// Interactive Photorealistic 3D Eco-Smart Home Component
// Provides full 360° drag rotation, smooth zooming (mouse wheel & touch), room focus, animated energy flow particles, and day/night simulation.

export class SmartHome3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Container #${containerId} not found.`);
      return;
    }

    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    
    // 3D Perspective Rotation & Zoom State
    this.rotationY = 0;      // Yaw (horizontal 360° spin)
    this.rotationX = 0;      // Pitch (vertical tilt)
    this.targetRotY = 0;
    this.targetRotX = 0;
    this.zoom = 1.0;         // Zoom scale (0.85x to 2.8x)
    this.targetZoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.targetPanX = 0;
    this.targetPanY = 0;

    this.autoRotate = true;
    this.autoRotateSpeed = 0.35;
    this.isDayMode = true;
    this.activeZone = 'overview';

    this.init();
  }

  init() {
    this.container.innerHTML = '';

    // Create 3D Viewport Structure
    this.viewport = document.createElement('div');
    this.viewport.className = 'iso-3d-viewport';

    // 3D Scene Wrapper (handles rotateX, rotateY, and zoom scaling)
    this.sceneWrapper = document.createElement('div');
    this.sceneWrapper.className = 'iso-3d-scene';

    // Realistic Architectural Villa Layer (Original Photorealistic Render)
    this.houseImage = document.createElement('img');
    this.houseImage.src = '/assets/images/smart_home_iso.jpg';
    this.houseImage.alt = 'Realist Home Architectural 3D Structure';
    this.houseImage.className = 'iso-3d-house-render';
    this.sceneWrapper.appendChild(this.houseImage);

    // Night Mode Lighting Glow Overlay
    this.nightOverlay = document.createElement('div');
    this.nightOverlay.className = 'iso-night-lighting-overlay';
    this.sceneWrapper.appendChild(this.nightOverlay);

    // Animated SVG Energy & Water Particle Conduits
    this.setupEnergyFlowOverlays();

    // 3D Hotspot Beacons Mount
    this.setupHotspots();

    this.viewport.appendChild(this.sceneWrapper);
    this.container.appendChild(this.viewport);

    // Attach Mouse & Touch Listeners for Orbit & Zoom
    this.setupInteractions();

    // Start Smooth Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupEnergyFlowOverlays() {
    // High-tech animated particle flow streams directly mapped to architectural features
    const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgOverlay.setAttribute('class', 'iso-energy-flow-svg');
    svgOverlay.setAttribute('viewBox', '0 0 1000 800');
    svgOverlay.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    svgOverlay.innerHTML = `
      <defs>
        <!-- Solar Energy Flow Gradient -->
        <linearGradient id="solarFlowGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#FBBF24" stop-opacity="0.3"/>
        </linearGradient>

        <!-- Water Conduit Flow Gradient -->
        <linearGradient id="waterFlowGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.3"/>
        </linearGradient>

        <!-- Filter for Glowing Energy -->
        <filter id="energyGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- 1. Rooftop Solar Panel Energy Glow Paths -->
      <polygon points="260,250 490,105 600,165 370,320" class="solar-active-sheen" />

      <!-- 2. Solar to Battery Conduit Line -->
      <path d="M 440,240 L 685,380 L 740,580 L 740,640" class="energy-conduit-line" />
      <circle r="4.5" class="energy-flow-particle solar-p1">
        <animateMotion path="M 440,240 L 685,380 L 740,580 L 740,640" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle r="4.5" class="energy-flow-particle solar-p2">
        <animateMotion path="M 440,240 L 685,380 L 740,580 L 740,640" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
      </circle>
      <circle r="4.5" class="energy-flow-particle solar-p3">
        <animateMotion path="M 440,240 L 685,380 L 740,580 L 740,640" dur="2.4s" begin="1.6s" repeatCount="indefinite" />
      </circle>

      <!-- 3. Subterranean Water Well to Kitchen Conduit -->
      <path d="M 640,750 L 590,720 L 520,680 L 460,620" class="water-conduit-line" />
      <circle r="4" class="water-flow-particle water-p1">
        <animateMotion path="M 640,750 L 590,720 L 520,680 L 460,620" dur="2.0s" repeatCount="indefinite" />
      </circle>
      <circle r="4" class="water-flow-particle water-p2">
        <animateMotion path="M 640,750 L 590,720 L 520,680 L 460,620" dur="2.0s" begin="1.0s" repeatCount="indefinite" />
      </circle>
    `;

    this.sceneWrapper.appendChild(svgOverlay);
  }

  setupHotspots() {
    this.hotspotDefs = [
      {
        id: 'solar',
        title: 'Rooftop Solar Array',
        subtitle: 'Peak 3.8 kW • 12 Solar Panels Generating Free Energy',
        x: '38%',
        y: '22%',
        zoom: 1.85,
        panX: 120,
        panY: 180,
        rotY: -6
      },
      {
        id: 'bedroom',
        title: 'Upper Floor Bedroom',
        subtitle: 'Comfort Temperature 22°C • Smart Shading Active',
        x: '62%',
        y: '42%',
        zoom: 1.9,
        panX: -120,
        panY: 60,
        rotY: 8
      },
      {
        id: 'living',
        title: 'Open Living Room',
        subtitle: 'Cozy 24°C • Fresh Air (CO₂ 520) • Current Draw: 1.3 kW',
        x: '52%',
        y: '65%',
        zoom: 1.95,
        panX: -40,
        panY: -110,
        rotY: 4
      },
      {
        id: 'battery',
        title: 'Eco Home Battery',
        subtitle: '82% Full (11.2 kWh Reserve) • Powers your home at night',
        x: '74%',
        y: '60%',
        zoom: 2.1,
        panX: -260,
        panY: -70,
        rotY: 14
      },
      {
        id: 'water',
        title: 'Ground Water Well & Pump',
        subtitle: '42 Liters Used Today • Connected Water Booster Pump',
        x: '58%',
        y: '82%',
        zoom: 1.85,
        panX: -100,
        panY: -220,
        rotY: -4
      }
    ];

    this.hotspotDefs.forEach(spot => {
      const beacon = document.createElement('div');
      beacon.className = 'hotspot-beacon';
      beacon.dataset.zone = spot.id;
      beacon.style.left = spot.x;
      beacon.style.top = spot.y;

      const pulseColor = spot.id === 'solar' ? 'solar' : (spot.id === 'water' ? 'amber' : 'cyan');
      beacon.innerHTML = `
        <div class="beacon-pulse ${pulseColor}"></div>
        <div class="beacon-dot ${pulseColor}"></div>
        <div class="beacon-tooltip">
          <strong>${spot.title}</strong>
          <span>${spot.subtitle}</span>
        </div>
      `;

      beacon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.focusOnZone(spot.id);
      });

      this.sceneWrapper.appendChild(beacon);
    });
  }

  setupInteractions() {
    const el = this.container;

    // Mouse Drag to Rotate & Tilt 3D
    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
      this.autoRotate = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.prevMouse = { x: e.clientX, y: e.clientY };

      // Horizontal 360° spin & Vertical pitch
      this.targetRotY += dx * 0.45;
      this.targetRotX = Math.max(-18, Math.min(22, this.targetRotX - dy * 0.35));

      // Pan when zoomed in
      if (this.zoom > 1.2) {
        this.targetPanX += dx * 0.6;
        this.targetPanY += dy * 0.6;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Mouse Wheel Zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = -e.deltaY * 0.002;
      this.targetZoom = Math.max(0.9, Math.min(2.8, this.targetZoom + zoomDelta));
      if (this.targetZoom <= 1.05) {
        this.targetPanX = 0;
        this.targetPanY = 0;
      }
    }, { passive: false });

    // Touch Support for Phones / Tablets
    let initialTouchDist = 0;
    el.addEventListener('touchstart', (e) => {
      this.autoRotate = false;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    el.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - this.prevMouse.x;
        const dy = e.touches[0].clientY - this.prevMouse.y;
        this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        this.targetRotY += dx * 0.45;
        this.targetRotX = Math.max(-18, Math.min(22, this.targetRotX - dy * 0.35));
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = dist - initialTouchDist;
        initialTouchDist = dist;
        this.targetZoom = Math.max(0.9, Math.min(2.8, this.targetZoom + diff * 0.008));
      }
    }, { passive: false });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  focusOnZone(zoneId) {
    const spot = this.hotspotDefs.find(h => h.id === zoneId);
    if (!spot) return;

    this.activeZone = zoneId;
    this.autoRotate = false;
    this.targetZoom = spot.zoom;
    this.targetPanX = spot.panX;
    this.targetPanY = spot.panY;
    this.targetRotX = 4;
    this.targetRotY = spot.rotY;

    // Show Details in HUD
    const hud = document.getElementById('hotspot-hud');
    const hudZoneName = document.getElementById('hud-zone-name');
    const hudContent = document.getElementById('hud-content');
    if (hud && hudZoneName && hudContent) {
      hudZoneName.textContent = spot.title;
      hudContent.textContent = spot.subtitle;
      hud.classList.remove('hidden');
    }
  }

  resetCamera() {
    this.activeZone = 'overview';
    this.targetZoom = 1.0;
    this.targetPanX = 0;
    this.targetPanY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;
    this.autoRotate = true;

    const hud = document.getElementById('hotspot-hud');
    if (hud) hud.classList.add('hidden');
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  toggleDayNight() {
    this.isDayMode = !this.isDayMode;
    if (this.nightOverlay) {
      this.nightOverlay.classList.toggle('active', !this.isDayMode);
    }
    return this.isDayMode;
  }

  zoomIn() {
    this.targetZoom = Math.min(2.8, this.targetZoom + 0.35);
  }

  zoomOut() {
    this.targetZoom = Math.max(0.9, this.targetZoom - 0.35);
    if (this.targetZoom <= 1.05) {
      this.targetPanX = 0;
      this.targetPanY = 0;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Continuous smooth turntable motion when auto-rotating
    if (this.autoRotate && !this.isDragging) {
      // Gentle sine oscillation for natural architectural presentation
      this.targetRotY += (Math.sin(Date.now() * 0.0008) * 0.15);
      this.targetRotX = Math.sin(Date.now() * 0.0005) * 3;
    }

    // Smooth Interpolation
    this.rotationY += (this.targetRotY - this.rotationY) * 0.08;
    this.rotationX += (this.targetRotX - this.rotationX) * 0.08;
    this.zoom += (this.targetZoom - this.zoom) * 0.08;
    this.panX += (this.targetPanX - this.panX) * 0.08;
    this.panY += (this.targetPanY - this.panY) * 0.08;

    // Apply 3D Matrix Perspective Transformation
    if (this.sceneWrapper) {
      this.sceneWrapper.style.transform = `
        perspective(1200px)
        translate3d(${this.panX.toFixed(1)}px, ${this.panY.toFixed(1)}px, 0)
        scale(${this.zoom.toFixed(3)})
        rotateX(${this.rotationX.toFixed(2)}deg)
        rotateY(${this.rotationY.toFixed(2)}deg)
      `;
    }
  }
}
