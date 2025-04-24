import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCStore from '../store/digitalKYCStore';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { 
        contract, 
        currentUser,
        addAdmin,
        addBankEmployee,
        addCustomer,
        deactivateUser,
        activateUser,
        updateEmployeeIFSC,
        getIFSCEmployees,
        ifscEmployees,
        isLoading,
        error
    } = useDigitalKYCStore();

    const [formData, setFormData] = useState({
        address: '',
        ifsc: '',
        userType: 'customer' // customer, employee, admin
    });

    const [activeTab, setActiveTab] = useState('addUser');
    const [searchIFSC, setSearchIFSC] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        if (!contract || !currentUser) {
            navigate('/');
        }
    }, [contract, currentUser, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        try {
            switch (formData.userType) {
                case 'admin':
                    await addAdmin(formData.address);
                    setMessage('Admin added successfully');
                    setMessageType('success');
                    break;
                case 'employee':
                    await addBankEmployee(formData.address, formData.ifsc);
                    setMessage('Bank employee added successfully');
                    setMessageType('success');
                    break;
                case 'customer':
                    await addCustomer(formData.address);
                    setMessage('Customer added successfully');
                    setMessageType('success');
                    break;
                default:
                    throw new Error('Invalid user type');
            }
            setFormData({ address: '', ifsc: '', userType: 'customer' });
        } catch (err) {
            setMessage(err.message || 'Failed to add user');
            setMessageType('error');
        }
    };

    const handleUserStatusChange = async (address, action) => {
        try {
            if (action === 'activate') {
                await activateUser(address);
                setMessage('User activated successfully');
            } else {
                await deactivateUser(address);
                setMessage('User deactivated successfully');
            }
            setMessageType('success');
        } catch (err) {
            setMessage(err.message || 'Failed to update user status');
            setMessageType('error');
        }
    };

    const handleIFSCUpdate = async (address, newIFSC) => {
        try {
            await updateEmployeeIFSC(address, newIFSC);
            setMessage('IFSC updated successfully');
            setMessageType('success');
        } catch (err) {
            setMessage(err.message || 'Failed to update IFSC');
            setMessageType('error');
        }
    };

    const handleSearchIFSC = async () => {
        try {
            await getIFSCEmployees(searchIFSC);
        } catch (err) {
            setMessage(err.message || 'Failed to fetch employees');
            setMessageType('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
                
                {/* Message Display */}
                {message && (
                    <div className={`mb-4 p-4 rounded-md ${
                        messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message}
                    </div>
                )}

                {/* Tabs */}
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

                {/* Add User Form */}
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
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {isLoading ? 'Adding User...' : 'Add User'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Manage Users */}
                {activeTab === 'manageUsers' && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
                        <div className="space-y-4">
                            <div className="flex space-x-4">
                                <input
                                    type="text"
                                    placeholder="Enter user address"
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                <button
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                    onClick={() => handleUserStatusChange(formData.address, 'activate')}
                                >
                                    Activate User
                                </button>
                                <button
                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                                    onClick={() => handleUserStatusChange(formData.address, 'deactivate')}
                                >
                                    Deactivate User
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Employees */}
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
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Search
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
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <button
                                                                onClick={() => handleIFSCUpdate(employee, searchIFSC)}
                                                                className="text-blue-600 hover:text-blue-900"
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

export default AdminDashboard; 