const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/ReportsPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace repeat(3, minmax(0, 1fr)) with className="rep-grid rep-grid-3"
content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3, minmax\(0, 1fr\)\)',\s*gap:\s*14,\s*marginBottom:\s*18\s*\}\}/g, 'className="rep-grid rep-grid-3"');

// Replace repeat(4, minmax(0, 1fr)) if it exists
content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(4, minmax\(0, 1fr\)\)',\s*gap:\s*14,\s*marginBottom:\s*18\s*\}\}/g, 'className="rep-grid rep-grid-4"');

// Replace 1fr 1fr with marginBottom: 18
content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*14,\s*marginBottom:\s*18\s*\}\}/g, 'className="rep-grid rep-grid-2 mb-18"');

// Replace 1fr 1fr without marginBottom
content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*14\s*\}\}/g, 'className="rep-grid rep-grid-2"');

// Enhance style block
const styleStr = `<style>{\`
  @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
  .rep-grid { display: grid; gap: 14px; }
  .rep-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .rep-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 18px; }
  .rep-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mb-18 { margin-bottom: 18px; }
  
  @media (max-width: 1024px) {
    .rep-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 18px; }
    .rep-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 768px) {
    .rep-grid-4 { grid-template-columns: 1fr; }
    .rep-grid-3 { grid-template-columns: 1fr; }
    .rep-grid-2 { grid-template-columns: 1fr; }
    .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  }
\`}</style>`;

content = content.replace(/<style>\{`@keyframes spin \{ from \{ transform: rotate\(0\); \} to \{ transform: rotate\(360deg\); \} \}`\}<\/style>/, styleStr);

// Wrap tables with div.table-responsive
content = content.replace(/<table style=\{\{ width: '100%', borderCollapse: 'collapse' \}\}>/g, '<div className="table-responsive"><table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse" }}>');
content = content.replace(/<\/table>/g, '</table></div>');

fs.writeFileSync(file, content);
console.log('Responsive styles applied.');
