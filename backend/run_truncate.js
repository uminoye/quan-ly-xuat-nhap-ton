require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
    console.error('Loi: Chua co DATABASE_URL! Copy vao .env truoc.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function runTruncate() {
    console.log('Ket noi Neon thanh cong!\n');
    const client = await pool.connect();
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../database/truncate_all.sql'), 'utf-8');
        await client.query(sql);
        console.log('Da xoa toan bo du lieu thanh cong!');
    } catch (err) {
        console.error('Loi:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runTruncate();
