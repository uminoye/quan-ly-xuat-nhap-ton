const db = require('../config/database');

const PREFIXES = {
  receipt: 'YC',
  order: 'SO',
  outbound: 'PXK',
  product: 'SP',
  customer: 'KH',
};

/**
 * Sinh mã tiếp theo cho một loại document.
 * Format: PREFIX-YYYY-NNNN (VD: YC-2026-0042)
 * Lock row để tránh race condition khi nhiều request cùng tạo.
 */
const generateCode = async (type) => {
  const prefix = PREFIXES[type];
  if (!prefix) throw new Error(`Unknown code type: ${type}`);

  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  const row = await db.getOne(
    `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1 FOR UPDATE`,
    [pattern]
  );

  let nextNum = 1;
  if (row?.code) {
    const lastNum = parseInt(row.code.split('-').pop(), 10);
    nextNum = lastNum + 1;
  }

  const newCode = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;

  await db.run(
    `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [newCode, prefix, year]
  );

  return newCode;
};

module.exports = { generateCode };
