import React, { useState } from 'react';
import useDigitalKYCStore from '../store/digitalKYCStore';

const EmployeeDashboard = () => {
    const [applicantAddress, setApplicantAddress] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [kycDetails, setKycDetails] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { verifyKYC, rejectKYC, getKYC } = useDigitalKYCStore();

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await verifyKYC(applicantAddress);
            setSuccess('KYC verified successfully');
            setApplicantAddress('');
        } catch (err) {
            setError(err.message || 'Failed to verify KYC');
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await rejectKYC(applicantAddress, rejectionReason);
            setSuccess('KYC rejected successfully');
            setApplicantAddress('');
            setRejectionReason('');
        } catch (err) {
            setError(err.message || 'Failed to reject KYC');
        }
    };

    const handleGetDetails = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const details = await getKYC(applicantAddress);
            setKycDetails(details);
        } catch (err) {
            setError(err.message || 'Failed to fetch KYC details');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Bank Employee Dashboard</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">KYC Management</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Applicant Address
                            </label>
                            <input
                                type="text"
                                value={applicantAddress}
                                onChange={(e) => setApplicantAddress(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0x..."
                                required
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={handleVerify}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                Verify KYC
                            </button>
                            <button
                                onClick={handleGetDetails}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Get Details
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Reject KYC</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rejection Reason
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="Enter rejection reason..."
                                required
                            />
                        </div>

                        <button
                            onClick={handleReject}
                            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Reject KYC
                        </button>
                    </div>
                </div>
            </div>

            {kycDetails && (
                <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">KYC Details</h2>
                    <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(kycDetails, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard; 