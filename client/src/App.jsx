import { useEffect, useState } from 'react';
import { getMeta } from './api.js';
import Dashboard from './components/Dashboard.jsx';
import ExpenseList from './components/ExpenseList.jsx';
import { currentMonthInput } from './utils.js';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ month: currentMonthInput(), category: '', search: '' });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getMeta()
      .then(setMeta)
      .catch(() => setError('Cannot reach the API server. Make sure it is running on port 5001.'));
  }, []);

  const viewMonth = (month) => {
    setFilters({ month, category: '', search: '' });
    setTab('expenses');
  };

  return (
    <>
      <nav className="navbar navbar-expand bg-white border-bottom mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold">💰 Expense Tracker</span>
          <ul className="navbar-nav">
            {[
              ['dashboard', 'Dashboard'],
              ['expenses', 'Expenses'],
            ].map(([key, label]) => (
              <li className="nav-item" key={key}>
                <button
                  className={`nav-link btn btn-link ${tab === key ? 'active fw-semibold' : ''}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="container pb-5">
        {error && <div className="alert alert-danger">{error}</div>}
        {!meta && !error && <p className="text-muted">Loading…</p>}
        {meta && tab === 'dashboard' && <Dashboard onViewMonth={viewMonth} refreshKey={refreshKey} />}
        {meta && tab === 'expenses' && (
          <ExpenseList
            meta={meta}
            filters={filters}
            setFilters={setFilters}
            onDataChanged={() => setRefreshKey((k) => k + 1)}
          />
        )}
      </main>
    </>
  );
}
