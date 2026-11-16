/**
 * Fills the database with ~14 months of realistic sample expenses so the
 * dashboard has data to show.  Run with: npm run seed
 */
import { connectDB, closeDB, expenses } from './db.js';

const TEMPLATES = [
  { title: 'House rent', category: 'Rent', min: 12000, max: 12000, perMonth: 1, method: 'Net Banking', day: 3 },
  { title: 'Electricity bill', category: 'Bills & Utilities', min: 900, max: 2200, perMonth: 1, method: 'UPI' },
  { title: 'Mobile & internet', category: 'Bills & Utilities', min: 599, max: 799, perMonth: 1, method: 'UPI' },
  { title: 'Supermarket groceries', category: 'Groceries', min: 800, max: 2600, perMonth: 4, method: 'Card' },
  { title: 'Vegetables & milk', category: 'Groceries', min: 150, max: 600, perMonth: 5, method: 'UPI' },
  { title: 'Lunch with friends', category: 'Food & Dining', min: 250, max: 900, perMonth: 3, method: 'UPI' },
  { title: 'Food delivery', category: 'Food & Dining', min: 200, max: 650, perMonth: 4, method: 'UPI' },
  { title: 'Metro card recharge', category: 'Transport', min: 300, max: 500, perMonth: 2, method: 'UPI' },
  { title: 'Cab ride', category: 'Transport', min: 120, max: 450, perMonth: 3, method: 'UPI' },
  { title: 'Movie tickets', category: 'Entertainment', min: 300, max: 800, perMonth: 1, method: 'Card' },
  { title: 'Streaming subscription', category: 'Entertainment', min: 149, max: 199, perMonth: 1, method: 'Card' },
  { title: 'Clothes shopping', category: 'Shopping', min: 900, max: 3500, perMonth: 0.6, method: 'Card' },
  { title: 'Pharmacy', category: 'Health', min: 120, max: 900, perMonth: 0.7, method: 'Cash' },
  { title: 'Online course', category: 'Education', min: 499, max: 3000, perMonth: 0.3, method: 'Card' },
  { title: 'Weekend trip', category: 'Travel', min: 2500, max: 8000, perMonth: 0.2, method: 'Card' },
  { title: 'Gift for friend', category: 'Other', min: 300, max: 1500, perMonth: 0.4, method: 'UPI' },
];

const rand = (min, max) => Math.round((min + Math.random() * (max - min)) / 10) * 10;

function buildExpenses(monthsBack = 14) {
  const now = new Date();
  const docs = [];

  for (let offset = monthsBack - 1; offset >= 0; offset--) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() - offset;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const isCurrentMonth = offset === 0;
    const maxDay = isCurrentMonth ? now.getUTCDate() : daysInMonth;
    // Festive season (Oct/Nov) spending bump
    const festive = [9, 10].includes(new Date(Date.UTC(year, month, 1)).getUTCMonth()) ? 1.4 : 1;

    for (const t of TEMPLATES) {
      let count = Math.floor(t.perMonth);
      if (Math.random() < t.perMonth - count) count++;
      for (let i = 0; i < count; i++) {
        const day = Math.min(t.day ?? 1 + Math.floor(Math.random() * daysInMonth), maxDay);
        const multiplier = ['Shopping', 'Other', 'Food & Dining'].includes(t.category) ? festive : 1;
        docs.push({
          title: t.title,
          amount: rand(t.min, t.max) * multiplier,
          category: t.category,
          paymentMethod: t.method,
          notes: '',
          date: new Date(Date.UTC(year, month, day)),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }
  return docs;
}

await connectDB();
await expenses().deleteMany({});
const docs = buildExpenses();
await expenses().insertMany(docs);
console.log(`Seeded ${docs.length} sample expenses.`);
await closeDB();
