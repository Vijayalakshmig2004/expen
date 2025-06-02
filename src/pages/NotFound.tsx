import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-6">
          <DollarSign className="h-12 w-12 text-blue-600" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-2">Page not found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <Link 
          to="/" 
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Home className="h-5 w-5 mr-2" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;