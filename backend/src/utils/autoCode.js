/**
 * Sinh mã tiếp theo cho một loại document.
 * Format: PREFIX-YYYY-NNNN (VD: YC-2026-0042)
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

  // Dùng client của caller nếu có (khi nằm trong transaction)
  const getOne = dbClient
    ? (text, params) => dbClient.query(text, params).then(r => r.rows[0] || null)
    : db.getOne;

  const run = dbClient
    ? (text, params) => dbClient.query(text, params)
    : db.run;

  const row = await getOne(
    `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1 FOR UPDATE`,
    [pattern]
  );

  let nextNum = 1;
  if (row?.code) {
    const lastNum = parseInt(row.code.split('-').pop(), 10);
    nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  }

  const newCode = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;

  await run(
    `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
    [newCode, prefix, year]
  );

  return newCode;
};

module.exports = { generateCode };
