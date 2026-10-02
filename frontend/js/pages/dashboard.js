// Realist Home — Flagship Monitoring Dashboard Controller
import { api } from '../api/endpoints.js';
import { storage } from '../utils/storage.js';
import { formatNumber, formatCurrency, formatDate } from '../utils/formatters.js';
import { showToast } from '../components/toast.js';
import { setupModal } from '../components/modal.js';
import { renderTrendChart, renderDistributionChart } from '../charts/resourceCharts.js';

let currentEntries = [];
let currentHouseholdId = 1;

document.addEventListener('DOMContentLoaded', async () => {
  currentHouseholdId = storage.getHouseholdId();

  // 1. Setup Tab Switching (Overview, Monitoring, Analytics)
  setupNavTabs();

  // 2. Setup 3D Hotspot Interactive Beacons
  setupHotspotBeacons();

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

  // Also bind sidebar buttons
  const waveBtn = document.getElementById('tb-wave');
  if (waveBtn) {
    waveBtn.addEventListener('click', () => {
      const analyticsTab = document.querySelector('.pill-tab[data-tab="analytics"]');
      if (analyticsTab) analyticsTab.click();
    });
  }
}

// Setup Interactive Hotspots on 3D Home
function setupHotspotBeacons() {
  const beacons = document.querySelectorAll('.hotspot-beacon');
  const hud = document.getElementById('hotspot-hud');
  const hudZoneName = document.getElementById('hud-zone-name');
  const hudContent = document.getElementById('hud-content');
  const hudCloseBtn = document.getElementById('hud-close-btn');

  const zoneData = {
    solar: {
      title: 'Rooftop Solar Array (Photovoltaic)',
      text: 'Peak Output: 3.8 kW • 12 Monocrystalline Panels • 94% Inverter Efficiency • Zero Grid Draw During Peak.'
    },
    bedroom: {
      title: 'Upper Floor Master Suite',
      text: 'Ambient Temperature: 28°C • Automated Thermal Shading Active • Passive Ventilation Loop Engaged.'
    },
    living: {
      title: 'Open Cutaway Living Room',
      text: 'Indoor Air Quality: CO₂ 520 ppm (Good) • Current Electrical Load: 1.3 kW • Smart HVAC Setpoint: 24°C.'
    },
    battery: {
      title: 'Exterior Eco Energy Storage Unit',
      text: 'Capacity: 82% Stored (11.2 kWh Reserve) • State: Healthy Floating Charge • Expected Autonomy: 18.5 hrs.'
    },
    water: {
      title: 'Ground Loop & Cascading Water Pump',
      text: 'Daily Consumption: 42 L • Pump Energy Intensity: 0.0012 kWh/L • Cascading Cross-Resource Simulation Model Active.'
    }
  };

  beacons.forEach(beacon => {
    beacon.addEventListener('click', () => {
      const zoneKey = beacon.dataset.zone;
      const info = zoneData[zoneKey];
      if (info && hud && hudZoneName && hudContent) {
        hudZoneName.textContent = info.title;
        hudContent.textContent = info.text;
        hud.classList.remove('hidden');
      }
    });
  });

  if (hudCloseBtn && hud) {
    hudCloseBtn.addEventListener('click', () => {
      hud.classList.add('hidden');
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
