require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');
async function run() {
    const hash = await bcrypt.hash('123', 10);
    await db.run("UPDATE users SET password_hash = $1 WHERE email = 'admin@congty.com'", [hash]);
    console.log("Password updated for admin@congty.com");
    process.exit(0);
}
run();
