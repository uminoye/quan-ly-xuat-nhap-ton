const fs = require('fs');
const file = 'src/pages/ReportsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<table style=\{\{ width: '100%', borderCollapse: 'collapse' \}\}>/g, '<div className="table-responsive" style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse" }}>');
content = content.replace(/<\/table>/g, '</table></div>');

fs.writeFileSync(file, content);
console.log('Tables wrapped');
