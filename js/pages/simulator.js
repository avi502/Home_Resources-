// What-If Simulator Controller
// Implements Blueprint Section 6: What-if simulation & cascading modeling
import { renderNavbar } from '../components/navbar.js';
import { api } from '../api/endpoints.js';
import { storage } from '../utils/storage.js';
import { formatNumber, formatCurrency } from '../utils/formatters.js';
import { showToast } from '../components/toast.js';

let currentHouseholdId = 1;
let debounceTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('simulator');
  currentHouseholdId = storage.getHouseholdId();

  setupControls();
  await loadPresets();
  triggerSimulation(); // Run initial simulation
});

function setupControls() {
  const slider = document.getElementById('change-slider');
  const sliderBadge = document.getElementById('slider-val-badge');
  const targetSelect = document.getElementById('target-resource-select');
  const pumpCheckbox = document.getElementById('water-pump-toggle');

  if (slider && sliderBadge) {
    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      sliderBadge.textContent = `${val > 0 ? '+' : ''}${val}%`;
      debouncedSimulate();
    });
  }

  if (targetSelect) {
    targetSelect.addEventListener('change', () => {
      // Show/hide water pump options if water is chosen
      const pumpGroup = document.getElementById('pump-options-group');
      if (pumpGroup) {
        pumpGroup.style.display = targetSelect.value === 'water' ? 'block' : 'none';
      }
      debouncedSimulate();
    });
  }

  if (pumpCheckbox) {
    pumpCheckbox.addEventListener('change', debouncedSimulate);
  }
}

function debouncedSimulate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    triggerSimulation();
  }, 250);
}

async function loadPresets() {
  const container = document.getElementById('presets-list');
  if (!container) return;

  try {
    const presets = await api.simulation.getPresets();
    if (!presets || presets.length === 0) return;

    container.innerHTML = presets.map((p, idx) => `
      <div class="preset-card ${idx === 0 ? 'active' : ''}" data-id="${p.id}" data-resource="${p.target_resource}" data-change="${p.change_percentage}">
        <div class="preset-card-title">${p.name}</div>
        <div class="preset-card-desc">${p.description}</div>
      </div>
    `).join('');

    container.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Apply preset values to form
        const res = card.dataset.resource;
        const chg = parseFloat(card.dataset.change);

        document.getElementById('target-resource-select').value = res;
        const slider = document.getElementById('change-slider');
        slider.value = chg;
        document.getElementById('slider-val-badge').textContent = `${chg > 0 ? '+' : ''}${chg}%`;

        const pumpGroup = document.getElementById('pump-options-group');
        if (pumpGroup) pumpGroup.style.display = res === 'water' ? 'block' : 'none';

        triggerSimulation();
      });
    });
  } catch (err) {
    console.warn('Could not load presets:', err);
  }
}

async function triggerSimulation() {
  const slider = document.getElementById('change-slider');
  const targetSelect = document.getElementById('target-resource-select');
  const pumpCheckbox = document.getElementById('water-pump-toggle');

  if (!slider || !targetSelect) return;

  const payload = {
    name: 'Custom What-If Run',
    target_resource: targetSelect.value,
    change_percentage: parseFloat(slider.value),
    water_pump_model: pumpCheckbox ? pumpCheckbox.checked : true,
    pump_energy_intensity: 0.0012
  };

  try {
    const result = await api.simulation.simulate(currentHouseholdId, payload);
    renderSimulationResults(result);
  } catch (err) {
    showToast('Simulation error: ' + err.message, 'error');
  }
}

function renderSimulationResults(res) {
  // 1. Savings Highlight
  const savingsEl = document.getElementById('expected-savings-display');
  const savingsUnitEl = document.getElementById('savings-direction-label');
  if (savingsEl) {
    const isPositive = res.cost_delta <= 0;
    savingsEl.textContent = formatCurrency(Math.abs(res.cost_delta), res.currency);
    savingsEl.style.color = isPositive ? 'var(--color-emerald-bright)' : '#EF4444';
    if (savingsUnitEl) {
      savingsUnitEl.textContent = isPositive ? 'Estimated Monthly Savings' : 'Estimated Cost Increase';
    }
  }

  // 2. Usage Delta
  const usageDeltaEl = document.getElementById('usage-delta-display');
  if (usageDeltaEl) {
    usageDeltaEl.innerHTML = `
      <span>Normal Use: <strong>${formatNumber(res.baseline_usage)}</strong> ${res.unit}</span>
      <span>➔ With Changes: <strong>${formatNumber(res.simulated_usage)}</strong> ${res.unit}</span>
      <span style="color: ${res.usage_delta <= 0 ? 'var(--color-emerald-bright)' : '#EF4444'};">(${res.usage_delta > 0 ? '+' : ''}${formatNumber(res.usage_delta)} ${res.unit})</span>
    `;
  }

  // 3. Uncertainty Bounds
  const unc = res.savings_uncertainty;
  if (unc) {
    document.getElementById('unc-min').textContent = formatCurrency(unc.minimum, res.currency);
    document.getElementById('unc-exp').textContent = formatCurrency(unc.expected, res.currency);
    document.getElementById('unc-max').textContent = formatCurrency(unc.maximum, res.currency);
    document.getElementById('unc-confidence-badge').textContent = unc.confidence_level;
  }

  // 4. Cascading Impacts
  const cascadingMount = document.getElementById('cascading-mount');
  if (cascadingMount) {
    if (res.cascading_impacts && res.cascading_impacts.length > 0) {
      cascadingMount.innerHTML = res.cascading_impacts.map(c => `
        <div class="cascading-impact-item">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--color-text-primary);">${c.mechanism}</div>
            <div style="font-size: 0.8rem; color: var(--color-text-muted);">${c.notes}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-heading); font-weight: 700; color: var(--color-amber);">
              ${c.delta_amount > 0 ? '+' : ''}${c.delta_amount} ${c.unit}
            </div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${formatCurrency(c.cost_impact, res.currency)}</div>
          </div>
        </div>
      `).join('');
    } else {
      cascadingMount.innerHTML = `<p style="font-size: 0.85rem; color: var(--color-text-muted); padding: 0.5rem 0;">No secondary cross-resource cascading interactions triggered for this selection.</p>`;
    }
  }

  // 5. Assumptions
  const assumptionsMount = document.getElementById('assumptions-mount');
  if (assumptionsMount && res.assumptions) {
    assumptionsMount.innerHTML = res.assumptions.map(a => `<li>${a}</li>`).join('');
  }

  // 6. Methodology
  const methodEl = document.getElementById('methodology-display');
  if (methodEl) {
    methodEl.textContent = res.methodology;
  }
}
