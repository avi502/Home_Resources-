// Realist Home — Flagship Monitoring Dashboard Controller
import { api } from '../api/endpoints.js';
import { storage } from '../utils/storage.js';
import { formatNumber, formatCurrency, formatDate } from '../utils/formatters.js';
import { showToast } from '../components/toast.js';
import { setupModal } from '../components/modal.js';
import { renderTrendChart, renderDistributionChart } from '../charts/resourceCharts.js';
import { SmartHome3D } from '../components/smartHome3D.js';

let currentEntries = [];
let currentHouseholdId = 1;
let smartHomeInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentHouseholdId = storage.getHouseholdId();

  // 1. Initialize Interactive 3D Rotating & Zooming Smart Home
  initSmartHome3D();

  // 2. Setup Top Pill Tabs Navigation (Overview, Monitoring, Analytics)
  setupNavTabs();

  // 3. Setup Telemetry Logging Modal
  setupModal('add-entry-modal', 'open-add-entry-btn');
  const analyticsAddBtn = document.getElementById('analytics-add-btn');
  if (analyticsAddBtn) {
    analyticsAddBtn.addEventListener('click', () => {
      const modal = document.getElementById('add-entry-modal');
      if (modal) modal.classList.add('active');
    });
  }
  setupAddEntryForm();

  // 4. Setup Live Date Stamp
  const dateEl = document.getElementById('telemetry-date-stamp');
  if (dateEl) {
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // 5. Load Data from Backend APIs
  await loadDashboardData();
  await loadAnomalies();
  await loadRelationships();
});

// Initialize Interactive 3D Eco-Smart Home
function initSmartHome3D() {
  const stage = document.getElementById('three-home-stage');
  if (!stage) return;

  try {
    smartHomeInstance = new SmartHome3D('three-home-stage');

    // Camera preset buttons
    const presetBtns = document.querySelectorAll('.cam-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const focus = btn.dataset.focus;
        if (focus === 'overview') {
          smartHomeInstance.resetCamera();
        } else {
          smartHomeInstance.focusOnZone(focus);
        }
      });
    });

    // Auto-Rotate Toggle Button
    const rotateBtn = document.getElementById('toggle-rotate-btn');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        const isRotating = smartHomeInstance.toggleAutoRotate();
        rotateBtn.classList.toggle('active', isRotating);
      });
    }

    // Day / Night Toggle Button
    const dayNightBtn = document.getElementById('toggle-daynight-btn');
    if (dayNightBtn) {
      dayNightBtn.addEventListener('click', () => {
        const isDay = smartHomeInstance.toggleDayNight();
        dayNightBtn.classList.toggle('active', !isDay);
        dayNightBtn.querySelector('span').textContent = isDay ? 'Day Mode' : 'Night Mode';
      });
    }

    // Reset Camera Button
    const resetBtn = document.getElementById('reset-cam-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        smartHomeInstance.resetCamera();
        presetBtns.forEach(b => b.classList.remove('active'));
        const overviewBtn = document.querySelector('.cam-preset-btn[data-focus="overview"]');
        if (overviewBtn) overviewBtn.classList.add('active');
      });
    }

    // Bind Slim Toolbar Shortcuts to 3D Camera Focus
    const tbThermometer = document.getElementById('tb-thermometer');
    if (tbThermometer) {
      tbThermometer.addEventListener('click', () => {
        switchToMonitoringView();
        smartHomeInstance.focusOnZone('bedroom');
        activatePresetBtn('bedroom');
      });
    }

    const tbBattery = document.getElementById('tb-battery');
    if (tbBattery) {
      tbBattery.addEventListener('click', () => {
        switchToMonitoringView();
        smartHomeInstance.focusOnZone('battery');
        activatePresetBtn('battery');
      });
    }

    const tbWater = document.getElementById('tb-water');
    if (tbWater) {
      tbWater.addEventListener('click', () => {
        switchToMonitoringView();
        smartHomeInstance.focusOnZone('water');
        activatePresetBtn('water');
      });
    }

    const tbDashboard = document.getElementById('tb-dashboard');
    if (tbDashboard) {
      tbDashboard.addEventListener('click', () => {
        switchToMonitoringView();
        smartHomeInstance.resetCamera();
        activatePresetBtn('overview');
      });
    }
  } catch (err) {
    console.error('Failed to initialize 3D Smart Home:', err);
  }
}

function switchToMonitoringView() {
  const monitoringView = document.getElementById('monitoring-view');
  const analyticsView = document.getElementById('analytics-view');
  if (monitoringView) monitoringView.classList.add('active');
  if (analyticsView) analyticsView.classList.remove('active');

  const tabs = document.querySelectorAll('.pill-tab');
  tabs.forEach(t => t.classList.remove('active'));
  const monTab = document.querySelector('.pill-tab[data-tab="monitoring"]');
  if (monTab) monTab.classList.add('active');
}

function activatePresetBtn(zone) {
  const presetBtns = document.querySelectorAll('.cam-preset-btn');
  presetBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.focus === zone);
  });
}

// Setup Navigation Pill Tabs
function setupNavTabs() {
  const tabs = document.querySelectorAll('.pill-tab');
  const monitoringView = document.getElementById('monitoring-view');
  const analyticsView = document.getElementById('analytics-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const target = tab.dataset.tab;
      if (target === 'energy') return; // Natural link to simulator.html

      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (target === 'monitoring' || target === 'overview') {
        if (monitoringView) monitoringView.classList.add('active');
        if (analyticsView) analyticsView.classList.remove('active');
        if (smartHomeInstance) smartHomeInstance.onResize();
      } else if (target === 'analytics') {
        if (monitoringView) monitoringView.classList.remove('active');
        if (analyticsView) analyticsView.classList.add('active');
        // Render charts when visible
        if (currentEntries.length > 0) {
          renderTrendChart('trendChart', currentEntries);
        }
      }
    });
  });

  const waveBtn = document.getElementById('tb-wave');
  if (waveBtn) {
    waveBtn.addEventListener('click', () => {
      const analyticsTab = document.querySelector('.pill-tab[data-tab="analytics"]');
      if (analyticsTab) analyticsTab.click();
    });
  }
}

// Load Core Dashboard Metrics
async function loadDashboardData() {
  try {
    const data = await api.resources.getDashboard(currentHouseholdId);
    if (!data) return;

    // Household location / title
    const locEl = document.getElementById('header-location');
    if (locEl && data.household_name) {
      locEl.textContent = data.household_name;
    }

    currentEntries = data.recent_entries || [];

    // Map summaries to sensor stream
    if (data.summaries && data.summaries.length > 0) {
      const waterSum = data.summaries.find(s => s.resource_type === 'water');
      const elecSum = data.summaries.find(s => s.resource_type === 'electricity');

      if (waterSum) {
        const streamWater = document.getElementById('stream-water');
        if (streamWater) streamWater.textContent = Math.round(waterSum.daily_average || waterSum.total_amount || 42);
      }

      if (elecSum) {
        const streamSolar = document.getElementById('stream-solar');
        if (streamSolar) streamSolar.textContent = '3.8';
      }

      // Render Distribution Chart
      renderDistributionChart('distributionChart', data.summaries);
    }

    // Render 14-day Trend Chart
    renderTrendChart('trendChart', currentEntries);

    // Render Telemetry Table
    renderTelemetryTable(currentEntries);
  } catch (err) {
    console.warn('Dashboard data fetch notification:', err.message);
  }
}

// Render Telemetry Table
function renderTelemetryTable(entries) {
  const tbody = document.getElementById('telemetry-tbody');
  if (!tbody) return;

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">No telemetry recorded yet. Click "+ Add Telemetry Record" to begin.</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.map(e => `
    <tr>
      <td>${formatDate(e.recorded_at, true)}</td>
      <td><span class="badge accent-${e.resource_type}">${e.resource_type}</span></td>
      <td><strong>${formatNumber(e.amount)}</strong> ${e.unit}</td>
      <td>${e.cost > 0 ? formatCurrency(e.cost) : '—'}</td>
      <td>${e.activity_tag}</td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.notes || '—'}</td>
      <td>
        <button class="btn btn-outline btn-sm delete-btn" data-id="${e.id}" style="color: #EF4444; border-color: rgba(239,68,68,0.3); padding: 2px 8px;">
          ✕
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Delete this telemetry entry?')) {
        try {
          await api.resources.deleteEntry(currentHouseholdId, id);
          showToast('Entry removed', 'info');
          await loadDashboardData();
        } catch (err) {
          showToast('Failed to delete entry: ' + err.message, 'error');
        }
      }
    });
  });
}

// Load Active Intelligence Anomalies
async function loadAnomalies() {
  const container = document.getElementById('alerts-list-mount');
  if (!container) return;

  try {
    const anomalies = await api.intelligence.getAnomalies(currentHouseholdId, 'electricity');
    if (!anomalies || anomalies.length === 0) return;

    // Prepend mathematical z-score anomalies from the database
    const dynamicItems = anomalies.map(a => `
      <div class="alert-pill-item ${a.severity === 'severe' ? 'critical' : 'warning'}">
        <div class="alert-pill-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13" stroke="#000" stroke-width="2"></line>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="#000" stroke-width="2"></line>
          </svg>
        </div>
        <div class="alert-pill-content">
          <div class="alert-pill-title">Deviation: ${a.value} ${a.unit} (z = ${a.z_score > 0 ? '+' : ''}${a.z_score} σ)</div>
          <div class="alert-pill-status">${a.severity === 'severe' ? 'Critical Statistical Anomaly' : 'Moderate Anomaly Alert'}</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = dynamicItems + container.innerHTML;
  } catch (err) {
    console.warn('Anomaly fetch:', err.message);
  }
}

// Load Interconnected Resource Graph
async function loadRelationships() {
  const canvas = document.getElementById('relationshipCanvas');
  if (!canvas) return;

  try {
    const graph = await api.intelligence.getRelationships(currentHouseholdId);
    if (!graph || !graph.nodes) return;

    drawRelationshipGraph(canvas, graph);
  } catch (err) {
    console.warn('Relationship graph:', err);
  }
}

// Draw Relationship Graph on Canvas
function drawRelationshipGraph(canvas, graph) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth || 360;
  const h = canvas.height = canvas.parentElement.clientHeight || 300;

  ctx.clearRect(0, 0, w, h);

  const nodeMap = {};
  const total = graph.nodes.length;
  const radius = Math.min(w, h) * 0.35;
  const cx = w / 2;
  const cy = h / 2;

  graph.nodes.forEach((n, idx) => {
    const angle = (idx * 2 * Math.PI) / total;
    nodeMap[n.id] = {
      ...n,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  });

  // Draw Edges
  graph.edges.forEach(e => {
    const s = nodeMap[e.source];
    const t = nodeMap[e.target];
    if (!s || !t) return;

    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.strokeStyle = e.is_causal ? 'rgba(245, 158, 11, 0.7)' : 'rgba(45, 212, 191, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    const mx = (s.x + t.x) / 2;
    const my = (s.y + t.y) / 2;
    ctx.fillStyle = '#7fa99b';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText(`r = ${e.correlation_coefficient}`, mx, my);
  });

  // Draw Nodes
  Object.values(nodeMap).forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = n.color || '#2dd4bf';
    ctx.shadowColor = n.color || '#2dd4bf';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(n.label, n.x, n.y + 24);
  });
}

// Telemetry Logging Form Handler
function setupAddEntryForm() {
  const form = document.getElementById('add-entry-form');
  if (!form) return;

  const typeSelect = document.getElementById('form-resource-type');
  const unitInput = document.getElementById('form-unit');

  const defaultUnits = {
    electricity: 'kWh',
    water: 'L',
    food: 'kg',
    money: 'USD',
    time: 'hrs'
  };

  if (typeSelect && unitInput) {
    typeSelect.addEventListener('change', () => {
      unitInput.value = defaultUnits[typeSelect.value] || 'units';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      resource_type: typeSelect.value,
      amount: parseFloat(document.getElementById('form-amount').value),
      unit: unitInput.value,
      cost: parseFloat(document.getElementById('form-cost').value || '0'),
      activity_tag: document.getElementById('form-activity').value || 'general',
      notes: document.getElementById('form-notes').value || '',
      is_demo: false
    };

    try {
      await api.resources.addEntry(currentHouseholdId, payload);
      showToast('Telemetry reading recorded!', 'success');
      form.reset();
      const modal = document.getElementById('add-entry-modal');
      if (modal) modal.classList.remove('active');
      await loadDashboardData();
    } catch (err) {
      showToast('Record failed: ' + err.message, 'error');
    }
  });
}
