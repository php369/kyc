import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCStore from '../store/digitalKYCStore';

const Register = () => {
    const navigate = useNavigate();
    const { 
        addCustomer, 
        addBankEmployee,
        currentUser,
        contract,
        account
    } = useDigitalKYCStore();
    
    const [formData, setFormData] = useState({
        address: '',
        ifsc: '',
        userType: 'customer' // customer or employee
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                address: currentUser
            }));
        }
    }, [currentUser]);

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
            if (formData.userType === 'customer') {
                await addCustomer(account);
                setMessage('Registered as Customer successfully');
            } else {
                await addBankEmployee(account, formData.ifsc);
                setMessage('Registered as Bank Employee successfully');
            }
            setMessageType('success');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            setMessage(err.message || 'Registration failed');
            setMessageType('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Register New Account
                    </h2>
                </div>

                {message && (
                    <div className={`rounded-md p-4 ${
                        messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                        {message}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                                Register As
                            </label>
                            <select
                                id="userType"
                                name="userType"
                                value={formData.userType}
                                onChange={handleInputChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            >
                                <option value="customer">Customer</option>
                                <option value="employee">Bank Employee</option>
                            </select>
                        </div>

                        <div className="mt-4">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                Ethereum Address
                            </label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                required
                                value={formData.address}
                                onChange={handleInputChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="0x..."
                                readOnly
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Connected wallet address
                            </p>
                        </div>

                        {formData.userType === 'employee' && (
                            <div className="mt-4">
                                <label htmlFor="ifsc" className="block text-sm font-medium text-gray-700 mb-2">
                                    IFSC Code
                                </label>
                                <input
                                    id="ifsc"
                                    name="ifsc"
                                    type="text"
                                    required
                                    value={formData.ifsc}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter IFSC code"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register; 