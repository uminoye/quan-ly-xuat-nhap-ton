require('dotenv').config();
const db = require('./src/config/database');
async function run() {
    const r1 = await db.getAll("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'auto_codes'");
    console.log(r1);
    process.exit(0);
}
run();
