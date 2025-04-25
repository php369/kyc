import React, { useState } from 'react';
import useDigitalKYCStore from '../store/digitalKYCStore';
import { uploadToIPFS, getIPFSURL } from '../services/pinataService';

const CustomerDashboard = () => {
    const [ipfsHash, setIpfsHash] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [kycDetails, setKycDetails] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('apply'); // 'apply', 'update', 'status'
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const { 
        submitKYC, 
        updateIPFS, 
        getKYC, 
        currentUser 
    } = useDigitalKYCStore();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setIpfsHash(''); // Clear previous hash when new file is selected
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
            // Simulate upload progress
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
            await updateIPFS(ipfsHash);
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
            const details = await getKYC(currentUser);
            setKycDetails(details);
        } catch (err) {
            setError(err.message || 'Failed to fetch KYC details');
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

            {/* Navigation Tabs */}
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
                        onClick={() => setActiveTab('status')}
                        className={`px-4 py-2 rounded-md ${
                            activeTab === 'status' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Check Status
                    </button>
                </div>
            </div>

            {/* Apply for KYC Form */}
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
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-blue-600 h-2.5 rounded-full" 
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
                                        href={getIPFSURL(ipfsHash)}
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
                            disabled={!ipfsHash || isUploading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            Submit KYC Application
                        </button>
                    </form>
                </div>
            )}

            {/* Update Documents Form */}
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
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-blue-600 h-2.5 rounded-full" 
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
                                        href={getIPFSURL(ipfsHash)}
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
                            disabled={!ipfsHash || isUploading}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            Update Documents
                        </button>
                    </form>
                </div>
            )}

            {/* Check Status Section */}
            {activeTab === 'status' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">KYC Status</h2>
                    <div className="space-y-4">
                        <button
                            onClick={handleGetDetails}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                            Check KYC Status
                        </button>
                        
                        {kycDetails && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                <h3 className="text-lg font-medium mb-2">Your KYC Details</h3>
                                <div className="space-y-2">
                                    <p><span className="font-medium">Status:</span> {kycDetails.isVerified ? 'Verified' : 'Pending'}</p>
                                    <p><span className="font-medium">IPFS Hash:</span> {kycDetails.ipfsHash}</p>
                                    <p><span className="font-medium">IFSC Code:</span> {kycDetails.ifscCode}</p>
                                    <p><span className="font-medium">Last Updated:</span> {new Date(kycDetails.timestamp * 1000).toLocaleString()}</p>
                                    {kycDetails.ipfsHash && (
                                        <a
                                            href={getIPFSURL(kycDetails.ipfsHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
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

export default CustomerDashboard; 