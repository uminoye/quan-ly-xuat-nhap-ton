const db = require('../src/config/database');

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const getColumns = (tableName) =>
  new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

const addColumnIfMissing = async (tableName, columnName, columnDefinition) => {
  const columns = await getColumns(tableName);
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await runAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
    console.log(`✅ Added column ${columnName} to ${tableName}`);
  } else {
    console.log(`ℹ️ Column ${columnName} already exists in ${tableName}`);
  }
};

const ensureTable = async (tableName, createSql) => {
  await runAsync(createSql);
  console.log(`✅ Checked table ${tableName}`);
};

const main = async () => {
  try {
    await ensureTable(
      'production_receipts',
      `CREATE TABLE IF NOT EXISTS production_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_no TEXT UNIQUE,
        warehouse_id INTEGER,
        receipt_date TEXT,
        created_by INTEGER,
        note TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await ensureTable(
      'production_receipt_items',
      `CREATE TABLE IF NOT EXISTS production_receipt_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        FOREIGN KEY (receipt_id) REFERENCES production_receipts (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`
    );

    await addColumnIfMissing('production_receipts', 'expected_delivery_date', 'expected_delivery_date TEXT');
    await addColumnIfMissing('production_receipts', 'responded_by', 'responded_by TEXT');
    await addColumnIfMissing('production_receipts', 'responded_reason', 'responded_reason TEXT');
    await addColumnIfMissing('production_receipts', 'responded_at', 'responded_at DATETIME');

    console.log('✅ Receipt migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Receipt migration failed:', error.message);
    process.exit(1);
  }
};

main();
