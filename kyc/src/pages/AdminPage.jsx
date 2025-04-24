// --- src/pages/AdminPage.jsx ---
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import useDigitalKYCStore from '../store/digitalKYCStore';
import UserManagement from '../components/UserManagement';
import ConnectWalletButton from '../components/ConnectWalletButton';
import LoadingSpinner from '../components/LoadingSpinner'; // Assuming you have this

function AdminPage() {
  // Get state including the userRole number
  const { isConnected, userRole, isLoading, account } = useDigitalKYCStore();
  const navigate = useNavigate(); // Initialize navigate function

  useEffect(() => {
    // Don't redirect while loading initial connection/role info
    if (isLoading) {
        return;
    }

    // If connected, check the role
    if (isConnected) {
      if (userRole !== 3) {
        // User is connected but not an Admin
        console.log(`User role (${userRole}) is not Admin (3). Redirecting...`);
        // Redirect based on role
        if (userRole === 1) {
          navigate('/customer'); // Redirect Customer to their page
        } else if (userRole === 2) {
          navigate('/employee'); // Redirect Employee to their page
        } else {
          // If role is 0 (inactive/not found) or unexpected, redirect to home
          navigate('/');
        }
      }
      // If userRole === 3, do nothing, stay on the Admin page.
    } else {
        // If not connected (and not loading), maybe redirect to home or show login prompt
        // This case is handled by the return statement below, but you could redirect here too.
        // navigate('/');
    }
    // Re-run this effect if connection status or user role changes
  }, [isConnected, userRole, isLoading, navigate]);


  // --- Render Logic ---

  // 1. Show loading state while checking connection/role initially
  // Check isLoading OR if isConnected is false BUT account exists (means wallet is likely connected but role fetch might be pending)
  const stillLoading = isLoading || (!isConnected && account);
  if (stillLoading) {
      return (
          <div className="flex justify-center items-center h-40">
              <LoadingSpinner />
              <span className="ml-2">Loading User Data...</span>
          </div>
      );
  }

  // 2. If not connected after loading, prompt to connect
  if (!isConnected) {
    return (
      <div className="text-center p-6 border rounded-lg bg-white shadow">
        <h2 className="text-xl font-semibold mb-4">Admin Panel Access</h2>
        <p className="mb-4">Please connect your wallet to access the admin panel.</p>
        <ConnectWalletButton />
      </div>
    );
  }

  // 3. If connected but role is not Admin (useEffect handles redirect, but this is a fallback UI)
  // This part might briefly show before the useEffect redirect kicks in.
  if (userRole !== 3) {
    return (
      <div className="text-center p-6 border rounded-lg bg-yellow-100 shadow">
        <h2 className="text-xl font-semibold mb-4 text-yellow-800">Redirecting...</h2>
        <p>You do not have Admin privileges. You will be redirected shortly.</p>
         {/* Optional: Add a manual link */}
         {/* <Link to="/" className="text-blue-600 hover:underline">Go to Homepage</Link> */}
      </div>
    );
  }

  // 4. If connected *and* userRole is 3 (Admin), show the actual Admin content
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
      <p className="text-gray-600">Manage users and system settings.</p>

      {/* Admin specific components */}
      <UserManagement />

      {/* Add other admin components here as needed */}
      {/* Example: Component to view all KYC records, manage settings, etc. */}
      {/* <AllKYCRecordsTable /> */}
      {/* <SystemSettings /> */}
    </div>
  );
}

export default AdminPage;
