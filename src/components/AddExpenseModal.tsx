import React, { useState, useEffect } from 'react';
import { Expense, UserProfile, CURRENCIES } from '../types';
import { addExpense, updateExpense } from '../services/expenseService';
import { toast } from 'react-hot-toast';
import { X, DollarSign, Users, Calendar, FileText, User } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: UserProfile[];
  onExpenseAdded: (expense: Expense) => void;
  onExpenseUpdated: (expense: Expense) => void;
  currentUserId: string;
  expense?: Expense | null;
  preferredCurrency: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  groupId,
  members,
  onExpenseAdded,
  onExpenseUpdated,
  currentUserId,
  expense,
  preferredCurrency
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'custom'>('equal');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState(preferredCurrency);
  const [loading, setLoading] = useState(false);
  const [splitDetails, setSplitDetails] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  
  // Initialize form when editing an expense
  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(expense.amount.toString());
      setDate(expense.date);
      setPaidBy(expense.paidBy);
      setSplitBetween(expense.splitBetween);
      setNotes(expense.notes || '');
      setCurrency(expense.currency);
      setSplitDetails(expense.splitDetails);
      
      // Determine split type from the details
      const isEqual = Object.values(expense.splitDetails).every(
        (val, i, arr) => val === arr[0]
      );
      
      const isPercentage = Object.values(expense.splitDetails).reduce(
        (sum, val) => sum + val, 0
      ) === 100;
      
      if (isEqual) {
        setSplitType('equal');
      } else if (isPercentage) {
        setSplitType('percentage');
      } else {
        setSplitType('custom');
      }
    } else {
      // Default to all members for new expense
      setSplitBetween(members.map(m => m.uid));
      
      // Initialize equal split
      const initialSplitDetails: Record<string, number> = {};
      members.forEach(member => {
        initialSplitDetails[member.uid] = 0;
      });
      setSplitDetails(initialSplitDetails);
    }
  }, [expense, members, currentUserId]);
  
  useEffect(() => {
    // Update split details when split type or members change
    if (splitType === 'equal' && splitBetween.length > 0) {
      const equalShare = 100 / splitBetween.length;
      const newSplitDetails: Record<string, number> = {};
      
      splitBetween.forEach(memberId => {
        newSplitDetails[memberId] = Number(equalShare.toFixed(2));
      });
      
      setSplitDetails(newSplitDetails);
    } else if (splitType === 'percentage' && !expense) {
      // Only reset for new expenses
      const newSplitDetails: Record<string, number> = {};
      
      splitBetween.forEach(memberId => {
        newSplitDetails[memberId] = 0;
      });
      
      setSplitDetails(newSplitDetails);
    }
  }, [splitType, splitBetween, expense]);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !amount || !date || !paidBy || splitBetween.length === 0) {
      setError('Please fill in all required fields');
      return;
    }
    
    const amountValue = parseFloat(amount);
    
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    
    // Validate split details
    if (splitType === 'percentage') {
      const totalPercentage = Object.values(splitDetails).reduce((sum, val) => sum + val, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setError('Percentage split must total 100%');
        return;
      }
    } else if (splitType === 'custom') {
      const totalCustom = Object.values(splitDetails).reduce((sum, val) => sum + val, 0);
      if (Math.abs(totalCustom - amountValue) > 0.01) {
        setError(`Custom split must total ${amountValue} ${currency}`);
        return;
      }
    }
    
    try {
      setLoading(true);
      setError('');
      
      const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
        title,
        amount: amountValue,
        date,
        paidBy,
        splitBetween,
        splitDetails,
        notes: notes || undefined,
        currency,
        groupId
      };
      
      if (expense?.id) {
        // Update existing expense
        await updateExpense(groupId, expense.id, expenseData);
        onExpenseUpdated({ ...expenseData, id: expense.id, createdAt: expense.createdAt });
        toast.success('Expense updated successfully');
      } else {
        // Create new expense
        const expenseId = await addExpense(expenseData);
        onExpenseAdded({ ...expenseData, id: expenseId, createdAt: new Date().toISOString() });
        toast.success('Expense added successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      setError('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSplitTypeChange = (type: 'equal' | 'percentage' | 'custom') => {
    setSplitType(type);
    
    if (type === 'equal') {
      // Reset to equal split
      const equalShare = 100 / splitBetween.length;
      const newSplitDetails: Record<string, number> = {};
      
      splitBetween.forEach(memberId => {
        newSplitDetails[memberId] = Number(equalShare.toFixed(2));
      });
      
      setSplitDetails(newSplitDetails);
    } else if (type === 'percentage') {
      // Initialize percentage split
      const equalPercentage = 100 / splitBetween.length;
      const newSplitDetails: Record<string, number> = {};
      
      splitBetween.forEach(memberId => {
        newSplitDetails[memberId] = Number(equalPercentage.toFixed(2));
      });
      
      setSplitDetails(newSplitDetails);
    } else if (type === 'custom') {
      // Initialize custom split with equal amounts
      const amountValue = parseFloat(amount) || 0;
      const equalAmount = amountValue / splitBetween.length;
      const newSplitDetails: Record<string, number> = {};
      
      splitBetween.forEach(memberId => {
        newSplitDetails[memberId] = Number(equalAmount.toFixed(2));
      });
      
      setSplitDetails(newSplitDetails);
    }
  };
  
  const handleMemberToggle = (memberId: string) => {
    setSplitBetween(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };
  
  const handleCustomSplitChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setSplitDetails(prev => ({
      ...prev,
      [memberId]: numValue
    }));
  };
  
  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.uid === memberId);
    return member?.name || 'Unknown';
  };
  
  // Set today as the default date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Dinner, Groceries, Movie tickets"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="date"
                  value={date || today}
                  onChange={(e) => setDate(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-1">
                Paid By <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="paidBy"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  {members.map((member) => (
                    <option key={member.uid} value={member.uid}>
                      {member.uid === currentUserId ? 'You' : member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Split Between <span className="text-red-500">*</span>
              </label>
              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Select Group Members
                  </span>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.uid} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`member-${member.uid}`}
                        checked={splitBetween.includes(member.uid)}
                        onChange={() => handleMemberToggle(member.uid)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`member-${member.uid}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {member.uid === currentUserId ? 'You' : member.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Type
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md focus:outline-none ${
                    splitType === 'equal'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                  onClick={() => handleSplitTypeChange('equal')}
                >
                  Equal
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md focus:outline-none ${
                    splitType === 'percentage'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                  onClick={() => handleSplitTypeChange('percentage')}
                >
                  Percentage
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md focus:outline-none ${
                    splitType === 'custom'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                  onClick={() => handleSplitTypeChange('custom')}
                >
                  Custom
                </button>
              </div>
            </div>
            
            {/* Show split details based on the selected split type */}
            {splitType !== 'equal' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {splitType === 'percentage' ? 'Split Percentages' : 'Custom Amounts'}
                </label>
                <div className="space-y-2 bg-gray-50 rounded-md p-3 border border-gray-200">
                  {splitBetween.map((memberId) => (
                    <div key={memberId} className="flex items-center">
                      <span className="w-32 text-sm">{getMemberName(memberId)}:</span>
                      <div className="flex-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          value={splitDetails[memberId] || 0}
                          onChange={(e) => handleCustomSplitChange(memberId, e.target.value)}
                          min="0"
                          step={splitType === 'percentage' ? '0.01' : '0.01'}
                          className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">
                            {splitType === 'percentage' ? '%' : currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="flex items-center pt-2 border-t border-gray-200 mt-2">
                    <span className="w-32 text-sm font-medium">Total:</span>
                    <span className="flex-1 text-right pr-12">
                      {splitType === 'percentage' 
                        ? `${Object.values(splitDetails).reduce((sum, val) => sum + val, 0).toFixed(2)}%`
                        : `${Object.values(splitDetails).reduce((sum, val) => sum + val, 0).toFixed(2)} ${currency}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Add any additional details about this expense..."
                />
              </div>
            </div>
          </form>
        </div>
        
        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading 
              ? 'Saving...' 
              : expense 
                ? 'Update Expense' 
                : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;