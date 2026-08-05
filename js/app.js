// ═══════════════════════════════════════════════════════════════
// WMS Application Logic — app.js
// ═══════════════════════════════════════════════════════════════

/* ─── STATE ────────────────────────────────────────────────────── */
const STATE = {
  currentScreen: 'login',
  currentRole:   'admin',
  currentUser:   null,
  currentPdaScreen: 'home',
  pdaHistory:    [],
  recvQty:       '',
  recvStep:      2,
  recvProgress:  { done: 1, total: 4 },
  pickItems:     [],
  pickDone:      0,
  scanContext:   null,  // 'item'|'bin'|'pick'|'count-bin'|'tf-from'|'tf-to'
  notifOpen:     false,
  charts:        {},
  startTime:     Date.now(),
  // Cycle Count
  countItems:    [],
  countIdx:      0,
  countStep:     1,
  countQtyStr:   '',
  // Transfer
  transferTasks: [],
  tfActiveIdx:   null,
  tfStep:        1,
};


/* ─── INIT ─────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  updateHeaderDate();
  setInterval(updateHeaderDate, 60_000);
  renderNotifications();
  loadPickItems();
  initCountItems();
  initTransferTasks();
  setupDiscOptions();
  document.getElementById('employee-id').focus();
  document.addEventListener('keydown', handleGlobalKeys);
});


function handleGlobalKeys(e) {
  if (e.key === 'Enter' && STATE.currentScreen === 'login') doLogin();
}

/* ─── DATE/TIME ────────────────────────────────────────────────── */
function updateHeaderDate() {
  const el = document.getElementById('header-date');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

/* ─── SCREENS ──────────────────────────────────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  const el = document.getElementById(`screen-${name}`);
  if (!el) return;

  el.style.display = name === 'dashboard' ? 'flex' : 'flex';
  requestAnimationFrame(() => el.classList.add('active'));
  STATE.currentScreen = name;

  if (name === 'dashboard') {
    showDashTab('overview');
    initCharts();
    renderDashboard();
  }

  if (name === 'pda') {
    pdaNav('home');
  }
}

function applyRBAC() {
  const role = STATE.currentRole;
  
  // 1. Worker: Cannot exit PDA to Dashboard
  const pdaExitBtn = document.querySelector('.pda-exit-btn');
  if (pdaExitBtn) {
    pdaExitBtn.style.display = role === 'worker' ? 'none' : 'flex';
  }
  
  // 2. Supervisor: Hide Reports & Audit Log
  const reportsNav = document.getElementById('nav-reports');
  const auditNav = document.getElementById('nav-audit');
  if (reportsNav) {
    reportsNav.style.display = role === 'admin' ? 'flex' : 'none';
  }
  if (auditNav) {
    auditNav.style.display = role === 'admin' ? 'flex' : 'none';
  }
}

/* ─── LOGIN ────────────────────────────────────────────────────── */
function doLogin() {
  const id  = document.getElementById('employee-id').value.trim() || 'NV001';
  const role = document.querySelector('.role-btn.active')?.dataset.role || 'worker';

  const user = WMS_DATA.employees.find(e => e.id === id) ||
               WMS_DATA.employees.find(e => e.role === role) ||
               WMS_DATA.employees[0];

  STATE.currentUser = user;
  STATE.currentRole = role;

  // Update sidebar
  document.getElementById('sidebar-name').textContent  = user.name;
  document.getElementById('sidebar-role').textContent  = roleLabel(role);
  document.getElementById('sidebar-avatar').textContent = user.avatar;
  document.getElementById('sidebar-avatar').style.background = `linear-gradient(135deg, ${user.color}, #1a1a2e)`;
  document.getElementById('pda-user-name').textContent = user.name;

  const btn = document.getElementById('btn-login');
  btn.textContent = '⏳ Đang xác thực...';
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Đăng nhập`;
    btn.disabled = false;
    applyRBAC();
    showScreen(role === 'worker' ? 'pda' : 'dashboard');
    showToast(`Xin chào, ${user.name}!`, 'success');
  }, 800);
}

function quickLogin(role) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`role-${role}`).classList.add('active');
  const idMap = { worker: 'NV001', supervisor: 'GS001', admin: 'QK001' };
  document.getElementById('employee-id').value = idMap[role];
  doLogin();
}

function doLogout() {
  showScreen('login');
  document.getElementById('employee-id').value = '';
  document.getElementById('password').value = '';
  STATE.currentUser = null;
}

function roleLabel(r) {
  return { worker: 'Nhân viên kho', supervisor: 'Giám sát', admin: 'Quản lý kho' }[r] || r;
}

/* ─── SIDEBAR ──────────────────────────────────────────────────── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

/* ─── DASHBOARD TABS ────────────────────────────────────────────── */
function showDashTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const tc = document.getElementById(`tab-${tab}`);
  const ni = document.getElementById(`nav-${tab}`);
  if (tc) tc.classList.add('active');
  if (ni) ni.classList.add('active');

  const titles = {
    overview:  'Dashboard Tổng quan',
    orders:    'Lệnh Nhập / Xuất kho',
    inventory: 'Quản lý Tồn kho',
    zonemap:   'Sơ đồ Kho',
    alerts:    'Cảnh báo & Sự cố',
    reports:   'Báo cáo Ca',
    audit:     'Lịch sử Thao tác (Audit Log)',
  };
  document.getElementById('page-title').textContent = titles[tab] || tab;

  // Lazy render
  const renderers = {
    orders:    renderOrdersTable,
    inventory: renderInventoryTable,
    zonemap:   renderZoneMap,
    alerts:    renderAlerts,
    audit:     renderAuditLog,
    reports:   initReportChart,
  };
  if (renderers[tab]) renderers[tab]();
}

/* ─── DASHBOARD RENDER ───────────────────────────────────────────── */
function renderDashboard() {
  renderRecentOrders();
  renderStaffList();
}

function renderRecentOrders() {
  const tbody = document.getElementById('recent-orders-body');
  if (!tbody) return;
  tbody.innerHTML = WMS_DATA.orders.slice(0, 6).map(o => `
    <tr>
      <td><span class="sku-code">${o.id}</span></td>
      <td><span class="table-badge badge-${o.type === 'in' ? 'in' : 'out'}">${o.type === 'in' ? '📥 Nhập' : '📤 Xuất'}</span></td>
      <td>${o.sku_count} SKU</td>
      <td>${workerName(o.worker)}</td>
      <td>
        <div class="mini-progress">
          <div class="mini-progress-bar"><div class="mini-progress-fill" style="width:${o.progress}%"></div></div>
          <span class="mini-progress-text">${o.progress}%</span>
        </div>
      </td>
      <td><span class="table-badge badge-${o.status}">${statusLabel(o.status)}</span></td>
    </tr>
  `).join('');
}

function renderStaffList() {
  const el = document.getElementById('staff-list');
  if (!el) return;
  el.innerHTML = WMS_DATA.employees.slice(0,8).map(s => `
    <div class="staff-item">
      <div class="staff-avatar" style="background:linear-gradient(135deg,${s.color},#1a1a2e)">${s.avatar}</div>
      <div class="staff-info">
        <div class="staff-name">${s.name}</div>
        <div class="staff-task">${s.task}</div>
      </div>
      <span class="staff-status success-text">● Online</span>
    </div>
  `).join('');
}

function renderOrdersTable() {
  const tbody = document.getElementById('all-orders-body');
  if (!tbody) return;
  tbody.innerHTML = WMS_DATA.orders.map(o => `
    <tr>
      <td><span class="sku-code">${o.id}</span>${o.discrepancy ? ' <span title="Sai lệch" style="color:var(--color-warning)">⚠️</span>' : ''}</td>
      <td><span class="table-badge badge-${o.type === 'in' ? 'in' : 'out'}">${o.type === 'in' ? '📥 Nhập kho' : '📤 Xuất kho'}</span></td>
      <td style="color:var(--text-secondary);font-size:12px">${o.date}</td>
      <td>${o.sku_count} SKU</td>
      <td>${workerName(o.worker)}</td>
      <td>
        <div class="mini-progress">
          <div class="mini-progress-bar"><div class="mini-progress-fill" style="width:${o.progress}%"></div></div>
          <span class="mini-progress-text">${o.progress}%</span>
        </div>
      </td>
      <td><span class="table-badge badge-${o.status}">${statusLabel(o.status)}</span></td>
      <td>
        <button class="alert-btn alert-btn-primary" style="font-size:11px" onclick="showToast('Mở lệnh ${o.id}','info')">Xem</button>
      </td>
    </tr>
  `).join('');
}

function renderInventoryTable(data) {
  const tbody = document.getElementById('inventory-body');
  if (!tbody) return;
  const items = data || WMS_DATA.inventory;
  tbody.innerHTML = items.map(item => {
    const isExpiringSoon = item.expiry && daysUntil(item.expiry) <= 7;
    const statusColor = { ok: 'success', low: 'warning', out: 'danger' }[item.status];
    const statusText  = { ok: '🟢 Đủ hàng', low: '🟡 Sắp hết', out: '🔴 Hết hàng' }[item.status];
    return `
    <tr>
      <td><span class="sku-code">${item.sku}</span></td>
      <td>${item.name}</td>
      <td><span style="color:var(--zone-${item.zone.toLowerCase()});font-weight:700">Khu ${item.zone}</span> / ${item.bin}</td>
      <td style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--color-${statusColor})">${item.stock}</td>
      <td style="color:var(--text-muted)">${item.min}</td>
      <td style="color:${isExpiringSoon ? 'var(--color-danger)' : 'var(--text-secondary)'}">
        ${item.expiry ? `${item.expiry}${isExpiringSoon ? ' ⚠️' : ''}` : '—'}
      </td>
      <td><span class="table-badge badge-${item.status === 'ok' ? 'done' : item.status === 'low' ? 'pending' : 'error'}">${statusText}</span></td>
      <td>
        <button class="alert-btn alert-btn-ghost" style="font-size:11px" onclick="showToast('Chi tiết ${item.sku}','info')">Chi tiết</button>
      </td>
    </tr>`;
  }).join('');
}

function filterInventory(q) {
  const filtered = WMS_DATA.inventory.filter(i =>
    i.sku.toLowerCase().includes(q.toLowerCase()) ||
    i.name.toLowerCase().includes(q.toLowerCase())
  );
  renderInventoryTable(filtered);
}

function filterInvStatus(status) {
  document.querySelectorAll('#tab-inventory .filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const filtered = status === 'all'
    ? WMS_DATA.inventory
    : WMS_DATA.inventory.filter(i => i.status === status);
  renderInventoryTable(filtered);
}

function filterOrders(type) {
  document.querySelectorAll('#tab-orders .filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function renderZoneMap() {
  const el = document.getElementById('zone-map');
  if (!el || el.children.length > 0) return;
  el.innerHTML = WMS_DATA.zoneMap.map(cell => `
    <div class="zone-cell"
      style="background:${cell.fill}22;border:2px solid ${cell.border}44;color:${cell.fill}"
      title="${cell.bin} — ${cell.occ}% đầy"
      onclick="showToast('Kệ ${cell.bin}: ${cell.occ}% lấp đầy','info')"
    >
      <span>${cell.zone}</span>
      <span class="zone-label">${cell.occ}%</span>
    </div>
  `).join('');
}

function renderAlerts() {
  const el = document.getElementById('alerts-list');
  if (!el) return;
  el.innerHTML = WMS_DATA.alerts.map(a => `
    <div class="alert-item ${a.type}">
      <div class="alert-icon" style="background:var(--color-${a.type === 'critical' ? 'danger' : a.type === 'warning' ? 'warning' : 'info'}-bg)">
        ${a.icon}
      </div>
      <div class="alert-content">
        <div class="alert-title" style="color:var(--color-${a.type === 'critical' ? 'danger' : a.type === 'warning' ? 'warning' : 'info'})">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
        <div class="alert-meta">🕐 ${a.time}</div>
      </div>
      <div class="alert-actions">
        <button class="alert-btn alert-btn-primary" onclick="showToast('${a.action} — đang xử lý','info')">${a.action}</button>
        <button class="alert-btn alert-btn-ghost" onclick="this.closest('.alert-item').style.opacity='0.4'">Bỏ qua</button>
      </div>
    </div>
  `).join('');
}

function renderAuditLog() {
  const el = document.getElementById('audit-timeline');
  if (!el) return;
  const colors = { success: 'var(--color-success-bg)', warning: 'var(--color-warning-bg)', danger: 'var(--color-danger-bg)', info: 'var(--color-info-bg)' };
  el.innerHTML = WMS_DATA.auditLog.map(log => `
    <div class="audit-item">
      <div class="audit-dot" style="background:${colors[log.type]}">${log.icon}</div>
      <div class="audit-body">
        <div class="audit-header-row">
          <span class="audit-action" style="color:var(--color-${log.type === 'success' ? 'success' : log.type === 'warning' ? 'warning' : log.type === 'danger' ? 'danger' : 'info'})">${log.action}</span>
          <span class="audit-sku">${log.sku}</span>
          <span class="audit-time">${log.time}</span>
        </div>
        <div class="audit-detail">${log.detail}</div>
        <div class="audit-user">👤 ${log.user}</div>
      </div>
    </div>
  `).join('');
}

/* ─── CHARTS ─────────────────────────────────────────────────────── */
function initCharts() {
  if (typeof Chart === 'undefined' || STATE.charts.activity) return;
  initActivityChart();
  initZoneChart();
}

function initActivityChart() {
  const canvas = document.getElementById('chart-activity');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  STATE.charts.activity = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: WMS_DATA.activityChart.labels,
      datasets: [
        {
          label: 'Nhập kho',
          data: WMS_DATA.activityChart.incoming,
          backgroundColor: 'rgba(63,185,80,0.7)',
          borderColor: '#3FB950',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Xuất kho',
          data: WMS_DATA.activityChart.outgoing,
          backgroundColor: 'rgba(88,166,255,0.7)',
          borderColor: '#58A6FF',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(48,54,61,0.6)' }, ticks: { color: '#8B949E', font: { size: 11 } } },
        y: { grid: { color: 'rgba(48,54,61,0.6)' }, ticks: { color: '#8B949E', font: { size: 11 } } },
      }
    }
  });
}

function initZoneChart() {
  const canvas = document.getElementById('chart-zones');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  STATE.charts.zones = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Khu A', 'Khu B', 'Khu C', 'Khu D'],
      datasets: [{
        data: [34, 28, 18, 22],
        backgroundColor: ['#FF6B35', '#00B4D8', '#FFD166', '#9B5DE5'],
        borderColor: '#0D1117',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        label: ctx => ` ${ctx.label}: ${ctx.parsed}%`
      }}}
    }
  });
}

function initReportChart() {
  if (STATE.charts.staffPerf) return;
  const canvas = document.getElementById('chart-staff-perf');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  STATE.charts.staffPerf = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['NV001', 'NV002', 'NV003', 'NV004', 'NV005'],
      datasets: [{
        label: 'Lệnh hoàn thành',
        data: [12, 9, 8, 11, 7],
        backgroundColor: ['#3FB950','#58A6FF','#E3B341','#BC8CFF','#FF6B35'],
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8B949E' } },
        y: { grid: { color: 'rgba(48,54,61,0.6)' }, ticks: { color: '#8B949E' } },
      }
    }
  });
}

/* ─── NOTIFICATIONS ─────────────────────────────────────────────── */
function renderNotifications() {
  const el = document.getElementById('notif-list');
  if (!el) return;
  el.innerHTML = WMS_DATA.notifications.map(n => `
    <div class="notif-item">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
}

function toggleNotifications() {
  STATE.notifOpen = !STATE.notifOpen;
  document.getElementById('notif-drawer').classList.toggle('active',  STATE.notifOpen);
  document.getElementById('notif-overlay').classList.toggle('active', STATE.notifOpen);
}

/* ─── PDA NAVIGATION ────────────────────────────────────────────── */
function pdaNav(screen) {
  // Push history
  if (screen !== 'home') STATE.pdaHistory.push(STATE.currentPdaScreen);
  else STATE.pdaHistory = [];

  // Hide all
  document.querySelectorAll('.pda-screen').forEach(s => s.classList.remove('active'));

  // Show target
  const el = document.getElementById(`pda-${screen}`);
  if (el) {
    el.classList.add('active');
    STATE.currentPdaScreen = screen;
  }

  // Back button
  const backBtn = document.getElementById('pda-back-btn');
  if (backBtn) backBtn.style.display = STATE.pdaHistory.length > 0 ? 'flex' : 'none';

  // FAB visibility
  const fab = document.getElementById('pda-scan-fab');
  if (fab) {
    const hideFabOn = ['home', 'complete', 'discrepancy', 'transfer'];
    fab.style.display = hideFabOn.includes(screen) ? 'none' : 'flex';
  }

  // Special init
  if (screen === 'pick')     renderPickList();
  if (screen === 'count')    initCountScreen();
  if (screen === 'transfer') renderTransferList();
  if (screen === 'complete') animateComplete();
}

function pdaGoBack() {
  if (STATE.pdaHistory.length > 0) {
    pdaNav(STATE.pdaHistory.pop());
    STATE.pdaHistory.pop(); // Remove the push that pdaNav added
  } else {
    pdaNav('home');
  }
}

function pdaBack() {
  if (STATE.pdaHistory.length > 0) {
    const prev = STATE.pdaHistory.pop();
    document.querySelectorAll('.pda-screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`pda-${prev}`);
    if (el) el.classList.add('active');
    STATE.currentPdaScreen = prev;
    const backBtn = document.getElementById('pda-back-btn');
    if (backBtn) backBtn.style.display = STATE.pdaHistory.length > 0 ? 'flex' : 'none';
  } else {
    pdaNav('home');
  }
}

/* ─── SCAN MODAL ────────────────────────────────────────────────── */
function openScan(context) {
  STATE.scanContext = context || STATE.currentPdaScreen;
  document.getElementById('pda-scan-overlay').classList.add('active');
}

function closeScan() {
  document.getElementById('pda-scan-overlay').classList.remove('active');
}

function simulateScan(result) {
  closeScan();

  if (result === 'success') {
    showPdaFeedback('success', '✅', 'Quét mã thành công!');

    if (STATE.currentPdaScreen === 'receive') {
      // Move to next step
      if (STATE.recvStep === 1) {
        STATE.recvStep = 2;
        updateRecvSteps();
      } else if (STATE.recvStep === 3) {
        // Completed one item
        STATE.recvProgress.done++;
        const pct = Math.round((STATE.recvProgress.done / STATE.recvProgress.total) * 100);
        document.getElementById('pda-recv-progress-fill').style.width = pct + '%';
        document.getElementById('pda-recv-progress-text').textContent =
          `${STATE.recvProgress.done} / ${STATE.recvProgress.total} SKU`;

        setTimeout(() => {
          if (STATE.recvProgress.done >= STATE.recvProgress.total) {
            pdaNav('complete');
          } else {
            // Reset for next item
            STATE.recvStep = 1;
            STATE.recvQty  = '';
            document.getElementById('pda-qty-display').textContent = '0';
            updateRecvSteps();
            showToast('SKU tiếp theo đã sẵn sàng!', 'info');
          }
        }, 600);
      }
    }

    if (STATE.currentPdaScreen === 'pick') {
      // Mark first unpicked item as picked
      const first = STATE.pickItems.find(i => !i.picked);
      if (first) {
        first.picked = true;
        STATE.pickDone++;
        renderPickList();
        updatePickProgress();
      }
    }
  } else {
    showPdaFeedback('fail', '❌', 'Mã không khớp!\nDừng lại và kiểm tra.');
  }
}

/* ─── PDA FEEDBACK VISUAL ───────────────────────────────────────── */
function showPdaFeedback(type, icon, text) {
  const el = document.getElementById('pda-feedback');
  const ic = document.getElementById('feedback-icon');
  const tx = document.getElementById('feedback-text');

  el.className = `pda-feedback-overlay feedback-${type}`;
  ic.textContent = icon;
  tx.textContent = text;
  tx.style.color = type === 'success' ? 'var(--color-success)' : 'var(--color-danger)';
  el.style.display = 'flex';

  // Vibrate (if supported)
  if (navigator.vibrate) {
    navigator.vibrate(type === 'success' ? [100] : [200, 100, 200]);
  }

  setTimeout(() => { el.style.display = 'none'; }, type === 'success' ? 600 : 1200);
}

/* ─── NUMPAD ────────────────────────────────────────────────────── */
function numpadPress(key) {
  const display = document.getElementById('pda-qty-display');
  if (!display) return;

  if (key === 'clear') {
    STATE.recvQty = '';
  } else if (key === 'del') {
    STATE.recvQty = STATE.recvQty.slice(0, -1);
  } else {
    if (STATE.recvQty.length >= 4) return;
    STATE.recvQty += key;
  }

  display.textContent = STATE.recvQty || '0';

  // Validate against needed quantity
  const needed = 24;
  const entered = parseInt(STATE.recvQty) || 0;
  const diff = Math.abs(entered - needed) / needed;

  if (STATE.recvQty && diff > 0.1) {
    display.style.color = 'var(--color-warning)';
  } else if (STATE.recvQty && entered === needed) {
    display.style.color = 'var(--color-success)';
  } else {
    display.style.color = 'var(--text-primary)';
  }
}

/* ─── RECEIVE WORKFLOW ───────────────────────────────────────────── */
function pdaReceiveConfirm() {
  const qty = parseInt(STATE.recvQty) || 0;
  const needed = 24;
  const diff = Math.abs(qty - needed) / needed;

  if (qty === 0) {
    showToast('Vui lòng nhập số lượng!', 'warning');
    return;
  }

  if (diff > 0.1 && diff <= 0.99) {
    // Show discrepancy warning (simulate)
    showToast(`Chênh lệch ${Math.round(diff*100)}% — cần Giám sát duyệt`, 'warning');
  }

  // Move to step 3: scan bin
  STATE.recvStep = 3;
  updateRecvSteps();
  openScan('bin');
}

function updateRecvSteps() {
  const steps = [1, 2, 3];
  steps.forEach(n => {
    const el = document.getElementById(`pda-step-${n}`);
    if (!el) return;
    el.className = 'pda-step';
    if (n < STATE.recvStep)  el.classList.add('done');
    if (n === STATE.recvStep) el.classList.add('active');
    const circle = el.querySelector('.step-circle');
    if (n < STATE.recvStep)  circle.textContent = '✓';
    else                     circle.textContent = String(n);
  });

  const stepLabel = document.querySelector('.pda-sku-step-indicator');
  const labels = ['', 'Bước 1/3: Quét mã hàng', 'Bước 2/3: Nhập số lượng', 'Bước 3/3: Quét mã kệ'];
  if (stepLabel) stepLabel.textContent = labels[STATE.recvStep];

  const confirmBtn = document.getElementById('pda-recv-confirm-btn');
  if (confirmBtn) {
    confirmBtn.style.display = STATE.recvStep === 2 ? 'flex' : 'none';
  }
}

/* ─── PICKING ────────────────────────────────────────────────────── */
function loadPickItems() {
  STATE.pickItems = JSON.parse(JSON.stringify(WMS_DATA.pickingItems));
  STATE.pickDone  = 0;
}

function renderPickList() {
  const el = document.getElementById('pda-pick-list');
  if (!el) return;
  el.innerHTML = STATE.pickItems.map((item, idx) => `
    <div class="pick-item${item.picked ? ' picked' : ''}" id="pick-item-${idx}" onclick="pickItem(${idx})">
      <div class="pick-item-status">${item.picked ? '✓' : (idx === STATE.pickDone ? '→' : '')}</div>
      <div class="pick-item-info">
        <div class="pick-item-sku">${item.sku}</div>
        <div class="pick-item-name">${item.name}</div>
        <div class="pick-item-loc">📍 ${item.location}</div>
      </div>
      <div class="pick-item-qty" style="color:${item.picked ? 'var(--color-success)' : 'var(--text-primary)'}">×${item.qty}</div>
    </div>
  `).join('');

  updatePickProgress();
}

function pickItem(idx) {
  if (STATE.pickItems[idx].picked) return;
  if (idx !== STATE.pickDone) {
    showToast('Lấy theo thứ tự để tối ưu lộ trình!', 'warning');
    return;
  }
  openScan('pick');
  STATE.scanContext = { type: 'pick', idx };
}

function updatePickProgress() {
  const done  = STATE.pickDone;
  const total = STATE.pickItems.length;
  const pct   = Math.round((done / total) * 100);

  document.getElementById('pda-pick-progress-fill').style.width  = pct + '%';
  document.getElementById('pda-pick-progress-text').textContent  = `${done} / ${total} SKU`;

  const doneBtn = document.getElementById('pda-pick-done-btn');
  if (doneBtn) {
    doneBtn.disabled = done < total;
    if (done >= total && done > 0) {
      showToast('Tất cả hàng đã lấy! Xác nhận hoàn thành.', 'success');
    }
  }
}

function pdaPickComplete() {
  pdaNav('complete');
  document.getElementById('complete-msg').textContent =
    'Đơn hàng ORD-88521 đã được lấy đủ. Chuyển đến bàn đóng gói.';
  document.getElementById('c-qty').textContent = STATE.pickItems.reduce((s,i) => s+i.qty, 0);
  loadPickItems(); // Reset for next time
}

/* ─── DISCREPANCY ────────────────────────────────────────────────── */
function pdaReportDiscrepancy() {
  pdaNav('discrepancy');
}

function setupDiscOptions() {
  document.querySelectorAll('.disc-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.disc-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function submitDiscrepancy() {
  const type = document.querySelector('.disc-opt.active')?.dataset.disc || 'qty';
  const note = document.getElementById('disc-note')?.value || '';
  showToast('Báo cáo sai lệch đã gửi lên Giám sát!', 'warning');
  pdaNav('home');
}

/* ─── COMPLETE ANIMATION ─────────────────────────────────────────── */
function animateComplete() {
  const circle = document.getElementById('complete-circle');
  const check  = document.getElementById('complete-check');
  if (!circle || !check) return;

  // Animate circle draw
  circle.style.transition = 'stroke-dashoffset 0.8s ease';
  circle.style.strokeDashoffset = '0';

  // Animate checkmark
  setTimeout(() => {
    check.style.transition = 'opacity 0.3s ease';
    check.style.opacity = '1';
  }, 600);

  // Elapsed time
  const elapsed = Math.round((Date.now() - STATE.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeEl = document.getElementById('c-time');
  if (timeEl) timeEl.textContent = `${mins}:${String(secs).padStart(2,'0')}`;

  // Vibrate success
  if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
}

/* ─── NEW ORDER ──────────────────────────────────────────────────── */
function openNewOrder() {
  showToast('Tính năng tạo lệnh sẽ mở modal — coming soon!', 'info');
}

/* ─── TOAST ──────────────────────────────────────────────────────── */
function showToast(message, type = 'info') {
  const icons = { success:'✅', warning:'⚠️', danger:'❌', info:'ℹ️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ─── HELPERS ────────────────────────────────────────────────────── */
function workerName(id) {
  const emp = WMS_DATA.employees.find(e => e.id === id);
  return emp ? emp.name : id;
}

function statusLabel(s) {
  return { done: '✅ Hoàn thành', pending: '⏳ Chờ xử lý', progress: '🔄 Đang làm', error: '❌ Lỗi' }[s] || s;
}

function daysUntil(dateStr) {
  const now    = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/* ═══════════════════════════════════════════════════════════════
   CYCLE COUNT — Kiểm đếm kho
   ═══════════════════════════════════════════════════════════════ */
function initCountItems() {
  STATE.countItems  = JSON.parse(JSON.stringify(WMS_DATA.cycleCountItems));
  STATE.countIdx    = 0;
  STATE.countStep   = 1;
  STATE.countQtyStr = '';
}

function initCountScreen() {
  STATE.countIdx    = 0;
  STATE.countStep   = 1;
  STATE.countQtyStr = '';
  STATE.countItems.forEach(i => { i.counted = false; i.actual = null; });
  const resultList = document.getElementById('count-results-list');
  if (resultList) resultList.innerHTML = '';
  const numpad = document.getElementById('count-numpad-area');
  if (numpad) numpad.style.display = 'none';
  const fill = document.getElementById('count-progress-fill');
  if (fill) fill.style.width = '0%';
  const txt = document.getElementById('count-progress-text');
  if (txt) txt.textContent = '0 / ' + STATE.countItems.length + ' kệ';
  updateCountCard();
  setCountStep(1);
}

function updateCountCard() {
  const item = STATE.countItems[STATE.countIdx];
  if (!item) return;
  const zoneColors = { A:'#FF6B35', B:'#00B4D8', C:'#FFD166', D:'#9B5DE5' };
  document.getElementById('count-zone-badge').textContent         = 'Khu ' + item.zone;
  document.getElementById('count-zone-badge').style.background    = zoneColors[item.zone] || '#58A6FF';
  document.getElementById('count-bin-code').textContent           = item.bin;
  document.getElementById('count-sku-name').textContent           = item.name;
  document.getElementById('count-sys-qty').textContent            = item.sysQty;
  document.getElementById('count-actual-display').textContent     = '—';
  document.getElementById('count-actual-display').style.color     = 'var(--text-muted)';
  const qtyInput = document.getElementById('count-qty-input');
  if (qtyInput) qtyInput.textContent = '0';
  STATE.countQtyStr = '';
}

function setCountStep(step) {
  STATE.countStep = step;
  const s1 = document.getElementById('cnt-step-1');
  const s2 = document.getElementById('cnt-step-2');
  const numpad = document.getElementById('count-numpad-area');
  const btn    = document.getElementById('count-action-btn');
  if (!s1 || !s2 || !numpad || !btn) return;

  s1.className = 'pda-step' + (step > 1 ? ' done' : ' active');
  s1.querySelector('.step-circle').textContent = step > 1 ? '✓' : '1';
  s2.className = 'pda-step' + (step === 2 ? ' active' : '');
  s2.querySelector('.step-circle').textContent = '2';

  document.getElementById('count-step-label').textContent =
    step === 1 ? 'Bước 1/2: Quét mã kệ' : 'Bước 2/2: Nhập số thực đếm';

  numpad.style.display = step === 2 ? 'block' : 'none';

  if (step === 1) {
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> QUÉT MÃ KỆ`;
    btn.onclick = countAction;
  } else {
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> XÁC NHẬN SỐ ĐẾM`;
    btn.onclick = countConfirmQty;
  }
}

function countAction() {
  STATE.scanContext = 'count-bin';
  openScan();
}

function countNumpad(key) {
  const display = document.getElementById('count-qty-input');
  if (!display) return;
  if (key === 'clear')    STATE.countQtyStr = '';
  else if (key === 'del') STATE.countQtyStr = STATE.countQtyStr.slice(0, -1);
  else {
    if (STATE.countQtyStr.length >= 5) return;
    STATE.countQtyStr += key;
  }
  const val  = parseInt(STATE.countQtyStr) || 0;
  display.textContent = STATE.countQtyStr || '0';

  const item = STATE.countItems[STATE.countIdx];
  if (!item) return;
  const diff = item.sysQty > 0 ? Math.abs(val - item.sysQty) / item.sysQty : 0;
  if (STATE.countQtyStr && val === item.sysQty)  display.style.color = 'var(--color-success)';
  else if (STATE.countQtyStr && diff > 0.05)     display.style.color = 'var(--color-warning)';
  else                                            display.style.color = 'var(--text-primary)';

  const actualEl = document.getElementById('count-actual-display');
  if (actualEl) {
    actualEl.textContent = val || '—';
    actualEl.style.color = val === item.sysQty ? 'var(--color-success)' : val > 0 ? 'var(--color-warning)' : 'var(--text-muted)';
  }
}

function countConfirmQty() {
  const actual = parseInt(STATE.countQtyStr) || 0;
  if (actual === 0) { showToast('Nhập số thực đếm trước!', 'warning'); return; }

  const item    = STATE.countItems[STATE.countIdx];
  item.actual   = actual;
  item.counted  = true;
  const matched = actual === item.sysQty;
  const diff    = Math.abs(actual - item.sysQty);

  // Append result row
  const resultEl = document.getElementById('count-results-list');
  if (resultEl) {
    const row = document.createElement('div');
    row.className = 'count-result-item ' + (matched ? 'match' : 'mismatch');
    row.innerHTML = `
      <span class="cri-icon">${matched ? '✅' : '⚠️'}</span>
      <span class="cri-bin">${item.bin}</span>
      <span class="cri-sys">HT: ${item.sysQty}</span>
      <span class="cri-actual ${matched ? 'ok' : 'warn'}">Đếm: ${actual}${!matched ? ' (±' + diff + ')' : ''}</span>
    `;
    resultEl.appendChild(row);
    resultEl.scrollTop = resultEl.scrollHeight;
  }

  if (matched) {
    showPdaFeedback('success', '✅', 'Khớp chính xác!');
    showToast(`Kệ ${item.bin}: Đúng ${item.sysQty} đơn vị!`, 'success');
  } else {
    showPdaFeedback('fail', '⚠️', `Chênh lệch ${diff} đơn vị!`);
    showToast(`Kệ ${item.bin}: Chênh ${diff} — đã báo GS`, 'warning');
  }

  STATE.countIdx++;
  const total = STATE.countItems.length;
  const done  = STATE.countIdx;
  const fillEl = document.getElementById('count-progress-fill');
  const txtEl  = document.getElementById('count-progress-text');
  if (fillEl) fillEl.style.width = Math.round((done / total) * 100) + '%';
  if (txtEl)  txtEl.textContent  = done + ' / ' + total + ' kệ';

  if (done >= total) {
    setTimeout(() => {
      const msgEl = document.getElementById('complete-msg');
      const qtyEl = document.getElementById('c-qty');
      if (msgEl) msgEl.textContent = `Kiểm đếm ${total} kệ hoàn tất. Báo cáo đã gửi lên Giám sát.`;
      if (qtyEl) qtyEl.textContent = total;
      pdaNav('complete');
      initCountItems();
    }, 800);
  } else {
    setTimeout(() => { updateCountCard(); setCountStep(1); }, 700);
  }
}

/* ═══════════════════════════════════════════════════════════════
   TRANSFER — Chuyển vị trí kệ
   ═══════════════════════════════════════════════════════════════ */
function initTransferTasks() {
  STATE.transferTasks = JSON.parse(JSON.stringify(WMS_DATA.transferTasks));
  STATE.tfActiveIdx   = null;
  STATE.tfStep        = 1;
}

function renderTransferList() {
  const list     = document.getElementById('transfer-task-list');
  const workflow = document.getElementById('transfer-workflow');
  if (!list || !workflow) return;

  list.style.display     = 'flex';
  workflow.style.display = 'none';
  STATE.tfActiveIdx      = null;

  const pending = STATE.transferTasks.filter(t => !t.done).length;
  const subEl   = document.getElementById('transfer-subtitle');
  if (subEl) subEl.textContent = pending > 0
    ? `${pending} yêu cầu chuyển kệ đang chờ`
    : 'Tất cả đã hoàn thành! ✅';

  list.innerHTML = STATE.transferTasks.map((t, idx) => `
    <button class="tf-task-card${t.done ? ' done' : ''}" onclick="selectTransferTask(${idx})">
      <div class="tf-task-icon${t.done ? ' done-icon' : ''}">
        ${t.done ? '✅' : '🔄'}
      </div>
      <div class="tf-task-info">
        <div class="tf-task-sku">${t.sku}</div>
        <div class="tf-task-name">${t.name}</div>
        <div class="tf-task-route">
          <span class="tf-task-from">${t.from}</span>
          <span class="tf-task-arrow">→</span>
          <span class="tf-task-to">${t.to}</span>
        </div>
      </div>
      <div class="tf-task-qty">×${t.qty}</div>
    </button>
  `).join('');
}

function selectTransferTask(idx) {
  const task = STATE.transferTasks[idx];
  if (!task || task.done) return;
  STATE.tfActiveIdx = idx;
  STATE.tfStep      = 1;

  const zoneColors = { A:'#FF6B35', B:'#00B4D8', C:'#FFD166', D:'#9B5DE5' };
  const zone = task.from.charAt(0);
  const zoneBadge = document.getElementById('tf-zone-badge');
  if (zoneBadge) { zoneBadge.textContent = 'Khu ' + zone; zoneBadge.style.background = zoneColors[zone] || '#58A6FF'; }

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('tf-sku-code', task.sku);
  set('tf-sku-name', task.name);
  set('tf-from-bin', task.from);
  set('tf-to-bin',   task.to);
  set('tf-qty',      task.qty + ' ' + task.unit);
  set('tf-reason',   task.reason);
  set('tf-qty-confirm-val', task.qty + ' ' + task.unit);

  document.getElementById('transfer-task-list').style.display = 'none';
  const wf = document.getElementById('transfer-workflow');
  wf.style.display = 'flex';

  setTransferStep(1);
}

function setTransferStep(step) {
  STATE.tfStep = step;
  const ids = ['tf-step-1', 'tf-step-2', 'tf-step-3'];
  const stepLabels = [
    'Bước 1/3: Quét kệ NGUỒN',
    'Bước 2/3: Xác nhận số lượng',
    'Bước 3/3: Quét kệ ĐÍCH',
  ];
  const btnLabels = [
    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> QUÉT KỆ NGUỒN`,
    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> XÁC NHẬN SỐ LƯỢNG`,
    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> QUÉT KỆ ĐÍCH`,
  ];

  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const n = i + 1;
    el.className = 'pda-step' + (n < step ? ' done' : n === step ? ' active' : '');
    el.querySelector('.step-circle').textContent = n < step ? '✓' : String(n);
  });

  const stepLabelEl = document.getElementById('tf-step-label');
  const actionBtn   = document.getElementById('tf-action-btn');
  const qtyConfirm  = document.getElementById('tf-qty-confirm');
  if (stepLabelEl) stepLabelEl.textContent     = stepLabels[step - 1];
  if (actionBtn)   actionBtn.innerHTML         = btnLabels[step - 1];
  if (qtyConfirm)  qtyConfirm.style.display    = step === 2 ? 'block' : 'none';

  if (actionBtn) actionBtn.onclick = transferAction;
}

function transferAction() {
  if (STATE.tfStep === 1) {
    STATE.scanContext = 'tf-from';
    openScan();
  } else if (STATE.tfStep === 2) {
    showPdaFeedback('success', '✅', 'Số lượng xác nhận!');
    setTimeout(() => setTransferStep(3), 500);
  } else if (STATE.tfStep === 3) {
    STATE.scanContext = 'tf-to';
    openScan();
  }
}

function cancelTransfer() {
  STATE.tfActiveIdx = null;
  renderTransferList();
}

/* ═══════════════════════════════════════════════════════════════
   UPDATED simulateScan — handles all scan contexts
   ═══════════════════════════════════════════════════════════════ */
function simulateScan(result) {
  closeScan();

  if (result === 'success') {
    const ctx = STATE.scanContext;

    // ─ Cycle Count: scan bin ─
    if (ctx === 'count-bin') {
      showPdaFeedback('success', '✅', 'Mã kệ xác nhận!');
      setTimeout(() => setCountStep(2), 500);
      return;
    }

    // ─ Transfer: scan source bin ─
    if (ctx === 'tf-from') {
      showPdaFeedback('success', '✅', 'Kệ nguồn xác nhận!');
      setTimeout(() => setTransferStep(2), 500);
      return;
    }

    // ─ Transfer: scan destination bin ─
    if (ctx === 'tf-to') {
      showPdaFeedback('success', '✅', 'Kệ đích xác nhận!');
      const task = STATE.transferTasks[STATE.tfActiveIdx];
      if (task) task.done = true;
      setTimeout(() => {
        const msgEl = document.getElementById('complete-msg');
        const qtyEl = document.getElementById('c-qty');
        if (msgEl) msgEl.textContent = `Đã chuyển ${task.qty} ${task.unit} "${task.name}" từ ${task.from} → ${task.to} thành công.`;
        if (qtyEl) qtyEl.textContent = task.qty;
        showToast(`Chuyển kệ hoàn thành: ${task.from} → ${task.to}`, 'success');
        pdaNav('complete');
      }, 600);
      return;
    }

    // ─ Original receive / pick contexts ─
    showPdaFeedback('success', '✅', 'Quét mã thành công!');
    if (navigator.vibrate) navigator.vibrate([100]);

    if (STATE.currentPdaScreen === 'receive') {
      if (STATE.recvStep === 1) {
        STATE.recvStep = 2;
        updateRecvSteps();
      } else if (STATE.recvStep === 3) {
        STATE.recvProgress.done++;
        const pct = Math.round((STATE.recvProgress.done / STATE.recvProgress.total) * 100);
        document.getElementById('pda-recv-progress-fill').style.width = pct + '%';
        document.getElementById('pda-recv-progress-text').textContent =
          `${STATE.recvProgress.done} / ${STATE.recvProgress.total} SKU`;
        setTimeout(() => {
          if (STATE.recvProgress.done >= STATE.recvProgress.total) {
            pdaNav('complete');
          } else {
            STATE.recvStep = 1;
            STATE.recvQty  = '';
            document.getElementById('pda-qty-display').textContent = '0';
            updateRecvSteps();
            showToast('SKU tiếp theo đã sẵn sàng!', 'info');
          }
        }, 600);
      }
    }

    if (STATE.currentPdaScreen === 'pick') {
      const first = STATE.pickItems.find(i => !i.picked);
      if (first) {
        first.picked = true;
        STATE.pickDone++;
        renderPickList();
        updatePickProgress();
      }
    }

  } else {
    showPdaFeedback('fail', '❌', 'Mã không khớp!\nDừng lại và kiểm tra.');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
}

/* ─── CHART.JS DYNAMIC LOAD ──────────────────────────────────────── */

(function loadChartJS() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
  script.onload = () => {
    Chart.defaults.color = '#8B949E';
    Chart.defaults.borderColor = '#30363D';
    Chart.defaults.font.family = "'Inter', sans-serif";
  };
  document.head.appendChild(script);
})();
