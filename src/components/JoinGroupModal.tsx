import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { joinGroupByCode } from '../services/groupService';
import { toast } from 'react-hot-toast';
import { X, Users } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupCode.trim()) {
      setError('Please enter a group code');
      return;
    }
    
    if (!user || !userProfile) {
      setError('You must be logged in to join a group');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const group = await joinGroupByCode(groupCode.toUpperCase(), user.uid, userProfile);
      
      if (group) {
        toast.success(`You've joined ${group.groupName}!`);
        onClose();
        navigate(`/groups/${group.id}`);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Join a Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleJoinGroup} className="p-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="groupCode" className="block text-sm font-medium text-gray-700 mb-1">
              Enter Group Code
            </label>
            <input
              type="text"
              id="groupCode"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ABCDEF"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the 6-character code provided by the group creator
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupModal;