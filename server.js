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
