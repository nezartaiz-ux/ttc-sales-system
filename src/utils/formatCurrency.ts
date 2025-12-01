// Utility function to format numbers with commas
export const formatCurrency = (amount: number, includeSign: boolean = true): string => {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return includeSign ? `$${formatted}` : formatted;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};
