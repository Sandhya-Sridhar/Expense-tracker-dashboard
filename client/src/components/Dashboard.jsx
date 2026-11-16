import { useEffect, useState } from 'react';
import { getAnalytics } from '../api.js';
import BarChart from '../charts/BarChart.jsx';
import DonutChart from '../charts/DonutChart.jsx';
import { CATEGORY_COLORS, MONTH_NAMES, formatINR } from '../utils.js';

export default function Dashboard({ onViewMonth, refreshKey }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    getAnalytics(year)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [year, refreshKey]);

  if (error) return <div className="alert alert-danger">Could not load analytics: {error}</div>;
  if (!data) return <p className="text-muted">Loading dashboard…</p>;

  const { summary, monthly, byCategory, yearly, paymentSplit } = data;
  const now = new Date();
  const thisMonthTotal = year === now.getFullYear() ? monthly[now.getMonth()].total : null;
  const paymentTotal = paymentSplit.reduce((s, p) => s + p.total, 0);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h1 className="h4 mb-0">Spending overview</h1>
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="year" className="text-muted small">Year</label>
          <select id="year" className="form-select form-select-sm w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[...new Set([now.getFullYear(), ...data.availableYears])].sort((a, b) => b - a).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="row g-3 mb-3">
        <Kpi label={`Total spent in ${year}`} value={formatINR(summary.yearTotal)} sub={`${summary.transactions} transactions`} />
        <Kpi
          label={thisMonthTotal !== null ? 'This month' : 'Highest month'}
          value={thisMonthTotal !== null ? formatINR(thisMonthTotal) : summary.highestMonth ? MONTH_NAMES[summary.highestMonth - 1] : '—'}
          sub={thisMonthTotal !== null ? MONTH_NAMES[now.getMonth()] : ''}
        />
        <Kpi label="Average per month" value={formatINR(summary.averagePerMonth)} sub="months with spending" />
        <Kpi
          label="Top category"
          value={summary.topCategory || '—'}
          sub={byCategory[0] ? formatINR(byCategory[0].total) : ''}
        />
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-1">Monthly spending — {year}</h2>
              <p className="text-muted small mb-3">Click a bar to see that month's expenses.</p>
              <BarChart
                data={monthly.map((m) => ({ label: MONTH_NAMES[m.month - 1], value: m.total }))}
                onBarClick={(i) => onViewMonth(`${year}-${String(i + 1).padStart(2, '0')}`)}
              />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Yearly comparison</h2>
              <BarChart
                width={320}
                height={280}
                color="#7c3aed"
                data={yearly.map((y) => ({ label: String(y.year), value: y.total }))}
                activeIndex={yearly.findIndex((y) => y.year === year)}
                onBarClick={(i) => setYear(yearly[i].year)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Spending by category — {year}</h2>
              <DonutChart
                data={byCategory.map((c) => ({ label: c.category, value: c.total, color: CATEGORY_COLORS[c.category] }))}
              />
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Payment methods — {year}</h2>
              {paymentSplit.length === 0 && <p className="text-muted small">No data.</p>}
              {paymentSplit.map((p) => {
                const pct = paymentTotal ? (p.total / paymentTotal) * 100 : 0;
                return (
                  <div key={p.method} className="mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{p.method}</span>
                      <span className="text-muted">{formatINR(p.total)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div className="progress-bar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              <h2 className="h6 mt-4 mb-2">Top categories</h2>
              <table className="table table-sm small mb-0">
                <tbody>
                  {byCategory.slice(0, 5).map((c) => (
                    <tr key={c.category}>
                      <td>
                        <span className="legend-swatch" style={{ background: CATEGORY_COLORS[c.category] }} />
                        {c.category}
                      </td>
                      <td className="text-muted">{c.count} txns</td>
                      <td className="text-end fw-semibold">{formatINR(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small">{label}</div>
          <div className="kpi-value text-truncate">{value}</div>
          {sub && <div className="text-muted small">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
