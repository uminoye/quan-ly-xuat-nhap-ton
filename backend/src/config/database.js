const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

const query = (text, params, client) => (client || pool).query(text, params);

const getOne = async (text, params, client) => {
  const result = await (client || pool).query(text, params);
  return result.rows[0] || null;
};

const getAll = async (text, params, client) => {
  const result = await (client || pool).query(text, params);
  return result.rows;
};

const run = async (text, params, client) => {
  const result = await (client || pool).query(text, params);
  return result;
};

module.exports = { pool, query, getOne, getAll, run };
