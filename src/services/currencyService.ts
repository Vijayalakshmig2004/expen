import { CURRENCY_RATES } from '../types';

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Get the conversion rate
  const conversionRate = CURRENCY_RATES[fromCurrency]?.[toCurrency];
  
  if (!conversionRate) {
    console.error(`Conversion rate not found for ${fromCurrency} to ${toCurrency}`);
    return amount;
  }
  
  return amount * conversionRate;
};

export const formatCurrency = (
  amount: number,
  currency: string
): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};