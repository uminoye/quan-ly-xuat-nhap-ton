require('dotenv').config();
require('./src/config/database').getAll("SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as d, count(*) FROM sales_orders GROUP BY d").then(console.log).finally(()=>process.exit(0));
