# HomeResource — Household Resource Intelligence Platform

[![CI](https://github.com/username/HomeResource/actions/workflows/ci.yml/badge.svg)](https://github.com/username/HomeResource/actions)
[![Python](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style: Clean](https://img.shields.io/badge/architecture-modular-brightgreen.svg)]()

> **HomeResource** is a secure, full-stack household resource intelligence and simulation platform that models **electricity, water, food, money, and time** as an interconnected system.

---

## 🌟 Overview & Core Principles

Unlike conventional static dashboards with disconnected metrics, **HomeResource** treats household metabolism as a coupled thermodynamic and economic system:

1. **Interconnected Subsystems**: Water flow demand drives well/booster pump motor runtime, cascading directly into kilowatt-hour electrical draw and municipal tariffs.
2. **Mathematically Grounded Intelligence**: Never fabricates savings or relies on black-box guesswork. Statistical deviations are detected using standardized z-scores ($z = \frac{x - \mu}{\sigma}$) against rolling empirical baselines.
3. **Correlation vs. Causation Safeguards**: Statistically correlated telemetry (e.g. food refrigeration vs. electric peak) is clearly separated from verified physical causal links.
4. **Transparent What-If Simulation**: Model hypotheticals (e.g., *"What happens if water use drops 15%?"*) with explicit calculation steps and 80% sensitivity uncertainty intervals (minimum, expected, maximum).
5. **Cinematic Web Experience**: A signature 3-stage visual narrative (*"The Living Resource System"*) transitioning from a falling water droplet to an interactive 3D Three.js particle network, built in a dark emerald (`#0B1412`, `#173D32`) and warm amber (`#D9A85B`) palette.

---

## 🏛️ System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │           HTML5 / Vanilla ES Modules         │
                       │     Three.js 3D Network · GSAP · Chart.js    │
                       └──────────────────────┬───────────────────────┘
                                              │ REST (JSON + JWT)
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │                 FastAPI REST API             │
                       │   Auth · Validation · Rate Limits · Security │
                       └──────────────┬───────────────┬───────────────┘
                                      │               │
                     ┌────────────────┴────┐     ┌────┴────────────────┐
                     │  Intelligence Layer │     │  Simulation Engine  │
                     │  Baselines · Anomaly│     │  Cascading · Bounds │
                     └────────────────┬────┘     └────┬────────────────┘
                                      │               │
                                      ▼               ▼
                       ┌──────────────────────────────────────────────┐
                       │          SQLAlchemy ORM Data Layer           │
                       │      SQLite (Dev) / PostgreSQL (Prod)        │
                       └──────────────────────────────────────────────┘
```

---

## 📁 Repository Directory Structure

```
HomeResource/
├── frontend/                     # Modern ES Modules Client
│   ├── index.html                # Cinematic landing page with 3-scene sequence
│   ├── dashboard.html            # 5-resource metrics, curves, anomalies, relationship graph
│   ├── simulator.html            # What-if simulation playground with uncertainty bounds
│   ├── settings.html             # Tariffs, data export (JSON/CSV), and GDPR telemetry wipe
│   ├── css/
│   │   ├── tokens.css            # Dark emerald, warm amber design tokens
│   │   ├── base.css              # Typography & glassmorphism utilities
│   │   ├── layout.css            # Grid layouts, responsive navigation & footer
│   │   ├── components.css        # Stat cards, buttons, modals, sliders, toasts
│   │   └── pages/                # Page-specific styling (landing, dashboard, simulator, settings)
│   └── js/
│       ├── main.js               # Entrance module
│       ├── api/                  # API client with JWT header injection & endpoints
│       ├── components/           # Navbar, modals, toast alerts
│       ├── pages/                # Page controllers
│       ├── charts/               # Chart.js 14-day history and distribution graphs
│       └── animations/           # Three.js 3D network, droplet canvas, GSAP scroll triggers
├── backend/
│   └── app/
│       ├── main.py               # FastAPI initialization, CORS, static frontend mount
│       ├── core/                 # Config (Pydantic settings), security (bcrypt, JWT), logging
│       ├── api/                  # Dependencies (deps.py) & route modules
│       ├── schemas/              # Pydantic request/response models with unit validation
│       ├── models/               # SQLAlchemy models (User, Household, ResourceEntry, Scenario)
│       ├── repositories/         # Database access helpers with household isolation
│       ├── services/             # Business logic (Auth, Resource, Export/GDPR)
│       ├── intelligence/         # Baselines, z-score anomalies, correlation graphs, explanations
│       ├── simulation/           # Cascading pump simulation, presets, uncertainty bounds
│       └── db/                   # Engine session & init_db.py demo seed
├── tests/
│   ├── conftest.py               # Test database fixtures & authorized test clients
│   ├── unit/                     # Mathematical unit tests (baseline, anomaly, simulation)
│   ├── api/                      # REST endpoint integration tests
│   └── security/                 # Strict household-level isolation & authorization tests
├── infrastructure/
│   ├── Dockerfile                # Multi-stage production container with non-root user
│   ├── docker-compose.yml        # Multi-service stack (App, PostgreSQL 16, Nginx)
│   └── nginx.conf                # Reverse proxy with security headers (CSP, HSTS)
├── .github/workflows/ci.yml      # Automated GitHub Actions test & hygiene pipeline
├── .env.example                  # Environment variable reference template
├── pyproject.toml                # Project metadata and pytest configuration
├── requirements.txt              # Production and testing dependencies
├── Makefile                      # Standard CLI commands
└── run.bat / run.sh              # Single-click launchers for Windows and Linux/macOS
```

---

## ⚡ Quickstart

### Prerequisites
- Python 3.10+
- (Optional) Docker & Docker Compose

### 1. Clone & Setup Environment

```bash
git clone https://github.com/your-username/HomeResource.git
cd HomeResource

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example configuration:
```bash
cp .env.example .env
```

### 3. Launch Application

**On Windows:**
Simply double-click `run.bat` or run:
```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

**On Linux/macOS:**
```bash
./run.sh
```

Navigate to **[http://localhost:8000](http://localhost:8000)** in your browser!

Default Seed Account:
- **Email**: `demo@homeresource.local`
- **Password**: `Password123!`
- **Household**: `Emerald Haven Eco-Home` (preloaded with 14 days of realistic labeled telemetry)

---

## 🧪 Testing Suite & Verification

HomeResource features an automated test suite across unit, API, and security layers:

```bash
pytest -v tests/
```

Test Coverage Highlights:
- **`test_anomaly.py`**: Verifies exact mathematical standardized deviations ($z = \frac{8.5 - 5.0}{0.8} = 4.375$).
- **`test_simulation.py`**: Tests cascading hydrodynamic pump electricity reduction and uncertainty intervals.
- **`test_authorization.py`**: Security isolation test verifying that unauthorized attempts to access or wipe another household's data are strictly rejected (`403 Forbidden`).

---

## 🚀 How to Deploy to GitHub

To push this project to your GitHub account:

1. **Initialize Git in the project root**:
   ```bash
   cd C:\Users\asus\Desktop\HomeResource
   git init
   git add .
   git commit -m "feat: complete HomeResource household intelligence platform"
   ```

2. **Create a new repository on GitHub** (e.g. `HomeResource`)

3. **Link remote and push**:
   ```bash
   git remote add origin https://github.com/<your-github-username>/HomeResource.git
   git branch -M main
   git push -u origin main
   ```

4. **GitHub Actions CI** will automatically trigger, installing dependencies and running the full pytest suite.

---

## 🐳 Production Deployment with Docker & Compose

For a multi-container deployment with PostgreSQL and Nginx reverse proxy:

```bash
cd infrastructure
docker compose up -d --build
```

Access the production site at `http://localhost`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
