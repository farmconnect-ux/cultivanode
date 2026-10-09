/**
 * Currency utilities for Nigerian Naira formatting
 */

export const formatCurrency = (amount: number): string => {
  return `₦${(amount || 0).toLocaleString('en-NG')}`;
};

export const formatCurrencyCompact = (amount: number): string => {
  const val = amount || 0;
  if (val >= 1000000000) {
    return `₦${(val / 1000000000).toFixed(1)}B`;
  } else if (val >= 1000000) {
    return `₦${(val / 1000000).toFixed(1)}M`;
  } else if (val >= 1000) {
    return `₦${(val / 1000).toFixed(1)}K`;
  } else {
    return `₦${val.toLocaleString('en-NG')}`;
  }
};

export const parseCurrency = (currencyString: string): number => {
  return parseFloat(currencyString.replace(/₦|,/g, '')) || 0;
};

export const convertToNGN = (usdAmount: number, exchangeRate: number = 1600): number => {
  return Math.round((usdAmount || 0) * exchangeRate);
};
