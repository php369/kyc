import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCStore from '../store/digitalKYCStore';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
    const navigate = useNavigate();
    const [loadingMessage, setLoadingMessage] = useState('Connecting to blockchain...');
    
    const {
        userRole,
        fetchUserRole,
        isLoading,
        isConnected,
        connectWallet,
        contract
    } = useDigitalKYCStore(state => ({
        userRole: state.userRole,
        fetchUserRole: state.fetchUserRole,
        isLoading: state.isLoading,
        isConnected: state.isConnected,
        connectWallet: state.connectWallet,
        contract: state.contract
    }));

    // Effect to handle wallet connection
    useEffect(() => {
        const attemptConnection = async () => {
            if (!isConnected && !isLoading) {
                try {
                    await connectWallet();
                } catch (error) {
                    console.error("Failed to connect wallet:", error);
                }
            }
        };
        
        attemptConnection();
    }, [isConnected, isLoading, connectWallet]);

    // Effect to fetch the user role when connected
    useEffect(() => {
        const getUserRole = async () => {
            if (isConnected && contract) {
                setLoadingMessage('Fetching user details...');
                try {
                    await fetchUserRole();
                } catch (error) {
                    console.error("Failed to fetch user role:", error);
                }
            }
        };
        
        getUserRole();
    }, [isConnected, contract, fetchUserRole]);

    // Effect to handle redirection based on role
    useEffect(() => {
        if (!isLoading && isConnected) {
            setLoadingMessage('Redirecting to appropriate dashboard...');
            
            if (userRole === 3) { // Admin
                navigate('/admin');
            } else if (userRole === 2) { // Bank Employee
                navigate('/employee');
            } else if (userRole === 1) { // Customer
                navigate('/customer');
            } else if (userRole === null || userRole === 0) {
                navigate('/register');
            }
        }
    }, [userRole, isLoading, isConnected, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
            <div className="text-center max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-blue-700 mb-2">Digital KYC Platform</h1>
                <p className="text-gray-600 mb-8">Secure, transparent, and efficient identity verification</p>
                
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center">
                            <LoadingSpinner />
                            <p className="mt-4 text-gray-600">{loadingMessage}</p>
                        </div>
                    ) : !isConnected ? (
                        <div className="text-center">
                            <p className="text-gray-700 mb-4">Please connect your wallet to access the platform</p>
                            <button 
                                onClick={connectWallet}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Connect Wallet
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-700">Wallet connected! Preparing your dashboard...</p>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-blue-600">For Customers</h3>
                        <p className="text-gray-600 text-sm mt-2">Submit and manage your KYC documents securely</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-blue-600">For Bank Employees</h3>
                        <p className="text-gray-600 text-sm mt-2">Verify customer documents with full traceability</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-blue-600">For Admins</h3>
                        <p className="text-gray-600 text-sm mt-2">Manage users and oversee the KYC process</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;