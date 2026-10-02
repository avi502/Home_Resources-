// Realist Home — Flagship Monitoring Dashboard Controller
// Featuring interactive draggable connections graph & photorealistic 3D architectural viewer

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

  // 1. Initialize Photorealistic 3D Smart Home Structure
  initSmartHome3D();

  // 2. Setup Navigation Tabs
  setupNavTabs();

  // 3. Setup Add Reading Modal
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
  await loadInteractiveConnectionsGraph();
});

// 1. Initialize Photorealistic 3D Eco-Smart Home Viewport
function initSmartHome3D() {
  const stage = document.getElementById('three-home-stage');
  const threeMount = document.getElementById('three-webgl-mount');
  if (!stage) return;

  try {
    if (threeMount) {
      smartHomeInstance = new SmartHome3D('three-webgl-mount');
    }

    // 3D Model Mode Switcher (Sketchfab vs Three.js)
    const sketchBtn = document.getElementById('btn-mode-sketchfab');
    const threeBtn = document.getElementById('btn-mode-three');
    const sketchFrame = document.getElementById('sketchfab-model-frame');
    const threePresetControls = document.getElementById('three-preset-controls');
    const threeSceneToggles = document.getElementById('three-scene-toggles');

    if (sketchBtn && threeBtn) {
      sketchBtn.addEventListener('click', () => {
        sketchBtn.classList.add('active');
        threeBtn.classList.remove('active');
        if (sketchFrame) sketchFrame.style.display = 'block';
        if (threeMount) threeMount.style.display = 'none';
        if (threePresetControls) threePresetControls.style.display = 'none';
        if (threeSceneToggles) threeSceneToggles.style.display = 'none';
      });

      threeBtn.addEventListener('click', () => {
        threeBtn.classList.add('active');
        sketchBtn.classList.remove('active');
        if (sketchFrame) sketchFrame.style.display = 'none';
        if (threeMount) {
          threeMount.style.display = 'block';
          if (smartHomeInstance) {
            setTimeout(() => smartHomeInstance.onResize(), 50);
          }
        }
        if (threePresetControls) threePresetControls.style.display = 'flex';
        if (threeSceneToggles) threeSceneToggles.style.display = 'flex';
      });
    }

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

    // Zoom Buttons
    const zoomInBtn = document.getElementById('zoom-in-btn');
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => smartHomeInstance.zoomIn());
    }

    const zoomOutBtn = document.getElementById('zoom-out-btn');
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => smartHomeInstance.zoomOut());
    }

    // Auto-Spin Toggle
    const rotateBtn = document.getElementById('toggle-rotate-btn');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        const isSpinning = smartHomeInstance.toggleAutoRotate();
        rotateBtn.classList.toggle('active', isSpinning);
      });
    }

    // Day / Night Toggle
    const dayNightBtn = document.getElementById('toggle-daynight-btn');
    if (dayNightBtn) {
      dayNightBtn.addEventListener('click', () => {
        const isDay = smartHomeInstance.toggleDayNight();
        dayNightBtn.classList.toggle('active', !isDay);
        dayNightBtn.querySelector('span').textContent = isDay ? 'Day Mode' : 'Night Mode';
      });
    }

    // Reset View Button
    const resetBtn = document.getElementById('reset-cam-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        smartHomeInstance.resetCamera();
        presetBtns.forEach(b => b.classList.remove('active'));
        const overviewBtn = document.querySelector('.cam-preset-btn[data-focus="overview"]');
        if (overviewBtn) overviewBtn.classList.add('active');
      });
    }

    // Sidebar Shortcuts
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
    console.error('Failed to initialize 3D Home:', err);
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

// 2. Setup Top Pill Tabs Navigation
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
        if (smartHomeInstance && typeof smartHomeInstance.onResize === 'function') {
          setTimeout(() => smartHomeInstance.onResize(), 60);
        }
      } else if (target === 'analytics') {
        if (monitoringView) monitoringView.classList.remove('active');
        if (analyticsView) analyticsView.classList.add('active');
        if (window.resizeInteractiveGraph) {
          setTimeout(() => window.resizeInteractiveGraph(), 60);
        }
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

// 3. Load Core Dashboard Metrics
async function loadDashboardData() {
  try {
    const data = await api.resources.getDashboard(currentHouseholdId);
    if (!data) return;

    // Household name in header
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

      renderDistributionChart('distributionChart', data.summaries);
    }

    renderTrendChart('trendChart', currentEntries);
    renderTelemetryTable(currentEntries);
  } catch (err) {
    console.warn('Dashboard metrics fetch:', err.message);
  }
}

// 4. Render Telemetry History Table
function renderTelemetryTable(entries) {
  const tbody = document.getElementById('telemetry-tbody');
  if (!tbody) return;

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">No readings recorded yet. Click "+ Add a Reading" to start.</td></tr>`;
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
          ✕ Delete
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Delete this reading?')) {
        try {
          await api.resources.deleteEntry(currentHouseholdId, id);
          showToast('Reading removed', 'info');
          await loadDashboardData();
        } catch (err) {
          showToast('Failed to delete reading: ' + err.message, 'error');
        }
      }
    });
  });
}

// 5. Load Active Intelligence Alerts
async function loadAnomalies() {
  const container = document.getElementById('alerts-list-mount');
  if (!container) return;

  try {
    const anomalies = await api.intelligence.getAnomalies(currentHouseholdId, 'electricity');
    if (!anomalies || anomalies.length === 0) return;

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
          <div class="alert-pill-title">Unusual Usage Spike: ${a.value} ${a.unit}</div>
          <div class="alert-pill-status">Usage jumped higher than your normal routine (+${Math.abs(a.z_score)}x above average)</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = dynamicItems + container.innerHTML;
  } catch (err) {
    console.warn('Anomaly fetch:', err.message);
  }
}

// 6. WORKING, DRAGGABLE, INTERACTIVE RESOURCE CONNECTIONS GRAPH
function loadInteractiveConnectionsGraph() {
  const canvas = document.getElementById('relationshipCanvas');
  if (!canvas) return;

  const storyCard = document.getElementById('connection-story-card');
  const storyIcon = document.getElementById('story-icon');
  const storyTitle = document.getElementById('story-title');
  const storyDesc = document.getElementById('story-desc');

  // Friendly everyday explanations
  const stories = {
    water: {
      icon: '💧',
      title: 'Water & Well Pump Connection (Direct Link)',
      desc: 'Whenever anyone takes a shower or turns on a tap, your electric water pump runs to deliver pressure. Saving 15% on water saves about 50 liters a day and gives you free electricity savings too!'
    },
    pump: {
      icon: '⚙️',
      title: 'Water Pump — The Bridge Between Water & Power',
      desc: 'Your pump is the physical bridge connecting your water and electric bills. It draws 1.2 kW of power. When you fix leaking faucets, the pump turns on far less often.'
    },
    electricity: {
      icon: '⚡',
      title: 'Electricity & Heating Connection',
      desc: 'Electricity powers appliances, lighting, and the water pump. Running high-draw appliances like laundry or dishwashers in the sunny afternoon uses 100% free rooftop solar energy!'
    },
    cost: {
      icon: '💵',
      title: 'Monthly Utility Expenses',
      desc: 'Electricity and water make up 85% of your home utility costs. Because they are connected, lowering your water usage gives you a double discount by also shrinking your electric bill.'
    },
    food: {
      icon: '🍽️',
      title: 'Kitchen & Meal Resources',
      desc: 'Kitchen appliances like the refrigerator, stove, and dishwasher consume both water and electricity. Running full dishwasher loads saves up to 40 liters per week.'
    }
  };

  // Node definitions with normalized percentage coordinates for perfect responsive layout
  let w = canvas.parentElement.clientWidth || 600;
  let h = canvas.parentElement.clientHeight || 320;
  canvas.width = w;
  canvas.height = h;

  const nodes = [
    { id: 'water', label: 'Water Use', color: '#2dd4bf', nx: 0.72, ny: 0.55, radius: 26 },
    { id: 'pump', label: 'Well / Pump', color: '#38bdf8', nx: 0.56, ny: 0.80, radius: 24 },
    { id: 'electricity', label: 'Electricity', color: '#fbbf24', nx: 0.28, ny: 0.72, radius: 28 },
    { id: 'cost', label: 'Utility Cost', color: '#34d399', nx: 0.28, ny: 0.35, radius: 25 },
    { id: 'food', label: 'Kitchen & Food', color: '#fb923c', nx: 0.55, ny: 0.22, radius: 24 }
  ];

  function recomputePositions() {
    w = canvas.parentElement.clientWidth || 600;
    h = canvas.parentElement.clientHeight || 320;
    canvas.width = w;
    canvas.height = h;
    nodes.forEach(n => {
      n.x = n.nx * w;
      n.y = n.ny * h;
    });
  }
  recomputePositions();

  const edges = [
    { from: 'water', to: 'pump', label: 'Direct Link (100%)', isCausal: true },
    { from: 'pump', to: 'electricity', label: 'Strong Link (99%)', isCausal: true },
    { from: 'electricity', to: 'cost', label: 'Strong Link (91%)', isCausal: true },
    { from: 'cost', to: 'food', label: 'Connected (98%)', isCausal: false }
  ];

  let draggedNode = null;
  let activeNode = nodes[0]; // Start focused on Water
  let pulseOffset = 0;

  function updateStory(node) {
    activeNode = node;
    const info = stories[node.id] || stories.water;
    if (storyIcon) storyIcon.textContent = info.icon;
    if (storyTitle) storyTitle.textContent = info.title;
    if (storyDesc) storyDesc.textContent = info.desc;
  }

  // Draw Graph Loop
  function draw() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pulseOffset = (pulseOffset + 0.015) % 1.0;

    // 1. Draw Edges & Animated Pulses
    edges.forEach(e => {
      const n1 = nodes.find(n => n.id === e.from);
      const n2 = nodes.find(n => n.id === e.to);
      if (!n1 || !n2) return;

      const isConnectedToActive = (activeNode && (activeNode.id === e.from || activeNode.id === e.to));

      // Connection Line
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.strokeStyle = isConnectedToActive 
        ? (e.isCausal ? 'rgba(245, 158, 11, 0.95)' : 'rgba(45, 212, 191, 0.9)') 
        : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = isConnectedToActive ? 3.5 : 2;
      ctx.stroke();

      // Animated traveling energy pulse packet
      const px = n1.x + (n2.x - n1.x) * pulseOffset;
      const py = n1.y + (n2.y - n1.y) * pulseOffset;
      ctx.beginPath();
      ctx.arc(px, py, isConnectedToActive ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = e.isCausal ? '#fbbf24' : '#2dd4bf';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label at midpoint in Simple English
      const mx = (n1.x + n2.x) / 2;
      const my = (n1.y + n2.y) / 2;
      ctx.fillStyle = isConnectedToActive ? '#f8fafc' : '#7fa99b';
      ctx.font = '11px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.label, mx, my - 6);
    });

    // 2. Draw Draggable Nodes
    nodes.forEach(n => {
      const isSelected = activeNode && activeNode.id === n.id;

      // Outer Aura Ring
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius + (isSelected ? 10 : 5), 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.globalAlpha = isSelected ? 0.35 : 0.15;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = isSelected ? 18 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + n.radius + 16);
    });

    requestAnimationFrame(draw);
  }

  // Mouse & Touch Drag Listeners
  function getNodeAt(px, py) {
    return nodes.find(n => Math.hypot(n.x - px, n.y - py) <= n.radius + 10);
  }

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const found = getNodeAt(x, y);
    if (found) {
      draggedNode = found;
      updateStory(found);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!draggedNode) return;
    const rect = canvas.getBoundingClientRect();
    draggedNode.x = Math.max(30, Math.min(canvas.width - 30, e.clientX - rect.left));
    draggedNode.y = Math.max(30, Math.min(canvas.height - 30, e.clientY - rect.top));
    draggedNode.nx = draggedNode.x / canvas.width;
    draggedNode.ny = draggedNode.y / canvas.height;
  });

  window.addEventListener('mouseup', () => {
    draggedNode = null;
  });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const found = getNodeAt(x, y);
      if (found) {
        draggedNode = found;
        updateStory(found);
      }
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!draggedNode || e.touches.length !== 1) return;
    const rect = canvas.getBoundingClientRect();
    draggedNode.x = Math.max(30, Math.min(canvas.width - 30, e.touches[0].clientX - rect.left));
    draggedNode.y = Math.max(30, Math.min(canvas.height - 30, e.touches[0].clientY - rect.top));
    draggedNode.nx = draggedNode.x / canvas.width;
    draggedNode.ny = draggedNode.y / canvas.height;
  });

  canvas.addEventListener('touchend', () => {
    draggedNode = null;
  });

  // Responsive Resize Handler
  function handleGraphResize() {
    recomputePositions();
  }
  window.addEventListener('resize', handleGraphResize);
  window.resizeInteractiveGraph = handleGraphResize;

  updateStory(nodes[0]);
  draw();
}

// 7. Add Usage Reading Form Handler
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

  const unitAliases = {
    'liters': 'L',
    'liter': 'L',
    'l': 'L',
    'hours': 'hrs',
    'hour': 'hrs',
    'hrs': 'hrs',
    'hr': 'hrs',
    'kwh': 'kWh',
    'kg': 'kg',
    'usd': 'USD'
  };

  if (typeSelect && unitInput) {
    typeSelect.addEventListener('change', () => {
      unitInput.value = defaultUnits[typeSelect.value] || 'units';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawUnit = unitInput.value.trim();
    const cleanUnit = unitAliases[rawUnit.toLowerCase()] || rawUnit;

    const payload = {
      resource_type: typeSelect.value,
      amount: parseFloat(document.getElementById('form-amount').value),
      unit: cleanUnit,
      cost: parseFloat(document.getElementById('form-cost').value || '0'),
      activity_tag: document.getElementById('form-activity').value || 'general',
      notes: document.getElementById('form-notes').value || '',
      is_demo: false
    };

    try {
      await api.resources.addEntry(currentHouseholdId, payload);
      showToast('Reading saved successfully!', 'success');
      form.reset();
      const modal = document.getElementById('add-entry-modal');
      if (modal) modal.classList.remove('active');
      await loadDashboardData();
    } catch (err) {
      showToast('Could not save reading: ' + err.message, 'error');
    }
  });
}
