// Settings & Data Privacy Controller
// Blueprint Section 7 & 8: Data export, deletion, structured logging and error handling
import { renderNavbar } from '../components/navbar.js';
import { api } from '../api/endpoints.js';
import { storage } from '../utils/storage.js';
import { showToast } from '../components/toast.js';

let currentHouseholdId = 1;

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('settings');
  currentHouseholdId = storage.getHouseholdId();

  await loadHouseholdSettings();
  setupSettingsForm();
  setupExportActions();
  setupWipeAction();
});

async function loadHouseholdSettings() {
  try {
    const h = await api.households.get(currentHouseholdId);
    if (!h) return;

    document.getElementById('household-name-input').value = h.name;
    document.getElementById('currency-input').value = h.currency;
    document.getElementById('timezone-input').value = h.timezone;
    document.getElementById('elec-tariff-input').value = h.electricity_tariff_rate;
    document.getElementById('water-tariff-input').value = h.water_tariff_rate;
  } catch (err) {
    console.warn('Could not load household details:', err);
  }
}

function setupSettingsForm() {
  const form = document.getElementById('household-settings-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('household-name-input').value,
      currency: document.getElementById('currency-input').value,
      timezone: document.getElementById('timezone-input').value,
      electricity_tariff_rate: parseFloat(document.getElementById('elec-tariff-input').value),
      water_tariff_rate: parseFloat(document.getElementById('water-tariff-input').value)
    };

    try {
      await api.households.update(currentHouseholdId, payload);
      showToast('Household settings saved successfully!', 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  });
}

function setupExportActions() {
  const jsonBtn = document.getElementById('export-json-btn');
  const csvBtn = document.getElementById('export-csv-btn');

  if (jsonBtn) {
    jsonBtn.addEventListener('click', async () => {
      try {
        const data = await api.export.getJson(currentHouseholdId);
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `homeresource_household_${currentHouseholdId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('JSON export downloaded', 'success');
      } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
      }
    });
  }

  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      window.location.href = `/api/v1/export/${currentHouseholdId}/csv`;
      showToast('Downloading CSV archive...', 'info');
    });
  }
}

function setupWipeAction() {
  const wipeBtn = document.getElementById('wipe-data-btn');
  if (!wipeBtn) return;

  wipeBtn.addEventListener('click', async () => {
    const confirmation = prompt(
      'WARNING: This will permanently delete all resource and telemetry records for this household (GDPR Right to be Forgotten).\n\nType "DELETE" to confirm:'
    );

    if (confirmation === 'DELETE') {
      try {
        const res = await api.export.wipe(currentHouseholdId);
        showToast(`Purged ${res.deleted_count || 'all'} telemetry records.`, 'info');
        setTimeout(() => {
          window.location.href = './dashboard.html';
        }, 1200);
      } catch (err) {
        showToast('Purge failed: ' + err.message, 'error');
      }
    }
  });
}
