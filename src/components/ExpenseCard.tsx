import React from 'react';
import { Expense, UserProfile } from '../types';
import { formatCurrency } from '../services/currencyService';
import { DollarSign, Calendar, FileText, Edit, Trash } from 'lucide-react';

interface ExpenseCardProps {
  expense: Expense;
  userProfiles: Record<string, UserProfile>;
  currentUserId: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  preferredCurrency: string;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  userProfiles,
  currentUserId,
  onEdit,
  onDelete,
  preferredCurrency
}) => {
  const paidByUser = userProfiles[expense.paidBy];
  const isCurrentUserExpense = expense.paidBy === currentUserId;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
            {expense.title}
          </h3>
          <div className={`text-sm font-medium px-2 py-1 rounded ${
            isCurrentUserExpense ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {isCurrentUserExpense ? 'You paid' : `${paidByUser?.name} paid`}
          </div>
        </div>
        
        <div className="flex items-center mt-2 mb-3">
          <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
          <span className="text-xl font-bold text-gray-800">
            {formatCurrency(expense.amount, expense.currency)}
          </span>
          {expense.currency !== preferredCurrency && (
            <span className="ml-2 text-sm text-gray-500">
              ({formatCurrency(expense.amount, preferredCurrency)} in {preferredCurrency})
            </span>
          )}
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span>{formatDate(expense.date)}</span>
        </div>
        
        {expense.notes && (
          <div className="flex items-start text-sm text-gray-600 mb-4">
            <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
            <p className="truncate">{expense.notes}</p>
          </div>
        )}
        
        <div className="border-t pt-3 mt-2 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Split between {expense.splitBetween.length} people
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(expense)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(expense.id!)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;