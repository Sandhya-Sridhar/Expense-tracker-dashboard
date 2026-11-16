import { useEffect, useState } from 'react';
import { toDateInput, todayInput } from '../utils.js';

const EMPTY = { title: '', amount: '', category: '', paymentMethod: 'UPI', date: '', notes: '' };

export default function ExpenseForm({ meta, editing, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, date: todayInput() });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setErrors({});
    setForm(
      editing
        ? { ...editing, amount: String(editing.amount), date: toDateInput(editing.date) }
        : { ...EMPTY, date: todayInput() }
    );
  }, [editing]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (form.title.trim().length < 2) errs.title = 'Enter a short description.';
    if (!(Number(form.amount) > 0)) errs.amount = 'Enter an amount greater than 0.';
    if (!form.category) errs.category = 'Choose a category.';
    if (!form.date) errs.date = 'Choose a date.';
    else if (form.date > todayInput()) errs.date = 'Date cannot be in the future.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await onSave({ ...form, amount: Number(form.amount) });
      if (!editing) setForm({ ...EMPTY, date: form.date, paymentMethod: form.paymentMethod });
    } catch (err) {
      setErrors(err.fields || { form: err.message });
    } finally {
      setSaving(false);
    }
  };

  const invalid = (field) => (errors[field] ? 'is-invalid' : '');

  return (
    <div className={`card shadow-sm ${editing ? 'border-warning' : ''}`}>
      <div className="card-body">
        <h2 className="h6 mb-3">{editing ? 'Edit expense' : 'Add expense'}</h2>
        {errors.form && <div className="alert alert-danger py-2 small">{errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-2">
            <label className="form-label small mb-1" htmlFor="title">Description</label>
            <input id="title" className={`form-control ${invalid('title')}`} value={form.title} onChange={update('title')} maxLength={80} placeholder="e.g. Groceries at Big Bazaar" />
            <div className="invalid-feedback">{errors.title}</div>
          </div>

          <div className="row g-2 mb-2">
            <div className="col-6">
              <label className="form-label small mb-1" htmlFor="amount">Amount (₹)</label>
              <input id="amount" type="number" min="0" step="0.01" className={`form-control ${invalid('amount')}`} value={form.amount} onChange={update('amount')} />
              <div className="invalid-feedback">{errors.amount}</div>
            </div>
            <div className="col-6">
              <label className="form-label small mb-1" htmlFor="date">Date</label>
              <input id="date" type="date" max={todayInput()} className={`form-control ${invalid('date')}`} value={form.date} onChange={update('date')} />
              <div className="invalid-feedback">{errors.date}</div>
            </div>
          </div>

          <div className="row g-2 mb-2">
            <div className="col-6">
              <label className="form-label small mb-1" htmlFor="category">Category</label>
              <select id="category" className={`form-select ${invalid('category')}`} value={form.category} onChange={update('category')}>
                <option value="">Select…</option>
                {meta.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="invalid-feedback">{errors.category}</div>
            </div>
            <div className="col-6">
              <label className="form-label small mb-1" htmlFor="method">Payment</label>
              <select id="method" className="form-select" value={form.paymentMethod} onChange={update('paymentMethod')}>
                {meta.paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small mb-1" htmlFor="notes">Notes (optional)</label>
            <textarea id="notes" rows="2" className="form-control" value={form.notes} onChange={update('notes')} maxLength={300} />
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update expense' : 'Add expense'}
            </button>
            {editing && (
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
