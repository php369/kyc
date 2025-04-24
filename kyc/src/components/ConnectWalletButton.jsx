// --- src/components/ConnectWalletButton.jsx ---
import React from 'react';
import useDigitalKYCStore from '../store/digitalKYCStore';

function ConnectWalletButton() {
  const {
    connectWallet,
    disconnect,
    isConnected,
    account,
    isLoading, // Use error from store if needed
    clearError,
  } = useDigitalKYCStore();

  const handleConnect = () => {
    clearError(); // Clear previous errors before attempting connection
    connectWallet();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Shorten address helper (can be moved to utils/helpers.js)
  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="connect-wallet-container p-4 border rounded-lg shadow-sm bg-white">
      {isConnected ? (
        <div className="flex items-center justify-between">
          <span className="text-green-600 font-medium">
            Connected: {shortenAddress(account)}
          </span>
          <button
            onClick={handleDisconnect}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition duration-150"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet (Login)'}
        </button>
      )}
      {/* Optional: Display connection error directly here */}
      {/* {error && !isConnected && <p className="text-red-500 text-sm mt-2">Error: {error}</p>} */}
    </div>
  );
}

export default ConnectWalletButton;
