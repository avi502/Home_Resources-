// Dashboard Page Controller
import { renderNavbar } from '../components/navbar.js';
import { api } from '../api/endpoints.js';
import { storage } from '../utils/storage.js';
import { formatNumber, formatCurrency, formatDate } from '../utils/formatters.js';
import { showToast } from '../components/toast.js';
import { setupModal } from '../components/modal.js';
import { renderTrendChart, renderDistributionChart } from '../charts/resourceCharts.js';

let currentEntries = [];
let currentHouseholdId = 1;

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('dashboard');
  currentHouseholdId = storage.getHouseholdId();

  setupModal('add-entry-modal', 'open-add-entry-btn');
  setupAddEntryForm();

  await loadDashboardData();
  await loadAnomalies();
  await loadRelationships();
});

async function loadDashboardData() {
  try {
    const data = await api.resources.getDashboard(currentHouseholdId);
    if (!data) return;

    // Set household name
    const titleEl = document.getElementById('household-title');
    if (titleEl) titleEl.textContent = data.household_name;

    // Render Stats
    renderStatCards(data.summaries);

    // Save recent entries
    currentEntries = data.recent_entries || [];

    // Render Charts
    renderTrendChart('trendChart', currentEntries);
    renderDistributionChart('distributionChart', data.summaries);

    // Render Telemetry Table
    renderTelemetryTable(currentEntries);
  } catch (err) {
    showToast('Failed to load dashboard metrics: ' + err.message, 'error');
  }
}

function renderStatCards(summaries) {
  const container = document.getElementById('stats-grid');
  if (!container) return;

  container.innerHTML = summaries.map(s => `
    <div class="glass-panel stat-card accent-${s.resource_type}">
      <div class="stat-card-header">
        <span class="stat-card-title">${s.resource_type}</span>
        ${s.is_demo ? '<span class="badge badge-demo">Demo</span>' : ''}
      </div>
      <div class="stat-card-value">
        ${formatNumber(s.total_amount)}<span class="stat-card-unit">${s.unit}</span>
      </div>
      <div class="stat-card-footer">
        <span>Daily: ~${formatNumber(s.daily_average)} ${s.unit}</span>
        <span>Cost: ${formatCurrency(s.total_cost)}</span>
      </div>
    </div>
  `).join('');
}

function renderTelemetryTable(entries) {
  const tbody = document.getElementById('telemetry-tbody');
  if (!tbody) return;

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">No entries logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.map(e => `
    <tr>
      <td>${formatDate(e.recorded_at, true)}</td>
      <td><span class="badge accent-${e.resource_type}" style="border: 1px solid var(--color-border);">${e.resource_type}</span></td>
      <td><strong>${formatNumber(e.amount)}</strong> ${e.unit}</td>
      <td>${e.cost > 0 ? formatCurrency(e.cost) : '—'}</td>
      <td>${e.activity_tag}</td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.notes || ''}</td>
      <td>
        <button class="btn btn-outline btn-sm delete-btn" data-id="${e.id}" style="color: #EF4444; border-color: rgba(239,68,68,0.3);">
          ✕
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Delete this resource entry?')) {
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

async function loadAnomalies() {
  const container = document.getElementById('anomaly-list-mount');
  if (!container) return;

  try {
    const anomalies = await api.intelligence.getAnomalies(currentHouseholdId, 'electricity');
    if (!anomalies || anomalies.length === 0) {
      container.innerHTML = `
        <div class="glass-panel" style="padding: var(--space-md); text-align: center; color: var(--color-text-muted);">
          No statistical deviations detected (Threshold: ±2.0 σ). Usage patterns are within baseline expectation.
        </div>
      `;
      return;
    }

    container.innerHTML = anomalies.map(a => `
      <div class="anomaly-item">
        <div class="anomaly-item-header">
          <div class="anomaly-value">${a.value} ${a.unit}</div>
          <span class="badge ${a.severity === 'severe' ? 'badge-anomaly-severe' : 'badge-anomaly-moderate'}">
            z = ${a.z_score > 0 ? '+' : ''}${a.z_score} σ
          </span>
        </div>
        <div class="anomaly-desc">
          ${a.explanation}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color: var(--color-text-muted);">Intelligence telemetry unavailable</p>`;
  }
}

async function loadRelationships() {
  const canvas = document.getElementById('relationshipCanvas');
  if (!canvas) return;

  try {
    const graph = await api.intelligence.getRelationships(currentHouseholdId);
    if (!graph || !graph.nodes) return;

    drawRelationshipGraph(canvas, graph);
  } catch (err) {
    console.error('Error loading graph:', err);
  }
}

function drawRelationshipGraph(canvas, graph) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth;
  const h = canvas.height = canvas.parentElement.clientHeight;

  ctx.clearRect(0, 0, w, h);

  // Position nodes in circle
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
    ctx.strokeStyle = e.is_causal ? 'rgba(217, 168, 91, 0.6)' : 'rgba(45, 212, 191, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Edge mid label
    const mx = (s.x + t.x) / 2;
    const my = (s.y + t.y) / 2;
    ctx.fillStyle = '#A3B5AE';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText(`r = ${e.correlation_coefficient}`, mx, my);
  });

  // Draw Nodes
  Object.values(nodeMap).forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = n.color;
    ctx.shadowColor = n.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#F3F0E7';
    ctx.font = 'bold 11px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(n.label, n.x, n.y + 26);
  });
}

function setupAddEntryForm() {
  const form = document.getElementById('add-entry-form');
  if (!form) return;

  // Auto-populate unit based on selected resource type
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
      showToast('New resource telemetry recorded!', 'success');
      form.reset();
      document.getElementById('add-entry-modal').classList.remove('active');
      await loadDashboardData();
    } catch (err) {
      showToast('Validation failed: ' + err.message, 'error');
    }
  });
}
