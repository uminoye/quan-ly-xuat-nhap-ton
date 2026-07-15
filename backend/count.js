require('dotenv').config();
const db = require('./src/config/database');
async function run() {
    const r1 = await db.getAll("SELECT created_at FROM compensation_requests");
    console.log("Compensations created_at:", r1.map(r => r.created_at));
    process.exit(0);
}
run();
