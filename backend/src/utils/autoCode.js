/**
 * Sinh mã tiếp theo cho một loại document.
 * Luôn chạy trong transaction riêng để tránh race condition.
 * Format: PREFIX-YYYY-NNNN (VD: SP-2026-0001)
 *
 * @param {string} type       - receipt | order | outbound | product | customer
 * @param {object} dbClient  - optional: pg client từ transaction đang chạy
 */
const PREFIXES = {
  receipt:  'YC',
  order:    'SO',
  outbound: 'PXK',
  product:  'SP',
  customer: 'KH',
};

const generateCode = async (type, dbClient) => {
  const prefix = PREFIXES[type];
  if (!prefix) throw new Error(`Unknown code type: ${type}`);

  const db = require('../config/database');

  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  // Nếu caller truyền vào pg client (đang trong transaction), dùng nó
  // Nếu không, tạo transaction riêng để đảm bảo FOR UPDATE lock hoạt động
  if (dbClient) {
    return _generateInClient(dbClient, prefix, year, pattern);
  }

  const client = await db.pool.connect();
  try {
    return await _generateInClient(client, prefix, year, pattern);
  } finally {
    client.release();
  }
};

async function _generateInClient(client, prefix, year, pattern) {
  await client.query('BEGIN');

  const lockResult = await client.query(
    `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1 FOR UPDATE`,
    [`${prefix}-${year}-%`]
  );
  const row = lockResult.rows[0];

  let nextNum = 1;
  if (row?.code) {
    const lastNum = parseInt(row.code.split('-').pop(), 10);
    nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  }

  const newCode = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;

  await client.query(
    `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
    [newCode, prefix, year]
  );

  await client.query('COMMIT');
  return newCode;
}

module.exports = { generateCode };
