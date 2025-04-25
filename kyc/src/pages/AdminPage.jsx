import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCStore from '../store/digitalKYCStore';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPage = () => {
    const navigate = useNavigate();
    const { 
        contract, 
        account,
        isAdmin,
        addAdmin,
        addBankEmployee,
        addCustomer,
        deactivateUser,
        activateUser,
        updateEmployeeIFSC,
        getIFSCEmployees,
        ifscEmployees,
        isLoading,
        error,
        clearError
    } = useDigitalKYCStore();

    const [formData, setFormData] = useState({
        address: '',
        ifsc: '',
        userType: 'customer'
    });

    const [managementData, setManagementData] = useState({
        userAddress: '',
        newIfsc: ''
    });

    const [activeTab, setActiveTab] = useState('addUser');
    const [searchIFSC, setSearchIFSC] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        if (!contract || !account || !isAdmin) {
            navigate('/');
        }
    }, [contract, account, isAdmin, navigate]);

    useEffect(() => {
        if (error) {
            setMessage(error);
            setMessageType('error');
        }
    }, [error]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleManagementInputChange = (e) => {
        const { name, value } = e.target;
        setManagementData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setMessage('');
        setMessageType('');

        try {
            if (formData.userType === 'admin') {
                await addAdmin(formData.address);
                setMessage('Admin added successfully');
                setMessageType('success');
            } else if (formData.userType === 'employee') {
                if (!formData.ifsc) {
                    setMessage('IFSC code is required for bank employees');
                    setMessageType('error');
                    return;
                }
                await addBankEmployee(formData.address, formData.ifsc);
                setMessage('Bank employee added successfully');
                setMessageType('success');
            } else {
                await addCustomer(formData.address);
                setMessage('Customer added successfully');
                setMessageType('success');
            }
            setFormData({ address: '', ifsc: '', userType: 'customer' });
        } catch (err) {
            setMessage(err.message || 'Failed to add user');
            setMessageType('error');
        }
    };

    const handleUserStatusChange = async (action) => {
        clearError();
        setMessage('');
        setMessageType('');

        if (!managementData.userAddress) {
            setMessage('Please enter a user address');
            setMessageType('error');
            return;
        }

        try {
            if (action === 'activate') {
                await activateUser(managementData.userAddress);
                setMessage('User activated successfully');
            } else {
                await deactivateUser(managementData.userAddress);
                setMessage('User deactivated successfully');
            }
            setMessageType('success');
            setManagementData(prev => ({ ...prev, userAddress: '' }));
        } catch (err) {
            setMessage(err.message || 'Failed to update user status');
            setMessageType('error');
        }
    };

    const handleUpdateIFSC = async () => {
        clearError();
        setMessage('');
        setMessageType('');

        if (!managementData.userAddress || !managementData.newIfsc) {
            setMessage('Please enter both user address and new IFSC');
            setMessageType('error');
            return;
        }

        try {
            await updateEmployeeIFSC(managementData.userAddress, managementData.newIfsc);
            setMessage('IFSC updated successfully');
            setMessageType('success');
            setManagementData({ userAddress: '', newIfsc: '' });
        } catch (err) {
            setMessage(err.message || 'Failed to update IFSC');
            setMessageType('error');
        }
    };

    const handleSearchIFSC = async () => {
        clearError();
        setMessage('');
        setMessageType('');

        if (!searchIFSC) {
            setMessage('Please enter an IFSC code to search');
            setMessageType('error');
            return;
        }

        try {
            await getIFSCEmployees(searchIFSC);
            if (ifscEmployees.length === 0) {
                setMessage(`No employees found for IFSC: ${searchIFSC}`);
                setMessageType('info');
            }
        } catch (err) {
            setMessage(err.message || 'Failed to fetch employees');
            setMessageType('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
                
                {message && (
                    <div className={`mb-4 p-4 rounded-md ${
                        messageType === 'success' ? 'bg-green-100 text-green-700' : 
                        messageType === 'info' ? 'bg-blue-100 text-blue-700' : 
                        'bg-red-100 text-red-700'
                    }`}>
                        {message}
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('addUser')}
                            className={`px-4 py-2 rounded-md ${
                                activeTab === 'addUser' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            Add User
                        </button>
                        <button
                            onClick={() => setActiveTab('manageUsers')}
                            className={`px-4 py-2 rounded-md ${
                                activeTab === 'manageUsers' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            Manage Users
                        </button>
                        <button
                            onClick={() => setActiveTab('viewEmployees')}
                            className={`px-4 py-2 rounded-md ${
                                activeTab === 'viewEmployees' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            View Employees
                        </button>
                    </div>
                </div>

                {activeTab === 'addUser' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Add New User</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">User Type</label>
                                <select
                                    name="userType"
                                    value={formData.userType}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="employee">Bank Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ethereum Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="0x..."
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            {formData.userType === 'employee' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                    <input
                                        type="text"
                                        name="ifsc"
                                        value={formData.ifsc}
                                        onChange={handleInputChange}
                                        placeholder="Enter IFSC code"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <LoadingSpinner /> <span className="ml-2">Adding User...</span>
                                    </span>
                                ) : 'Add User'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'manageUsers' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">User Address</label>
                                <input
                                    type="text"
                                    name="userAddress"
                                    value={managementData.userAddress}
                                    onChange={handleManagementInputChange}
                                    placeholder="Enter user address"
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="flex space-x-4">
                                <button
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                                    onClick={() => handleUserStatusChange('activate')}
                                    disabled={isLoading || !managementData.userAddress}
                                >
                                    {isLoading ? 'Processing...' : 'Activate User'}
                                </button>
                                <button
                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                                    onClick={() => handleUserStatusChange('deactivate')}
                                    disabled={isLoading || !managementData.userAddress}
                                >
                                    {isLoading ? 'Processing...' : 'Deactivate User'}
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium mb-3">Update Employee IFSC</h3>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Address</label>
                                        <input
                                            type="text"
                                            name="userAddress"
                                            value={managementData.userAddress}
                                            onChange={handleManagementInputChange}
                                            placeholder="Enter employee address"
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New IFSC Code</label>
                                        <input
                                            type="text"
                                            name="newIfsc"
                                            value={managementData.newIfsc}
                                            onChange={handleManagementInputChange}
                                            placeholder="Enter new IFSC code"
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <button
                                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                        onClick={handleUpdateIFSC}
                                        disabled={isLoading || !managementData.userAddress || !managementData.newIfsc}
                                    >
                                        {isLoading ? 'Updating...' : 'Update IFSC'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'viewEmployees' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">View Employees by IFSC</h2>
                        <div className="space-y-4">
                            <div className="flex space-x-4">
                                <input
                                    type="text"
                                    placeholder="Enter IFSC code"
                                    value={searchIFSC}
                                    onChange={(e) => setSearchIFSC(e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSearchIFSC}
                                    disabled={isLoading || !searchIFSC}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {ifscEmployees.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium mb-2">Employees for IFSC: {searchIFSC}</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Address
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {ifscEmployees.map((employee, index) => (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {employee}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                onClick={() => {
                                                                    setManagementData({
                                                                        userAddress: employee,
                                                                        newIfsc: ''
                                                                    });
                                                                    setActiveTab('manageUsers');
                                                                }}
                                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                            >
                                                                Manage
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setManagementData({
                                                                        userAddress: employee,
                                                                        newIfsc: searchIFSC
                                                                    });
                                                                    handleUpdateIFSC();
                                                                }}
                                                                className="text-green-600 hover:text-green-900"
                                                                disabled={isLoading}
                                                            >
                                                                Update IFSC
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;