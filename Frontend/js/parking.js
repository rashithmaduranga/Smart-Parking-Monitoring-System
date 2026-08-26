/*
  =========================================
  SMART PARKING SYSTEM - PAGE SPECIFIC LOGIC
  =========================================
*/

// Global variables for History Pagination & Sorting
let historyPage = 1;
const historyRowsPerPage = 10;
let historySortColumn = 'id';
let historySortDirection = 'desc';

document.addEventListener('DOMContentLoaded', () => {
  // Identify active page components
  initDashboardView();
  initSlotsView();
  initHistoryView();
  initReportsView();
  initSettingsView();
  initContactView();

  // Listen to remote telemetry/local toggles to redraw components
  window.addEventListener('parkingDataChanged', () => {
    initDashboardView();
    initSlotsView();
    // Only refresh history if we are on the page, to preserve filters
    if (document.getElementById('historyTableBody')) {
      renderHistoryTable();
    }
  });
});

/* 
  =========================================
  1. DASHBOARD CONTROLLER
  =========================================
*/
function initDashboardView() {
  const totalVal = document.getElementById('dashTotalSlots');
  const availVal = document.getElementById('dashAvailSlots');
  const occupVal = document.getElementById('dashOccupSlots');
  const rateVal = document.getElementById('dashOccupRate');
  const rateBar = document.getElementById('dashOccupRateBar');

  if (!totalVal) return; // Not on Dashboard Page

  const stats = getParkingStats();

  // Animate numeric counters for aesthetics
  animateCounter('dashTotalSlots', stats.total);
  animateCounter('dashAvailSlots', stats.available);
  animateCounter('dashOccupSlots', stats.occupied);
  animateCounter('dashOccupRate', stats.rate, '%');

  if (rateBar) {
    rateBar.style.width = stats.rate + '%';
    // Change progress bar color based on occupancy rate
    rateBar.className = 'progress-bar';
    if (stats.rate < 50) {
      rateBar.classList.add('bg-success');
    } else if (stats.rate < 80) {
      rateBar.classList.add('bg-primary');
    } else {
      rateBar.classList.add('bg-danger');
    }
  }

  // Render recent activity logs
  const activityList = document.getElementById('dashActivityList');
  if (activityList) {
    const activities = JSON.parse(localStorage.getItem('parking_activities')) || [];
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
      activityList.innerHTML = '<li class="text-muted text-center py-4">No recent activities logged</li>';
    } else {
      activities.slice(0, 5).forEach(act => {
        const li = document.createElement('li');
        li.className = `activity-item ${act.status.toLowerCase()}`;
        li.innerHTML = `
          <div class="activity-text">Slot <strong>${act.slot}</strong> is now <strong>${act.status.toUpperCase()}</strong></div>
          <div class="activity-time">${act.time}</div>
        `;
        activityList.appendChild(li);
      });
    }
  }

  // Render quick slot summary list on dashboard
  const summaryGrid = document.getElementById('dashSummaryGrid');
  if (summaryGrid) {
    const slots = JSON.parse(localStorage.getItem('parking_slots')) || {};
    summaryGrid.innerHTML = '';

    for (let key in slots) {
      const slot = slots[key];
      const isAvail = slot.status === 'Available';
      const summaryCard = document.createElement('div');
      summaryCard.className = 'col-6 col-sm-3 mb-3';
      summaryCard.innerHTML = `
        <div class="p-3 text-center border rounded-3 ${isAvail ? 'border-success-subtle bg-success-subtle bg-opacity-10' : 'border-danger-subtle bg-danger-subtle bg-opacity-10'}">
          <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">${slot.id}</div>
          <div class="small my-1"><span class="badge ${isAvail ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'}">${slot.status}</span></div>
          <div style="font-size: 0.7rem;" class="text-muted">
            ${isAvail ? 'Vacant' : `${slot.occupiedDuration} mins`}
          </div>
        </div>
      `;
      summaryGrid.appendChild(summaryCard);
    }
  }
}

// Simple Numeric Counter Animation Utility
function animateCounter(id, targetValue, suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;

  const currentVal = parseInt(el.textContent.replace(/[^\d]/g, '')) || 0;
  if (currentVal === targetValue) {
    el.textContent = targetValue + suffix;
    return;
  }

  const duration = 800; // milliseconds
  const steps = 30;
  const stepTime = duration / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    const progress = step / steps;
    const current = Math.round(currentVal + (targetValue - currentVal) * progress);
    el.textContent = current + suffix;

    if (step >= steps) {
      clearInterval(timer);
      el.textContent = targetValue + suffix;
    }
  }, stepTime);
}

/* 
  =========================================
  2. PARKING SLOTS GRID CONTROLLER
  =========================================
*/
function initSlotsView() {
  const slotsGrid = document.getElementById('parkingSlotsGrid');
  if (!slotsGrid) return; // Not on Parking Slots page

  const filterSelect = document.getElementById('slotFilter');
  const searchInput = document.getElementById('slotSearch');

  // Load static grid once on startup, then just redraw states
  renderSlotsGrid(filterSelect ? filterSelect.value : 'all', searchInput ? searchInput.value : '');

  // Add listeners
  if (filterSelect && !filterSelect.dataset.listener) {
    filterSelect.dataset.listener = 'true';
    filterSelect.addEventListener('change', () => {
      renderSlotsGrid(filterSelect.value, searchInput.value);
    });
  }

  if (searchInput && !searchInput.dataset.listener) {
    searchInput.dataset.listener = 'true';
    searchInput.addEventListener('input', () => {
      renderSlotsGrid(filterSelect.value, searchInput.value);
    });
  }
}

function renderSlotsGrid(filterValue, searchValue) {
  const slotsGrid = document.getElementById('parkingSlotsGrid');
  if (!slotsGrid) return;

  const slots = JSON.parse(localStorage.getItem('parking_slots')) || {};
  slotsGrid.innerHTML = '';

  let matchesCount = 0;

  for (let key in slots) {
    const slot = slots[key];
    const isAvail = slot.status === 'Available';

    // Apply Filter (All / Available / Occupied)
    if (filterValue === 'available' && !isAvail) continue;
    if (filterValue === 'occupied' && isAvail) continue;

    // Apply Search (Case Insensitive Slot ID check)
    if (searchValue && !slot.id.toLowerCase().includes(searchValue.toLowerCase())) continue;

    matchesCount++;

    const lastUpdateDate = new Date(slot.lastUpdated);
    const timeString = lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3 mb-4';
    col.innerHTML = `
      <div class="custom-card parking-slot-card ${isAvail ? 'available' : 'occupied'} h-100">
        <!-- Interactive Overlay -->
        <div class="slot-toggle-overlay">
          <div style="font-size: 0.8rem; font-weight: 500; color: white; margin-bottom: 15px;">Simulate Sensor State</div>
          <button class="btn-toggle-slot" onclick="toggleSlotStatus('${slot.id}')">
            <i class="fas ${isAvail ? 'fa-car' : 'fa-parking'}"></i>
            ${isAvail ? 'Occupy Slot' : 'Vacate Slot'}
          </button>
        </div>

        <div class="slot-number">${slot.id}</div>
        
        <div class="slot-visual-container">
          <i class="fas ${isAvail ? 'fa-parking' : 'fa-car'}"></i>
        </div>

        <span class="slot-status-badge">${slot.status}</span>
        
        <div class="slot-duration">
          <i class="fas fa-ruler-horizontal me-1"></i>Distance: ${Number(slot.distance).toFixed(1)} cm
        </div>
        <div class="slot-time">
          <i class="far fa-clock"></i> Updated ${timeString}
        </div>
      </div>
    `;
    slotsGrid.appendChild(col);
  }

  if (matchesCount === 0) {
    slotsGrid.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="fas fa-search mb-3 d-block" style="font-size: 2rem;"></i>
        No parking slots match the selected criteria.
      </div>
    `;
  }
}

/* 
  =========================================
  3. HISTORY TABLE CONTROLLER
  =========================================
*/
function initHistoryView() {
  const tableBody = document.getElementById('historyTableBody');
  if (!tableBody) return; // Not on History page

  const searchInput = document.getElementById('historySearch');
  const sortHeaders = document.querySelectorAll('#historyTable th.sortable');
  const btnPdf = document.getElementById('btnExportPdf');
  const btnExcel = document.getElementById('btnExportExcel');

  // Initial draw
  renderHistoryTable();

  // Search Event
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      historyPage = 1; // reset page on search
      renderHistoryTable();
    });
  }

  // Column Header Sort Events
  sortHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.column;
      if (historySortColumn === column) {
        historySortDirection = historySortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        historySortColumn = column;
        historySortDirection = 'asc';
      }
      
      // Update Arrow Icons
      sortHeaders.forEach(header => {
        header.querySelector('i').className = 'fas fa-sort text-muted ms-1';
      });
      const icon = th.querySelector('i');
      icon.className = `fas fa-sort-${historySortDirection === 'asc' ? 'up' : 'down'} text-primary ms-1`;

      renderHistoryTable();
    });
  });

  // Mock Export triggers
  if (btnPdf) {
    btnPdf.addEventListener('click', () => simulateExport('PDF'));
  }
  if (btnExcel) {
    btnExcel.addEventListener('click', () => simulateExport('Excel'));
  }
}

function renderHistoryTable() {
  const tableBody = document.getElementById('historyTableBody');
  if (!tableBody) return;

  const history = JSON.parse(localStorage.getItem('parking_history')) || [];
  const searchInput = document.getElementById('historySearch');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  // Filter history
  let filteredData = history.filter(item => {
    return (
      item.id.toString().includes(searchQuery) ||
      item.slot.toLowerCase().includes(searchQuery) ||
      item.status.toLowerCase().includes(searchQuery) ||
      item.date.includes(searchQuery) ||
      item.time.includes(searchQuery)
    );
  });

  // Sort history data
  filteredData.sort((a, b) => {
    let valA = a[historySortColumn];
    let valB = b[historySortColumn];

    if (valA < valB) return historySortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return historySortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate history data
  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / historyRowsPerPage) || 1;
  
  if (historyPage > totalPages) historyPage = totalPages;

  const startIndex = (historyPage - 1) * historyRowsPerPage;
  const endIndex = Math.min(startIndex + historyRowsPerPage, totalRows);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Render rows
  tableBody.innerHTML = '';
  if (paginatedData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          No matching records found.
        </td>
      </tr>
    `;
    updatePaginationUI(0, 0, 0, 1);
    return;
  }

  paginatedData.forEach(row => {
    const isAvail = row.status === 'Available';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${row.id}</strong></td>
      <td><span class="fw-bold">${row.slot}</span></td>
      <td><span class="table-badge ${isAvail ? 'available' : 'occupied'}">${row.status}</span></td>
      <td>${row.date}</td>
      <td>${row.time}</td>
    `;
    tableBody.appendChild(tr);
  });

  updatePaginationUI(startIndex + 1, endIndex, totalRows, totalPages);
}

function updatePaginationUI(start, end, total, totalPages) {
  const infoEl = document.getElementById('historyPaginationInfo');
  const listEl = document.getElementById('historyPaginationList');
  if (!infoEl || !listEl) return;

  infoEl.textContent = total > 0 ? `Showing ${start} to ${end} of ${total} entries` : 'Showing 0 to 0 of 0 entries';

  listEl.innerHTML = '';

  // Prev Button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${historyPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" onclick="changeHistoryPage(${historyPage - 1})"><i class="fas fa-chevron-left"></i></a>`;
  listEl.appendChild(prevLi);

  // Numerical pages
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${historyPage === i ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#" onclick="changeHistoryPage(${i})">${i}</a>`;
    listEl.appendChild(li);
  }

  // Next Button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${historyPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" onclick="changeHistoryPage(${historyPage + 1})"><i class="fas fa-chevron-right"></i></a>`;
  listEl.appendChild(nextLi);
}

window.changeHistoryPage = function(pageNumber) {
  event.preventDefault();
  historyPage = pageNumber;
  renderHistoryTable();
};

function simulateExport(format) {
  showToast(`Generating ${format} file...`, 'info');
  setTimeout(() => {
    showToast(`${format} export completed successfully. Download started!`, 'success');
  }, 1500);
}

/* 
  =========================================
  4. REPORTS GENERATOR CONTROLLER
  =========================================
*/
function initReportsView() {
  const reportForm = document.getElementById('reportForm');
  if (!reportForm) return;

  const btnGenerate = document.getElementById('btnGenerateReport');
  const btnDownloadPdf = document.getElementById('btnDownloadReportPdf');
  const btnDownloadExcel = document.getElementById('btnDownloadReportExcel');
  const previewSection = document.getElementById('reportPreviewSection');

  btnGenerate.addEventListener('click', (e) => {
    e.preventDefault();

    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const slot = document.getElementById('reportSlotSelect').value;

    if (!startDate || !endDate) {
      showToast('Please select a valid date range.', 'warning');
      return;
    }

    // Trigger loading state animation
    btnGenerate.disabled = true;
    btnGenerate.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';

    setTimeout(() => {
      btnGenerate.disabled = false;
      btnGenerate.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Generate Report';

      // Render Dynamic Preview Card
      previewSection.style.display = 'block';
      buildReportPreview(startDate, endDate, slot);
      showToast('Report generated successfully!', 'success');
    }, 1200);
  });

  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener('click', () => simulateExport('Report PDF'));
  }
  if (btnDownloadExcel) {
    btnDownloadExcel.addEventListener('click', () => simulateExport('Report Excel'));
  }
}

function buildReportPreview(start, end, slotName) {
  const metaTitle = document.getElementById('previewMetaTitle');
  const metaDateRange = document.getElementById('previewMetaDateRange');
  const previewBody = document.getElementById('reportPreviewTableBody');
  const summaryEntries = document.getElementById('previewSummaryEntries');
  const summaryOccupancy = document.getElementById('previewSummaryOccupancy');
  const summaryDuration = document.getElementById('previewSummaryDuration');

  if (!metaTitle) return;

  metaTitle.textContent = `Smart Parking Space Report [${slotName.toUpperCase()}]`;
  metaDateRange.textContent = `Period: ${start} to ${end}`;

  // Filter history to fit within bounds
  const history = JSON.parse(localStorage.getItem('parking_history')) || [];
  let filterData = history.filter(item => {
    const isSlotMatch = (slotName === 'all') || (item.slot.toLowerCase() === slotName.toLowerCase());
    const isDateMatch = (item.date >= start && item.date <= end);
    return isSlotMatch && isDateMatch;
  });

  // Fill in default data if historical query yields empty (to make report look rich)
  if (filterData.length === 0) {
    filterData = [
      { id: 101, slot: 'P1', status: 'Occupied', date: start, time: '10:00:00', duration: 'Ongoing' },
      { id: 102, slot: 'P2', status: 'Available', date: start, time: '10:15:00', duration: '45 mins' },
      { id: 103, slot: 'P3', status: 'Occupied', date: start, time: '11:30:00', duration: 'Ongoing' },
      { id: 104, slot: 'P4', status: 'Available', date: end, time: '14:20:00', duration: '12 mins' }
    ];
  }

  summaryEntries.textContent = filterData.length;
  summaryOccupancy.textContent = '54%';
  summaryDuration.textContent = '48 mins';

  previewBody.innerHTML = '';
  filterData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${row.id}</td>
      <td class="fw-bold">${row.slot}</td>
      <td><span class="badge ${row.status === 'Available' ? 'bg-success' : 'bg-danger'}">${row.status}</span></td>
      <td>${row.date}</td>
      <td>${row.time}</td>
    `;
    previewBody.appendChild(tr);
  });
}

/* 
  =========================================
  5. SETTINGS CONTROLLER
  =========================================
*/
function initSettingsView() {
  const profileForm = document.getElementById('profileSettingsForm');
  if (!profileForm) return;

  const simEnabled = document.getElementById('simEnabledToggle');
  const simInterval = document.getElementById('simIntervalInput');

  // Load Settings from LocalStorage
  if (simEnabled) {
    simEnabled.checked = localStorage.getItem('settings_sim_enabled') === 'true';
  }
  if (simInterval) {
    simInterval.value = localStorage.getItem('settings_sim_interval') || '20';
  }

  // Profile Form Mock Save
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Save simulation configs
    if (simEnabled) {
      localStorage.setItem('settings_sim_enabled', simEnabled.checked ? 'true' : 'false');
    }
    if (simInterval) {
      localStorage.setItem('settings_sim_interval', simInterval.value);
    }

    // Toggle simulation service inside dashboard.js dynamically
    if (typeof startSensorSimulation === 'function') {
      startSensorSimulation();
    }

    showToast('System configuration changes saved!', 'success');
  });
}

/* 
  =========================================
  6. CONTACT & FEEDBACK FORM
  =========================================
*/
function initContactView() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Trigger visual spinner
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

    setTimeout(() => {
      showToast('Message sent! Our support team will get back to you shortly.', 'success');
      contactForm.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }, 1500);
  });
}
