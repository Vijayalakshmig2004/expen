import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserGroups } from '../services/groupService';
import { Group } from '../types';
import Layout from '../components/Layout';
import GroupCard from '../components/GroupCard';
import { Plus } from 'lucide-react';
import JoinGroupModal from '../components/JoinGroupModal';

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchGroups = async () => {
      if (user) {
        try {
          const userGroups = await getUserGroups(user.uid);
          setGroups(userGroups);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching groups:', error);
          setLoading(false);
        }
      }
    };
    
    fetchGroups();
  }, [user]);
  
  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Groups</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Join Group
            </button>
            <Link 
              to="/create-group"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus size={16} className="mr-1" /> New Group
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            {groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <GroupCard 
                    key={group.id} 
                    group={group} 
                    onClick={() => navigate(`/groups/${group.id}`)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-medium text-gray-600 mb-2">No groups yet</h3>
                <p className="text-gray-500 mb-4">Create a new group or join an existing one to get started</p>
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setJoinModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Join a Group
                  </button>
                  <Link 
                    to="/create-group"
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Plus size={16} className="mr-1" /> Create New Group
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <JoinGroupModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </Layout>
  );
};

export default Dashboard;