require('dotenv').config();
require('./src/config/database').run("UPDATE return_requests SET status = 'return_completed', logistics_action = 'return_to_warehouse', customer_reject_reason = 'hong_vo', complaint_source = 'after_delivery' WHERE status IS NULL")
  .then(() => console.log('Fixed DB'))
  .catch(console.error)
  .finally(()=>process.exit(0));
