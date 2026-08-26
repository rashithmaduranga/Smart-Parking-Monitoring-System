/* Smart Parking shared UI, API client, and live telemetry synchronisation. */

// When the frontend is served from another device, this automatically uses that
// device's host name. Override it in DevTools if needed:
// localStorage.setItem('parking_api_url', 'http://192.168.1.10:8080/api/parking')
const PARKING_API_URL = localStorage.getItem('parking_api_url') ||
  (window.location.protocol === 'file:'
    ? 'http://localhost:8080/api/parking'
    : `${window.location.protocol}//${window.location.hostname}:8080/api/parking`);

let simulationTimer = null;
let telemetryRefreshTimer = null;

async function apiRequest(path, options = {}) {
  const response = await fetch(`${PARKING_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body;
}

function checkAuth() {
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage !== 'index.html' && currentPage !== '' && !localStorage.getItem('parking_auth')) {
    window.location.href = 'index.html';
  }
}

function initTheme() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.checked = currentTheme === 'dark';
    themeToggle.addEventListener('change', function () {
      const newTheme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      window.dispatchEvent(new CustomEvent('themeChanged'));
    });
  }
}

function saveApiData(slots, history) {
  const slotMap = Object.fromEntries(slots.map((slot) => [slot.slotId, {
    id: slot.slotId,
    distance: slot.distance,
    status: slot.status,
    lastUpdated: slot.updatedAt || slot.createdAt || new Date().toISOString(),
    occupiedDuration: 0,
  }]));
  const historyRows = history.map((item) => {
    const date = new Date(item.recordedAt);
    return {
      id: item._id,
      slot: item.slotId,
      status: item.status,
      date: date.toISOString().slice(0, 10),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      distance: item.distance,
      entryTime: item.recordedAt,
    };
  });
  const activities = historyRows.slice(0, 8).map((row) => ({
    slot: row.slot,
    status: row.status,
    time: new Date(row.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));
  localStorage.setItem('parking_slots', JSON.stringify(slotMap));
  localStorage.setItem('parking_history', JSON.stringify(historyRows));
  localStorage.setItem('parking_activities', JSON.stringify(activities));
}

async function refreshParkingData({ notify = true } = {}) {
  try {
    const [slots, history] = await Promise.all([apiRequest('/slots'), apiRequest('/history')]);
    const oldSlots = localStorage.getItem('parking_slots');
    saveApiData(slots, history);
    if (notify && oldSlots !== localStorage.getItem('parking_slots')) triggerParkingDataChanged();
    return true;
  } catch (error) {
    console.warn('Parking API is unavailable:', error.message);
    return false;
  }
}

function getParkingStats() {
  const slots = JSON.parse(localStorage.getItem('parking_slots') || '{}');
  const values = Object.values(slots);
  const occupied = values.filter((slot) => slot.status === 'Occupied').length;
  const total = values.length;
  return { total, occupied, available: total - occupied, rate: total ? Math.round((occupied / total) * 100) : 0 };
}
async function refreshVehicleCount() {
  try {
    const response = await fetch(
      'http://localhost:8080/api/parking/vehicle-count'
    );

    const count = await response.json();

    const entryElement = document.getElementById('dashEntryCount');
    const exitElement = document.getElementById('dashExitCount');
    const insideElement = document.getElementById('dashVehiclesInside');

    if (entryElement) {
      entryElement.textContent = count.entryCount;
    }

    if (exitElement) {
      exitElement.textContent = count.exitCount;
    }

    if (insideElement) {
      insideElement.textContent = count.vehiclesInside;
    }

  } catch (error) {
    console.error('Vehicle count error:', error);
  }
}


function triggerParkingDataChanged() {
  window.dispatchEvent(new CustomEvent('parkingDataChanged'));
  updateNotificationPanel();
}

async function toggleSlotStatus(slotId) {
  const slots = JSON.parse(localStorage.getItem('parking_slots') || '{}');
  const slot = slots[slotId];
  if (!slot) return;
  try {
    if (slot.status === 'Available') {
      await apiRequest(`/sensor/${encodeURIComponent(slotId)}`, {
        method: 'POST', body: JSON.stringify({ distance: 10 }),
      });
      showToast(`Object detected in ${slotId}.`, 'danger');
    } else {
      await apiRequest(`/sensor/${encodeURIComponent(slotId)}`, { method: 'POST', body: JSON.stringify({ distance: 55 }) });
      showToast(`${slotId} is available.`, 'success');
    }
    await refreshParkingData();
  } catch (error) {
    showToast(error.message, 'warning');
  }
}

function startSensorSimulation() {
  if (simulationTimer) clearInterval(simulationTimer);
  if (localStorage.getItem('settings_sim_enabled') !== 'true') return;
  const intervalSeconds = Math.max(5, Number(localStorage.getItem('settings_sim_interval')) || 20);
  simulationTimer = setInterval(() => {
    const slots = Object.values(JSON.parse(localStorage.getItem('parking_slots') || '{}'));
    if (!slots.length) return;
    const slot = slots[Math.floor(Math.random() * slots.length)];
    if (slot.status === 'Available') {
      apiRequest(`/sensor/${encodeURIComponent(slot.id)}`, {
        method: 'POST', body: JSON.stringify({ distance: 10 }),
      }).then(() => refreshParkingData()).catch(() => {});
    } else {
      apiRequest(`/sensor/${encodeURIComponent(slot.id)}`, { method: 'POST', body: JSON.stringify({ distance: 55 }) })
        .then(() => refreshParkingData()).catch(() => {});
    }
  }, intervalSeconds * 1000);
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast-custom ${type}`;
  toast.innerHTML = `<i class="fas fa-info-circle mt-1"></i><div><div style="font-weight:700">System Notice</div><div>${message}</div></div><button class="toast-close-btn">&times;</button>`;
  container.appendChild(toast);
  toast.querySelector('.toast-close-btn').addEventListener('click', () => toast.remove());
  setTimeout(() => toast.remove(), 4000);
}

function updateNotificationPanel() {
  const counter = document.getElementById('notifCounter');
  const list = document.getElementById('notifList');
  if (!list) return;
  const activities = JSON.parse(localStorage.getItem('parking_activities') || '[]');
  if (counter) { counter.textContent = activities.length; counter.style.display = activities.length ? 'flex' : 'none'; }
  list.innerHTML = '<div class="notification-header"><span>Recent Database Events</span></div>';
  if (!activities.length) list.innerHTML += '<div class="p-4 text-center text-muted">No recent activities</div>';
  activities.forEach((event) => {
    list.innerHTML += `<div class="notification-item"><span>Slot <strong>${event.slot}</strong> is <strong>${event.status.toLowerCase()}</strong></span><span class="time-ago">${event.time}</span></div>`;
  });
}

function initHeaderClock() {
  const element = document.getElementById('headerClock');
  if (!element) return;
  const update = () => { element.textContent = new Date().toLocaleString(); };
  update(); setInterval(update, 1000);
}

function mockLogout() { localStorage.removeItem('parking_auth'); window.location.href = 'index.html'; }

document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('sidebarToggle');
  if (sidebar && toggleButton) {
    toggleButton.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
  }
  const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.menu-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === currentFile);
  });
  initTheme();
  if (!localStorage.getItem('settings_sim_enabled')) localStorage.setItem('settings_sim_enabled', 'false');
  if (!localStorage.getItem('settings_sim_interval')) localStorage.setItem('settings_sim_interval', '20');
  initHeaderClock();
  updateNotificationPanel();
  await refreshParkingData({ notify: false });
  await refreshVehicleCount();
  triggerParkingDataChanged();
  startSensorSimulation();
  telemetryRefreshTimer = setInterval(async () => {
  await refreshParkingData();
  await refreshVehicleCount();
}, 5000);
});
