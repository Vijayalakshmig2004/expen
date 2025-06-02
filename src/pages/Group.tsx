import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGroupById } from '../services/groupService';
import { getGroupExpenses, deleteExpense, calculateBalances } from '../services/expenseService';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import ExpenseCard from '../components/ExpenseCard';
import { Group as GroupType, Expense, UserProfile, Settlement } from '../types';
import { Plus, Users, ArrowLeft, Filter, DollarSign } from 'lucide-react';
import AddExpenseModal from '../components/AddExpenseModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Group = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<GroupType | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId || !user) return;
      
      try {
        const groupData = await getGroupById(groupId);
        
        if (!groupData) {
          toast.error('Group not found');
          navigate('/');
          return;
        }
        
        // Check if user is a member
        if (!groupData.members.includes(user.uid)) {
          toast.error('You are not a member of this group');
          navigate('/');
          return;
        }
        
        setGroup(groupData);
        
        // Fetch member profiles
        const profiles: Record<string, UserProfile> = {};
        
        for (const memberId of groupData.members) {
          try {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            if (userDoc.exists()) {
              profiles[memberId] = userDoc.data() as UserProfile;
            }
          } catch (error) {
            console.error('Error fetching member profile:', error);
          }
        }
        
        setMemberProfiles(profiles);
        
        // Fetch expenses
        const expensesData = await getGroupExpenses(groupId);
        setExpenses(expensesData);
        
        // Calculate balances
        if (userProfile) {
          const result = await calculateBalances(
            groupId,
            expensesData,
            Object.values(profiles),
            userProfile.preferredCurrency
          );
          
          setSettlements(result.settlements);
          
          // Convert balances record to a simpler format for display
          const balanceMap: Record<string, number> = {};
          Object.entries(result.balances).forEach(([userId, balance]) => {
            balanceMap[userId] = balance.amount;
          });
          setBalances(balanceMap);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching group data:', error);
        toast.error('Failed to load group data');
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId, user, userProfile, navigate]);
  
  const handleDeleteExpense = async (expenseId: string) => {
    if (!groupId || !window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await deleteExpense(groupId, expenseId);
      setExpenses(expenses.filter(e => e.id !== expenseId));
      toast.success('Expense deleted successfully');
      
      // Recalculate balances
      if (userProfile) {
        const result = await calculateBalances(
          groupId,
          expenses.filter(e => e.id !== expenseId),
          Object.values(memberProfiles),
          userProfile.preferredCurrency
        );
        
        setSettlements(result.settlements);
        
        const balanceMap: Record<string, number> = {};
        Object.entries(result.balances).forEach(([userId, balance]) => {
          balanceMap[userId] = balance.amount;
        });
        setBalances(balanceMap);
      }
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };
  
  const handleAddExpense = (newExpense: Expense) => {
    setExpenses([newExpense, ...expenses]);
    
    // Recalculate balances
    if (userProfile) {
      calculateBalances(
        groupId!,
        [newExpense, ...expenses],
        Object.values(memberProfiles),
        userProfile.preferredCurrency
      ).then(result => {
        setSettlements(result.settlements);
        
        const balanceMap: Record<string, number> = {};
        Object.entries(result.balances).forEach(([userId, balance]) => {
          balanceMap[userId] = balance.amount;
        });
        setBalances(balanceMap);
      });
    }
  };
  
  const handleEditExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setEditingExpense(null);
    
    // Recalculate balances
    if (userProfile) {
      calculateBalances(
        groupId!,
        expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e),
        Object.values(memberProfiles),
        userProfile.preferredCurrency
      ).then(result => {
        setSettlements(result.settlements);
        
        const balanceMap: Record<string, number> = {};
        Object.entries(result.balances).forEach(([userId, balance]) => {
          balanceMap[userId] = balance.amount;
        });
        setBalances(balanceMap);
      });
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (!group) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700">Group not found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold">{group.groupName}</h1>
            <div className="flex items-center mt-2">
              <Users className="h-5 w-5 mr-2 text-blue-100" />
              <span>{group.members.length} members</span>
              <div className="ml-6 bg-white/20 px-3 py-1 rounded-full text-sm">
                Group Code: {group.groupCode}
              </div>
            </div>
          </div>
          
          {/* Balances Summary */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
              <DollarSign className="h-5 w-5 mr-1 text-blue-600" />
              Balance Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Your Balance</h3>
                {userProfile && balances[user?.uid!] !== undefined && (
                  <div className={`text-xl font-bold ${
                    balances[user?.uid!] > 0 
                      ? 'text-green-600' 
                      : balances[user?.uid!] < 0 
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}>
                    {balances[user?.uid!] > 0 
                      ? `You are owed ${Math.abs(balances[user?.uid!]).toFixed(2)} ${userProfile.preferredCurrency}`
                      : balances[user?.uid!] < 0 
                        ? `You owe ${Math.abs(balances[user?.uid!]).toFixed(2)} ${userProfile.preferredCurrency}`
                        : `You're all settled up!`}
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Settlements</h3>
                {settlements.length > 0 ? (
                  <ul className="text-sm">
                    {settlements
                      .filter(s => s.from === user?.uid || s.to === user?.uid)
                      .map((settlement, index) => (
                        <li key={index} className="py-1">
                          {settlement.from === user?.uid ? (
                            <span>
                              You owe <span className="font-medium">{memberProfiles[settlement.to]?.name}</span>{' '}
                              <span className="font-semibold">{settlement.amount.toFixed(2)} {settlement.currency}</span>
                            </span>
                          ) : (
                            <span>
                              <span className="font-medium">{memberProfiles[settlement.from]?.name}</span> owes you{' '}
                              <span className="font-semibold">{settlement.amount.toFixed(2)} {settlement.currency}</span>
                            </span>
                          )}
                        </li>
                      ))
                    }
                  </ul>
                ) : (
                  <p className="text-gray-600">Everyone is settled up!</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Expenses List */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Expenses</h2>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setShowAddExpense(true);
                }}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Expense
              </button>
            </div>
            
            {expenses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expenses.map(expense => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    userProfiles={memberProfiles}
                    currentUserId={user?.uid || ''}
                    onEdit={(e) => {
                      setEditingExpense(e);
                      setShowAddExpense(true);
                    }}
                    onDelete={handleDeleteExpense}
                    preferredCurrency={userProfile?.preferredCurrency || 'INR'}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No expenses yet</p>
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setShowAddExpense(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add your first expense
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showAddExpense && (
        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => {
            setShowAddExpense(false);
            setEditingExpense(null);
          }}
          groupId={groupId!}
          members={Object.values(memberProfiles)}
          onExpenseAdded={handleAddExpense}
          onExpenseUpdated={handleEditExpense}
          currentUserId={user?.uid || ''}
          expense={editingExpense}
          preferredCurrency={userProfile?.preferredCurrency || 'INR'}
        />
      )}
    </Layout>
  );
};

export default Group;