import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { CURRENCIES } from '../types';
import { User, Camera, Save } from 'lucide-react';

const Profile = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setPhotoURL(userProfile.photoURL);
      setPreferredCurrency(userProfile.preferredCurrency);
    }
  }, [userProfile]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await updateUserProfile({
        name,
        photoURL,
        preferredCurrency
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  if (!userProfile) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 p-6 sm:p-8 text-white">
            <h1 className="text-2xl font-bold flex items-center">
              <User className="mr-2 h-6 w-6" />
              Profile Settings
            </h1>
            <p className="mt-1 text-blue-100">Manage your account information and preferences</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-8 flex flex-col sm:flex-row items-center">
              <div className="relative">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={name}
                    className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-3xl border-4 border-white shadow-md">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 shadow-lg">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="text"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a URL for your profile picture
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your Name"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={userProfile.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>
            
            <div className="mb-8">
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Currency
              </label>
              <select
                id="currency"
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                All expenses will be shown in this currency by default
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                      <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;