import { create } from 'zustand';
import { ethers } from 'ethers';

const useKYCStore = create((set, get) => ({
  contract: null,
  provider: null,
  signer: null,
  currentUser: null,
  userRole: null,
  kycDetails: null,
  ifscEmployees: [],
  isAdmin: false,
  isBankEmployee: false,
  isCustomer: false,

  setContract: (contract) => set({ contract }),
  setProvider: (provider) => set({ provider }),
  setSigner: (signer) => set({ signer }),
  setCurrentUser: (address) => set({ currentUser: address }),

  initializeContract: async (contractAddress, abi) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const address = await signer.getAddress();
      
      set({ contract, provider, signer, currentUser: address });
      await get().fetchUserRole();
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  },

  fetchUserRole: async () => {
    try {
      const { contract, currentUser } = get();
      if (!contract || !currentUser) return;

      const role = await contract.getUserRole(currentUser);
      
      set({
        userRole: role,
        isAdmin: role === 2, // 2 for admin
        isBankEmployee: role === 1, // 1 for bank employee
        isCustomer: role === 0, // 0 for customer
      });
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  },

  addAdmin: async (userAddress) => {
    try {
      const { contract } = get();
      const tx = await contract.addAdmin(userAddress);
      await tx.wait();
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  },

  addBankEmployee: async (userAddress, ifsc) => {
    try {
      const { contract } = get();
      const tx = await contract.addBankEmployee(userAddress, ifsc);
      await tx.wait();
    } catch (error) {
      console.error('Error adding bank employee:', error);
      throw error;
    }
  },

  addCustomer: async (userAddress) => {
    try {
      const { contract } = get();
      const tx = await contract.addCustomer(userAddress);
      await tx.wait();
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  },

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

  reverifyKYC: async (applicant) => {
    try {
      const { contract } = get();
      const tx = await contract.reverifyKYC(applicant);
      await tx.wait();
    } catch (error) {
      console.error('Error reverifying KYC:', error);
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

  getKYCDetails: async (applicant) => {
    try {
      const { contract } = get();
      const details = await contract.getKYCDetails(applicant);
      set({ kycDetails: details });
      return details;
    } catch (error) {
      console.error('Error getting KYC details:', error);
      throw error;
    }
  },

  getIFSCEmployees: async (ifsc) => {
    try {
      const { contract } = get();
      const employees = await contract.getIFSCEmployees(ifsc);
      set({ ifscEmployees: employees });
      return employees;
    } catch (error) {
      console.error('Error getting IFSC employees:', error);
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

  resetStore: () => set({
    contract: null,
    provider: null,
    signer: null,
    currentUser: null,
    userRole: null,
    kycDetails: null,
    ifscEmployees: [],
    isAdmin: false,
    isBankEmployee: false,
    isCustomer: false,
  }),
}));

export default useKYCStore; 