import { create } from 'zustand';
import { ethers } from 'ethers';

// --- Import your Contract ABI and Address ---
import DigitalKYCAbi from '../constants/index.js';
const CONTRACT_ADDRESS = '0x2f243960a2af242271f75b43af37df36b8f3cdbc';

// --- Helper to Parse Errors ---
const getReadableError = (error) => {
    console.error("Raw Error:", error); // Log the full error for debugging
    let message = 'An unknown error occurred.';
    
    if (error instanceof Error) {
        // Ethers v6 specific error handling
        if (error.code === 'ACTION_REJECTED') {
            message = 'Transaction rejected by user.';
        } else if (error.reason) {
            message = error.reason; // Often contains revert messages
        } else if (error.message) {
            // Check for revert reason in message
            const revertReason = error.message.match(/reverted with reason string '(.*?)'/);
            if (revertReason && revertReason[1]) {
                message = revertReason[1];
            } else {
                message = error.message.substring(0, 100) + (error.message.length > 100 ? '...' : '');
            }
        }
        
        // Add specific error prefix handling
        const errorPrefixes = ['AUTH:', 'KYC:', 'USER:', 'IFSC:'];
        for (const prefix of errorPrefixes) {
            if (message.includes(prefix)) {
                message = message.split(`${prefix} `)[1] || `${prefix.replace(':', '')} Error`;
                break;
            }
        }
    } else if (typeof error === 'string') {
        message = error;
    }
    
    return message;
};

// --- KYC Status Mapping ---
export const KYCStatusMap = {
    0: 'Pending',
    1: 'VerifiedByEmployee',
    2: 'ApprovedByAdmin',
    3: 'Rejected',
    4: 'Expired',
};

// --- User Role Mapping ---
export const UserRoleMap = {
    0: 'None',
    1: 'Customer',
    2: 'BankEmployee',
    3: 'Admin',
};

const useDigitalKYCUnrestrictedStore = create((set, get) => ({
    // --- State ---
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

    // --- Actions ---

    /**
     * Connects to the user's wallet, initializes ethers,
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
            
            set({
                provider,
                signer,
                contract,
                account,
                isConnected: true,
                isLoading: false,
            });

            // Fetch user details immediately after connecting
            await get().fetchUserRole();

            // Setup wallet event listeners
            get().setupWalletListeners();

        } catch (err) {
            set({ 
                isLoading: false, 
                error: getReadableError(err), 
                isConnected: false 
            });
            console.error("Connection failed:", err);
        }
    },

    /**
     * Setup wallet event listeners for account and chain changes
     */
    setupWalletListeners: () => {
        if (!window.ethereum) return;

        // Clean up existing listeners first
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        
        // Account change handler
        window.ethereum.on('accountsChanged', (newAccounts) => {
            console.log('Account changed:', newAccounts);
            if (newAccounts.length === 0) {
                // Handle disconnection
                get().disconnect();
            } else {
                // Reconnect with new account
                get().connectWallet();
            }
        });

        // Network change handler
        window.ethereum.on('chainChanged', () => {
            console.log('Network changed, reloading...');
            window.location.reload();
        });
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
     * Fetches the role, ifsc, and active status for the connected account.
     */
    fetchUserRole: async () => {
        const { contract, account } = get();
        
        if (!contract || !account) {
            console.warn("Cannot fetch user details: Not connected or no account.");
            set({ 
                userRole: null, 
                userIfsc: '', 
                isAdmin: false, 
                isBankEmployee: false, 
                isCustomer: false 
            });
            return;
        }

        set({ isLoading: true, error: null });
        
        try {
            // Get the user's role
            const role = await contract.getUserRole(account);
            
            // If role is empty, zero, or null, treat as unregistered
            if (!role || role === '0x' || Number(role) === 0 && (!role.toString || role.toString() === '0')) {
                set({
                    userRole: null,
                    userIfsc: '',
                    isAdmin: false,
                    isBankEmployee: false,
                    isCustomer: false,
                    isLoading: false
                });
                return;
            }

            const roleNumber = Number(role);
            
            // Get user details to extract IFSC code
            let ifscCode = '';
            try {
                // Using getUserDetails function from unrestricted contract
                const [, userIfsc, ] = await contract.getUserDetails(account);
                ifscCode = userIfsc;
            } catch (detailsErr) {
                console.warn("Could not fetch user details:", detailsErr);
            }

            set({
                userRole: roleNumber,
                userIfsc: ifscCode,
                isAdmin: roleNumber === 3,
                isBankEmployee: roleNumber === 2,
                isCustomer: roleNumber === 1,
                isLoading: false,
                error: null
            });
            
            console.log(`User ${account} details: Role=${roleNumber} (${UserRoleMap[roleNumber]}), IFSC=${ifscCode}`);
            
        } catch (err) {
            // Handle specific error cases
            if (err.code === 'BAD_DATA' && err.info?.method === 'getUserRole') {
                set({
                    userRole: null,
                    userIfsc: '',
                    isAdmin: false,
                    isBankEmployee: false,
                    isCustomer: false,
                    isLoading: false
                });
                return;
            }
            
            set({
                error: getReadableError(err),
                userRole: null,
                userIfsc: '',
                isAdmin: false,
                isBankEmployee: false,
                isCustomer: false,
                isLoading: false
            });
            
            console.error("Failed to fetch user details:", err);
        }
    },

    // ==============================================
    // == Contract Interaction Methods (Write/Transactions) ==
    // ==============================================

    /**
     * Centralized method for executing contract transactions
     * @param {string} methodName - The contract method to call
     * @param {Array} args - Arguments for the method
     * @param {string} successMessage - Optional success message for logging
     * @returns {Promise<TransactionReceipt>} - Transaction receipt
     */
    _executeTransaction: async (methodName, args = [], successMessage) => {
        const { contract } = get();
        
        if (!contract) throw new Error("Not connected to contract.");
        
        set({ isLoading: true, error: null });

        try {
            const tx = await contract[methodName](...args);
            console.log(`Transaction sent for ${methodName}:`, tx.hash);
            
            const receipt = await tx.wait();
            console.log(`Transaction confirmed for ${methodName}:`, receipt);
            
            set({ isLoading: false });
            
            if (successMessage) console.log(successMessage);
            
            return receipt;
            
        } catch (err) {
            const readableError = getReadableError(err);
            set({ isLoading: false, error: readableError });
            
            console.error(`Transaction failed for ${methodName}:`, err);
            throw new Error(readableError);
        }
    },

    // --- User Management ---
    addCustomer: async (address) => {
        return get()._executeTransaction(
            'addCustomer', 
            [address], 
            `Customer ${address} added successfully.`
        );
    },
    
    addBankEmployee: async (address, ifsc) => {
        return get()._executeTransaction(
            'addBankEmployee', 
            [address, ifsc], 
            `Bank employee ${address} added with IFSC ${ifsc}.`
        );
    },
    
    addAdmin: async (address) => {
        return get()._executeTransaction(
            'addAdmin', 
            [address], 
            `Admin ${address} added successfully.`
        );
    },
    
    deactivateUser: (address) => {
        return get()._executeTransaction(
            'deactivateUser', 
            [address], 
            `User ${address} deactivated.`
        );
    },
    
    activateUser: (address) => {
        return get()._executeTransaction(
            'activateUser', 
            [address], 
            `User ${address} activated.`
        );
    },
    
    updateEmployeeIFSC: (address, newIfsc) => {
        return get()._executeTransaction(
            'updateEmployeeIFSC', 
            [address, newIfsc], 
            `IFSC for ${address} updated to ${newIfsc}.`
        );
    },

    // --- KYC Workflow ---
    submitKYC: async (ipfsHash, ifscCode) => {
        return get()._executeTransaction(
            'submitKYC', 
            [ipfsHash, ifscCode], 
            `KYC submitted with IPFS hash ${ipfsHash} to bank branch ${ifscCode}.`
        );
    },
    
    verifyKYC: async (applicant) => {
        return get()._executeTransaction(
            'verifyKYC', 
            [applicant], 
            `KYC for ${applicant} verified by employee.`
        );
    },
    
    adminApproveKYC: (applicantAddress) => {
        return get()._executeTransaction(
            'adminApproveKYC', 
            [applicantAddress], 
            `KYC for ${applicantAddress} approved by admin.`
        );
    },
    
    rejectKYC: async (applicant, reason) => {
        return get()._executeTransaction(
            'rejectKYC', 
            [applicant, reason], 
            `KYC for ${applicant} rejected with reason: ${reason}.`
        );
    },
    
    updateIPFSHash: async (newHash) => {
        return get()._executeTransaction(
            'updateIPFSHash', 
            [newHash], 
            `IPFS hash updated to ${newHash}.`
        );
    },
    
    checkExpiry: async (applicant) => {
        return get()._executeTransaction(
            'checkExpiry', 
            [applicant], 
            `Expiry check performed for ${applicant}.`
        );
    },

    // ==============================================
    // == Contract Interaction Methods (Read/View) ==
    // ==============================================

    /**
     * Fetches KYC details for a specific applicant address.
     * @param {string} applicantAddress - The address to fetch details for.
     * @returns {Object|null} The KYC details or null if error
     */
    getKYCDetails: async (applicantAddress) => {
        const { contract } = get();
        
        if (!contract) {
            set({ error: "Not connected to contract." });
            return null;
        }
        
        set({ isLoading: true, error: null, currentKycDetails: null });
        
        try {
            const [status, ipfsHash, expiryDate, rejectionReason, lastUpdatedBy] = 
                await contract.getKYCDetails(applicantAddress);
            
            const statusNumber = Number(status);
            const expiryTimestamp = Number(expiryDate);
            
            const details = {
                status: statusNumber,
                statusString: KYCStatusMap[statusNumber] || 'Unknown',
                ipfsHash,
                expiryDate: expiryTimestamp,
                expiryDateString: expiryTimestamp > 0 
                    ? new Date(expiryTimestamp * 1000).toLocaleString() 
                    : 'N/A',
                rejectionReason,
                lastUpdatedBy,
                applicant: applicantAddress,
            };
            
            set({ currentKycDetails: details, isLoading: false });
            return details;
            
        } catch (err) {
            const readableError = getReadableError(err);
            set({ isLoading: false, error: readableError });
            
            console.error("Failed to fetch KYC details:", err);
            return null;
        }
    },

    /**
     * Fetches the list of active employees for a given IFSC code.
     * @param {string} ifsc - The IFSC code.
     * @returns {Array|null} Array of employee addresses or null if error
     */
    getIFSCEmployees: async (ifsc) => {
        const { contract } = get();
        
        if (!contract) {
            set({ error: "Not connected to contract." });
            return null;
        }
        
        set({ isLoading: true, error: null, ifscEmployees: [] });
        
        try {
            // Note the function name change to match unrestricted contract
            const employees = await contract.getActiveIFSCEmployees(ifsc);
            set({ ifscEmployees: employees, isLoading: false });
            
            return employees;
            
        } catch (err) {
            const readableError = getReadableError(err);
            set({ isLoading: false, error: readableError });
            
            console.error("Failed to fetch IFSC employees:", err);
            return null;
        }
    },

    /**
     * Gets role for a specific address without setting global state
     * @param {string} userAddress - Address to query
     * @returns {Promise<number>} Role number (0-3) or throws error
     */
    getUserRoleForAddress: async (userAddress) => {
        const { contract } = get();
        
        if (!contract) throw new Error("Not connected to contract.");
        
        try {
            const role = await contract.getUserRole(userAddress);
            return Number(role);
            
        } catch (err) {
            console.error(`Failed to get role for ${userAddress}:`, err);
            throw new Error(getReadableError(err));
        }
    },
    
    /**
     * Gets user details for a specific address
     * @param {string} userAddress - Address to query
     * @returns {Promise<Object>} User details or throws error
     */
    getUserDetails: async (userAddress) => {
        const { contract } = get();
        
        if (!contract) throw new Error("Not connected to contract.");
        
        try {
            const [role, ifscCode, isActive] = await contract.getUserDetails(userAddress);
            return {
                role: Number(role),
                ifscCode,
                isActive
            };
            
        } catch (err) {
            console.error(`Failed to get details for ${userAddress}:`, err);
            throw new Error(getReadableError(err));
        }
    },

    // Utility methods
    clearError: () => set({ error: null }),
    setLoading: (isLoading) => set({ isLoading }),
}));

export default useDigitalKYCUnrestrictedStore;