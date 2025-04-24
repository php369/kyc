import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCStore from '../store/digitalKYCStore';
import AdminDashboard from './AdminDashboard';
import BankEmployeeDashboard from './BankEmployeeDashboard';
import CustomerDashboard from './CustomerDashboard';

const Home = () => {
    const navigate = useNavigate();
    const { 
        isAdmin, 
        isBankEmployee, 
        isCustomer,
        userRole,
        fetchUserRole,
        isLoading
    } = useDigitalKYCStore();

    useEffect(() => {
        const checkUserRole = async () => {
            await fetchUserRole();
            
            // If userRole is 0 (unregistered) or null, redirect to register
            if (userRole === 0 || userRole === null) {
                navigate('/register');
            }
        };
        console.log(userRole)
        checkUserRole();
    }, [fetchUserRole, userRole, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (isAdmin) {
        return <AdminDashboard />;
    }

    if (isBankEmployee) {
        return <BankEmployeeDashboard />;
    }

    if (isCustomer) {
        return <CustomerDashboard />;
    }

    // Default loading state while checking role
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">Loading...</div>
        </div>
    );
};

export default Home; 