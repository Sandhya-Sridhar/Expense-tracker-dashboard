import { MongoClient } from 'mongodb';

let client;
let db;

export const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Rent',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Other',
];

export const PAYMENT_METHODS = ['UPI', 'Card', 'Cash', 'Net Banking'];

export async function connectDB() {
  client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'expense_tracker');
  await db.collection('expenses').createIndex({ date: -1 });
  await db.collection('expenses').createIndex({ category: 1, date: -1 });
  return db;
}

export function expenses() {
  if (!db) throw new Error('Database not connected.');
  return db.collection('expenses');
}

export async function closeDB() {
  if (client) await client.close();
}
