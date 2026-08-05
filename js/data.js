// ═══════════════════════════════════════════════════════════════
// WMS Mock Data — data.js
// ═══════════════════════════════════════════════════════════════

const WMS_DATA = {
  employees: [
    { id: 'NV001', name: 'Nguyễn Văn An', role: 'worker',     task: 'Picking — Lệnh #4521', avatar: 'NA', color: '#58A6FF' },
    { id: 'NV002', name: 'Trần Thị Bình', role: 'worker',     task: 'Nhập kho — Khu A',     avatar: 'TB', color: '#3FB950' },
    { id: 'NV003', name: 'Lê Văn Cường',  role: 'worker',     task: 'Kiểm đếm — Kệ B-07',   avatar: 'LC', color: '#E3B341' },
    { id: 'NV004', name: 'Phạm Thị Dung', role: 'worker',     task: 'Xuất kho — Đơn #8821', avatar: 'PD', color: '#BC8CFF' },
    { id: 'NV005', name: 'Hoàng Văn Em',  role: 'worker',     task: 'Nhập kho — Khu C',     avatar: 'HE', color: '#FF6B35' },
    { id: 'GS001', name: 'Vũ Thị Hoa',   role: 'supervisor', task: 'Giám sát ca sáng',     avatar: 'VH', color: '#00B4D8' },
    { id: 'GS002', name: 'Đinh Văn Hùng', role: 'supervisor', task: 'Xử lý sai lệch',       avatar: 'DH', color: '#4ECDC4' },
    { id: 'QK001', name: 'Bùi Quang Kho', role: 'admin',      task: 'Quản lý kho',          avatar: 'QK', color: '#9B5DE5' },
  ],

  orders: [
    { id: 'NK-4521', type: 'in',  date: '2026-08-03 06:15', sku_count: 4, worker: 'NV001', progress: 25,  status: 'progress' },
    { id: 'NK-4520', type: 'in',  date: '2026-08-03 05:50', sku_count: 7, worker: 'NV002', progress: 100, status: 'done' },
    { id: 'XK-8821', type: 'out', date: '2026-08-03 07:00', sku_count: 3, worker: 'NV004', progress: 67,  status: 'progress' },
    { id: 'XK-8820', type: 'out', date: '2026-08-03 05:30', sku_count: 5, worker: 'NV001', progress: 100, status: 'done' },
    { id: 'NK-4519', type: 'in',  date: '2026-08-02 22:10', sku_count: 6, worker: 'NV003', progress: 0,   status: 'pending' },
    { id: 'XK-8819', type: 'out', date: '2026-08-03 08:20', sku_count: 9, worker: 'NV005', progress: 11,  status: 'progress' },
    { id: 'NK-4518', type: 'in',  date: '2026-08-03 09:00', sku_count: 2, worker: 'NV002', progress: 0,   status: 'pending' },
    { id: 'XK-8818', type: 'out', date: '2026-08-02 18:00', sku_count: 12,worker: 'NV004', progress: 100, status: 'done' },
    { id: 'NK-4517', type: 'in',  date: '2026-08-03 10:30', sku_count: 3, worker: 'NV001', progress: 0,   status: 'pending', discrepancy: true },
    { id: 'XK-8817', type: 'out', date: '2026-08-03 11:00', sku_count: 5, worker: 'NV003', progress: 0,   status: 'pending' },
  ],

  inventory: [
    { sku: 'SP-00123', name: 'Bình sữa 250ml (Lốc 24)',   zone: 'A', bin: 'A-03-B-07', stock: 142, min: 50,  expiry: '2026-11-15', status: 'ok' },
    { sku: 'SP-00456', name: 'Hộp bánh quy 200g',         zone: 'A', bin: 'A-01-C-02', stock: 18,  min: 30,  expiry: '2026-09-20', status: 'low' },
    { sku: 'SP-00789', name: 'Nước trái cây 500ml',        zone: 'B', bin: 'B-02-A-05', stock: 0,   min: 100, expiry: '2026-08-30', status: 'out' },
    { sku: 'SP-01012', name: 'Dầu ăn cao cấp 1L',         zone: 'A', bin: 'A-05-D-01', stock: 230, min: 80,  expiry: '2027-03-01', status: 'ok' },
    { sku: 'SP-01345', name: 'Cốc thủy tinh cao cấp',     zone: 'C', bin: 'C-01-A-03', stock: 65,  min: 40,  expiry: null,         status: 'ok' },
    { sku: 'SP-01678', name: 'Laptop Gaming X5 Pro',       zone: 'D', bin: 'D-01-A-01', stock: 8,   min: 5,   expiry: null,         status: 'ok' },
    { sku: 'SP-01911', name: 'Mỹ phẩm serum dưỡng da',    zone: 'D', bin: 'D-02-B-03', stock: 3,   min: 20,  expiry: '2026-08-10', status: 'low' },
    { sku: 'SP-02234', name: 'Cà phê rang xay 500g',       zone: 'A', bin: 'A-02-A-04', stock: 89,  min: 60,  expiry: '2026-12-31', status: 'ok' },
    { sku: 'SP-02567', name: 'Kem dưỡng thể SPF50',        zone: 'C', bin: 'C-03-B-06', stock: 12,  min: 25,  expiry: '2026-08-05', status: 'low' },
    { sku: 'SP-02890', name: 'Tai nghe Bluetooth NC700',   zone: 'D', bin: 'D-03-A-02', stock: 22,  min: 10,  expiry: null,         status: 'ok' },
    { sku: 'SP-03123', name: 'Sữa tắm thảo mộc 650ml',    zone: 'A', bin: 'A-04-C-09', stock: 5,   min: 50,  expiry: '2027-01-20', status: 'low' },
    { sku: 'SP-03456', name: 'Nước hoa cao cấp 50ml',      zone: 'D', bin: 'D-04-B-05', stock: 45,  min: 20,  expiry: null,         status: 'ok' },
  ],

  pickingItems: [
    { sku: 'SP-00123', name: 'Bình sữa 250ml',    location: 'A-03-B-07', qty: 6,  picked: false },
    { sku: 'SP-01012', name: 'Dầu ăn cao cấp 1L', location: 'A-05-D-01', qty: 3,  picked: false },
    { sku: 'SP-02234', name: 'Cà phê rang xay',   location: 'A-02-A-04', qty: 12, picked: false },
    { sku: 'SP-01678', name: 'Laptop Gaming X5',  location: 'D-01-A-01', qty: 1,  picked: false },
    { sku: 'SP-03456', name: 'Nước hoa 50ml',     location: 'D-04-B-05', qty: 2,  picked: false },
  ],

  alerts: [
    { type: 'critical', icon: '🔴', title: 'Sai lệch tồn kho nghiêm trọng',      desc: 'SKU SP-00789 (Nước trái cây 500ml) — Khu B: Hệ thống ghi 58 thùng, thực tế = 0. Chênh lệch 100%.', time: '5 phút trước', action: 'Điều tra' },
    { type: 'critical', icon: '⚠️', title: 'Hàng sắp hết hạn trong 48 giờ',      desc: 'SP-01911 (Serum dưỡng da) HSD: 10/08/2026. Cần xuất kho ưu tiên FEFO.', time: '22 phút trước', action: 'Lên kế hoạch xuất' },
    { type: 'critical', icon: '🔒', title: 'Nhân viên NV003 báo không thể truy xuất kệ D-01', desc: 'Kệ D-01-A-01 đang bị khóa hệ thống. Có thể do lỗi đồng bộ scan.', time: '45 phút trước', action: 'Mở khoá' },
    { type: 'warning',  icon: '🟡', title: 'Tồn kho thấp — 4 SKU cần bổ hàng',   desc: 'SP-00456, SP-01911, SP-02567, SP-03123 đều dưới mức tối thiểu. Cần tạo PO.', time: '1 giờ trước', action: 'Tạo đơn bổ hàng' },
    { type: 'warning',  icon: '⏰', title: 'Lệnh NK-4519 quá 30 phút không xử lý', desc: 'Lệnh nhập kho 6 SKU được tạo lúc 22:10 chưa có nhân viên nhận. Phân công lại.', time: '2 giờ trước', action: 'Phân công' },
    { type: 'info-alert', icon: '📦', title: 'Xe vận chuyển đến cổng B — 30 phút nữa', desc: 'Chuyến hàng #TRK-2026-08-03-007 đang trên đường, ETA 14:30. Chuẩn bị bến dỡ.', time: '3 phút trước', action: 'Xem chi tiết' },
  ],

  auditLog: [
    { icon: '📦', type: 'success', action: 'NHẬP KHO', sku: 'SP-00123', detail: 'Nhập 24 thùng vào kệ A-03-B-07. Số lượng khớp 100%.', user: 'NV001 — PDA-07', time: '14:02' },
    { icon: '⚠️', type: 'warning', action: 'SẠI LỆCH', sku: 'SP-00456', detail: 'Chênh lệch 6% (cần 30, thực tế 28). Lý do: Hàng bị ướt 2 thùng. GS đã duyệt.', user: 'NV002 — PDA-12 → GS001', time: '13:55' },
    { icon: '✅', type: 'success', action: 'PICKING',  sku: 'SP-01012', detail: 'Lấy 6 đơn vị cho đơn ORD-88520. Quét kệ A-05-D-01 thành công.', user: 'NV004 — PDA-03', time: '13:40' },
    { icon: '🔄', type: 'info',    action: 'CHUYỂN KỆ', sku: 'SP-02234', detail: 'Di chuyển từ A-01-A-01 → A-02-A-04 để tối ưu luồng picking.', user: 'NV003 — PDA-09', time: '13:20' },
    { icon: '🔴', type: 'danger',  action: 'BÁO LỖI', sku: 'SP-00789', detail: 'Không tìm thấy hàng tại kệ B-02-A-05. Đã gửi ticket điều tra lên GS.', user: 'NV005 — PDA-11', time: '12:58' },
    { icon: '📋', type: 'success', action: 'KIỂM ĐẾM', sku: 'SP-01345', detail: 'Cycle count kệ C-01-A-03. Hệ thống: 65, Thực tế: 65. Khớp hoàn toàn.', user: 'NV003 — PDA-09', time: '12:30' },
  ],

  notifications: [
    { icon: '🔴', title: 'Sai lệch nghiêm trọng', desc: 'SP-00789 chênh lệch 100% tại kệ B-02', time: '5 phút trước' },
    { icon: '⚠️', title: 'Hàng sắp hết hạn',      desc: 'SP-01911 HSD còn 7 ngày',              time: '22 phút trước' },
    { icon: '📦', title: 'Xe hàng sắp đến',        desc: 'TRK-2026-08-03-007 ETA 14:30',         time: '3 phút trước' },
    { icon: '🟡', title: 'Tồn kho thấp',           desc: '4 SKU dưới mức tối thiểu',             time: '1 giờ trước' },
  ],

  activityChart: {
    labels: ['28/7', '29/7', '30/7', '31/7', '1/8', '2/8', '3/8'],
    incoming: [85, 120, 95, 140, 110, 98, 143],
    outgoing: [72, 108, 88, 125, 102, 90, 127],
  },

  // Cycle Count data
  cycleCountItems: [
    { bin: 'A-03-B-07', zone: 'A', sku: 'SP-00123', name: 'Bình sữa 250ml (Lốc 24)',    sysQty: 142, counted: false, actual: null },
    { bin: 'A-01-C-02', zone: 'A', sku: 'SP-00456', name: 'Hộp bánh quy 200g',          sysQty: 18,  counted: false, actual: null },
    { bin: 'B-02-A-05', zone: 'B', sku: 'SP-00789', name: 'Nước trái cây 500ml',         sysQty: 58,  counted: false, actual: null },
    { bin: 'C-01-A-03', zone: 'C', sku: 'SP-01345', name: 'Cốc thủy tinh cao cấp',      sysQty: 65,  counted: false, actual: null },
    { bin: 'D-01-A-01', zone: 'D', sku: 'SP-01678', name: 'Laptop Gaming X5 Pro',        sysQty: 8,   counted: false, actual: null },
  ],

  // Transfer tasks data
  transferTasks: [
    {
      sku:    'SP-00123',
      name:   'Bình sữa 250ml',
      from:   'A-03-B-07',
      to:     'A-01-A-01',
      qty:    48,
      unit:   'thùng',
      reason: 'Tối ưu luồng picking — gần lối ra',
      done:   false,
    },
    {
      sku:    'SP-02234',
      name:   'Cà phê rang xay 500g',
      from:   'A-02-A-04',
      to:     'A-03-C-06',
      qty:    24,
      unit:   'thùng',
      reason: 'Kệ A-02 quá đầy (95%) — cân bằng tải',
      done:   false,
    },
  ],

  zoneMap: (() => {
    const cells = [];
    const zones = ['A','A','A','A','B','B','B','C','D','D'];
    const zoneColors = { A:'#FF6B35', B:'#00B4D8', C:'#FFD166', D:'#9B5DE5' };
    const occupancy  = [0.9,0.75,0.5,0.95,0.8,0.6,0.3,0.85,0.45,0.7];

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 10; col++) {
        const zone = zones[col];
        const occ  = Math.min(1, occupancy[col] + (Math.random()-0.5)*0.3);
        let fill = '#30363D';
        if (Math.random() > 0.1) {
          if      (occ > 0.85) fill = '#F85149';
          else if (occ > 0.6)  fill = '#E3B341';
          else                 fill = '#3FB950';
        }
        cells.push({
          zone, col: col+1, row: row+1,
          bin: `${zone}-${String(row+1).padStart(2,'0')}-${String(col+1).padStart(2,'0')}`,
          fill, occ: Math.round(occ*100),
          border: zoneColors[zone],
        });
      }
    }
    return cells;
  })(),
};
