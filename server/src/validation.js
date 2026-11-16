import { CATEGORIES, PAYMENT_METHODS } from './db.js';

/**
 * Validates an expense payload from the client.
 * Returns { value } with a clean document, or { errors } with field messages.
 */
export function validateExpense(body) {
  const errors = {};
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const amount = Number(body?.amount);
  const category = body?.category;
  const paymentMethod = body?.paymentMethod || 'UPI';
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
  const date = new Date(body?.date);

  if (title.length < 2 || title.length > 80) errors.title = 'Title must be 2–80 characters.';
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    errors.amount = 'Amount must be a positive number.';
  }
  if (!CATEGORIES.includes(category)) errors.category = 'Choose a valid category.';
  if (!PAYMENT_METHODS.includes(paymentMethod)) errors.paymentMethod = 'Choose a valid payment method.';
  if (Number.isNaN(date.getTime())) {
    errors.date = 'Enter a valid date.';
  } else if (date > new Date()) {
    errors.date = 'Date cannot be in the future.';
  }
  if (notes.length > 300) errors.notes = 'Notes can be at most 300 characters.';

  if (Object.keys(errors).length) return { errors };

  return {
    value: {
      title,
      amount: Math.round(amount * 100) / 100,
      category,
      paymentMethod,
      notes,
      date,
    },
  };
}
