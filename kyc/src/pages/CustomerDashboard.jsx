import { useState } from 'react';
import useKYCStore from '../store/kycStore';

const CustomerDashboard = () => {
  const { submitKYC, updateIPFSHash, getKYCDetails } = useKYCStore();
  const [ipfsHash, setIpfsHash] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [kycDetails, setKycDetails] = useState(null);

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    try {
      await submitKYC(ipfsHash, ifscCode);
      setIpfsHash('');
      setIfscCode('');
    } catch (error) {
      console.error('Error submitting KYC:', error);
    }
  };

  const handleUpdateIPFS = async (e) => {
    e.preventDefault();
    try {
      await updateIPFSHash(ipfsHash);
      setIpfsHash('');
    } catch (error) {
      console.error('Error updating IPFS hash:', error);
    }
  };

  const handleGetDetails = async () => {
    try {
      const { currentUser } = useKYCStore.getState();
      const details = await getKYCDetails(currentUser);
      setKycDetails(details);
    } catch (error) {
      console.error('Error getting KYC details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Customer Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Submit KYC</h2>
          
          <form onSubmit={handleSubmitKYC} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">IPFS Hash</label>
              <input
                type="text"
                value={ipfsHash}
                onChange={(e) => setIpfsHash(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit KYC
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Update IPFS Hash</h2>
          
          <form onSubmit={handleUpdateIPFS} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New IPFS Hash</label>
              <input
                type="text"
                value={ipfsHash}
                onChange={(e) => setIpfsHash(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update IPFS Hash
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">KYC Status</h2>
          
          <button
            onClick={handleGetDetails}
            className="mb-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Check Status
          </button>

          {kycDetails && (
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> {kycDetails.status}</p>
              <p><span className="font-medium">IPFS Hash:</span> {kycDetails.ipfsHash}</p>
              <p><span className="font-medium">Expiry:</span> {new Date(kycDetails.expiry * 1000).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard; 