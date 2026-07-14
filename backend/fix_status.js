require('dotenv').config();
require('./src/config/database').run("UPDATE return_requests SET status = 'return_completed' WHERE status = 'resolved'")
  .then(() => console.log('Fixed DB'))
  .catch(console.error)
  .finally(()=>process.exit(0));
