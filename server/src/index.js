/**
 * Expense Tracker API
 *
 * Browsers cannot talk to MongoDB directly, so this small server (Node's built-in
 * http module + the official MongoDB driver) exposes the expense collection to the
 * React app as a JSON REST API.
 */
import http from 'node:http';
import { ObjectId } from 'mongodb';
import { connectDB, closeDB, expenses, CATEGORIES, PAYMENT_METHODS } from './db.js';
import { validateExpense } from './validation.js';

const PORT = process.env.PORT || 5001;

// ---------- small helpers ----------

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(status === 204 ? undefined : JSON.stringify(data));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw Object.assign(new Error('Request body too large.'), { status: 413 });
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw Object.assign(new Error('Invalid JSON body.'), { status: 400 });
  }
}

function toClient(doc) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function monthRange(month) {
  // month = 'YYYY-MM'
  const [y, m] = month.split('-').map(Number);
  return { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) };
}

function yearRange(year) {
  return { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) };
}

// ---------- route handlers ----------

async function listExpenses(query) {
  const filter = {};
  const month = query.get('month');
  const category = query.get('category');
  const search = query.get('search');

  if (month && /^\d{4}-\d{2}$/.test(month)) filter.date = monthRange(month);
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ title: { $regex: escaped, $options: 'i' } }, { notes: { $regex: escaped, $options: 'i' } }];
  }

  const docs = await expenses().find(filter).sort({ date: -1, createdAt: -1 }).limit(500).toArray();
  return docs.map(toClient);
}

async function analytics(query) {
  const year = Number(query.get('year')) || new Date().getUTCFullYear();

  const [monthly, byCategory, yearly, paymentSplit, years] = await Promise.all([
    // Total per month for the selected year
    expenses()
      .aggregate([
        { $match: { date: yearRange(year) } },
        { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    // Total per category for the selected year
    expenses()
      .aggregate([
        { $match: { date: yearRange(year) } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ])
      .toArray(),
    // Total per year (all time)
    expenses()
      .aggregate([
        { $group: { _id: { $year: '$date' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    // Payment method split for the selected year
    expenses()
      .aggregate([
        { $match: { date: yearRange(year) } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ])
      .toArray(),
    expenses().distinct('date').then((dates) => [...new Set(dates.map((d) => d.getUTCFullYear()))].sort((a, b) => b - a)),
  ]);

  // Fill months with no spending so charts always show 12 bars
  const months = Array.from({ length: 12 }, (_, i) => {
    const found = monthly.find((m) => m._id === i + 1);
    return { month: i + 1, total: found ? found.total : 0, count: found ? found.count : 0 };
  });

  const yearTotal = months.reduce((sum, m) => sum + m.total, 0);
  const activeMonths = months.filter((m) => m.count > 0).length;

  return {
    year,
    availableYears: years.length ? years : [year],
    summary: {
      yearTotal,
      transactions: months.reduce((s, m) => s + m.count, 0),
      averagePerMonth: activeMonths ? yearTotal / activeMonths : 0,
      topCategory: byCategory[0]?._id || null,
      highestMonth: activeMonths ? months.reduce((a, b) => (b.total > a.total ? b : a)).month : null,
    },
    monthly: months,
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    yearly: yearly.map((y) => ({ year: y._id, total: y.total, count: y.count })),
    paymentSplit: paymentSplit.map((p) => ({ method: p._id, total: p.total })),
  };
}

// ---------- router ----------

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean); // e.g. ['api', 'expenses', ':id']

  if (parts[0] !== 'api') return send(res, 404, { error: 'Not found.' });

  // GET /api/meta
  if (parts[1] === 'meta' && req.method === 'GET') {
    return send(res, 200, { categories: CATEGORIES, paymentMethods: PAYMENT_METHODS });
  }

  // GET /api/analytics?year=2026
  if (parts[1] === 'analytics' && req.method === 'GET') {
    return send(res, 200, await analytics(url.searchParams));
  }

  if (parts[1] === 'expenses') {
    const id = parts[2];

    if (!id) {
      if (req.method === 'GET') return send(res, 200, await listExpenses(url.searchParams));
      if (req.method === 'POST') {
        const { value, errors } = validateExpense(await readJson(req));
        if (errors) return send(res, 400, { error: 'Validation failed.', fields: errors });
        const doc = { ...value, createdAt: new Date(), updatedAt: new Date() };
        const { insertedId } = await expenses().insertOne(doc);
        return send(res, 201, toClient({ _id: insertedId, ...doc }));
      }
    } else {
      if (!ObjectId.isValid(id)) return send(res, 400, { error: 'Invalid expense id.' });
      const _id = new ObjectId(id);

      if (req.method === 'PUT') {
        const { value, errors } = validateExpense(await readJson(req));
        if (errors) return send(res, 400, { error: 'Validation failed.', fields: errors });
        const updated = await expenses().findOneAndUpdate(
          { _id },
          { $set: { ...value, updatedAt: new Date() } },
          { returnDocument: 'after' }
        );
        return updated ? send(res, 200, toClient(updated)) : send(res, 404, { error: 'Expense not found.' });
      }

      if (req.method === 'DELETE') {
        const { deletedCount } = await expenses().deleteOne({ _id });
        return deletedCount ? send(res, 204) : send(res, 404, { error: 'Expense not found.' });
      }
    }
  }

  return send(res, 404, { error: 'Route not found.' });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    send(res, err.status || 500, { error: err.status ? err.message : 'Internal server error.' });
  });
});

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Expense API running on http://localhost:${PORT}`));
    const shutdown = async () => {
      server.close();
      await closeDB();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
