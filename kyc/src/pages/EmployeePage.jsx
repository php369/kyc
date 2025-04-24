import { useState } from 'react';
import useKYCStore from '../store/kycStore';

const EmployeePage = () => {
  const { verifyKYC, rejectKYC, getKYCDetails } = useKYCStore();
  const [applicantAddress, setApplicantAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [kycDetails, setKycDetails] = useState(null);

  const handleVerify = async () => {
    try {
      await verifyKYC(applicantAddress);
      setApplicantAddress('');
    } catch (error) {
      console.error('Error verifying KYC:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectKYC(applicantAddress, rejectionReason);
      setApplicantAddress('');
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting KYC:', error);
    }
  };

  const handleGetDetails = async () => {
    try {
      const details = await getKYCDetails(applicantAddress);
      setKycDetails(details);
    } catch (error) {
      console.error('Error getting KYC details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Bank Employee Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">KYC Management</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Applicant Address</label>
              <input
                type="text"
                value={applicantAddress}
                onChange={(e) => setApplicantAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleGetDetails}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Get Details
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Verify
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleReject}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Reject
            </button>
          </div>
        </div>

        {kycDetails && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">KYC Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> {kycDetails.status}</p>
              <p><span className="font-medium">IPFS Hash:</span> {kycDetails.ipfsHash}</p>
              <p><span className="font-medium">Expiry:</span> {new Date(kycDetails.expiry * 1000).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePage; 