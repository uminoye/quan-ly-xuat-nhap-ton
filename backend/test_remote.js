require('dotenv').config();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function test() {
  // Get a real token
  const user = await pool.query('SELECT id, role_id FROM users LIMIT 1');
  if (user.rows.length === 0) { console.log('No users found'); await pool.end(); return; }
  const { id, role_id } = user.rows[0];
  const token = jwt.sign({ id, role_id }, process.env.JWT_SECRET, { expiresIn: 86400 });
  console.log('Token:', token.substring(0, 30) + '...');

  // Get real test URL from deployed backend
  const BASE = 'https://quan-ly-xuat-nhap-ton.onrender.com';

  const tests = [
    { url: '/api/reports/dashboard', auth: false },
    { url: '/api/reports/inventory', auth: true },
    { url: '/api/orders', auth: true },
    { url: '/api/outbounds', auth: true },
    { url: '/api/outbounds/pending', auth: true },
    { url: '/api/receipts', auth: false },
    { url: '/api/logistics/process', auth: true, method: 'POST' },
  ];

  for (const t of tests) {
    try {
      const opts = {
        method: t.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(t.auth ? { 'Authorization': `Bearer ${token}` } : {})
        },
      };
      if (t.method === 'POST') opts.body = JSON.stringify({ order_id: 1, warehouse_id: 1 });

      const resp = await fetch(`${BASE}${t.url}`, opts);
      const text = await resp.text();
      const status = resp.status;
      const short = text.length > 200 ? text.substring(0, 200) + '...' : text;
      console.log(`[${status}] ${t.method || 'GET'} ${t.url}: ${short}`);
    } catch (e) {
      console.log(`[ERR] ${t.url}: ${e.message}`);
    }
  }

  await pool.end();
}
test().catch(e => { console.error(e.message); process.exit(1); });
