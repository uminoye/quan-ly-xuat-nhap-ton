const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/AccountsPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add <style> block right inside the main container
const styleStr = `<style>{\`
  .acc-grid { display: grid; gap: 14px; }
  .acc-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .acc-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .acc-grid-search { grid-template-columns: minmax(0, 1.3fr) minmax(240px, 0.7fr); gap: 12px; }
  .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  
  @media (max-width: 1024px) {
    .acc-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 768px) {
    .acc-grid-3 { grid-template-columns: 1fr; }
    .acc-grid-2 { grid-template-columns: 1fr; }
    .acc-grid-search { grid-template-columns: 1fr; }
  }
\`}</style>
      <div style={styles.shell}>`;

content = content.replace(/<div style=\{styles\.shell\}>/, styleStr);

// 2. Replace styles.statGrid usage
content = content.replace(/<div style=\{styles\.statGrid\}>/g, '<div className="acc-grid acc-grid-3" style={{ marginBottom: "22px" }}>');

// 3. Replace styles.formGrid usage
content = content.replace(/<div style=\{styles\.formGrid\}>/g, '<div className="acc-grid acc-grid-2">');

// 4. Replace inline search grid
content = content.replace(/<div style=\{\{\s*marginTop:\s*'14px',\s*display:\s*'grid',\s*gridTemplateColumns:\s*'minmax\(0,\s*1\.3fr\)\s*minmax\(240px,\s*0\.7fr\)',\s*gap:\s*'12px'\s*\}\}>/, '<div className="acc-grid acc-grid-search" style={{ marginTop: "14px" }}>');

// 5. Wrap table with div.table-responsive
content = content.replace(/<table style=\{styles\.table\}>/, '<div className="table-responsive"><table style={{ ...styles.table, minWidth: 600 }}>');
content = content.replace(/<\/table>/, '</table></div>');

fs.writeFileSync(file, content);
console.log('AccountsPage responsive styles applied.');
