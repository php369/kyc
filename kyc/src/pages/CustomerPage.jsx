import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCStore from '../store/digitalKYCStore';
import { uploadToIPFS, getIPFSURL } from '../services/pinataService';

const CustomerPage = () => {
    const navigate = useNavigate();
    const [ipfsHash, setIpfsHash] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [kycDetails, setKycDetails] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('apply');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const { 
        submitKYC, 
        updateIPFSHash, 
        getKYCDetails, 
        contract, 
        currentUser,
        isLoading,
        error: storeError,
        isCustomer
    } = useDigitalKYCStore();

    useEffect(() => {
        if (!contract || !currentUser) {
            navigate('/');
        } else if (!isCustomer) {
            navigate('/');
        }
    }, [contract, currentUser, isCustomer, navigate]);

    useEffect(() => {
        if (storeError) {
            setError(storeError);
        }
    }, [storeError]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setIpfsHash('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setError('');
        setSuccess('');

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            const hash = await uploadToIPFS(selectedFile);
            clearInterval(progressInterval);
            setUploadProgress(100);
            setIpfsHash(hash);
            setSuccess('File uploaded successfully to IPFS');
        } catch (err) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmitKYC = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!ipfsHash) {
            setError('Please upload your documents first');
            return;
        }

        if (!ifscCode) {
            setError('Please enter an IFSC code');
            return;
        }

        try {
            await submitKYC(ipfsHash, ifscCode);
            setSuccess('KYC application submitted successfully');
            setIpfsHash('');
            setIfscCode('');
            setSelectedFile(null);
        } catch (err) {
            setError(err.message || 'Failed to submit KYC application');
        }
    };

    const handleUpdateIPFS = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!ipfsHash) {
            setError('Please upload your documents first');
            return;
        }

        try {
            await updateIPFSHash(ipfsHash);
            setSuccess('IPFS hash updated successfully');
            setIpfsHash('');
            setSelectedFile(null);
        } catch (err) {
            setError(err.message || 'Failed to update IPFS hash');
        }
    };

    const handleGetDetails = async () => {
        setError('');
        setSuccess('');

        try {
            const details = await getKYCDetails(currentUser);
            setKycDetails(details);
            setSuccess('KYC details retrieved successfully');
        } catch (err) {
            setError(err.message || 'Failed to fetch KYC details');
            setKycDetails(null);
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 0: return 'Pending';
            case 1: return 'Verified by Employee';
            case 2: return 'Approved by Admin';
            case 3: return 'Rejected';
            case 4: return 'Expired';
            default: return 'Unknown';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Customer Dashboard</h1>
            
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

            <div className="mb-6">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('apply')}
                        className={`px-4 py-2 rounded-md ${
                            activeTab === 'apply' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Apply for KYC
                    </button>
                    <button
                        onClick={() => setActiveTab('update')}
                        className={`px-4 py-2 rounded-md ${
                            activeTab === 'update' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Update Documents
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('status');
                            handleGetDetails();
                        }}
                        className={`px-4 py-2 rounded-md ${
                            activeTab === 'status' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Check Status
                    </button>
                </div>
            </div>

            {activeTab === 'apply' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Apply for KYC</h2>
                    <form onSubmit={handleSubmitKYC} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload Documents
                            </label>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                                />
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={!selectedFile || isUploading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Upload to IPFS'}
                                </button>
                            </div>
                            {isUploading && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Uploading... {uploadProgress}%
                                    </p>
                                </div>
                            )}
                            {ipfsHash && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-600">
                                        IPFS Hash: {ipfsHash}
                                    </p>
                                    <a
                                        href={`https://ipfs.io/ipfs/${ipfsHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        View on IPFS
                                    </a>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank IFSC Code
                            </label>
                            <input
                                type="text"
                                value={ifscCode}
                                onChange={(e) => setIfscCode(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your bank's IFSC code"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!ipfsHash || isUploading || isLoading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Submitting...' : 'Submit KYC Application'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'update' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Update Documents</h2>
                    <form onSubmit={handleUpdateIPFS} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload New Documents
                            </label>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                                />
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={!selectedFile || isUploading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Upload to IPFS'}
                                </button>
                            </div>
                            {isUploading && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Uploading... {uploadProgress}%
                                    </p>
                                </div>
                            )}
                            {ipfsHash && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-600">
                                        IPFS Hash: {ipfsHash}
                                    </p>
                                    <a
                                        href={`https://ipfs.io/ipfs/${ipfsHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        View on IPFS
                                    </a>
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={!ipfsHash || isUploading || isLoading}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Updating...' : 'Update Documents'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'status' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">KYC Status</h2>
                    <div className="space-y-4">
                        <button
                            onClick={handleGetDetails}
                            disabled={isLoading}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Checking...' : 'Refresh KYC Status'}
                        </button>
                        
                        {kycDetails && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                <h3 className="text-lg font-medium mb-2">Your KYC Details</h3>
                                <div className="space-y-2">
                                    <p><span className="font-medium">Status:</span> {getStatusText(kycDetails.status)}</p>
                                    <p><span className="font-medium">IPFS Hash:</span> {kycDetails.ipfsHash || 'None'}</p>
                                    <p><span className="font-medium">Expiry Date:</span> {kycDetails.expiryDate > 0 
                                        ? new Date(kycDetails.expiryDate * 1000).toLocaleString() 
                                        : 'Not set'}
                                    </p>
                                    {kycDetails.rejectionReason && (
                                        <p><span className="font-medium">Rejection Reason:</span> {kycDetails.rejectionReason}</p>
                                    )}
                                    {kycDetails.ipfsHash && (
                                        <a
                                            href={getIPFSURL(kycDetails.ipfsHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block mt-2 text-blue-600 hover:underline"
                                        >
                                            View Documents on IPFS
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerPage;