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
    } = useDigitalKYCStore(state => ({
        addCustomer: state.addCustomer,
        addBankEmployee: state.addBankEmployee,
        currentUser: state.currentUser,
        contract: state.contract,
    }));

    const [formData, setFormData] = useState({
        address: '',
        ifsc: '',
        userType: 'customer'
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        if (!contract || !currentUser) {
             navigate('/');
        } else {
             setFormData(prev => ({
                 ...prev,
                 address: currentUser
             }));
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

        if (!currentUser) {
            setMessage('Wallet not connected or address unavailable.');
            setMessageType('error');
            return;
        }

         if (formData.userType === 'employee' && !formData.ifsc.trim()) {
            setMessage('IFSC code is required for Bank Employee registration.');
            setMessageType('error');
            return;
        }

        try {
            if (formData.userType === 'customer') {
                await addCustomer(currentUser);
                navigate('/customer');
            } else {
                await addBankEmployee(currentUser, formData.ifsc);
                navigate('/employee');
            }
        } catch (err) {
            setMessage(err?.message || 'Registration failed. Please check console for details.');
            setMessageType('error');
            console.error("Registration Error:", err);
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
                        messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm">
                         <div className="mb-4">
                            <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
                                Register As
                            </label>
                            <select
                                id="userType"
                                name="userType"
                                value={formData.userType}
                                onChange={handleInputChange}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            >
                                <option value="customer">Customer</option>
                                <option value="employee">Bank Employee</option>
                            </select>
                        </div>

                         <div className="mb-4">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                Ethereum Address
                            </label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                required
                                value={formData.address}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="0x..."
                                readOnly
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Connected wallet address (read-only)
                            </p>
                        </div>

                        {formData.userType === 'employee' && (
                             <div className="mb-4">
                                <label htmlFor="ifsc" className="block text-sm font-medium text-gray-700 mb-1">
                                    IFSC Code
                                </label>
                                <input
                                    id="ifsc"
                                    name="ifsc"
                                    type="text"
                                    required={formData.userType === 'employee'}
                                    value={formData.ifsc}
                                    onChange={handleInputChange}
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter bank branch IFSC code"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={!currentUser || !contract}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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