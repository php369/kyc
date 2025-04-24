// --- src/App.js ---
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import EmployeePage from './pages/EmployeePage';
import CustomerPage from './pages/CustomerPage';
import NotFoundPage from './pages/NotFoundPage';
import ConnectWalletButton from './components/ConnectWalletButton';
import UserInfo from './components/UserInfo'; // To display role/account info
import ErrorMessage from './components/ErrorMessage'; // To display global errors
import useDigitalKYCStore from './store/digitalKYCStore';
import Home from './pages/Home';
import Register from './pages/Register';

function App() {
  // Get necessary state for layout/conditional rendering
  const { isConnected, error, clearError } = useDigitalKYCStore();

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header/Navigation */}
      <header className="bg-white shadow-md p-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            DigitalKYC dApp
          </Link>
          <div className="flex items-center space-x-4">
             {/* Display user info if connected */}
            {isConnected && <UserInfo />}
            {/* Wallet Connection Button */}
            <ConnectWalletButton />
          </div>
        </nav>
      </header>

      {/* Global Error Display */}
      {error && <ErrorMessage message={error} onClose={clearError} />}

      {/* Main Content Area */}
      <main className="container mx-auto p-4 mt-4">
        {/* Define application routes */}
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Home />} />

          {/* Role-Specific Routes (add protection later if needed via hooks) */}
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="/employee" element={<EmployeePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/register" element={<Register />} />

          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer (Optional) */}
      <footer className="text-center p-4 mt-8 text-gray-600 text-sm">
        © {new Date().getFullYear()} DigitalKYC Platform. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
