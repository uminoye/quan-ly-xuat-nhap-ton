/**
 * Helper export danh sach ra Excel (.xlsx) su dung exceljs.
 * Dung cho cac trang list: Sales, Products, Customers, Receipts, Outbounds, Returns, Logistics.
 */
import ExcelJS from 'exceljs';

const HDR_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const HDR_FONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const HDR_ALIGN = { vertical: 'middle', horizontal: 'center' };
const ROW_FILL_EVEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
const ROW_FILL_ODD  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const CELL_FONT  = { size: 11, color: { argb: 'FF1F1F1F' } };
const BORDER_STYLE = { style: 'thin', color: { argb: 'FFAAAAAA' } };
const TABLE_BORDER = { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE };

function applyHeader(ws, colCount, title) {
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font  = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;
  const hdrRow = ws.getRow(2);
  hdrRow.alignment = HDR_ALIGN;
  for (let c = 1; c <= colCount; c++) {
    const cell = hdrRow.getCell(c);
    cell.fill  = HDR_FILL;
    cell.font  = HDR_FONT;
    cell.border = TABLE_BORDER;
  }
}

/**
 * Export 1 sheet tu mang rows.
 * @param {string} filename - Ten file (khong can .xlsx)
 * @param {string} sheetName
 * @param {string} title
 * @param {string[]} headers
 * @param {Array<Array<any>>} rows
 * @param {number[]} colWidths - chieu rong tung cot
 * @param {object[]} [numberCols] - [{ col: 1-based index, format: '#,##0' | '#,##0 "đ"' | '0.0"%"' }]
 */
export async function exportListToExcel({
  filename, sheetName = 'Sheet1', title, headers, rows, colWidths = [], numberCols = [],
}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.properties.defaultRowHeight = 18;
  applyHeader(ws, headers.length, title);
  colWidths.forEach((w, i) => ws.getColumn(i + 1).width = w);

  rows.forEach((row, ri) => {
    const sheetRow = ws.addRow(row);
    sheetRow.alignment = { vertical: 'middle', wrapText: false };
    sheetRow.eachCell({ includeEmpty: true }, (cell) => {
      const even = ri % 2 === 0;
      cell.fill   = even ? ROW_FILL_EVEN : ROW_FILL_ODD;
      cell.font   = CELL_FONT;
      cell.border = TABLE_BORDER;
      if (cell._column._number === 1) cell.font = { ...CELL_FONT, bold: true };
    });
  });

  // Apply number formats
  numberCols.forEach(({ col, format }) => {
    ws.getColumn(col).numFmt = format;
  });

  // Freeze header
  ws.views = [{ state: 'frozen', ySplit: 2 }];

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
