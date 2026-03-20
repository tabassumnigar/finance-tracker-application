export const formatCurrency = (value: number) =>
  `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
