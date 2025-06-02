import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createGroup } from '../services/groupService';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { Users, ArrowLeft } from 'lucide-react';

const CreateGroup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create a group');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const groupData = {
        groupName,
        createdBy: user.uid,
        members: [user.uid]
      };
      
      const groupId = await createGroup(groupData);
      toast.success('Group created successfully!');
      navigate(`/groups/${groupId}`);
    } catch (error: any) {
      setError(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-800">Create a New Group</h1>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Roommates, Trip to Paris, Family"
              />
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-200 mt-6 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-3">1</span>
                <span>Your group will be created with you as the admin</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-3">2</span>
                <span>A unique group code will be generated for others to join</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-3">3</span>
                <span>Share this code with friends to add them to your group</span>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-3">4</span>
                <span>Start adding expenses and splitting costs with your group members</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateGroup;