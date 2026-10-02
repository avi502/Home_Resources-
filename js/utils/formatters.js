// Number, Date, and Resource Unit Formatters

export function formatNumber(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '0.0';
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function formatDate(isoString, includeTime = false) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return d.toLocaleDateString(undefined, options);
}

export function formatResourceUnit(resourceType) {
  switch (resourceType?.toLowerCase()) {
    case 'electricity': return 'kWh';
    case 'water': return 'L';
    case 'food': return 'kg';
    case 'money': return 'USD';
    case 'time': return 'hrs';
    default: return 'units';
  }
}
