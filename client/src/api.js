async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.fields = data.fields;
    throw err;
  }
  return data;
}

export const getMeta = () => request('/meta');

export function getExpenses({ month, category, search } = {}) {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  return request(`/expenses?${params}`);
}

export const createExpense = (expense) => request('/expenses', { method: 'POST', body: JSON.stringify(expense) });

export const updateExpense = (id, expense) =>
  request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(expense) });

export const deleteExpense = (id) => request(`/expenses/${id}`, { method: 'DELETE' });

export const getAnalytics = (year) => request(`/analytics?year=${year}`);
