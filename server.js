// HomeResource Multi-Mode Server (Python FastAPI Launcher & Node Fallback)
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 8000;
let fallbackServerRunning = false;

console.log('============================================================');
console.log('  HomeResource — Household Resource Intelligence Platform   ');
console.log('============================================================\n');

// 1. Attempt to launch Python FastAPI backend
const pyEnv = { ...process.env, DISABLE_SQLALCHEMY_CEXT: '1' };
const pyCmd = process.platform === 'win32' ? 'python' : 'python3';

console.log(`[Launcher] Starting Python FastAPI server on http://localhost:${PORT} ...\n`);
console.log(`  👉 Localhost: http://localhost:${PORT}`);
console.log(`  👉 Network:   http://127.0.0.1:${PORT}\n`);

const pyProcess = spawn(pyCmd, ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(PORT), '--reload'], {
  cwd: __dirname,
  env: pyEnv,
  stdio: 'inherit'
});

pyProcess.on('error', (err) => {
  console.warn(`\n[Launcher] Python command not accessible: ${err.message}`);
  console.log('[Launcher] Activating built-in Node.js server fallback...\n');
  startNodeFallbackServer(PORT);
});

pyProcess.on('exit', (code) => {
  if (code !== 0 && code !== null && !fallbackServerRunning) {
    console.warn(`\n[Launcher] Python process terminated (code ${code}). Activating Node.js fallback server...\n`);
    startNodeFallbackServer(PORT);
  }
});

// Built-in Node.js Fallback Server (serves frontend and static demo API)
function startNodeFallbackServer(port) {
  if (fallbackServerRunning) return;
  fallbackServerRunning = true;

  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = parsedUrl.pathname;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health endpoint
    if (pathname === '/api/v1/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: { status: 'healthy', app_name: 'HomeResource (Node)', version: '1.0.0' },
        meta: { model_version: '1.0' },
        error: null
      }));
      return;
    }

    // Simulation Presets
    if (pathname === '/api/v1/simulation/presets') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: [
          {
            id: 'water_reduction_15',
            name: '15% Water Conservation & Pump Relief',
            description: 'Reduces domestic flow via low-flow aerators, reducing well/booster pump run time.',
            target_resource: 'water',
            change_percentage: -15.0,
            water_pump_model: true,
            pump_energy_intensity: 0.0012
          },
          {
            id: 'appliance_efficiency_20',
            name: '20% Electrical Load Optimization',
            description: 'Simulates adjusting HVAC cooling setpoints by 1.5°C.',
            target_resource: 'electricity',
            change_percentage: -20.0,
            water_pump_model: false
          },
          {
            id: 'food_waste_curtailment',
            name: 'Food Waste Reduction & Meal Planning',
            description: 'Simulates 25% reduction in spoiled pantry inventory.',
            target_resource: 'food',
            change_percentage: -25.0,
            water_pump_model: false
          }
        ]
      }));
    // Auth Login endpoint
    if (pathname === '/api/v1/auth/login') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: { access_token: 'demo-token', token_type: 'bearer', user_id: 1, email: 'demo@homeresource.local', household_id: 1 },
        meta: { model_version: '1.0' },
        error: null
      }));
      return;
    }

    // Dashboard Telemetry
    if (pathname.includes('/resources/') && pathname.endsWith('/dashboard')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: {
          household_name: 'Emerald Haven Eco-Home',
          currency: 'USD',
          summaries: [
            { resource_type: 'electricity', total_amount: 72.8, unit: 'kWh', total_cost: 13.1, entry_count: 14, daily_average: 5.2, is_demo: true },
            { resource_type: 'water', total_amount: 4890, unit: 'L', total_cost: 19.56, entry_count: 14, daily_average: 349.3, is_demo: true },
            { resource_type: 'food', total_amount: 30.5, unit: 'kg', total_cost: 88.2, entry_count: 14, daily_average: 2.18, is_demo: true },
            { resource_type: 'money', total_amount: 236.4, unit: 'USD', total_cost: 236.4, entry_count: 14, daily_average: 16.88, is_demo: true },
            { resource_type: 'time', total_amount: 21.6, unit: 'hrs', total_cost: 0, entry_count: 14, daily_average: 1.54, is_demo: true }
          ],
          recent_entries: [
            { id: 14, household_id: 1, resource_type: 'electricity', amount: 8.5, unit: 'kWh', cost: 1.53, activity_tag: 'hvac', recorded_at: new Date().toISOString(), notes: '[DEMO DATA] Daily aggregate meter log', is_demo: true },
            { id: 13, household_id: 1, resource_type: 'water', amount: 540, unit: 'L', cost: 2.16, activity_tag: 'irrigation', recorded_at: new Date().toISOString(), notes: '[DEMO DATA] Smart flow sensor log', is_demo: true },
            { id: 12, household_id: 1, resource_type: 'time', amount: 2.8, unit: 'hrs', cost: 0, activity_tag: 'water_pump', recorded_at: new Date().toISOString(), notes: '[DEMO DATA] Booster pump runtime', is_demo: true }
          ]
        },
        meta: { model_version: '1.0' },
        error: null
      }));
      return;
    }

    // Anomalies
    if (pathname.includes('/anomalies/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: [
          {
            entry_id: 14,
            resource_type: 'electricity',
            recorded_at: new Date().toISOString(),
            value: 8.5,
            unit: 'kWh',
            baseline_mean: 5.0,
            baseline_std: 0.8,
            z_score: 4.38,
            severity: 'severe',
            explanation: 'Observed 8.5 kWh is 4.38 standard deviations above historical mean (5.0 kWh). Deviation flags an unusual spike for human inspection.',
            is_anomaly: true
          }
        ],
        meta: { model_version: '1.0' },
        error: null
      }));
      return;
    }

    // Relationships
    if (pathname.includes('/relationships')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: {
          nodes: [
            { id: 'water', label: 'Water Consumption', resource_type: 'water', current_value: 4890, unit: 'L', color: '#2DD4BF' },
            { id: 'pump_runtime', label: 'Well / Booster Pump', resource_type: 'time', current_value: 21.6, unit: 'hrs', color: '#38BDF8' },
            { id: 'electricity', label: 'Electricity Consumption', resource_type: 'electricity', current_value: 72.8, unit: 'kWh', color: '#FBBF24' },
            { id: 'utility_bill', label: 'Utility Expenditure', resource_type: 'money', current_value: 236.4, unit: 'USD', color: '#34D399' },
            { id: 'food', label: 'Food & Kitchen Resources', resource_type: 'food', current_value: 30.5, unit: 'kg', color: '#FB923C' }
          ],
          edges: [
            { source: 'water', target: 'pump_runtime', relationship_type: 'operational', correlation_coefficient: 0.78, observation_count: 14, description: 'Increased water consumption correlates with pump run duration.', is_causal: false },
            { source: 'pump_runtime', target: 'electricity', relationship_type: 'electrical_load', correlation_coefficient: 0.84, observation_count: 14, description: 'Pump motor runtime exerts measurable power demand on household circuit.', is_causal: true },
            { source: 'electricity', target: 'utility_bill', relationship_type: 'financial_tariff', correlation_coefficient: 0.92, observation_count: 14, description: 'Electricity consumed maps deterministically to monthly tariff calculation.', is_causal: true }
          ],
          correlation_safeguard_note: 'Statistical correlation does not imply causation. Associations require physical system validation.'
        },
        meta: { model_version: '1.0' },
        error: null
      }));
      return;
    }

    // Friendly URL routing
    if (pathname === '/' || pathname === '/index') pathname = '/index.html';
    else if (pathname === '/dashboard') pathname = '/dashboard.html';
    else if (pathname === '/simulator') pathname = '/simulator.html';
    else if (pathname === '/settings') pathname = '/settings.html';

    const filePath = path.join(__dirname, 'frontend', pathname);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.listen(port, () => {
    console.log(`[Node Runner] Server running at http://localhost:${port}`);
    console.log(`[Node Runner] Open in browser: http://localhost:${port}\n`);
  });
}
