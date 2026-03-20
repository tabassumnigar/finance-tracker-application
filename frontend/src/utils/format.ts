const buildCurrencyFormatter = (currency: string) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatCurrency = (value?: number, fallback = '-', currency = 'INR') => {
  if (value === undefined || value === null) {
    return fallback;
  }
  return buildCurrencyFormatter(currency).format(value);
};

export const formatPercent = (value?: number) => {
  const pct = value ?? 0;
  return `${Math.round(pct * 100)}%`;
};

export const stripCurrencySuffix = (value?: string) =>
  value?.replace(/\s*\([A-Z]{3}\)$/, '').trim() ?? value;
