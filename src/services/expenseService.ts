import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  getDoc, 
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Expense, Settlement, Balance, UserProfile } from '../types';
import { convertCurrency } from './currencyService';

export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const newExpense = {
      ...expense,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, `groups/${expense.groupId}/expenses`), newExpense);
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const getExpenseById = async (groupId: string, expenseId: string): Promise<Expense | null> => {
  try {
    const docRef = doc(db, `groups/${groupId}/expenses`, expenseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Expense;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting expense:', error);
    throw error;
  }
};

export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
  try {
    const q = query(
      collection(db, `groups/${groupId}/expenses`),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() } as Expense);
    });
    
    return expenses;
  } catch (error) {
    console.error('Error getting group expenses:', error);
    throw error;
  }
};

export const updateExpense = async (groupId: string, expenseId: string, expenseData: Partial<Expense>): Promise<void> => {
  try {
    await updateDoc(doc(db, `groups/${groupId}/expenses`, expenseId), expenseData);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (groupId: string, expenseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, `groups/${groupId}/expenses`, expenseId));
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export const calculateBalances = async (
  groupId: string, 
  expenses: Expense[], 
  members: UserProfile[],
  baseCurrency: string
): Promise<{
  balances: Record<string, Balance>,
  settlements: Settlement[]
}> => {
  const balances: Record<string, Balance> = {};
  
  // Initialize balances for all members
  members.forEach(member => {
    balances[member.uid] = {
      userId: member.uid,
      amount: 0,
      currency: baseCurrency
    };
  });
  
  // Calculate raw balances
  expenses.forEach(expense => {
    const paidBy = expense.paidBy;
    const amount = expense.amount;
    const fromCurrency = expense.currency;
    
    // Convert to group's base currency
    const convertedAmount = convertCurrency(amount, fromCurrency, baseCurrency);
    
    // Update the payer's balance
    balances[paidBy].amount += convertedAmount;
    
    // Calculate how much each person owes
    const splitAmount = convertedAmount / expense.splitBetween.length;
    
    expense.splitBetween.forEach(userId => {
      // If the user is the payer, don't subtract their own share
      if (userId !== paidBy) {
        balances[userId].amount -= splitAmount;
      }
    });
  });
  
  // Generate simplified settlements
  const settlements = simplifyDebts(balances, baseCurrency);
  
  return { balances, settlements };
};

// Algorithm to minimize the number of transactions
export const simplifyDebts = (
  balances: Record<string, Balance>,
  baseCurrency: string
): Settlement[] => {
  const settlements: Settlement[] = [];
  
  // Separate users who owe money and users who are owed money
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];
  
  for (const userId in balances) {
    const balance = balances[userId].amount;
    
    if (balance < 0) {
      debtors.push({ userId, amount: Math.abs(balance) });
    } else if (balance > 0) {
      creditors.push({ userId, amount: balance });
    }
  }
  
  // Sort by amount (highest first)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  // Greedy algorithm to minimize transactions
  let i = 0;
  let j = 0;
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Math.min(debtor.amount, creditor.amount);
    
    if (amount > 0.01) { // Ignore very small amounts
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount,
        currency: baseCurrency,
        settled: false
      });
    }
    
    debtor.amount -= amount;
    creditor.amount -= amount;
    
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }
  
  return settlements;
};