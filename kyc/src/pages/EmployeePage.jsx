import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCUnrestrictedStore from '../store/digitalKYCUnrestrictedStore';
import LoadingSpinner from '../components/LoadingSpinner';

const EmployeePage = () => {
    const navigate = useNavigate();
    const { 
        verifyKYC, 
        rejectKYC, 
        getKYCDetails,
        contract,
        account,
        isLoading,
        error,
        clearError,
        currentKycDetails, // Use the store's currentKycDetails
    } = useDigitalKYCUnrestrictedStore();

    const [applicantAddress, setApplicantAddress] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [detailsLoading, setDetailsLoading] = useState(false);

    // With unrestricted store, we don't need to check isBankEmployee
    // But we'll keep the contract and account check for UI consistency
    useEffect(() => {
        if (!contract || !account) {
            navigate('/');
        }
    }, [contract, account, navigate]);

    useEffect(() => {
        if (error) {
            setMessage(error);
            setMessageType('error');
        }
    }, [error]);

    const handleVerify = async () => {
        clearError();
        setMessage('');
        setMessageType('');

        if (!applicantAddress) {
            setMessage('Please enter an applicant address');
            setMessageType('error');
            return;
        }

        try {
            await verifyKYC(applicantAddress);
            setMessage(`KYC for ${applicantAddress} verified successfully`);
            setMessageType('success');
            
            // Refresh KYC details after verification
            handleGetDetails();
        } catch (err) {
            setMessage(err.message || 'Failed to verify KYC');
            setMessageType('error');
        }
    };

    const handleReject = async () => {
        clearError();
        setMessage('');
        setMessageType('');

        if (!applicantAddress) {
            setMessage('Please enter an applicant address');
            setMessageType('error');
            return;
        }

        if (!rejectionReason) {
            setMessage('Please enter a rejection reason');
            setMessageType('error');
            return;
        }

        try {
            await rejectKYC(applicantAddress, rejectionReason);
            setMessage(`KYC for ${applicantAddress} rejected successfully`);
            setMessageType('success');
            setRejectionReason('');
            
            // Refresh KYC details after rejection
            handleGetDetails();
        } catch (err) {
            setMessage(err.message || 'Failed to reject KYC');
            setMessageType('error');
        }
    };

    const handleGetDetails = async () => {
        clearError();
        setMessage('');
        setMessageType('');
        setDetailsLoading(true);

        if (!applicantAddress) {
            setMessage('Please enter an applicant address');
            setMessageType('error');
            setDetailsLoading(false);
            return;
        }

        try {
            await getKYCDetails(applicantAddress);
            setMessage('KYC details retrieved successfully');
            setMessageType('success');
        } catch (err) {
            setMessage(err.message || 'Failed to get KYC details');
            setMessageType('error');
        } finally {
            setDetailsLoading(false);
        }
    };

    // Helper function to render KYC status in a more readable format
    const renderKYCStatus = (status) => {
        const statusMap = {
            0: 'Pending',
            1: 'Verified by Employee',
            2: 'Approved by Admin',
            3: 'Rejected',
            4: 'Expired'
        };
        return statusMap[status] || `Unknown (${status})`;
    };

    // Helper function to determine status color
    const getStatusColor = (status) => {
        const colorMap = {
            0: 'text-yellow-600', // Pending
            1: 'text-blue-600', // Verified by Employee
            2: 'text-green-600', // Approved by Admin
            3: 'text-red-600', // Rejected
            4: 'text-gray-600', // Expired
        };
        return colorMap[status] || 'text-gray-600';
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Bank Employee Dashboard</h1>
                
                {message && (
                    <div className={`mb-4 p-4 rounded-md ${
                        messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message}
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
                                />
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={handleGetDetails}
                                    disabled={isLoading || detailsLoading || !applicantAddress}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    {detailsLoading ? (
                                        <span className="flex items-center justify-center">
                                            <LoadingSpinner /> <span className="ml-2">Loading...</span>
                                        </span>
                                    ) : 'View Details'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">KYC Actions</h2>
                        
                        <div className="space-y-4">
                            <button
                                onClick={handleVerify}
                                disabled={isLoading || !applicantAddress || !currentKycDetails || currentKycDetails.status !== 0}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <LoadingSpinner /> <span className="ml-2">Verifying...</span>
                                    </span>
                                ) : 'Verify KYC'}
                            </button>
                            
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
                                    disabled={!currentKycDetails || (currentKycDetails.status !== 0 && currentKycDetails.status !== 1)}
                                />
                            </div>

                            <button
                                onClick={handleReject}
                                disabled={
                                    isLoading || 
                                    !applicantAddress || 
                                    !rejectionReason || 
                                    !currentKycDetails || 
                                    (currentKycDetails.status !== 0 && currentKycDetails.status !== 1)
                                }
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {isLoading ? 'Rejecting...' : 'Reject KYC'}
                            </button>
                        </div>
                    </div>
                </div>

                {currentKycDetails && (
                    <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">KYC Details</h2>
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Applicant</p>
                                    <p className="mt-1 break-all">{currentKycDetails.applicant}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p className={`mt-1 font-medium ${getStatusColor(currentKycDetails.status)}`}>
                                        {renderKYCStatus(currentKycDetails.status)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                                    <p className="mt-1">{currentKycDetails.expiryDateString}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-500">IPFS Hash</p>
                                <p className="mt-1 break-all">{currentKycDetails.ipfsHash || 'None'}</p>
                            </div>
                            
                            {currentKycDetails.rejectionReason && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-500">Rejection Reason</p>
                                    <p className="mt-1">{currentKycDetails.rejectionReason}</p>
                                </div>
                            )}
                            
                            {currentKycDetails.lastUpdatedBy && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-500">Last Updated By</p>
                                    <p className="mt-1 break-all">{currentKycDetails.lastUpdatedBy}</p>
                                </div>
                            )}

                            {/* Action guidance based on current status */}
                            <div className="mt-6 p-3 bg-gray-50 rounded-md">
                                <h3 className="text-md font-medium mb-2">Available Actions</h3>
                                {currentKycDetails.status === 0 && (
                                    <p>You can <span className="font-medium text-green-600">verify</span> or <span className="font-medium text-red-600">reject</span> this KYC application.</p>
                                )}
                                {currentKycDetails.status === 1 && (
                                    <p>This KYC is already verified by an employee. You can still <span className="font-medium text-red-600">reject</span> it if needed.</p>
                                )}
                                {(currentKycDetails.status === 2 || currentKycDetails.status === 3 || currentKycDetails.status === 4) && (
                                    <p>No actions available for this KYC in its current status.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeePage;