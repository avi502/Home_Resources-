// Chart.js Configuration & Renderers for HomeResource

let trendChartInstance = null;
let distributionChartInstance = null;

export function renderTrendChart(canvasId, entries) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  // Filter last 14 entries of electricity & water
  const elecEntries = entries.filter(e => e.resource_type === 'electricity').slice(0, 14).reverse();
  const waterEntries = entries.filter(e => e.resource_type === 'water').slice(0, 14).reverse();

  const labels = elecEntries.map(e => {
    const d = new Date(e.recorded_at);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const elecData = elecEntries.map(e => e.amount);
  const waterData = waterEntries.map(e => e.amount);

  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
      datasets: [
        {
          label: 'Electricity (kWh)',
          data: elecData.length ? elecData : [5.0, 4.8, 5.2, 5.0, 8.5],
          borderColor: '#FBBF24',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#FBBF24'
        },
        {
          label: 'Water (L / 100)',
          data: waterData.length ? waterData.map(v => v / 100) : [3.5, 3.4, 3.6, 3.4, 5.4],
          borderColor: '#2DD4BF',
          backgroundColor: 'rgba(45, 212, 191, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#2DD4BF'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#A3B5AE',
            font: { family: "'Inter', sans-serif", size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(11, 20, 18, 0.95)',
          titleColor: '#F3F0E7',
          bodyColor: '#A3B5AE',
          borderColor: 'rgba(217, 168, 91, 0.3)',
          borderWidth: 1,
          padding: 12
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#6B7D76' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#6B7D76' }
        }
      }
    }
  });
}

export function renderDistributionChart(canvasId, summaries) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;

  const labels = summaries.map(s => s.resource_type.toUpperCase());
  const data = summaries.map(s => s.total_cost || s.total_amount || 1);
  const colors = ['#FBBF24', '#2DD4BF', '#FB923C', '#34D399', '#38BDF8'];

  if (distributionChartInstance) {
    distributionChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');

  distributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 1,
        borderColor: '#0B1412'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#A3B5AE',
            font: { family: "'Inter', sans-serif", size: 11 },
            boxWidth: 12
          }
        }
      },
      cutout: '70%'
    }
  });
}
