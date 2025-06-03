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

/**
 * Add an expense with support for equal and percentage splits.
 */
export const addExpense = async (
  expense: Omit<Expense, 'id' | 'createdAt'> & {
    splitMethod: 'equal' | 'percentage';
    percentages?: Record<string, number>;
  }
): Promise<string> => {
  try {
    const { amount, paidBy, splitBetween, currency, groupId, splitMethod, percentages } = expense;

    const convertedAmount = amount; // Currency conversion if needed
    let splitDetails: Record<string, number> = {};

    if (splitMethod === 'equal') {
      const perPerson = convertedAmount / splitBetween.length;
      splitBetween.forEach(uid => {
        splitDetails[uid] = parseFloat(perPerson.toFixed(2));
      });
    } else if (splitMethod === 'percentage') {
      if (!percentages) throw new Error('Percentages must be provided for percentage split.');

      let totalPercent = 0;
      splitBetween.forEach(uid => {
        const percent = percentages[uid] || 0;
        totalPercent += percent;
        splitDetails[uid] = parseFloat(((percent / 100) * convertedAmount).toFixed(2));
      });

      if (Math.abs(totalPercent - 100) > 0.1) {
        throw new Error('Percentages must add up to 100.');
      }
    }

    const newExpense = {
      paidBy,
      amount,
      currency,
      groupId,
      splitBetween,
      splitMethod,
      percentages: splitMethod === 'percentage' ? percentages : undefined,
      splitDetails,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, `groups/${groupId}/expenses`), newExpense);
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

/**
 * Calculates member balances and settlements.
 */
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
  
  // Initialize balances
  members.forEach(member => {
    balances[member.uid] = {
      userId: member.uid,
      amount: 0,
      currency: baseCurrency
    };
  });
  
  // Calculate balances
  expenses.forEach(expense => {
    const paidBy = expense.paidBy;
    const fromCurrency = expense.currency;
    const convertedAmount = convertCurrency(expense.amount, fromCurrency, baseCurrency);

    // Credit the payer
    balances[paidBy].amount += convertedAmount;

    // Debit each participant
    Object.entries(expense.splitDetails || {}).forEach(([userId, amount]) => {
      if (userId !== paidBy) {
        const convertedShare = convertCurrency(amount, fromCurrency, baseCurrency);
        balances[userId].amount -= convertedShare;
      }
    });
  });
  
  const settlements = simplifyDebts(balances, baseCurrency);
  
  return { balances, settlements };
};

/**
 * Simplify debts into a minimal set of transactions.
 */
export const simplifyDebts = (
  balances: Record<string, Balance>,
  baseCurrency: string
): Settlement[] => {
  const settlements: Settlement[] = [];
  
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];
  
  for (const userId in balances) {
    const balance = balances[userId].amount;
    if (balance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    }
  }
  
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  let i = 0;
  let j = 0;
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Math.min(debtor.amount, creditor.amount);
    
    if (amount > 0.01) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: parseFloat(amount.toFixed(2)),
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
