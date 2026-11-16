export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatINR = (value) => currency.format(value || 0);

/** Short form for chart axes: 1.2L, 45K */
export function formatCompact(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `₹${Math.round(value)}`;
}

/** Dates are stored as UTC midnight; show them without timezone shifting. */
export const toDateInput = (iso) => new Date(iso).toISOString().slice(0, 10);

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const currentMonthInput = () => todayInput().slice(0, 7);

/** One fixed colour per category so charts and badges stay consistent. */
export const CATEGORY_COLORS = {
  'Food & Dining': '#2a78d6',
  Groceries: '#16a34a',
  Transport: '#eab308',
  Shopping: '#db2777',
  'Bills & Utilities': '#7c3aed',
  Rent: '#0f766e',
  Entertainment: '#ea580c',
  Health: '#dc2626',
  Education: '#0891b2',
  Travel: '#65a30d',
  Other: '#6b7280',
};
