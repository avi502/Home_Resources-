// Realist Home — High-Detail 3D Architectural Eco-Home with Houses3K Modular Design
// Features realistic suburban background environment: Sky dome, asphalt road, sidewalk,
// flagstone walkway, 3D trees, hedges, wooden privacy fence, landscape lighting,
// solar/water energy particle streams, glowing battery indicators, and day/night simulation.

export class SmartHome3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Container #${containerId} not found.`);
      return;
    }

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;

    // Camera Spherical Orbit Parameters
    this.orbit = {
      radius: 15.5,
      targetRadius: 15.5,
      minRadius: 4.5,
      maxRadius: 28.0,
      theta: 0.82,           // Horizontal azimuthal angle
      targetTheta: 0.82,
      phi: 1.12,             // Vertical polar angle (elevation)
      targetPhi: 1.12,
      minPhi: 0.20,
      maxPhi: Math.PI / 2 - 0.05,
      center: new THREE.Vector3(0, 1.2, 0),
      targetCenter: new THREE.Vector3(0, 1.2, 0),
      damping: 0.08
    };

    // Interaction State
    this.isDragging = false;
    this.prevPointer = { x: 0, y: 0 };
    this.autoRotate = true;
    this.autoRotateSpeed = 0.003;
    this.isDayMode = true;
    this.currentZone = 'overview';

    // Lighting References for Day/Night Lerp
    this.lights = {
      sun: null,
      hemi: null,
      interiorSpot: null,
      bedroomLight: null,
      batteryGlow: null,
      streetLamp: null,
      gardenLights: []
    };

    // Animated & Environment References
    this.solarParticles = [];
    this.waterParticles = [];
    this.batteryLedMaterials = [];
    this.hotspots = [];
    this.foliageClusters = [];
    this.starsMesh = null;
    this.skyDomeMesh = null;
    this.moonMesh = null;
    this.sunDiscMesh = null;

    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // 1. Scene & Atmosphere Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Daylight sky default
    this.scene.fog = new THREE.FogExp2(0xcfe6f4, 0.016);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 150);
    this.updateCameraPosition(true);

    // 3. WebGL Renderer with High-End Tonemapping and Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.borderRadius = '16px';
    this.renderer.domElement.style.outline = 'none';

    this.container.appendChild(this.renderer.domElement);

    // 4. Procedural Photorealistic Canvas Textures (Houses3K + Environment)
    this.textures = this.createProceduralTextures();

    // 5. Lighting Setup
    this.setupLighting();

    // 6. Build Realistic Background Environment (Sky, Road, Sidewalk, Trees, Lawn)
    this.buildRealisticEnvironment();

    // 7. Build the Houses3K Modular Architectural Eco-Home Model
    this.houseGroup = new THREE.Group();
    this.buildHouseModel();
    this.scene.add(this.houseGroup);

    // 8. Energy & Water Flow Animated Particle Conduits
    this.setupEnergyFlowParticles();

    // 9. 3D Interactive Hotspot Beacons
    this.setup3DHotspots();

    // 10. Event Listeners (Drag Orbit, Zoom, Resize, Raycasting)
    this.setupEventListeners();

    // 11. Start Animation Loop
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  // ==========================================
  // PROCEDURAL PHOTOREALISTIC TEXTURE GENERATION
  // ==========================================
  createProceduralTextures() {
    // 1. Natural Oak Hardwood Floor Texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d');
    fctx.fillStyle = '#caa989';
    fctx.fillRect(0, 0, 512, 512);

    const plankH = 32;
    const plankW = 128;
    const woodTones = ['#c8a584', '#d2b192', '#bf9c79', '#cead8e', '#b6926f', '#dbbca0'];

    for (let y = 0; y < 512; y += plankH) {
      const offsetX = ((y / plankH) % 2) * (plankW / 2);
      for (let x = -plankW; x < 512 + plankW; x += plankW) {
        fctx.fillStyle = woodTones[Math.floor(Math.random() * woodTones.length)];
        fctx.fillRect(x + offsetX, y, plankW - 1.5, plankH - 1.5);

        // Fine grain
        fctx.strokeStyle = 'rgba(100, 70, 45, 0.12)';
        fctx.lineWidth = 1;
        for (let g = 0; g < 4; g++) {
          const gy = y + 4 + g * 7 + (Math.random() * 2);
          fctx.beginPath();
          fctx.moveTo(x + offsetX, gy);
          fctx.bezierCurveTo(
            x + offsetX + 40, gy + (Math.random() * 2 - 1),
            x + offsetX + 80, gy + (Math.random() * 2 - 1),
            x + offsetX + plankW - 2, gy
          );
          fctx.stroke();
        }

        // Seams
        fctx.fillStyle = 'rgba(70, 50, 35, 0.45)';
        fctx.fillRect(x + offsetX + plankW - 1.5, y, 1.5, plankH);
        fctx.fillRect(x + offsetX, y + plankH - 1.5, plankW, 1.5);
      }
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(2.5, 2.5);

    // 2. High-Efficiency Solar Panel Texture
    const solarCanvas = document.createElement('canvas');
    solarCanvas.width = 512;
    solarCanvas.height = 512;
    const sctx = solarCanvas.getContext('2d');

    const grad = sctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0c1b33');
    grad.addColorStop(0.5, '#071224');
    grad.addColorStop(1, '#050c18');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 512, 512);

    const cols = 6;
    const rows = 10;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * cellW;
        const cy = r * cellH;

        sctx.fillStyle = '#0f2444';
        sctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);

        sctx.strokeStyle = 'rgba(180, 215, 255, 0.22)';
        sctx.lineWidth = 1;
        for (let l = 6; l < cellH - 4; l += 8) {
          sctx.beginPath();
          sctx.moveTo(cx + 3, cy + l);
          sctx.lineTo(cx + cellW - 3, cy + l);
          sctx.stroke();
        }

        sctx.strokeStyle = 'rgba(230, 240, 255, 0.75)';
        sctx.lineWidth = 1.6;
        sctx.beginPath();
        sctx.moveTo(cx + cellW * 0.25, cy + 2);
        sctx.lineTo(cx + cellW * 0.25, cy + cellH - 2);
        sctx.moveTo(cx + cellW * 0.5, cy + 2);
        sctx.lineTo(cx + cellW * 0.5, cy + cellH - 2);
        sctx.moveTo(cx + cellW * 0.75, cy + 2);
        sctx.lineTo(cx + cellW * 0.75, cy + cellH - 2);
        sctx.stroke();

        sctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        sctx.lineWidth = 1.2;
        sctx.strokeRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
      }
    }
    const solarTex = new THREE.CanvasTexture(solarCanvas);

    // 3. Houses3K Stone Masonry Texture (Ashlar Stone Plinth)
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const stnCtx = stoneCanvas.getContext('2d');
    stnCtx.fillStyle = '#6b7280';
    stnCtx.fillRect(0, 0, 512, 512);

    const stoneH = 32;
    const stoneW = 64;
    const stoneColors = ['#857d76', '#9c9288', '#736b63', '#a89f94', '#665f57'];

    for (let sy = 0; sy < 512; sy += stoneH) {
      const off = ((sy / stoneH) % 2) * (stoneW / 2);
      for (let sx = -stoneW; sx < 512 + stoneW; sx += stoneW) {
        stnCtx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
        stnCtx.fillRect(sx + off + 2, sy + 2, stoneW - 4, stoneH - 4);

        // Mortar lines
        stnCtx.strokeStyle = '#47433e';
        stnCtx.lineWidth = 2.5;
        stnCtx.strokeRect(sx + off + 1, sy + 1, stoneW - 2, stoneH - 2);
      }
    }
    const stoneTex = new THREE.CanvasTexture(stoneCanvas);
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    stoneTex.repeat.set(3, 1.5);

    // 4. Houses3K Modern Vertical Wood Slat Siding Texture
    const woodSlatCanvas = document.createElement('canvas');
    woodSlatCanvas.width = 256;
    woodSlatCanvas.height = 256;
    const wsCtx = woodSlatCanvas.getContext('2d');
    wsCtx.fillStyle = '#8a5a36'; // Warm cedar
    wsCtx.fillRect(0, 0, 256, 256);

    const slatW = 16;
    for (let x = 0; x < 256; x += slatW) {
      wsCtx.fillStyle = (x % 32 === 0) ? '#96633b' : '#7c4f2e';
      wsCtx.fillRect(x, 0, slatW - 2, 256);
      wsCtx.fillStyle = '#422814'; // Dark groove
      wsCtx.fillRect(x + slatW - 2, 0, 2, 256);
    }
    const woodSlatTex = new THREE.CanvasTexture(woodSlatCanvas);
    woodSlatTex.wrapS = THREE.RepeatWrapping;
    woodSlatTex.wrapT = THREE.RepeatWrapping;
    woodSlatTex.repeat.set(2, 2);

    // 5. Stucco / Matte Wall Texture
    const stuccoCanvas = document.createElement('canvas');
    stuccoCanvas.width = 256;
    stuccoCanvas.height = 256;
    const stctx = stuccoCanvas.getContext('2d');
    stctx.fillStyle = '#ece8df';
    stctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      const nx = Math.random() * 256;
      const ny = Math.random() * 256;
      const alpha = Math.random() * 0.08;
      stctx.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha * 1.5})`;
      stctx.fillRect(nx, ny, 1.5, 1.5);
    }
    const stuccoTex = new THREE.CanvasTexture(stuccoCanvas);
    stuccoTex.wrapS = THREE.RepeatWrapping;
    stuccoTex.wrapT = THREE.RepeatWrapping;
    stuccoTex.repeat.set(3, 3);

    // 6. Asphalt Road Texture with White Dashes
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 512;
    roadCanvas.height = 512;
    const rctx = roadCanvas.getContext('2d');
    rctx.fillStyle = '#26292b'; // Dark tarmac
    rctx.fillRect(0, 0, 512, 512);

    // Asphalt speckles
    for (let i = 0; i < 15000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      rctx.fillStyle = Math.random() > 0.5 ? '#373b3e' : '#1c1e20';
      rctx.fillRect(rx, ry, 2, 2);
    }

    // Yellow road center divider dashes
    rctx.fillStyle = '#facc15';
    for (let dy = 20; dy < 512; dy += 80) {
      rctx.fillRect(250, dy, 12, 45);
    }

    // White outer road boundary lines
    rctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    rctx.fillRect(40, 0, 8, 512);
    rctx.fillRect(464, 0, 8, 512);
    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 4);

    // 7. Concrete Sidewalk & Curb Texture
    const sidewalkCanvas = document.createElement('canvas');
    sidewalkCanvas.width = 256;
    sidewalkCanvas.height = 256;
    const swCtx = sidewalkCanvas.getContext('2d');
    swCtx.fillStyle = '#b8bec5';
    swCtx.fillRect(0, 0, 256, 256);
    // Expansion joints
    swCtx.strokeStyle = '#8f959c';
    swCtx.lineWidth = 3;
    swCtx.strokeRect(0, 0, 256, 256);
    const sidewalkTex = new THREE.CanvasTexture(sidewalkCanvas);
    sidewalkTex.wrapS = THREE.RepeatWrapping;
    sidewalkTex.wrapT = THREE.RepeatWrapping;
    sidewalkTex.repeat.set(1, 6);

    // 8. Natural Flagstone Garden Walkway Texture
    const stoneWalkCanvas = document.createElement('canvas');
    stoneWalkCanvas.width = 256;
    stoneWalkCanvas.height = 256;
    const swkCtx = stoneWalkCanvas.getContext('2d');
    swkCtx.fillStyle = '#4c783c'; // Grass backdrop
    swkCtx.fillRect(0, 0, 256, 256);

    // Random slate stones
    const slates = ['#9ca3af', '#6b7280', '#d1d5db', '#78716c'];
    for (let i = 0; i < 18; i++) {
      const sx = Math.random() * 200 + 20;
      const sy = Math.random() * 200 + 20;
      const sr = Math.random() * 22 + 18;
      swkCtx.fillStyle = slates[i % slates.length];
      swkCtx.beginPath();
      swkCtx.arc(sx, sy, sr, 0, Math.PI * 2);
      swkCtx.fill();
    }
    const stoneWalkTex = new THREE.CanvasTexture(stoneWalkCanvas);
    stoneWalkTex.wrapS = THREE.RepeatWrapping;
    stoneWalkTex.wrapT = THREE.RepeatWrapping;
    stoneWalkTex.repeat.set(2, 3);

    // 9. Manicured Lawn Grass Texture
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 512;
    grassCanvas.height = 512;
    const gctx = grassCanvas.getContext('2d');
    gctx.fillStyle = '#456e36';
    gctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      gctx.fillStyle = Math.random() > 0.5 ? '#558743' : '#395c2c';
      gctx.fillRect(gx, gy, 2, 3);
    }
    const grassTex = new THREE.CanvasTexture(grassCanvas);
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(8, 8);

    // 10. Horizontal Cedar Wood Privacy Fence Texture
    const fenceCanvas = document.createElement('canvas');
    fenceCanvas.width = 256;
    fenceCanvas.height = 256;
    const fncCtx = fenceCanvas.getContext('2d');
    fncCtx.fillStyle = '#8d5b38';
    fncCtx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) {
      fncCtx.fillStyle = (y % 64 === 0) ? '#9c6640' : '#7f4f2e';
      fncCtx.fillRect(0, y, 256, 30);
      fncCtx.fillStyle = '#3f2512';
      fncCtx.fillRect(0, y + 30, 256, 2);
    }
    const fenceTex = new THREE.CanvasTexture(fenceCanvas);
    fenceTex.wrapS = THREE.RepeatWrapping;
    fenceTex.wrapT = THREE.RepeatWrapping;
    fenceTex.repeat.set(4, 1);

    // 11. Art, TV & Screens
    const artCanvas = document.createElement('canvas');
    artCanvas.width = 256;
    artCanvas.height = 256;
    const actx = artCanvas.getContext('2d');
    actx.fillStyle = '#f6f3ed';
    actx.fillRect(0, 0, 256, 256);
    actx.fillStyle = '#c86d51';
    actx.beginPath();
    actx.arc(128, 140, 65, Math.PI, 0, false);
    actx.lineTo(193, 210);
    actx.lineTo(63, 210);
    actx.closePath();
    actx.fill();
    actx.fillStyle = '#6b8168';
    actx.beginPath();
    actx.arc(128, 70, 32, 0, Math.PI * 2);
    actx.fill();
    const artTex = new THREE.CanvasTexture(artCanvas);

    const tvCanvas = document.createElement('canvas');
    tvCanvas.width = 512;
    tvCanvas.height = 288;
    const tvctx = tvCanvas.getContext('2d');
    tvctx.fillStyle = '#0b1320';
    tvctx.fillRect(0, 0, 512, 288);
    tvctx.fillStyle = '#2dd4bf';
    tvctx.font = 'bold 22px sans-serif';
    tvctx.fillText('Realist Home — Living Room Hub', 36, 52);
    tvctx.fillStyle = '#94a3b8';
    tvctx.font = '16px sans-serif';
    tvctx.fillText('Solar: 3.8 kW  •  Battery: 82%  •  Temp: 24°C', 36, 88);
    tvctx.strokeStyle = '#38bdf8';
    tvctx.lineWidth = 3;
    tvctx.beginPath();
    tvctx.moveTo(36, 190);
    tvctx.bezierCurveTo(150, 130, 250, 230, 370, 160);
    tvctx.lineTo(476, 180);
    tvctx.stroke();
    const tvTex = new THREE.CanvasTexture(tvCanvas);

    return {
      floorTex, solarTex, stoneTex, woodSlatTex, stuccoTex,
      roadTex, sidewalkTex, stoneWalkTex, grassTex, fenceTex,
      artTex, tvTex
    };
  }

  // ==========================================
  // REALISTIC LIGHTING SYSTEM
  // ==========================================
  setupLighting() {
    // 1. Directional Sun Light (Golden daylight with soft shadow mapping)
    this.lights.sun = new THREE.DirectionalLight(0xfff8ee, 1.4);
    this.lights.sun.position.set(-14.0, 22.0, 16.0);
    this.lights.sun.castShadow = true;
    this.lights.sun.shadow.mapSize.width = 2048;
    this.lights.sun.shadow.mapSize.height = 2048;
    this.lights.sun.shadow.camera.near = 1.0;
    this.lights.sun.shadow.camera.far = 65;
    this.lights.sun.shadow.camera.left = -22;
    this.lights.sun.shadow.camera.right = 22;
    this.lights.sun.shadow.camera.top = 22;
    this.lights.sun.shadow.camera.bottom = -22;
    this.lights.sun.shadow.bias = -0.0004;
    this.lights.sun.shadow.radius = 2.2;
    this.scene.add(this.lights.sun);

    // 2. Sky Hemisphere Light
    this.lights.hemi = new THREE.HemisphereLight(0xa5d8ff, 0x2b3825, 0.6);
    this.lights.hemi.position.set(0, 30, 0);
    this.scene.add(this.lights.hemi);

    // 3. Interior Living Room Ceiling Spot Light
    this.lights.interiorSpot = new THREE.PointLight(0xffaa40, 0.9, 9.0, 1.8);
    this.lights.interiorSpot.position.set(0.6, 2.7, 0.4);
    this.lights.interiorSpot.castShadow = true;
    this.lights.interiorSpot.shadow.bias = -0.001;
    this.scene.add(this.lights.interiorSpot);

    // 4. Bedroom Hallway Light
    this.lights.bedroomLight = new THREE.PointLight(0xffbe76, 0.65, 6.5, 2.0);
    this.lights.bedroomLight.position.set(2.4, 2.2, -1.2);
    this.scene.add(this.lights.bedroomLight);

    // 5. Exterior Battery Unit Status Glow Light
    this.lights.batteryGlow = new THREE.PointLight(0x2dd4bf, 0.5, 3.5, 2.0);
    this.lights.batteryGlow.position.set(-3.7, 1.4, 0.3);
    this.scene.add(this.lights.batteryGlow);

    // 6. Street Lamp Light (Warm pool on pavement)
    this.lights.streetLamp = new THREE.PointLight(0xffe8ba, 0.8, 14.0, 2.0);
    this.lights.streetLamp.position.set(-8.5, 4.4, 8.8);
    this.lights.streetLamp.castShadow = true;
    this.scene.add(this.lights.streetLamp);

    // 7. Garden Walkway Bollard Lights
    const bollardPositions = [
      new THREE.Vector3(4.2, 0.4, 3.2),
      new THREE.Vector3(1.2, 0.4, 5.2),
      new THREE.Vector3(-3.2, 0.4, 4.2)
    ];
    bollardPositions.forEach(pos => {
      const pl = new THREE.PointLight(0xfef08a, 0.35, 3.8, 2.0);
      pl.position.copy(pos);
      this.lights.gardenLights.push(pl);
      this.scene.add(pl);
    });
  }

  // ==========================================
  // REALISTIC BACKGROUND ENVIRONMENT
  // (Sky Dome, Starfield, Road, Sidewalk, Trees, Lawn, Fence)
  // ==========================================
  buildRealisticEnvironment() {
    const { roadTex, sidewalkTex, stoneWalkTex, grassTex, fenceTex } = this.textures;

    // --- 1. Atmospheric Sky Dome ---
    const skyGeo = new THREE.SphereGeometry(65, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      side: THREE.BackSide
    });
    this.skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDomeMesh);

    // --- 2. Twinkling Starfield for Night ---
    const starCount = 850;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 62.0;
      const sinPhi = Math.sin(phi);
      starPositions[i * 3] = r * sinPhi * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 5.0; // Keep in sky
      starPositions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.0 // Invisible by day
    });
    this.starsMesh = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsMesh);

    // --- 3. Glowing Sun & Moon Spheres ---
    const sunGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3a1 });
    this.sunDiscMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunDiscMesh.position.set(-28, 42, 32);
    this.scene.add(this.sunDiscMesh);

    const moonGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.0
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(28, 38, -25);
    this.scene.add(this.moonMesh);

    // --- 4. Main Suburban Terrain Lawn ---
    const terrainGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    const matTerrain = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.95,
      metalness: 0.02
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, matTerrain);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.set(0, -0.05, 0);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);

    // --- 5. Front Asphalt Access Road & Markings ---
    const roadGeo = new THREE.PlaneGeometry(80, 8.5);
    const matRoad = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.88,
      metalness: 0.1
    });
    const roadMesh = new THREE.Mesh(roadGeo, matRoad);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.rotation.z = Math.PI / 2; // Runs left to right along front
    roadMesh.position.set(0, 0.02, 11.2);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);

    // Concrete Street Curb
    const curbGeo = new THREE.BoxGeometry(80, 0.16, 0.35);
    const matCurb = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.75
    });
    const curbMesh = new THREE.Mesh(curbGeo, matCurb);
    curbMesh.position.set(0, 0.08, 6.8);
    curbMesh.castShadow = true;
    curbMesh.receiveShadow = true;
    this.scene.add(curbMesh);

    // Concrete Sidewalk
    const sidewalkGeo = new THREE.PlaneGeometry(80, 2.2);
    const matSidewalk = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.82
    });
    const sidewalkMesh = new THREE.Mesh(sidewalkGeo, matSidewalk);
    sidewalkMesh.rotation.x = -Math.PI / 2;
    sidewalkMesh.rotation.z = Math.PI / 2;
    sidewalkMesh.position.set(0, 0.11, 5.5);
    sidewalkMesh.receiveShadow = true;
    this.scene.add(sidewalkMesh);

    // Flagstone Garden Pathway (Connecting sidewalk to house entrance)
    const walkPathGeo = new THREE.PlaneGeometry(1.6, 5.2);
    const matWalkPath = new THREE.MeshStandardMaterial({
      map: stoneWalkTex,
      roughness: 0.85
    });
    const walkPathMesh = new THREE.Mesh(walkPathGeo, matWalkPath);
    walkPathMesh.rotation.x = -Math.PI / 2;
    walkPathMesh.position.set(0.6, 0.14, 3.2);
    walkPathMesh.receiveShadow = true;
    this.scene.add(walkPathMesh);

    // --- 6. Modern Horizontal Cedar Wood Privacy Fence ---
    const fenceMat = new THREE.MeshStandardMaterial({
      map: fenceTex,
      roughness: 0.78,
      metalness: 0.05
    });

    // Rear boundary fence
    const rearFenceGeo = new THREE.BoxGeometry(26, 2.4, 0.14);
    const rearFence = new THREE.Mesh(rearFenceGeo, fenceMat);
    rearFence.position.set(0, 1.2, -8.2);
    rearFence.castShadow = true;
    rearFence.receiveShadow = true;
    this.scene.add(rearFence);

    // Left boundary fence
    const leftFenceGeo = new THREE.BoxGeometry(0.14, 2.4, 13.5);
    const leftFence = new THREE.Mesh(leftFenceGeo, fenceMat);
    leftFence.position.set(-11.5, 1.2, -1.5);
    leftFence.castShadow = true;
    leftFence.receiveShadow = true;
    this.scene.add(leftFence);

    // Right boundary fence
    const rightFenceGeo = new THREE.BoxGeometry(0.14, 2.4, 13.5);
    const rightFence = new THREE.Mesh(rightFenceGeo, fenceMat);
    rightFence.position.set(11.5, 1.2, -1.5);
    rightFence.castShadow = true;
    rightFence.receiveShadow = true;
    this.scene.add(rightFence);

    // --- 7. Street Lamp Post ---
    const streetLampGroup = new THREE.Group();
    streetLampGroup.position.set(-8.5, 0, 8.8);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.35, metalness: 0.85 });
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 4.4, 12);
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.y = 2.2;
    poleMesh.castShadow = true;
    streetLampGroup.add(poleMesh);

    // Lamp Head & Luminaire
    const headGeo = new THREE.BoxGeometry(0.7, 0.22, 0.4);
    const headMesh = new THREE.Mesh(headGeo, poleMat);
    headMesh.position.set(0.3, 4.4, 0);
    streetLampGroup.add(headMesh);

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff0c2 });
    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), bulbMat);
    bulbMesh.position.set(0.45, 4.3, 0);
    streetLampGroup.add(bulbMesh);

    this.scene.add(streetLampGroup);

    // --- 8. 3D Trees & Landscaped Greenery ---
    this.create3DTrees();
  }

  // ==========================================
  // 3D TREES & NATURAL FOLIAGE (Houses3K Suburban Grounds)
  // ==========================================
  create3DTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728, // Natural bark
      roughness: 0.9,
      metalness: 0.05
    });

    const leafMat1 = new THREE.MeshStandardMaterial({
      color: 0x36632d, // Deep oak green
      roughness: 0.65,
      metalness: 0.08
    });

    const leafMat2 = new THREE.MeshStandardMaterial({
      color: 0x4d803c, // Golden-green birch
      roughness: 0.65,
      metalness: 0.08
    });

    const pineMat = new THREE.MeshStandardMaterial({
      color: 0x224a28, // Evergreen pine
      roughness: 0.8
    });

    // Deciduous Trees
    const treeCoords = [
      { x: -8.8, z: -5.2, scale: 1.25, mat: leafMat1 },
      { x: 8.5, z: -4.8, scale: 1.15, mat: leafMat2 },
      { x: 7.8, z: 3.5, scale: 1.0, mat: leafMat1 },
      { x: -9.2, z: 2.8, scale: 0.95, mat: leafMat2 }
    ];

    treeCoords.forEach(t => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(t.x, 0, t.z);
      treeGroup.scale.set(t.scale, t.scale, t.scale);

      // Tapered trunk
      const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 2.6, 10);
      const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
      trunkMesh.position.y = 1.3;
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      treeGroup.add(trunkMesh);

      // Layered Organic Canopy Clusters
      const canopyOffsets = [
        [0, 2.8, 0, 1.25],
        [-0.45, 3.2, 0.35, 0.95],
        [0.45, 3.3, -0.3, 0.92],
        [0, 3.8, 0, 0.88]
      ];

      canopyOffsets.forEach(([cx, cy, cz, cr]) => {
        const cGeo = new THREE.DodecahedronGeometry(cr, 1);
        const cMesh = new THREE.Mesh(cGeo, t.mat);
        cMesh.position.set(cx, cy, cz);
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        this.foliageClusters.push(cMesh);
        treeGroup.add(cMesh);
      });

      this.scene.add(treeGroup);
    });

    // Tall Evergreen Pines framing the back fence
    const pineCoords = [
      { x: -5.2, z: -7.5, h: 5.2 },
      { x: 4.8, z: -7.5, h: 4.8 },
      { x: 0, z: -7.8, h: 5.8 }
    ];

    pineCoords.forEach(p => {
      const pineGroup = new THREE.Group();
      pineGroup.position.set(p.x, 0, p.z);

      const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 1.4, 8), trunkMat);
      pTrunk.position.y = 0.7;
      pTrunk.castShadow = true;
      pineGroup.add(pTrunk);

      // 3 Conical Foliage Tiers
      for (let c = 0; c < 3; c++) {
        const coneGeo = new THREE.ConeGeometry(1.4 - c * 0.3, 1.8, 10);
        const coneMesh = new THREE.Mesh(coneGeo, pineMat);
        coneMesh.position.y = 1.6 + c * 1.1;
        coneMesh.castShadow = true;
        coneMesh.receiveShadow = true;
        pineGroup.add(coneMesh);
      }

      this.scene.add(pineGroup);
    });
  }

  // ==========================================
  // HOUSES3K MODULAR ARCHITECTURAL ECO-HOME
  // (Modular Ashlar Stone Plinth, Cedar Vertical Slat Panels,
  // Cutaway Living Room, Standing-Seam Roof, Rooftop Solar Array,
  // Smart Energy Battery, Rainwater Harvesting, Entrance Canopy)
  // ==========================================
  buildHouseModel() {
    const {
      floorTex, solarTex, stoneTex, woodSlatTex, stuccoTex,
      artTex, tvTex, grassTex
    } = this.textures;

    // --- PBR Materials ---
    const matStonePlinth = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.1
    });

    const matWoodSlatSiding = new THREE.MeshStandardMaterial({
      map: woodSlatTex,
      roughness: 0.65,
      metalness: 0.05
    });

    const matStuccoExterior = new THREE.MeshStandardMaterial({
      color: 0xe5e1d8,
      map: stuccoTex,
      roughness: 0.9,
      metalness: 0.05
    });

    const matStuccoInterior = new THREE.MeshStandardMaterial({
      color: 0xf5f2eb,
      roughness: 0.88,
      metalness: 0.02
    });

    const matWhiteTrim = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.35,
      metalness: 0.1
    });

    const matWoodFloor = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.38,
      metalness: 0.08
    });

    const matRoofStandingSeam = new THREE.MeshStandardMaterial({
      color: 0x7c858e, // Standing-seam architectural zinc grey
      roughness: 0.55,
      metalness: 0.35
    });

    const matSolarPanel = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.15,
      metalness: 0.65
    });

    const matMetalSilver = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.25,
      metalness: 0.85
    });

    const matDarkMetal = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.45,
      metalness: 0.8
    });

    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      reflectivity: 0.9
    });

    const matFabricSofa = new THREE.MeshStandardMaterial({
      color: 0xded5c5,
      roughness: 0.95,
      metalness: 0.0
    });

    const matWarmOak = new THREE.MeshStandardMaterial({
      color: 0xb58e65,
      roughness: 0.45,
      metalness: 0.05
    });

    // ----------------------------------------
    // 1. LOT LAWN BASE & HOUSES3K ASHLAR STONE PLINTH
    // ----------------------------------------
    const lawnGeo = new THREE.BoxGeometry(16.5, 0.4, 14.5);
    const matLawn = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.96,
      metalness: 0.0
    });
    const lawnMesh = new THREE.Mesh(lawnGeo, matLawn);
    lawnMesh.position.set(0, -0.2, -0.5);
    lawnMesh.receiveShadow = true;
    this.houseGroup.add(lawnMesh);

    // Houses3K Modular Ashlar Stone Plinth Foundation
    const plinthGeo = new THREE.BoxGeometry(8.6, 0.48, 6.6);
    const plinthMesh = new THREE.Mesh(plinthGeo, matStonePlinth);
    plinthMesh.position.set(-0.2, 0.14, -0.2);
    plinthMesh.receiveShadow = true;
    plinthMesh.castShadow = true;
    this.houseGroup.add(plinthMesh);

    // Front stone paver patio walkway
    const patioGeo = new THREE.BoxGeometry(5.2, 0.1, 1.8);
    const matPatio = new THREE.MeshStandardMaterial({
      color: 0xd6d3cb,
      roughness: 0.65,
      metalness: 0.05
    });
    const patioMesh = new THREE.Mesh(patioGeo, matPatio);
    patioMesh.position.set(0.6, 0.32, 2.5);
    patioMesh.receiveShadow = true;
    this.houseGroup.add(patioMesh);

    // Houses3K Entrance Timber Canopy & Columns
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(-2.8, 0.38, 2.4);

    const colGeo = new THREE.BoxGeometry(0.14, 2.6, 0.14);
    const colMat = matWarmOak;
    const col1 = new THREE.Mesh(colGeo, colMat);
    col1.position.set(-0.6, 1.3, 0.5);
    col1.castShadow = true;
    canopyGroup.add(col1);

    const col2 = new THREE.Mesh(colGeo, colMat);
    col2.position.set(0.6, 1.3, 0.5);
    col2.castShadow = true;
    canopyGroup.add(col2);

    // Slanted wooden portico roof
    const porticoGeo = new THREE.BoxGeometry(1.8, 0.12, 1.4);
    const porticoMesh = new THREE.Mesh(porticoGeo, matRoofStandingSeam);
    porticoMesh.position.set(0, 2.65, 0.15);
    porticoMesh.rotation.x = 0.14;
    porticoMesh.castShadow = true;
    canopyGroup.add(porticoMesh);

    this.houseGroup.add(canopyGroup);

    // ----------------------------------------
    // 2. LIVING ROOM INTERIOR HARDWOOD FLOOR
    // ----------------------------------------
    const interiorFloorGeo = new THREE.BoxGeometry(7.2, 0.08, 4.6);
    const interiorFloor = new THREE.Mesh(interiorFloorGeo, matWoodFloor);
    interiorFloor.position.set(-0.1, 0.38, 0.2);
    interiorFloor.receiveShadow = true;
    this.houseGroup.add(interiorFloor);

    // ----------------------------------------
    // 3. EXTERIOR WALLS & ARCHITECTURAL ARCHWAY
    // (Houses3K Wood Siding Accent + Stucco)
    // ----------------------------------------
    // Left Exterior Wall (With recessed window)
    const leftWallGeo = new THREE.BoxGeometry(0.42, 2.8, 4.8);
    const leftWall = new THREE.Mesh(leftWallGeo, matStuccoExterior);
    leftWall.position.set(-3.7, 1.78, 0.1);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.houseGroup.add(leftWall);

    // Houses3K Vertical Cedar Wood Louver Accent Wall Section
    const woodAccentWallGeo = new THREE.BoxGeometry(0.44, 2.8, 1.6);
    const woodAccentWall = new THREE.Mesh(woodAccentWallGeo, matWoodSlatSiding);
    woodAccentWall.position.set(-3.7, 1.78, -1.2);
    woodAccentWall.castShadow = true;
    this.houseGroup.add(woodAccentWall);

    // Window on Left Wall
    const winFrameOuter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 1.3), matWhiteTrim);
    winFrameOuter.position.set(-3.7, 1.9, 0.8);
    this.houseGroup.add(winFrameOuter);

    const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.15, 1.15), matGlass);
    winGlass.position.set(-3.7, 1.9, 0.8);
    this.houseGroup.add(winGlass);

    // Rear Interior Wall Left Section
    const rearWallLeftGeo = new THREE.BoxGeometry(3.6, 2.8, 0.38);
    const rearWallLeft = new THREE.Mesh(rearWallLeftGeo, matStuccoInterior);
    rearWallLeft.position.set(-1.8, 1.78, -2.1);
    rearWallLeft.castShadow = true;
    rearWallLeft.receiveShadow = true;
    this.houseGroup.add(rearWallLeft);

    // Rear Interior Wall Right Section
    const rearWallRightGeo = new THREE.BoxGeometry(2.2, 2.8, 0.38);
    const rearWallRight = new THREE.Mesh(rearWallRightGeo, matStuccoInterior);
    rearWallRight.position.set(2.4, 1.78, -2.1);
    rearWallRight.castShadow = true;
    rearWallRight.receiveShadow = true;
    this.houseGroup.add(rearWallRight);

    // Architectural Arched Doorway
    const archTopGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.38, 24, 1, false, 0, Math.PI);
    const archTopMesh = new THREE.Mesh(archTopGeo, matStuccoInterior);
    archTopMesh.rotation.z = Math.PI / 2;
    archTopMesh.rotation.y = Math.PI / 2;
    archTopMesh.position.set(0.65, 2.48, -2.1);
    this.houseGroup.add(archTopMesh);

    // Hallway / Bedroom Interior Depth Backdrop
    const hallBackdropGeo = new THREE.BoxGeometry(2.4, 2.8, 0.2);
    const matHallBackdrop = new THREE.MeshStandardMaterial({
      color: 0xdfdad0,
      roughness: 0.9
    });
    const hallBackdrop = new THREE.Mesh(hallBackdropGeo, matHallBackdrop);
    hallBackdrop.position.set(0.65, 1.78, -3.2);
    hallBackdrop.receiveShadow = true;
    this.houseGroup.add(hallBackdrop);

    // Right Exterior Wall (With Cedar Wood Louver Accent)
    const rightWallGeo = new THREE.BoxGeometry(0.42, 2.8, 4.8);
    const rightWall = new THREE.Mesh(rightWallGeo, matStuccoExterior);
    rightWall.position.set(3.5, 1.78, 0.1);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.houseGroup.add(rightWall);

    const rightAccentSlat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 2.8, 1.5), matWoodSlatSiding);
    rightAccentSlat.position.set(3.5, 1.78, 1.2);
    rightAccentSlat.castShadow = true;
    this.houseGroup.add(rightAccentSlat);

    // Triangular Gable Walls
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-2.4, 0);
    gableShape.lineTo(2.4, 0);
    gableShape.lineTo(0, 1.6);
    gableShape.closePath();
    const extrudeSettings = { depth: 0.38, bevelEnabled: false };
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, extrudeSettings);

    const leftGable = new THREE.Mesh(gableGeo, matStuccoExterior);
    leftGable.rotation.y = Math.PI / 2;
    leftGable.position.set(-3.51, 3.18, 0.1);
    leftGable.castShadow = true;
    this.houseGroup.add(leftGable);

    const rightGable = new THREE.Mesh(gableGeo, matStuccoExterior);
    rightGable.rotation.y = Math.PI / 2;
    rightGable.position.set(3.89, 3.18, 0.1);
    rightGable.castShadow = true;
    this.houseGroup.add(rightGable);

    // ----------------------------------------
    // 4. PITCHED GABLED ROOF & WHITE FASCIA TRIM
    // ----------------------------------------
    const roofAngle = Math.atan2(1.6, 2.4);

    const roofBackGeo = new THREE.BoxGeometry(7.9, 0.14, 2.85);
    const roofBack = new THREE.Mesh(roofBackGeo, matRoofStandingSeam);
    roofBack.position.set(-0.1, 3.95, -1.2);
    roofBack.rotation.x = roofAngle;
    roofBack.castShadow = true;
    roofBack.receiveShadow = true;
    this.houseGroup.add(roofBack);

    const roofFrontGeo = new THREE.BoxGeometry(7.9, 0.14, 2.85);
    const roofFront = new THREE.Mesh(roofFrontGeo, matRoofStandingSeam);
    roofFront.position.set(-0.1, 3.95, 1.4);
    roofFront.rotation.x = -roofAngle;
    roofFront.castShadow = true;
    roofFront.receiveShadow = true;
    this.houseGroup.add(roofFront);

    const ridgeFascia = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.22, 0.22), matWhiteTrim);
    ridgeFascia.position.set(-0.1, 4.78, 0.1);
    ridgeFascia.castShadow = true;
    this.houseGroup.add(ridgeFascia);

    const frontEavesTrim = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.18, 0.12), matWhiteTrim);
    frontEavesTrim.position.set(-0.1, 3.15, 2.68);
    frontEavesTrim.castShadow = true;
    this.houseGroup.add(frontEavesTrim);

    // Houses3K Modern Architectural Chimney / HVAC Flue Stack
    const chimneyGeo = new THREE.BoxGeometry(0.7, 2.2, 0.7);
    const chimneyMesh = new THREE.Mesh(chimneyGeo, matStonePlinth);
    chimneyMesh.position.set(2.4, 4.6, -1.1);
    chimneyMesh.castShadow = true;
    this.houseGroup.add(chimneyMesh);

    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.85), matDarkMetal);
    chimneyCap.position.set(2.4, 5.75, -1.1);
    this.houseGroup.add(chimneyCap);

    // ----------------------------------------
    // 5. ROOFTOP PHOTOVOLTAIC SOLAR ARRAY (4 MODULES)
    // ----------------------------------------
    const railMat = matDarkMetal;
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.05, 0.05), railMat);
    rail1.position.set(-0.1, 4.28, 0.85);
    rail1.rotation.x = -roofAngle;
    this.houseGroup.add(rail1);

    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.05, 0.05), railMat);
    rail2.position.set(-0.1, 3.65, 1.8);
    rail2.rotation.x = -roofAngle;
    this.houseGroup.add(rail2);

    const panelWidth = 1.45;
    const panelHeight = 2.15;
    const panelDepth = 0.05;
    const panelSpacing = 1.55;

    this.solarPanelMeshes = [];
    for (let i = 0; i < 4; i++) {
      const panelGroup = new THREE.Group();

      const frameGeo = new THREE.BoxGeometry(panelWidth, panelDepth, panelHeight);
      const frameMesh = new THREE.Mesh(frameGeo, matMetalSilver);
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      panelGroup.add(frameMesh);

      const faceGeo = new THREE.PlaneGeometry(panelWidth - 0.08, panelHeight - 0.08);
      const faceMesh = new THREE.Mesh(faceGeo, matSolarPanel);
      faceMesh.rotation.x = -Math.PI / 2;
      faceMesh.position.y = 0.03;
      panelGroup.add(faceMesh);

      const px = -2.32 + (i * panelSpacing);
      panelGroup.position.set(px, 3.98, 1.34);
      panelGroup.rotation.x = -roofAngle;

      this.solarPanelMeshes.push(panelGroup);
      this.houseGroup.add(panelGroup);
    }

    // Solar DC Conduit Pipe
    const conduitMat = matMetalSilver;
    const conduit1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), conduitMat);
    conduit1.position.set(-3.75, 3.0, 1.6);
    this.houseGroup.add(conduit1);

    const conduit2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), conduitMat);
    conduit2.position.set(-3.75, 2.3, 0.95);
    conduit2.rotation.z = Math.PI / 4;
    this.houseGroup.add(conduit2);

    // ----------------------------------------
    // 6. EXTERIOR SMART BATTERY STORAGE (POWERWALL STYLE)
    // ----------------------------------------
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-3.78, 1.45, 0.35);

    const battChassisGeo = new THREE.BoxGeometry(0.24, 1.25, 0.85);
    const battChassis = new THREE.Mesh(battChassisGeo, matWhiteTrim);
    battChassis.castShadow = true;
    battChassis.receiveShadow = true;
    batteryGroup.add(battChassis);

    const faceplateGeo = new THREE.BoxGeometry(0.04, 1.1, 0.72);
    const faceplate = new THREE.Mesh(faceplateGeo, matDarkMetal);
    faceplate.position.set(-0.11, 0, 0);
    batteryGroup.add(faceplate);

    for (let b = 0; b < 5; b++) {
      const ledGeo = new THREE.BoxGeometry(0.05, 0.06, 0.42);
      const isLit = b < 4;
      const ledMat = new THREE.MeshStandardMaterial({
        color: isLit ? 0x2dd4bf : 0x334155,
        emissive: isLit ? 0x14b8a6 : 0x000000,
        emissiveIntensity: isLit ? 1.4 : 0.0,
        roughness: 0.3
      });
      if (isLit) this.batteryLedMaterials.push(ledMat);

      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(-0.12, -0.3 + b * 0.14, 0);
      batteryGroup.add(ledMesh);
    }
    this.houseGroup.add(batteryGroup);

    // ----------------------------------------
    // 7. WATER PUMP & RAINWATER STORAGE SYSTEM
    // ----------------------------------------
    const waterGroup = new THREE.Group();
    waterGroup.position.set(-3.65, 0.85, -2.3);

    const tankGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.2, 24);
    const matTank = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.7
    });
    const tankMesh = new THREE.Mesh(tankGeo, matTank);
    tankMesh.castShadow = true;
    waterGroup.add(tankMesh);

    const gaugeGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12), matGlass);
    gaugeGlass.position.set(0.5, 0, 0);
    waterGroup.add(gaugeGlass);

    const waterLevelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.65, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 })
    );
    waterLevelMesh.position.set(0.5, -0.12, 0);
    waterGroup.add(waterLevelMesh);

    const pumpMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.45), matDarkMetal);
    pumpMesh.position.set(0, -0.42, 0.65);
    waterGroup.add(pumpMesh);

    this.houseGroup.add(waterGroup);

    // ----------------------------------------
    // 8. LIVING ROOM INTERIOR DESIGN PIECES
    // ----------------------------------------
    // Modular Sectional Sofa
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(-0.85, 0.42, 0.15);

    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.14, 1.2), matWarmOak);
    sofaBase.position.y = 0.07;
    sofaGroup.add(sofaBase);

    for (let s = 0; s < 3; s++) {
      const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.26, 1.1), matFabricSofa);
      seatCushion.position.set(-0.95 + s * 0.95, 0.26, 0.02);
      seatCushion.castShadow = true;
      seatCushion.receiveShadow = true;
      sofaGroup.add(seatCushion);

      const backCushion = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.52, 0.28), matFabricSofa);
      backCushion.position.set(-0.95 + s * 0.95, 0.56, -0.42);
      backCushion.rotation.x = 0.12;
      backCushion.castShadow = true;
      sofaGroup.add(backCushion);
    }

    const armrestLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.46, 1.15), matFabricSofa);
    armrestLeft.position.set(-1.48, 0.38, 0.02);
    armrestLeft.castShadow = true;
    sofaGroup.add(armrestLeft);

    this.houseGroup.add(sofaGroup);

    // Oak Coffee Table
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-0.8, 0.42, 1.35);

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.07, 0.78), matWarmOak);
    tableTop.position.y = 0.38;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.38, 12);
    [[-0.7, 0.19, -0.3], [0.7, 0.19, -0.3], [-0.7, 0.19, 0.3], [0.7, 0.19, 0.3]].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, matWarmOak);
      leg.position.set(lx, ly, lz);
      leg.rotation.z = lx > 0 ? -0.1 : 0.1;
      tableGroup.add(leg);
    });

    const bowlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.08, 16), matWhiteTrim);
    bowlMesh.position.set(0.1, 0.44, 0);
    tableGroup.add(bowlMesh);

    this.houseGroup.add(tableGroup);

    // TV Media Console & OLED TV
    const tvConsoleGroup = new THREE.Group();
    tvConsoleGroup.position.set(2.4, 0.42, 0.2);

    const consoleBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 1.8), matWarmOak);
    consoleBody.position.y = 0.34;
    consoleBody.castShadow = true;
    consoleBody.receiveShadow = true;
    tvConsoleGroup.add(consoleBody);

    const cubbyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.75), matDarkMetal);
    cubbyMesh.position.set(0.01, 0.34, 0.35);
    tvConsoleGroup.add(cubbyMesh);

    const cLegGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12);
    [[-0.25, 0.07, -0.75], [0.25, 0.07, -0.75], [-0.25, 0.07, 0.75], [0.25, 0.07, 0.75]].forEach(([cx, cy, cz]) => {
      const cLeg = new THREE.Mesh(cLegGeo, matDarkMetal);
      cLeg.position.set(cx, cy, cz);
      tvConsoleGroup.add(cLeg);
    });

    const tvGroup = new THREE.Group();
    tvGroup.position.set(0, 0.58, -0.1);

    const tvBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.48), matMetalSilver);
    tvBase.position.y = 0.01;
    tvGroup.add(tvBase);

    const tvNeck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), matMetalSilver);
    tvNeck.position.set(0, 0.09, 0);
    tvGroup.add(tvNeck);

    const tvBezel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 1.55), matDarkMetal);
    tvBezel.position.y = 0.65;
    tvGroup.add(tvBezel);

    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: tvTex }));
    tvScreen.rotation.y = -Math.PI / 2;
    tvScreen.position.set(-0.035, 0.65, 0);
    tvGroup.add(tvScreen);

    tvConsoleGroup.add(tvGroup);
    this.houseGroup.add(tvConsoleGroup);

    // Wall Art Above Sofa
    const artFrameGroup = new THREE.Group();
    artFrameGroup.position.set(-0.85, 2.15, -1.9);

    const artOuterFrame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 0.04), matWarmOak);
    artFrameGroup.add(artOuterFrame);

    const artCanvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.75), new THREE.MeshBasicMaterial({ map: artTex }));
    artCanvasMesh.position.z = 0.025;
    artFrameGroup.add(artCanvasMesh);

    this.houseGroup.add(artFrameGroup);

    // Potted Indoor Botanical Plant
    const plantGroup = new THREE.Group();
    plantGroup.position.set(1.4, 0.42, -1.6);

    const potMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.45, 16), matWhiteTrim);
    potMesh.position.y = 0.22;
    potMesh.castShadow = true;
    plantGroup.add(potMesh);

    const soilMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), matDarkMetal);
    soilMesh.position.y = 0.42;
    plantGroup.add(soilMesh);

    const matLeaf = new THREE.MeshStandardMaterial({ color: 0x2e6b36, roughness: 0.4, metalness: 0.1 });
    [0, 1.2, 2.3, 3.5, 4.7].forEach((ang, idx) => {
      const leafGeo = new THREE.SphereGeometry(0.18, 8, 8);
      leafGeo.scale(1.0, 0.3, 1.6);
      const leafMesh = new THREE.Mesh(leafGeo, matLeaf);
      leafMesh.position.set(Math.cos(ang) * 0.18, 0.55 + idx * 0.12, Math.sin(ang) * 0.18);
      leafMesh.rotation.y = ang;
      leafMesh.rotation.x = 0.4;
      leafMesh.castShadow = true;
      plantGroup.add(leafMesh);
    });

    this.houseGroup.add(plantGroup);

    // Right Side Flower Garden Bed
    const gardenGroup = new THREE.Group();
    gardenGroup.position.set(4.2, 0, 0.5);

    const bushMat = new THREE.MeshStandardMaterial({ color: 0x3d6631, roughness: 0.9 });
    const yellowFlowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.3, roughness: 0.5 });
    const whiteFlowerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

    for (let g = 0; g < 7; g++) {
      const bRad = 0.35 + (Math.random() * 0.2);
      const bMesh = new THREE.Mesh(new THREE.SphereGeometry(bRad, 12, 10), bushMat);
      bMesh.position.set((Math.random() - 0.5) * 1.2, bRad * 0.8, -1.8 + g * 0.65);
      bMesh.castShadow = true;
      gardenGroup.add(bMesh);

      for (let f = 0; f < 4; f++) {
        const fMat = Math.random() > 0.4 ? yellowFlowerMat : whiteFlowerMat;
        const fMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), fMat);
        fMesh.position.set(
          bMesh.position.x + (Math.random() - 0.5) * bRad * 1.2,
          bMesh.position.y + bRad * 0.5 + Math.random() * 0.2,
          bMesh.position.z + (Math.random() - 0.5) * bRad * 1.2
        );
        gardenGroup.add(fMesh);
      }
    }
    this.houseGroup.add(gardenGroup);
  }

  // ==========================================
  // ANIMATED ENERGY & WATER FLOW PARTICLE STREAMS
  // ==========================================
  setupEnergyFlowParticles() {
    const solarPathPoints = [
      new THREE.Vector3(-0.1, 4.3, 1.2),
      new THREE.Vector3(-2.3, 4.0, 1.3),
      new THREE.Vector3(-3.7, 3.3, 1.5),
      new THREE.Vector3(-3.7, 2.2, 0.9),
      new THREE.Vector3(-3.7, 1.5, 0.4)
    ];
    this.solarCurve = new THREE.CatmullRomCurve3(solarPathPoints);

    const solarParticleGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const matSolarParticle = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.5,
      roughness: 0.1
    });

    for (let i = 0; i < 9; i++) {
      const p = new THREE.Mesh(solarParticleGeo, matSolarParticle);
      p.userData = { t: i / 9, speed: 0.0075 };
      this.solarParticles.push(p);
      this.scene.add(p);
    }

    const waterPathPoints = [
      new THREE.Vector3(-3.65, 0.45, -1.8),
      new THREE.Vector3(-2.4, 0.4, -1.2),
      new THREE.Vector3(-0.8, 0.4, -0.4),
      new THREE.Vector3(1.2, 0.4, -0.4)
    ];
    this.waterCurve = new THREE.CatmullRomCurve3(waterPathPoints);

    const waterParticleGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const matWaterParticle = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.0,
      roughness: 0.1
    });

    for (let i = 0; i < 6; i++) {
      const wp = new THREE.Mesh(waterParticleGeo, matWaterParticle);
      wp.userData = { t: i / 6, speed: 0.006 };
      this.waterParticles.push(wp);
      this.scene.add(wp);
    }
  }

  // ==========================================
  // INTERACTIVE 3D HOTSPOT BEACONS
  // ==========================================
  setup3DHotspots() {
    const zones = [
      {
        id: 'solar',
        name: 'Rooftop Solar Array',
        desc: 'Generating 3.8 kW • 12 High-Efficiency Silicon Modules • 100% Clean Solar Power',
        pos: new THREE.Vector3(-0.1, 4.85, 1.4),
        color: 0xfbbf24
      },
      {
        id: 'living',
        name: 'Living Room & Smart Hub',
        desc: 'Current draw 1.3 kW • 24°C Comfort Temp • Smart lighting & OLED Hub active',
        pos: new THREE.Vector3(-0.8, 1.9, 0.6),
        color: 0x2dd4bf
      },
      {
        id: 'battery',
        name: 'Home Energy Storage',
        desc: '13.5 kWh Capacity • 82% Charged • Ready for evening peak hours with zero grid costs',
        pos: new THREE.Vector3(-4.1, 1.8, 0.35),
        color: 0x34d399
      },
      {
        id: 'water',
        name: 'Rainwater & Pressure Pump',
        desc: '42 L Used Today • Pressure Pump: 1.2 kW • Rain harvesting cistern 78% full',
        pos: new THREE.Vector3(-3.9, 1.5, -2.1),
        color: 0x38bdf8
      }
    ];

    zones.forEach(zone => {
      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(zone.pos);
      beaconGroup.userData = zone;

      const coreMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({
          color: zone.color,
          emissive: zone.color,
          emissiveIntensity: 2.2,
          roughness: 0.2
        })
      );
      beaconGroup.add(coreMesh);

      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.18, 0.26, 24),
        new THREE.MeshBasicMaterial({
          color: zone.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        })
      );
      ringMesh.rotation.x = Math.PI / 2;
      beaconGroup.add(ringMesh);

      this.hotspots.push({ group: beaconGroup, core: coreMesh, ring: ringMesh, zone });
      this.scene.add(beaconGroup);
    });
  }

  // ==========================================
  // EVENT LISTENERS: DRAG ORBIT, ZOOM & RESIZE
  // ==========================================
  setupEventListeners() {
    const el = this.renderer.domElement;

    const onPointerDown = (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.prevPointer = { x: clientX, y: clientY };
    };

    const onPointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (this.isDragging) {
        const deltaX = clientX - this.prevPointer.x;
        const deltaY = clientY - this.prevPointer.y;

        this.orbit.targetTheta -= deltaX * 0.007;
        this.orbit.targetPhi -= deltaY * 0.006;
        this.orbit.targetPhi = Math.max(this.orbit.minPhi, Math.min(this.orbit.maxPhi, this.orbit.targetPhi));

        this.prevPointer = { x: clientX, y: clientY };
      }

      if (!this.isDragging && !e.touches) {
        const rect = el.getBoundingClientRect();
        this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        this.checkHotspotHover();
      }
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.012;
      this.orbit.targetRadius = Math.max(
        this.orbit.minRadius,
        Math.min(this.orbit.maxRadius, this.orbit.targetRadius + zoomFactor)
      );
    };

    const onClick = (e) => {
      const rect = el.getBoundingClientRect();
      const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
      if (!clientX || !clientY) return;

      this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseVec, this.camera);
      const interactiveTargets = this.hotspots.map(h => h.core);
      const intersects = this.raycaster.intersectObjects(interactiveTargets, false);

      if (intersects.length > 0) {
        const clickedObj = intersects[0].object.parent;
        if (clickedObj && clickedObj.userData) {
          this.showHotspotHUD(clickedObj.userData);
          this.focusOnZone(clickedObj.userData.id);
        }
      }
    };

    el.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('click', onClick);

    el.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const closeHudBtn = document.getElementById('hud-close-btn');
    if (closeHudBtn) {
      closeHudBtn.addEventListener('click', () => {
        const hud = document.getElementById('hotspot-hud');
        if (hud) hud.classList.add('hidden');
      });
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.container);
  }

  checkHotspotHover() {
    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const interactiveTargets = this.hotspots.map(h => h.core);
    const intersects = this.raycaster.intersectObjects(interactiveTargets, false);

    if (intersects.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = this.isDragging ? 'grabbing' : 'grab';
    }
  }

  showHotspotHUD(zone) {
    const hud = document.getElementById('hotspot-hud');
    const nameEl = document.getElementById('hud-zone-name');
    const contentEl = document.getElementById('hud-content');

    if (hud && nameEl && contentEl) {
      nameEl.textContent = zone.name;
      contentEl.textContent = zone.desc;
      hud.classList.remove('hidden');
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ==========================================
  // CAMERA MOTION & ORBIT CALCULATIONS
  // ==========================================
  updateCameraPosition(instant = false) {
    if (instant) {
      this.orbit.radius = this.orbit.targetRadius;
      this.orbit.theta = this.orbit.targetTheta;
      this.orbit.phi = this.orbit.targetPhi;
      this.orbit.center.copy(this.orbit.targetCenter);
    } else {
      this.orbit.radius += (this.orbit.targetRadius - this.orbit.radius) * this.orbit.damping;
      this.orbit.theta += (this.orbit.targetTheta - this.orbit.theta) * this.orbit.damping;
      this.orbit.phi += (this.orbit.targetPhi - this.orbit.phi) * this.orbit.damping;
      this.orbit.center.lerp(this.orbit.targetCenter, this.orbit.damping);
    }

    const sinPhi = Math.sin(this.orbit.phi);
    const cosPhi = Math.cos(this.orbit.phi);
    const sinTheta = Math.sin(this.orbit.theta);
    const cosTheta = Math.cos(this.orbit.theta);

    this.camera.position.set(
      this.orbit.center.x + this.orbit.radius * sinPhi * sinTheta,
      this.orbit.center.y + this.orbit.radius * cosPhi,
      this.orbit.center.z + this.orbit.radius * sinPhi * cosTheta
    );

    this.camera.lookAt(this.orbit.center);
  }

  // ==========================================
  // CAMERA PRESETS & ZOOM PUBLIC CONTROLS
  // ==========================================
  zoomIn() {
    this.orbit.targetRadius = Math.max(this.orbit.minRadius, this.orbit.targetRadius - 2.5);
  }

  zoomOut() {
    this.orbit.targetRadius = Math.min(this.orbit.maxRadius, this.orbit.targetRadius + 2.5);
  }

  resetCamera() {
    this.currentZone = 'overview';
    this.orbit.targetRadius = 15.5;
    this.orbit.targetTheta = 0.82;
    this.orbit.targetPhi = 1.12;
    this.orbit.targetCenter.set(0, 1.2, 0);
  }

  focusOnZone(zoneKey) {
    this.currentZone = zoneKey;
    const presets = {
      overview: {
        radius: 15.5,
        theta: 0.82,
        phi: 1.12,
        center: new THREE.Vector3(0, 1.2, 0)
      },
      solar: {
        radius: 7.2,
        theta: 0.35,
        phi: 0.72,
        center: new THREE.Vector3(-0.2, 4.0, 1.2)
      },
      living: {
        radius: 6.8,
        theta: 0.55,
        phi: 1.22,
        center: new THREE.Vector3(-0.4, 1.2, 0.4)
      },
      bedroom: {
        radius: 7.5,
        theta: 0.95,
        phi: 1.15,
        center: new THREE.Vector3(1.2, 1.4, -1.0)
      },
      battery: {
        radius: 5.6,
        theta: 1.55,
        phi: 1.25,
        center: new THREE.Vector3(-3.7, 1.45, 0.35)
      },
      water: {
        radius: 5.8,
        theta: 2.15,
        phi: 1.28,
        center: new THREE.Vector3(-3.5, 0.95, -2.1)
      },
      environment: {
        radius: 25.0,
        theta: 0.85,
        phi: 0.92,
        center: new THREE.Vector3(0, 1.0, 0)
      }
    };

    const target = presets[zoneKey] || presets.overview;
    this.orbit.targetRadius = target.radius;
    this.orbit.targetTheta = target.theta;
    this.orbit.targetPhi = target.phi;
    this.orbit.targetCenter.copy(target.center);

    const foundZone = this.hotspots.find(h => h.zone.id === zoneKey);
    if (foundZone) {
      this.showHotspotHUD(foundZone.zone);
    }
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  toggleDayNight() {
    this.isDayMode = !this.isDayMode;
    return this.isDayMode;
  }

  // ==========================================
  // CONTINUOUS 60FPS ANIMATION LOOP
  // ==========================================
  animate(timestamp = 0) {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const time = timestamp * 0.001;

    // 1. Auto-rotation
    if (this.autoRotate && !this.isDragging) {
      this.orbit.targetTheta += this.autoRotateSpeed;
    }

    // 2. Smooth Camera Interpolation
    this.updateCameraPosition(false);

    // 3. Day / Night Dynamic Smooth Lighting & Sky Dome Transition
    const targetSunIntensity = this.isDayMode ? 1.4 : 0.04;
    const targetHemiIntensity = this.isDayMode ? 0.6 : 0.16;
    const targetInteriorIntensity = this.isDayMode ? 0.9 : 2.6;
    const targetBatteryGlow = this.isDayMode ? 0.5 : 1.4;
    const targetStreetLamp = this.isDayMode ? 0.1 : 1.2;
    const targetStarOpacity = this.isDayMode ? 0.0 : 0.95;
    const targetMoonOpacity = this.isDayMode ? 0.0 : 1.0;
    const targetSunOpacity = this.isDayMode ? 1.0 : 0.0;

    this.lights.sun.intensity += (targetSunIntensity - this.lights.sun.intensity) * 0.05;
    this.lights.hemi.intensity += (targetHemiIntensity - this.lights.hemi.intensity) * 0.05;
    this.lights.interiorSpot.intensity += (targetInteriorIntensity - this.lights.interiorSpot.intensity) * 0.05;
    this.lights.batteryGlow.intensity += (targetBatteryGlow - this.lights.batteryGlow.intensity) * 0.05;
    this.lights.streetLamp.intensity += (targetStreetLamp - this.lights.streetLamp.intensity) * 0.05;

    // Sky Dome & Fog Lerp
    const targetSkyColor = this.isDayMode ? new THREE.Color(0x87ceeb) : new THREE.Color(0x0a1122);
    const targetFogColor = this.isDayMode ? new THREE.Color(0xcfe6f4) : new THREE.Color(0x070c18);

    if (this.skyDomeMesh) this.skyDomeMesh.material.color.lerp(targetSkyColor, 0.05);
    this.scene.background.lerp(targetSkyColor, 0.05);
    this.scene.fog.color.lerp(targetFogColor, 0.05);

    if (this.starsMesh) {
      this.starsMesh.material.opacity += (targetStarOpacity - this.starsMesh.material.opacity) * 0.05;
      this.starsMesh.rotation.y = time * 0.01;
    }

    if (this.moonMesh) {
      this.moonMesh.material.opacity += (targetMoonOpacity - this.moonMesh.material.opacity) * 0.05;
    }

    if (this.sunDiscMesh) {
      this.sunDiscMesh.visible = this.isDayMode;
    }

    // 4. Subtle Wind Foliage Rustle Micro-Animation
    this.foliageClusters.forEach((fc, idx) => {
      const rustle = 0.012 * Math.sin(time * 2.2 + idx * 1.5);
      fc.position.x += rustle * 0.1;
      fc.rotation.z = rustle * 0.5;
    });

    // 5. Solar Energy Particle Pulse Stream
    if (this.solarCurve) {
      this.solarParticles.forEach(p => {
        p.userData.t = (p.userData.t + p.userData.speed) % 1.0;
        const pt = this.solarCurve.getPoint(p.userData.t);
        p.position.copy(pt);
        const pulseScale = 1.0 + 0.3 * Math.sin(time * 6 + p.userData.t * 10);
        p.scale.set(pulseScale, pulseScale, pulseScale);
      });
    }

    // 6. Water Particle Flow
    if (this.waterCurve) {
      this.waterParticles.forEach(wp => {
        wp.userData.t = (wp.userData.t + wp.userData.speed) % 1.0;
        const pt = this.waterCurve.getPoint(wp.userData.t);
        wp.position.copy(pt);
      });
    }

    // 7. Breathing Battery LED Indicator Pulse
    const ledPulse = 1.2 + 0.4 * Math.sin(time * 3.5);
    this.batteryLedMaterials.forEach(m => {
      m.emissiveIntensity = ledPulse;
    });

    // 8. Hotspot Ring Ripple Animation
    this.hotspots.forEach(h => {
      const ringScale = 1.0 + 0.35 * Math.sin(time * 3.0);
      h.ring.scale.set(ringScale, ringScale, 1.0);
      h.ring.material.opacity = 0.8 - (ringScale - 1.0) * 1.5;
    });

    // 9. Render Frame
    this.renderer.render(this.scene, this.camera);
  }

  // ==========================================
  // CLEANUP / DISPOSAL
  // ==========================================
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
