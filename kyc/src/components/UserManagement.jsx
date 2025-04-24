

// --- src/components/UserManagement.jsx ---
// This component should only be rendered if the connected user is an Admin
import React, { useState } from 'react';
import useDigitalKYCStore from '../store/digitalKYCStore';

function UserManagement() {
  const {
    addCustomer,
    addBankEmployee,
    addAdmin,
    isLoading,
    error, // Use error from store for feedback
    clearError,
    isAdmin, // Ensure this component is only shown to admins
  } = useDigitalKYCStore();

  const [userAddress, setUserAddress] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [roleToAdd, setRoleToAdd] = useState('customer'); // 'customer', 'employee', 'admin'

  // Only render if connected user is an Admin
  if (!isAdmin) {
    return null; // Or return a message indicating lack of permission
  }

  const handleAddUser = async (e) => {
    e.preventDefault();
    clearError(); // Clear previous errors

    if (!userAddress || (roleToAdd === 'employee' && !ifscCode)) {
        alert('Please fill in all required fields.');
        return;
    }

    // Basic address validation (consider using a library like ethers.isAddress)
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
        alert('Invalid Ethereum address format.');
        return;
    }

    try {
      let txPromise;
      switch (roleToAdd) {
        case 'customer':
          txPromise = addCustomer(userAddress);
          break;
        case 'employee':
          txPromise = addBankEmployee(userAddress, ifscCode);
          break;
        case 'admin':
          txPromise = addAdmin(userAddress);
          break;
        default:
          console.error('Invalid role selected');
          return;
      }

      await txPromise; // Wait for the transaction helper to complete

      // Check store *after* await if error wasn't thrown
      const latestError = useDigitalKYCStore.getState().error;
      if (!latestError) {
          alert(`User ${userAddress} added successfully as ${roleToAdd}.`);
          // Clear form on success
          setUserAddress('');
          setIfscCode('');
      } else {
          // Error is already set in the store, maybe alert it here too
          // alert(`Error adding user: ${latestError}`);
      }

    } catch (err) {
      // Error is already set in the store by _executeTransaction
      // You might still want to log it or show a generic message here
      console.error("Add user failed in component:", err.message);
      // alert(`Failed to add user. Check console or error message.`);
    }
  };

  return (
    <div className="user-management p-4 border rounded-lg shadow-sm bg-gray-50 mt-4">
      <h3 className="text-lg font-semibold mb-3">Register New User (Admin Only)</h3>
      {/* Display error from store */}
      {error && <p className="text-red-500 text-sm mb-2">Error: {error}</p>}

      <form onSubmit={handleAddUser} className="space-y-3">
        <div>
          <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Role to Add:
          </label>
          <select
            id="roleSelect"
            value={roleToAdd}
            onChange={(e) => setRoleToAdd(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="customer">Customer</option>
            <option value="employee">Bank Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label htmlFor="userAddress" className="block text-sm font-medium text-gray-700 mb-1">
            User Ethereum Address:
          </label>
          <input
            id="userAddress"
            type="text"
            placeholder="0x..."
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {roleToAdd === 'employee' && (
          <div>
            <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code (Required for Employee):
            </label>
            <input
              id="ifscCode"
              type="text"
              placeholder="e.g., SBIN0001234"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding User...' : 'Add User'}
        </button>
      </form>
    </div>
  );
}

export default UserManagement;
