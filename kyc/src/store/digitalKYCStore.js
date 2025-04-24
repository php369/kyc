import { create } from 'zustand';
import { ethers } from 'ethers';

// --- Import your Contract ABI and Address ---
// Example: Replace with your actual ABI and Address
import DigitalKYCAbi from '../constants/index.js'; // Assuming you saved the ABI json
const CONTRACT_ADDRESS = '0x9CaDae5Ea59cc93f8e809d8A2e182Aa9947b44fA'; // Replace with your address

// --- Helper to Parse Errors ---
const getReadableError = (error) => {
    console.error("Raw Error:", error); // Log the full error for debugging
    let message = 'An unknown error occurred.';
    if (error instanceof Error) {
        // Ethers v6 specific error handling might be needed
        // Check for common reasons
        if (error.code === 'ACTION_REJECTED') {
            message = 'Transaction rejected by user.';
        } else if (error.reason) {
            message = error.reason; // Often contains revert messages
        } else if (error.message) {
            // Fallback to generic message
            // Check for revert reason in message (less reliable)
             const revertReason = error.message.match(/reverted with reason string '(.*?)'/);
             if (revertReason && revertReason[1]) {
                 message = revertReason[1];
             } else {
                 message = error.message.substring(0, 100) + '...'; // Truncate long messages
             }
        }
         // Add more specific checks based on common contract errors if needed
        if(message.includes("AUTH:")) {
            message = message.split("AUTH: ")[1] || "Authorization Error";
        } else if (message.includes("KYC:")) {
             message = message.split("KYC: ")[1] || "KYC Workflow Error";
        } else if (message.includes("USER:")) {
             message = message.split("USER: ")[1] || "User Management Error";
        } else if (message.includes("IFSC:")) {
             message = message.split("IFSC: ")[1] || "IFSC Error";
        }

    } else if (typeof error === 'string') {
        message = error;
    }
    return message;
};

// --- Enum Mapping (Optional but helpful) ---
export const KYCStatusMap = {
    0: 'Pending',
    1: 'VerifiedByEmployee',
    2: 'ApprovedByAdmin',
    3: 'Rejected',
    4: 'Expired',
};

const useDigitalKYCStore = create((set, get) => ({
    // --- State ---
    provider: null,
    signer: null,
    contract: null,
    account: null,
    isConnected: false,
    userRole: null,
    userIfsc: '', // Store employee's IFSC
    isAdmin: false,
    isBankEmployee: false,
    isCustomer: false,
    isLoading: false, // General loading state for transactions/fetching
    error: null, // Store error messages
    currentKycDetails: null, // Store details fetched for a specific applicant
    ifscEmployees: [], // Store list of employees for an IFSC

    // --- Actions ---

    /**
     * Connects to the user's wallet (e.g., MetaMask), initializes ethers,
     * creates the contract instance, and fetches the user's role.
     */
    connectWallet: async () => {
        set({ isLoading: true, error: null });
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask (or compatible wallet) not found.');
            }

            // Request account access
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found or permission denied.');
            }
            const account = accounts[0];
            const signer = await provider.getSigner();
            
            // Create contract instance
            const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalKYCAbi, signer);
            console.log('Contract instance created. Available functions:', contract);

            set({
                provider,
                signer,
                contract,
                account,
                isConnected: true,
                isLoading: false,
                error: null,
            });

            // Fetch user details immediately after connecting
            await get().fetchUserRole();

            // --- Event Listeners (Important for dApp reactivity) ---
            window.ethereum.removeAllListeners('accountsChanged'); // Clean previous listeners
            window.ethereum.on('accountsChanged', (newAccounts) => {
                console.log('Account changed:', newAccounts);
                 if (newAccounts.length === 0) {
                    // Handle disconnection
                    get().disconnect();
                } else {
                    // Reconnect with new account - triggers fetchUserDetails again
                    get().connectWallet();
                }
            });

             window.ethereum.removeAllListeners('chainChanged');
             window.ethereum.on('chainChanged', (chainId) => {
                 console.log('Network changed to:', chainId);
                 // Force reload or prompt user as contract might be on a different network
                 window.location.reload();
                 // Or alternatively, attempt reconnect which might fail if contract not on new chain
                 // get().connectWallet();
             });


        } catch (err) {
            set({ isLoading: false, error: getReadableError(err), isConnected: false });
            console.error("Connection failed:", err);
        }
    },

    /**
     * Disconnects wallet and resets store state.
     */
    disconnect: () => {
         // Remove listeners if added
         if (window.ethereum) {
             window.ethereum.removeAllListeners('accountsChanged');
             window.ethereum.removeAllListeners('chainChanged');
         }
         set({
            provider: null,
            signer: null,
            contract: null,
            account: null,
            isConnected: false,
            userRole: null,
            userIfsc: '',
            isAdmin: false,
            isBankEmployee: false,
            isCustomer: false,
            isLoading: false,
            error: null,
            currentKycDetails: null,
            ifscEmployees: [],
        });
    },

    /**
     * Fetches the details (role, ifsc, active status) for the currently connected account.
     * @param {string} [accountAddress=current account] - Optional address to fetch details for.
     */
    fetchUserRole: async () => {
        const { contract } = get();
        if (!contract) {
            console.warn("Cannot fetch user details: Not connected or no account.");
            // Reset user details if called without connection
            set({ userRole: null, userIfsc: '', isAdmin: false, isBankEmployee: false, isCustomer: false });
            return;
        }

        try {
            const role = await contract.getUserRole(get().account);
            // If role is empty (0x) or null, treat as unregistered user
            if (!role || role === '0x') {
                set({
                    userRole: null,
                    userIfsc: '',
                    isAdmin: false,
                    isBankEmployee: false,
                    isCustomer: false
                });
                return;
            }

            set({
                userRole: role,
                userIfsc: role === 1 ? get().userIfsc : '', // Only store IFSC for active employees
                isAdmin: role === 2,
                isBankEmployee: role === 1,
                isCustomer: role === 0,
                error: null
            });
            console.log(`User ${get().account} details: Role=${role}, IFSC=${get().userIfsc}`);
        } catch (err) {
            // Handle the case where getUserRole returns empty response
            if (err.code === 'BAD_DATA' && err.info?.method === 'getUserRole') {
                set({
                    userRole: null,
                    userIfsc: '',
                    isAdmin: false,
                    isBankEmployee: false,
                    isCustomer: false
                });
                return;
            }
            
            set({
                error: getReadableError(err),
                userRole: null,
                userIfsc: '',
                isAdmin: false,
                isBankEmployee: false,
                isCustomer: false
            });
            console.error("Failed to fetch user details:", err);
        }
    },

    // ==============================================
    // == Contract Interaction Methods (Write/Transactions) ==
    // ==============================================

    _executeTransaction: async (methodName, args = [], successMessage) => {
        const { contract } = get();
        if (!contract) throw new Error("Not connected to contract.");
        set({ isLoading: true, error: null });

        try {
            const tx = await contract[methodName](...args);
            console.log(`Transaction sent for ${methodName}:`, tx.hash);
            const receipt = await tx.wait(); // Wait for transaction confirmation
            console.log(`Transaction confirmed for ${methodName}:`, receipt);
            set({ isLoading: false });
            // Optional: Show success message to user
            if(successMessage) console.log(successMessage); // Replace with better UI feedback
             return receipt; // Return receipt if needed
        } catch (err) {
            const readableError = getReadableError(err);
            set({ isLoading: false, error: readableError });
            console.error(`Transaction failed for ${methodName}:`, err);
            throw new Error(readableError); // Re-throw for component-level handling if needed
        }
    },

    // --- User Management (Admin) ---
    addCustomer: async (address) => {
        try {
            const { contract } = get();
            const tx = await contract.addCustomer(address);
            await tx.wait();
        } catch (error) {
            console.error('Error adding customer:', error);
            throw error;
        }
    },
    addBankEmployee: async (address, ifsc) => {
        try {
            const { contract } = get();
            const tx = await contract.addBankEmployee(address, ifsc);
            await tx.wait();
        } catch (error) {
            console.error('Error adding bank employee:', error);
            throw error;
        }
    },
    addAdmin: async (address) => {
        try {
            const { contract } = get();
            const tx = await contract.addAdmin(address);
            await tx.wait();
        } catch (error) {
            console.error('Error adding admin:', error);
            throw error;
        }
    },
    deactivateUser: (address) => get()._executeTransaction('deactivateUser', [address], `User ${address} deactivated.`),
    activateUser: (address) => get()._executeTransaction('activateUser', [address], `User ${address} activated.`),
    updateEmployeeIFSC: (address, newIfsc) => get()._executeTransaction('updateEmployeeIFSC', [address, newIfsc], `IFSC for ${address} updated to ${newIfsc}.`),

    // --- KYC Workflow ---
    submitKYC: async (ipfsHash, ifscCode) => {
        try {
            const { contract } = get();
            const tx = await contract.submitKYC(ipfsHash, ifscCode);
            await tx.wait();
        } catch (error) {
            console.error('Error submitting KYC:', error);
            throw error;
        }
    },
    verifyKYC: async (applicant) => {
        try {
            const { contract } = get();
            const tx = await contract.verifyKYC(applicant);
            await tx.wait();
        } catch (error) {
            console.error('Error verifying KYC:', error);
            throw error;
        }
    },
    adminApproveKYC: (applicantAddress) => get()._executeTransaction('adminApproveKYC', [applicantAddress], `KYC for ${applicantAddress} approved by admin.`),
    rejectKYC: async (applicant, reason) => {
        try {
            const { contract } = get();
            const tx = await contract.rejectKYC(applicant, reason);
            await tx.wait();
        } catch (error) {
            console.error('Error rejecting KYC:', error);
            throw error;
        }
    },
    updateIPFSHash: async (newHash) => {
        try {
            const { contract } = get();
            const tx = await contract.updateIPFSHash(newHash);
            await tx.wait();
        } catch (error) {
            console.error('Error updating IPFS hash:', error);
            throw error;
        }
    },
    checkExpiry: async (applicant) => {
        try {
            const { contract } = get();
            const tx = await contract.checkExpiry(applicant);
            await tx.wait();
        } catch (error) {
            console.error('Error checking expiry:', error);
            throw error;
        }
    },


    // ==============================================
    // == Contract Interaction Methods (Read/View) ==
    // ==============================================

     /**
     * Fetches KYC details for a specific applicant address.
     * Stores result in `currentKycDetails`.
     * @param {string} applicantAddress - The address to fetch details for.
     */
    getKYCDetails: async (applicantAddress) => {
         const { contract } = get();
        if (!contract) {
            set({error: "Not connected."});
            return;
        }
        set({ isLoading: true, error: null, currentKycDetails: null }); // Reset previous details
        try {
            const [status, ipfsHash, expiryDate, rejectionReason, lastUpdatedBy] = await contract.getKYCDetails(applicantAddress);
             const details = {
                 status: Number(status), // Convert BigInt status to number
                 statusString: KYCStatusMap[Number(status)] || 'Unknown',
                 ipfsHash,
                 expiryDate: Number(expiryDate), // Convert BigInt timestamp to number
                 expiryDateString: Number(expiryDate) > 0 ? new Date(Number(expiryDate) * 1000).toLocaleString() : 'N/A',
                 rejectionReason,
                 lastUpdatedBy,
                 applicant: applicantAddress, // Add applicant address for context
            };
            set({ currentKycDetails: details, isLoading: false });
            return details;
        } catch (err) {
            const readableError = getReadableError(err);
            set({ isLoading: false, error: readableError });
            console.error("Failed to fetch KYC details:", err);
        }
    },

    /**
     * Fetches the list of *active* employees for a given IFSC code.
     * Stores result in `ifscEmployees`.
     * @param {string} ifsc - The IFSC code.
     */
    getIFSCEmployees: async (ifsc) => {
        const { contract } = get();
        if (!contract) {
             set({error: "Not connected."});
            return;
        }
        set({ isLoading: true, error: null, ifscEmployees: [] }); // Reset previous list
        try {
            const employees = await contract.getIFSCEmployees(ifsc);
            set({ ifscEmployees: employees, isLoading: false });
             return employees;
        } catch (err) {
             const readableError = getReadableError(err);
            set({ isLoading: false, error: readableError });
            console.error("Failed to fetch IFSC employees:", err);
        }
    },

     /**
      * Simple view function call example - Gets role without setting global state
      * @param {string} userAddress - Address to query
      * @returns {Promise<number>} Role (0-3) or throws error
      */
     getUserRoleForAddress: async (userAddress) => {
         const { contract } = get();
         if (!contract) throw new Error("Not connected.");
         // No loading state set here as it's a quick read expected to be used directly
         try {
             // Note: Using getUserDetails as getUserRole is external view in the provided contract
             // If getUserRole existed and was public view, it could be called directly.
             // Calling getUserDetails is slightly less efficient if only role is needed.
             const role = await contract.getUserRole(userAddress);
             return role;
         } catch (err) {
             console.error(`Failed to get role for ${userAddress}:`, err);
             throw new Error(getReadableError(err));
         }
     },


    // Utility to clear errors
    clearError: () => set({ error: null }),

}));

export default useDigitalKYCStore;