import { useEffect, useState } from 'react';
import { createExpense, deleteExpense, getExpenses, updateExpense } from '../api.js';
import ExpenseForm from './ExpenseForm.jsx';
import { CATEGORY_COLORS, formatDate, formatINR } from '../utils.js';

export default function ExpenseList({ meta, filters, setFilters, onDataChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const value = searchInput.trim();
    const t = setTimeout(() => setFilters((f) => (f.search === value ? f : { ...f, search: value })), 300);
    return () => clearTimeout(t);
  }, [searchInput, setFilters]);

  const load = () => {
    setLoading(true);
    getExpenses(filters)
      .then((data) => {
        setItems(data);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters]);

  const handleSave = async (expense) => {
    if (editing) {
      await updateExpense(editing.id, expense);
      setEditing(null);
    } else {
      await createExpense(expense);
    }
    load();
    onDataChanged();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}" (${formatINR(item.amount)})?`)) return;
    try {
      await deleteExpense(item.id);
      if (editing?.id === item.id) setEditing(null);
      load();
      onDataChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="row g-3">
      <div className="col-lg-4 order-lg-2">
        <ExpenseForm meta={meta} editing={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      </div>

      <div className="col-lg-8 order-lg-1">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search description or notes"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <input
                  type="month"
                  className="form-control form-control-sm"
                  value={filters.month}
                  onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
                  aria-label="Filter by month"
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  aria-label="Filter by category"
                >
                  <option value="">All categories</option>
                  {meta.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 d-grid">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setSearchInput('');
                    setFilters({ month: '', category: '', search: '' });
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <span className="text-muted small">{items.length} expense(s){items.length === 500 ? ' (showing latest 500)' : ''}</span>
              <span className="fw-semibold">Total: {formatINR(total)}</span>
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="text-end">Amount</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan="5" className="text-center text-muted py-4">Loading…</td></tr>
                  )}
                  {!loading && items.length === 0 && (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No expenses match these filters.</td></tr>
                  )}
                  {!loading &&
                    items.map((item) => (
                      <tr key={item.id} className={editing?.id === item.id ? 'table-warning' : ''}>
                        <td className="small text-nowrap">{formatDate(item.date)}</td>
                        <td>
                          <div>{item.title}</div>
                          <div className="small text-muted">
                            {item.paymentMethod}
                            {item.notes ? ` · ${item.notes}` : ''}
                          </div>
                        </td>
                        <td>
                          <span className="badge rounded-pill" style={{ background: CATEGORY_COLORS[item.category] }}>
                            {item.category}
                          </span>
                        </td>
                        <td className="text-end fw-semibold text-nowrap">{formatINR(item.amount)}</td>
                        <td className="text-end text-nowrap">
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setEditing(item)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
