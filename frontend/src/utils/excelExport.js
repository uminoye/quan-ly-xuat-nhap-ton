import ExcelJS from 'exceljs';

const HDR_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const HDR_FONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const HDR_ALIGN = { vertical: 'middle', horizontal: 'center' };
const ROW_FILL_EVEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
const ROW_FILL_ODD  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const CELL_FONT  = { size: 11, color: { argb: 'FF1F1F1F' } };
const BORDER_STYLE = { style: 'thin', color: { argb: 'FFAAAAAA' } };
const TABLE_BORDER = {
  top:    BORDER_STYLE,
  bottom: BORDER_STYLE,
  left:   BORDER_STYLE,
  right:  BORDER_STYLE,
};

function applyHeader(ws, colCount, title) {
  // Merge title row
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font  = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  // Header row
  const hdrRow = ws.getRow(2);
  hdrRow.alignment = HDR_ALIGN;
  for (let c = 1; c <= colCount; c++) {
    const cell = hdrRow.getCell(c);
    cell.fill  = HDR_FILL;
    cell.font  = HDR_FONT;
    cell.border = TABLE_BORDER;
  }
}

function addSheet(wb, sheetName, title, headers, rows, colWidths) {
  const ws = wb.addWorksheet(sheetName);
  ws.properties.defaultRowHeight = 18;

  // Title & header rows
  applyHeader(ws, headers.length, title);

  // Column widths
  if (colWidths) colWidths.forEach((w, i) => ws.getColumn(i + 1).width = w);

  // Data rows
  rows.forEach((row, ri) => {
    const sheetRow = ws.addRow(row);
    sheetRow.alignment = { vertical: 'middle', wrapText: false };
    sheetRow.eachCell({ includeEmpty: true }, (cell) => {
      const even = ri % 2 === 0;
      cell.fill   = even ? ROW_FILL_EVEN : ROW_FILL_ODD;
      cell.font   = CELL_FONT;
      cell.border = TABLE_BORDER;
      // Bold if first col (label)
      if (cell._column._number === 1) cell.font = { ...CELL_FONT, bold: true };
    });
  });

  return ws;
}

function fmtVND(v) {
  return new Intl.NumberFormat('vi-VN').format(Number(v || 0));
}

export function exportInventoryReport(data) {
  const wb = new ExcelJS.Workbook();
  const items = Array.isArray(data) ? data : [];
  addSheet(wb, 'TonKho', 'BÁO CÁO TỒN KHO', ['SKU', 'Tên sản phẩm', 'Kho', 'Tồn', 'Đơn giá (VND)', 'Thành tiền (VND)'],
    items.map(it => [
      it.sku || '',
      it.product_name || '',
      it.warehouse_name || '',
      Number(it.on_hand_qty || 0),
      Number(it.sale_price || 0),
      Number((it.on_hand_qty || 0) * (it.sale_price || 0)),
    ]),
    [14, 28, 20, 10, 18, 20]
  );
  // Number formats
  const ws = wb.getWorksheet('TonKho');
  ws.getColumn(4).numFmt = '#,##0';
  ws.getColumn(5).numFmt = '#,##0 "đ"';
  ws.getColumn(6).numFmt = '#,##0 "đ"';
  download(wb, 'BaoCaoTonKho');
}

export function exportSalesReport(data) {
  const wb = new ExcelJS.Workbook();
  const tables = data?.tables || {};
  const summary = data?.summary || {};

  // Sheet 1: Summary
  addSheet(wb, 'TongQuan', 'BÁO CÁO DOANH THU - TỔNG QUAN',
    ['Chỉ tiêu', 'Giá trị'],
    [['Tổng đơn hàng', summary.total_orders || 0], ['Tổng doanh thu (VND)', summary.total_revenue || 0], ['Kỳ báo cáo', data?.period || '']],
    [30, 20]
  );
  const ws0 = wb.getWorksheet('TongQuan');
  ws0.getColumn(2).numFmt = '#,##0 "đ"';
  ws0.getRow(2).eachCell({ includeEmpty: true }, c => { c.font = { bold: true }; });

  // Sheet 2: Top Products
  const topProds = Array.isArray(tables.top_products) ? tables.top_products : [];
  addSheet(wb, 'SanPham', 'TOP SẢN PHẨM BÁN CHẠY',
    ['Tên sản phẩm', 'Số lượng bán', 'Doanh thu (VND)'],
    topProds.map(p => [p.name || '', Number(p.total_qty || 0), Number(p.total_revenue || 0)]),
    [30, 18, 22]
  );
  const ws1 = wb.getWorksheet('SanPham');
  ws1.getColumn(2).numFmt = '#,##0';
  ws1.getColumn(3).numFmt = '#,##0 "đ"';

  // Sheet 3: Top Customers
  const topCusts = Array.isArray(tables.top_customers) ? tables.top_customers : [];
  addSheet(wb, 'KhachHang', 'TOP KHÁCH HÀNG',
    ['Khách hàng', 'Số đơn', 'Chi tiêu (VND)'],
    topCusts.map(c => [c.company_name || '', Number(c.order_count || 0), Number(c.total_spent || 0)]),
    [30, 12, 22]
  );
  const ws2 = wb.getWorksheet('KhachHang');
  ws2.getColumn(2).numFmt = '#,##0';
  ws2.getColumn(3).numFmt = '#,##0 "đ"';

  download(wb, 'BaoCaoDoanhThu');
}

export function exportLogisticsReport(data) {
  const wb = new ExcelJS.Workbook();
  const t = data?.tables || {};

  const delStats  = Array.isArray(t.delivery_stats)     ? t.delivery_stats : [];
  const retStats  = Array.isArray(t.return_stats)       ? t.return_stats : [];
  const compStats = Array.isArray(t.compensation_stats)  ? t.compensation_stats : [];
  const carrier   = Array.isArray(t.carrier_stats)      ? t.carrier_stats : [];

  addSheet(wb, 'GiaoHang', 'TRẠNG THÁI GIAO HÀNG',
    ['Trạng thái', 'Số lượng'],
    delStats.map(r => [r.status || '', Number(r.count || 0)]),
    [25, 15]
  );
  wb.getWorksheet('GiaoHang').getColumn(2).numFmt = '#,##0';

  addSheet(wb, 'DonViVanChuyen', 'ĐƠN VỊ VẬN CHUYỂN',
    ['Đơn vị', 'Số chuyến', 'Đã giao', 'Tỷ lệ thành công (%)'],
    carrier.map(c => [c.carrier_code || '', Number(c.shipments || 0), Number(c.delivered || 0), c.success_rate || 0]),
    [20, 14, 14, 20]
  );
  const ws1 = wb.getWorksheet('DonViVanChuyen');
  ws1.getColumn(2).numFmt = '#,##0';
  ws1.getColumn(3).numFmt = '#,##0';
  ws1.getColumn(4).numFmt = '0.0"%"';

  addSheet(wb, 'PhieuBu', 'PHIẾU BÙ THEO LOẠI LỖI',
    ['Loại lỗi', 'Số phiếu', 'Số SP', 'Trạng thái'],
    compStats.map(c => [c.defect_type || '', Number(c.count || 0), Number(c.total_items || 0), c.status || '']),
    [22, 12, 12, 18]
  );
  wb.getWorksheet('PhieuBu').getColumn(2).numFmt = '#,##0';

  download(wb, 'BaoCaoVanChuyen');
}

export function exportWarehouseReport(data) {
  const wb = new ExcelJS.Workbook();
  const t = data?.tables || {};

  const recStats  = Array.isArray(t.receipt_stats)      ? t.receipt_stats : [];
  const outStats   = Array.isArray(t.outbound_stats)    ? t.outbound_stats : [];
  const whSummary  = Array.isArray(t.warehouse_summary) ? t.warehouse_summary : [];
  const prodMove   = Array.isArray(t.product_movement)   ? t.product_movement : [];

  addSheet(wb, 'PhieuNhap', 'TRẠNG THÁI PHIẾU NHẬP KHO',
    ['Trạng thái', 'Số phiếu'],
    recStats.map(r => [r.status || '', Number(r.count || 0)]),
    [25, 15]
  );
  wb.getWorksheet('PhieuNhap').getColumn(2).numFmt = '#,##0';

  addSheet(wb, 'PhieuXuat', 'TRẠNG THÁI PHIẾU XUẤT KHO',
    ['Trạng thái', 'Số phiếu'],
    outStats.map(r => [r.status || '', Number(r.count || 0)]),
    [25, 15]
  );
  wb.getWorksheet('PhieuXuat').getColumn(2).numFmt = '#,##0';

  addSheet(wb, 'TongHopKho', 'TỔNG HỢP THEO KHO',
    ['Kho', 'Loại SP', 'Tổng tồn (SP)', 'Phiếu nhập', 'Phiếu xuất'],
    whSummary.map(w => [w.name || '', Number(w.product_types || 0), Number(w.total_qty || 0), Number(w.receipt_count || 0), Number(w.outbound_count || 0)]),
    [25, 12, 18, 15, 15]
  );
  const ws2 = wb.getWorksheet('TongHopKho');
  ws2.getColumn(3).numFmt = '#,##0';
  ws2.getColumn(4).numFmt = '#,##0';
  ws2.getColumn(5).numFmt = '#,##0';

  addSheet(wb, 'BienDong', 'BIẾN ĐỘNG HÀNG HÓA',
    ['Sản phẩm', 'Nhập (SP)', 'Xuất (SP)', 'Tồn hiện tại'],
    prodMove.map(p => [p.name || '', Number(p.total_in || 0), Number(p.total_out || 0), Number(p.current_stock || 0)]),
    [28, 15, 15, 18]
  );
  const ws3 = wb.getWorksheet('BienDong');
  ws3.getColumn(2).numFmt = '#,##0';
  ws3.getColumn(3).numFmt = '#,##0';
  ws3.getColumn(4).numFmt = '#,##0';

  download(wb, 'BaoCaoKho');
}

export function exportFactoryReport(data) {
  const wb = new ExcelJS.Workbook();
  const t = data?.tables || {};

  const recStats  = Array.isArray(t.receipt_stats)          ? t.receipt_stats : [];
  const compStats  = Array.isArray(t.compensation_stats)      ? t.compensation_stats : [];
  const pendingRec  = Array.isArray(t.pending_receipts)       ? t.pending_receipts : [];
  const pendingComp = Array.isArray(t.pending_compensations)  ? t.pending_compensations : [];

  addSheet(wb, 'PhieuNhap', 'TRẠNG THÁI PHIẾU NHẬP',
    ['Trạng thái', 'Số phiếu'],
    recStats.map(r => [r.status || '', Number(r.count || 0)]),
    [25, 15]
  );
  wb.getWorksheet('PhieuNhap').getColumn(2).numFmt = '#,##0';

  addSheet(wb, 'PhieuBu', 'TRẠNG THÁI PHIẾU BÙ',
    ['Loại lỗi', 'Trạng thái', 'Số phiếu', 'Số SP'],
    compStats.map(c => [c.defect_type || '', c.status || '', Number(c.count || 0), Number(c.total_items || 0)]),
    [22, 18, 12, 12]
  );
  const ws1 = wb.getWorksheet('PhieuBu');
  ws1.getColumn(3).numFmt = '#,##0';
  ws1.getColumn(4).numFmt = '#,##0';

  addSheet(wb, 'PhieuNhapCho', 'PHIẾU NHẬP CHỜ DUYỆT',
    ['Số phiếu', 'Kho', 'Số SP', 'Ghi chú'],
    pendingRec.map(r => [r.receipt_no || '', r.warehouse_name || '', Number(r.item_count || 0), r.note || '']),
    [20, 22, 12, 30]
  );
  wb.getWorksheet('PhieuNhapCho').getColumn(3).numFmt = '#,##0';

  addSheet(wb, 'PhieuBuCho', 'PHIẾU BÙ CHỜ XỬ LÝ',
    ['Số phiếu', 'Mã đơn', 'Khách hàng', 'Loại lỗi'],
    pendingComp.map(c => [c.compensation_no || '', c.order_no || '', c.customer_name || '', c.defect_type || '']),
    [20, 16, 22, 18]
  );

  download(wb, 'BaoCaoNhaMay');
}

export function exportAdminDashboard(data) {
  const wb = new ExcelJS.Workbook();
  const s         = data?.summary || {};
  const whUtil    = Array.isArray(data?.tables?.warehouse_utilization) ? data.tables.warehouse_utilization : [];
  const recentOrd = Array.isArray(data?.tables?.recent_orders)        ? data.tables.recent_orders        : [];
  const topProds  = Array.isArray(data?.tables?.top_products)         ? data.tables.top_products         : [];
  const revData   = (data?.charts?.revenue_by_day || []).map(r => ({ ...r, name: r.date || r.period }));

  // Sheet 1: KPIs
  addSheet(wb, 'KPI', 'DASHBOARD TỔNG QUAN - KPIs',
    ['Chỉ tiêu', 'Giá trị'],
    [
      ['Tổng doanh thu (VND)',     s.total_revenue || 0],
      ['Đơn hoàn thành',           `${s.completed_orders || 0} / ${s.total_orders || 0}`],
      ['Đơn đang chờ',             s.pending_orders || 0],
      ['Tồn kho thấp',             s.low_stock_count || 0],
      ['Phiếu nhập kho',           s.total_receipts || 0],
      ['Phiếu xuất kho',           s.total_outbounds || 0],
      ['Yêu cầu hoàn',             s.return_pending || 0],
      ['Người dùng',               s.total_users || 0],
    ],
    [28, 22]
  );
  wb.getWorksheet('KPI').getColumn(2).numFmt = '#,##0 "đ"';

  // Sheet 2: Doanh thu theo ngày
  addSheet(wb, 'DoanhThu', 'DOANH THU THEO NGÀY',
    ['Ngày', 'Doanh thu (VND)'],
    revData.map(r => [r.name, Number(r.revenue || 0)]),
    [20, 22]
  );
  wb.getWorksheet('DoanhThu').getColumn(2).numFmt = '#,##0 "đ"';

  // Sheet 3: Phân bổ tồn kho
  addSheet(wb, 'PhanBoTonKho', 'PHÂN BỔ TỒN KHO THEO KHO',
    ['Kho', 'SKU', 'Tổng tồn (SP)'],
    whUtil.map(w => [w.name || '', Number(w.product_count || 0), Number(w.total_qty || 0)]),
    [28, 12, 18]
  );
  const ws1 = wb.getWorksheet('PhanBoTonKho');
  ws1.getColumn(2).numFmt = '#,##0';
  ws1.getColumn(3).numFmt = '#,##0';

  // Sheet 4: Đơn hàng gần nhất
  addSheet(wb, 'DonHang', 'ĐƠN HÀNG GẦN NHẤT',
    ['Mã đơn', 'Khách hàng', 'Trạng thái', 'Ngày tạo'],
    recentOrd.map(o => [
      o.order_no || '',
      o.customer_name || '—',
      o.status || '',
      o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '',
    ]),
    [18, 24, 16, 14]
  );

  // Sheet 5: Top sản phẩm bán chạy
  addSheet(wb, 'SanPham', 'TOP SẢN PHẨM BÁN CHẠY',
    ['Sản phẩm', 'SKU', 'Số lượng', 'Doanh thu (VND)'],
    topProds.map(p => [p.name || '', p.sku || '', Number(p.total_qty || 0), Number(p.total_revenue || 0)]),
    [28, 14, 12, 22]
  );
  const ws3 = wb.getWorksheet('SanPham');
  ws3.getColumn(3).numFmt = '#,##0';
  ws3.getColumn(4).numFmt = '#,##0 "đ"';

  download(wb, 'DashboardTongQuan');
}

function download(wb, filename) {
  wb.xlsx.writeBuffer().then(buf => {
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
