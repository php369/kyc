import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDigitalKYCStore from '../store/digitalKYCStore';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import CustomerDashboard from './CustomerDashboard';

const Dashboard = () => {
    const navigate = useNavigate();
    const { 
        userRole, 
        isAdmin, 
        isBankEmployee, 
        isCustomer, 
        isLoading,
        fetchUserRole 
    } = useDigitalKYCStore();

    useEffect(() => {
        const checkUserRole = async () => {
            await fetchUserRole();
        };
        checkUserRole();
    }, [fetchUserRole]);

    useEffect(() => {
        if (!isLoading) {
            if (userRole === null || userRole === 0) {
                navigate('/register');
            }
        }
    }, [userRole, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {isAdmin && <AdminDashboard />}
            {isBankEmployee && <EmployeeDashboard />}
            {isCustomer && <CustomerDashboard />}
        </div>
    );
};

export default Dashboard; 