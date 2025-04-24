import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCStore from '../store/digitalKYCStore';

const Home = () => {
    const navigate = useNavigate();
    const {
        userRole,
        fetchUserRole,
        isLoading,
        isConnected, // Check connection status
    } = useDigitalKYCStore(state => ({
        userRole: state.userRole,
        fetchUserRole: state.fetchUserRole,
        isLoading: state.isLoading,
        isConnected: state.isConnected,
    }));

    // Effect to fetch the user role when connected, if not already available
    useEffect(() => {
        if (isConnected && userRole === null) {
             fetchUserRole();
        }
    }, [isConnected, userRole, fetchUserRole]);

    // Effect to handle redirection based on the fetched role and loading state
    useEffect(() => {
        // Only attempt redirection if connected and loading is complete
        if (isLoading || !isConnected) {
            return;
        }

        // Redirect based on role
        if (userRole === 1) { // Customer
            navigate('/customer');
        } else if (userRole === 2) { // Employee
            navigate('/employee');
        } else if (userRole === 3) { // Admin
            navigate('/admin');
        } else if (userRole === 0 || userRole === null) {
            // Includes explicitly unregistered (0) or still null after loading check
            navigate('/register');
        }

    }, [userRole, isLoading, isConnected, navigate]);

    // Render loading indicator while checking connection, fetching role, or redirecting
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl animate-pulse">Loading User Data...</div>
        </div>
    );
};

export default Home;