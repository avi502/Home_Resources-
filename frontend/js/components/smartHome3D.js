// Realist Home — High-Detail Photorealistic 3D Architectural Eco-Home
// Built with Three.js WebGL: Procedural PBR materials, true 3D meshes, 360° orbit, zoom,
// animated solar/water energy streams, glowing battery indicators, and day/night simulation.

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
      radius: 13.5,
      targetRadius: 13.5,
      minRadius: 4.8,
      maxRadius: 22.0,
      theta: 0.85,           // Horizontal azimuthal angle
      targetTheta: 0.85,
      phi: 1.05,             // Vertical polar angle (elevation)
      targetPhi: 1.05,
      minPhi: 0.25,
      maxPhi: Math.PI / 2 - 0.08,
      center: new THREE.Vector3(0, 1.3, 0),
      targetCenter: new THREE.Vector3(0, 1.3, 0),
      damping: 0.08
    };

    // Interaction State
    this.isDragging = false;
    this.prevPointer = { x: 0, y: 0 };
    this.autoRotate = true;
    this.autoRotateSpeed = 0.0035;
    this.isDayMode = true;
    this.currentZone = 'overview';

    // Lighting References for Day/Night Lerp
    this.lights = {
      sun: null,
      hemi: null,
      interiorSpot: null,
      bedroomLight: null,
      batteryGlow: null,
      gardenLights: []
    };

    // Animated Elements
    this.solarParticles = [];
    this.waterParticles = [];
    this.batteryLedMaterials = [];
    this.hotspots = [];
    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1d24); // Matching realist dark dashboard palette
    this.scene.fog = new THREE.FogExp2(0x0f1d24, 0.022);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
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
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.borderRadius = '16px';
    this.renderer.domElement.style.outline = 'none';

    this.container.appendChild(this.renderer.domElement);

    // 4. Procedural Photorealistic Canvas Textures
    this.textures = this.createProceduralTextures();

    // 5. Lighting Setup
    this.setupLighting();

    // 6. Build the Complete Architectural Eco-Home Model
    this.houseGroup = new THREE.Group();
    this.buildHouseModel();
    this.scene.add(this.houseGroup);

    // 7. Energy & Water Flow Animated Particle Conduits
    this.setupEnergyFlowParticles();

    // 8. 3D Interactive Hotspot Beacons
    this.setup3DHotspots();

    // 9. Event Listeners (Drag Orbit, Zoom, Resize, Raycasting)
    this.setupEventListeners();

    // 10. Start Animation Loop
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
    
    // Base wood warmth
    fctx.fillStyle = '#caa989';
    fctx.fillRect(0, 0, 512, 512);

    // Draw individual staggered oak planks
    const plankH = 32;
    const plankW = 128;
    const woodTones = ['#c8a584', '#d2b192', '#bf9c79', '#cead8e', '#b6926f', '#dbbca0'];

    for (let y = 0; y < 512; y += plankH) {
      const offsetX = ((y / plankH) % 2) * (plankW / 2);
      for (let x = -plankW; x < 512 + plankW; x += plankW) {
        const tone = woodTones[Math.floor(Math.random() * woodTones.length)];
        fctx.fillStyle = tone;
        fctx.fillRect(x + offsetX, y, plankW - 1.5, plankH - 1.5);

        // Fine grain lines
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

        // Dark seam joint
        fctx.fillStyle = 'rgba(70, 50, 35, 0.45)';
        fctx.fillRect(x + offsetX + plankW - 1.5, y, 1.5, plankH);
        fctx.fillRect(x + offsetX, y + plankH - 1.5, plankW, 1.5);
      }
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(2.5, 2.5);

    // 2. High-Efficiency Solar Panel Photovoltaic Texture
    const solarCanvas = document.createElement('canvas');
    solarCanvas.width = 512;
    solarCanvas.height = 512;
    const sctx = solarCanvas.getContext('2d');

    // Deep crystalline navy-black base
    const grad = sctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0c1b33');
    grad.addColorStop(0.5, '#071224');
    grad.addColorStop(1, '#050c18');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 512, 512);

    // Photovoltaic cell grid (6 cols x 10 rows)
    const cols = 6;
    const rows = 10;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * cellW;
        const cy = r * cellH;

        // Individual silicon wafer cell with chamfered corners
        sctx.fillStyle = '#0f2444';
        sctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);

        // Thin conductive silver finger lines
        sctx.strokeStyle = 'rgba(180, 215, 255, 0.22)';
        sctx.lineWidth = 1;
        for (let l = 6; l < cellH - 4; l += 8) {
          sctx.beginPath();
          sctx.moveTo(cx + 3, cy + l);
          sctx.lineTo(cx + cellW - 3, cy + l);
          sctx.stroke();
        }

        // Heavy silver busbars (3 vertical lines per cell)
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

        // White cell border isolation
        sctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        sctx.lineWidth = 1.2;
        sctx.strokeRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
      }
    }
    const solarTex = new THREE.CanvasTexture(solarCanvas);

    // 3. Stucco / Architectural Matte Wall Texture
    const stuccoCanvas = document.createElement('canvas');
    stuccoCanvas.width = 256;
    stuccoCanvas.height = 256;
    const stctx = stuccoCanvas.getContext('2d');
    stctx.fillStyle = '#ece8df'; // Warm light greige stucco
    stctx.fillRect(0, 0, 256, 256);
    // Subtle organic noise stipple
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

    // 4. Modern Wall Artwork Canvas
    const artCanvas = document.createElement('canvas');
    artCanvas.width = 256;
    artCanvas.height = 256;
    const actx = artCanvas.getContext('2d');
    actx.fillStyle = '#f6f3ed';
    actx.fillRect(0, 0, 256, 256);
    // Terracotta minimalist arch
    actx.fillStyle = '#c86d51';
    actx.beginPath();
    actx.arc(128, 140, 65, Math.PI, 0, false);
    actx.lineTo(193, 210);
    actx.lineTo(63, 210);
    actx.closePath();
    actx.fill();
    // Sage green balance circle
    actx.fillStyle = '#6b8168';
    actx.beginPath();
    actx.arc(128, 70, 32, 0, Math.PI * 2);
    actx.fill();
    // Warm ochre accent ring
    actx.strokeStyle = '#d99e43';
    actx.lineWidth = 4;
    actx.beginPath();
    actx.arc(80, 160, 24, 0, Math.PI * 2);
    actx.stroke();
    const artTex = new THREE.CanvasTexture(artCanvas);

    // 5. Flat OLED TV Live Screen Graphic
    const tvCanvas = document.createElement('canvas');
    tvCanvas.width = 512;
    tvCanvas.height = 288;
    const tvctx = tvCanvas.getContext('2d');
    tvctx.fillStyle = '#0b1320';
    tvctx.fillRect(0, 0, 512, 288);
    // Ambient screensaver wave
    const tvGrad = tvctx.createLinearGradient(0, 0, 512, 288);
    tvGrad.addColorStop(0, '#0d2838');
    tvGrad.addColorStop(0.5, '#071822');
    tvGrad.addColorStop(1, '#050e17');
    tvctx.fillStyle = tvGrad;
    tvctx.fillRect(0, 0, 512, 288);
    // Smart Home Energy HUD on TV
    tvctx.fillStyle = '#2dd4bf';
    tvctx.font = 'bold 22px sans-serif';
    tvctx.fillText('Realist Home — Living Room Hub', 36, 52);
    tvctx.fillStyle = '#94a3b8';
    tvctx.font = '16px sans-serif';
    tvctx.fillText('Solar: 3.8 kW  •  Battery: 82%  •  Temp: 24°C', 36, 88);
    // Graphic wave on screen
    tvctx.strokeStyle = '#38bdf8';
    tvctx.lineWidth = 3;
    tvctx.beginPath();
    tvctx.moveTo(36, 190);
    tvctx.bezierCurveTo(150, 130, 250, 230, 370, 160);
    tvctx.lineTo(476, 180);
    tvctx.stroke();
    const tvTex = new THREE.CanvasTexture(tvCanvas);

    // 6. Manicured Green Lawn Texture
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 512;
    grassCanvas.height = 512;
    const gctx = grassCanvas.getContext('2d');
    gctx.fillStyle = '#4c783c';
    gctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8000; i++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      gctx.fillStyle = Math.random() > 0.5 ? '#5e944b' : '#3d6130';
      gctx.fillRect(gx, gy, 2, 3);
    }
    const grassTex = new THREE.CanvasTexture(grassCanvas);
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(4, 4);

    return { floorTex, solarTex, stuccoTex, artTex, tvTex, grassTex };
  }

  // ==========================================
  // REALISTIC LIGHTING SYSTEM
  // ==========================================
  setupLighting() {
    // 1. Directional Sun Light (Warm golden natural daylight, casts crisp soft shadows)
    this.lights.sun = new THREE.DirectionalLight(0xfff6ea, 1.35);
    this.lights.sun.position.set(-9.0, 15.0, 11.0);
    this.lights.sun.castShadow = true;
    this.lights.sun.shadow.mapSize.width = 2048;
    this.lights.sun.shadow.mapSize.height = 2048;
    this.lights.sun.shadow.camera.near = 0.5;
    this.lights.sun.shadow.camera.far = 38;
    this.lights.sun.shadow.camera.left = -10;
    this.lights.sun.shadow.camera.right = 10;
    this.lights.sun.shadow.camera.top = 10;
    this.lights.sun.shadow.camera.bottom = -10;
    this.lights.sun.shadow.bias = -0.0004;
    this.lights.sun.shadow.radius = 2.2;
    this.scene.add(this.lights.sun);

    // 2. Sky Hemisphere Light (Soft blue sky ambient bounce + warm ground bounce)
    this.lights.hemi = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.55);
    this.lights.hemi.position.set(0, 20, 0);
    this.scene.add(this.lights.hemi);

    // 3. Interior Living Room Ceiling Spot Light (Warm amber glow)
    this.lights.interiorSpot = new THREE.PointLight(0xffaa40, 0.85, 8.5, 1.8);
    this.lights.interiorSpot.position.set(0.6, 2.7, 0.4);
    this.lights.interiorSpot.castShadow = true;
    this.lights.interiorSpot.shadow.bias = -0.001;
    this.scene.add(this.lights.interiorSpot);

    // 4. Bedroom Hallway Light (Soft cozy warm white)
    this.lights.bedroomLight = new THREE.PointLight(0xffbe76, 0.65, 6.0, 2.0);
    this.lights.bedroomLight.position.set(2.4, 2.2, -1.2);
    this.scene.add(this.lights.bedroomLight);

    // 5. Exterior Battery Unit Status Glow Light
    this.lights.batteryGlow = new THREE.PointLight(0x2dd4bf, 0.45, 3.2, 2.0);
    this.lights.batteryGlow.position.set(-3.7, 1.4, 0.3);
    this.scene.add(this.lights.batteryGlow);

    // 6. Garden Pathway Lights (Subtle warm ground pools)
    const gardenLightPos = [
      new THREE.Vector3(3.8, 0.35, 3.2),
      new THREE.Vector3(-3.2, 0.35, 3.6)
    ];
    gardenLightPos.forEach(pos => {
      const pl = new THREE.PointLight(0xfef08a, 0.25, 2.8, 2.0);
      pl.position.copy(pos);
      this.lights.gardenLights.push(pl);
      this.scene.add(pl);
    });
  }

  // ==========================================
  // ARCHITECTURAL 3D ECO-HOME MESH CONSTRUCTION
  // (Exact Match to Modern Cutaway Villa Architecture)
  // ==========================================
  buildHouseModel() {
    const { floorTex, solarTex, stuccoTex, artTex, tvTex, grassTex } = this.textures;

    // --- High-End PBR Materials ---
    const matStuccoExterior = new THREE.MeshStandardMaterial({
      color: 0xe2ded4, // Warm light grey/greige
      map: stuccoTex,
      roughness: 0.92,
      metalness: 0.05
    });

    const matStuccoInterior = new THREE.MeshStandardMaterial({
      color: 0xf5f2eb, // Clean warm off-white
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

    const matRoofTile = new THREE.MeshStandardMaterial({
      color: 0x8a929a, // Architectural zinc-grey roof surface
      roughness: 0.75,
      metalness: 0.15
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
      color: 0xded5c5, // Warm cream-beige upholstery
      roughness: 0.95,
      metalness: 0.0
    });

    const matWarmOak = new THREE.MeshStandardMaterial({
      color: 0xb58e65, // Natural oak wood
      roughness: 0.45,
      metalness: 0.05
    });

    // ----------------------------------------
    // 1. GROUND, PATIO & LANDSCAPED LAWN
    // ----------------------------------------
    // Manicured grass base with beveled edges
    const lawnGeo = new THREE.BoxGeometry(13.8, 0.4, 11.2);
    const matLawn = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.96,
      metalness: 0.0
    });
    const lawnMesh = new THREE.Mesh(lawnGeo, matLawn);
    lawnMesh.position.set(0, -0.2, 0);
    lawnMesh.receiveShadow = true;
    this.houseGroup.add(lawnMesh);

    // Architectural Concrete Foundation Plinth
    const plinthGeo = new THREE.BoxGeometry(8.4, 0.35, 6.4);
    const matPlinth = new THREE.MeshStandardMaterial({
      color: 0xb4aba1,
      roughness: 0.85,
      metalness: 0.08
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, matPlinth);
    plinthMesh.position.set(-0.2, 0.08, -0.2);
    plinthMesh.receiveShadow = true;
    plinthMesh.castShadow = true;
    this.houseGroup.add(plinthMesh);

    // Front stone paver patio walkway
    const patioGeo = new THREE.BoxGeometry(4.8, 0.08, 1.4);
    const matPatio = new THREE.MeshStandardMaterial({
      color: 0xd6d3cb,
      roughness: 0.65,
      metalness: 0.05
    });
    const patioMesh = new THREE.Mesh(patioGeo, matPatio);
    patioMesh.position.set(0.6, 0.28, 2.5);
    patioMesh.receiveShadow = true;
    this.houseGroup.add(patioMesh);

    // ----------------------------------------
    // 2. LIVING ROOM INTERIOR HARDWOOD FLOOR
    // ----------------------------------------
    const interiorFloorGeo = new THREE.BoxGeometry(7.2, 0.08, 4.6);
    const interiorFloor = new THREE.Mesh(interiorFloorGeo, matWoodFloor);
    interiorFloor.position.set(-0.1, 0.28, 0.2);
    interiorFloor.receiveShadow = true;
    this.houseGroup.add(interiorFloor);

    // ----------------------------------------
    // 3. EXTERIOR WALLS & ARCHITECTURAL ARCHWAY
    // ----------------------------------------
    // Left Exterior Wall (With recessed window cutout)
    const leftWallGeo = new THREE.BoxGeometry(0.42, 2.8, 4.8);
    const leftWall = new THREE.Mesh(leftWallGeo, matStuccoExterior);
    leftWall.position.set(-3.7, 1.65, 0.1);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.houseGroup.add(leftWall);

    // Window on Left Wall (White frame & glass)
    const winFrameOuter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 1.3), matWhiteTrim);
    winFrameOuter.position.set(-3.7, 1.8, 0.8);
    this.houseGroup.add(winFrameOuter);

    const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.15, 1.15), matGlass);
    winGlass.position.set(-3.7, 1.8, 0.8);
    this.houseGroup.add(winGlass);

    // Rear Interior Wall Left Section
    const rearWallLeftGeo = new THREE.BoxGeometry(3.6, 2.8, 0.38);
    const rearWallLeft = new THREE.Mesh(rearWallLeftGeo, matStuccoInterior);
    rearWallLeft.position.set(-1.8, 1.65, -2.1);
    rearWallLeft.castShadow = true;
    rearWallLeft.receiveShadow = true;
    this.houseGroup.add(rearWallLeft);

    // Rear Interior Wall Right Section
    const rearWallRightGeo = new THREE.BoxGeometry(2.2, 2.8, 0.38);
    const rearWallRight = new THREE.Mesh(rearWallRightGeo, matStuccoInterior);
    rearWallRight.position.set(2.4, 1.65, -2.1);
    rearWallRight.castShadow = true;
    rearWallRight.receiveShadow = true;
    this.houseGroup.add(rearWallRight);

    // Architectural Arched Doorway Lintels & Arch Top
    const archTopGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.38, 24, 1, false, 0, Math.PI);
    const archTopMesh = new THREE.Mesh(archTopGeo, matStuccoInterior);
    archTopMesh.rotation.z = Math.PI / 2;
    archTopMesh.rotation.y = Math.PI / 2;
    archTopMesh.position.set(0.65, 2.35, -2.1);
    this.houseGroup.add(archTopMesh);

    // Hallway / Bedroom Interior Depth Backdrop
    const hallBackdropGeo = new THREE.BoxGeometry(2.4, 2.8, 0.2);
    const matHallBackdrop = new THREE.MeshStandardMaterial({
      color: 0xdfdad0,
      roughness: 0.9
    });
    const hallBackdrop = new THREE.Mesh(hallBackdropGeo, matHallBackdrop);
    hallBackdrop.position.set(0.65, 1.65, -3.2);
    hallBackdrop.receiveShadow = true;
    this.houseGroup.add(hallBackdrop);

    // Right Exterior Wall
    const rightWallGeo = new THREE.BoxGeometry(0.42, 2.8, 4.8);
    const rightWall = new THREE.Mesh(rightWallGeo, matStuccoExterior);
    rightWall.position.set(3.5, 1.65, 0.1);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.houseGroup.add(rightWall);

    // Triangular Gable Wall on Left Side
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-2.4, 0);
    gableShape.lineTo(2.4, 0);
    gableShape.lineTo(0, 1.6);
    gableShape.closePath();
    const extrudeSettings = { depth: 0.38, bevelEnabled: false };
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, extrudeSettings);
    
    const leftGable = new THREE.Mesh(gableGeo, matStuccoExterior);
    leftGable.rotation.y = Math.PI / 2;
    leftGable.position.set(-3.51, 3.05, 0.1);
    leftGable.castShadow = true;
    this.houseGroup.add(leftGable);

    const rightGable = new THREE.Mesh(gableGeo, matStuccoExterior);
    rightGable.rotation.y = Math.PI / 2;
    rightGable.position.set(3.89, 3.05, 0.1);
    rightGable.castShadow = true;
    this.houseGroup.add(rightGable);

    // ----------------------------------------
    // 4. PITCHED GABLED ROOF & WHITE FASCIA TRIM
    // ----------------------------------------
    // Back pitch of roof
    const roofBackGeo = new THREE.BoxGeometry(7.8, 0.14, 2.85);
    const roofBack = new THREE.Mesh(roofBackGeo, matRoofTile);
    roofBack.position.set(-0.1, 3.82, -1.2);
    roofBack.rotation.x = Math.atan2(1.6, 2.4);
    roofBack.castShadow = true;
    roofBack.receiveShadow = true;
    this.houseGroup.add(roofBack);

    // Front pitch of roof (Sunny southern pitch hosting solar array)
    const roofFrontGeo = new THREE.BoxGeometry(7.8, 0.14, 2.85);
    const roofFront = new THREE.Mesh(roofFrontGeo, matRoofTile);
    roofFront.position.set(-0.1, 3.82, 1.4);
    roofFront.rotation.x = -Math.atan2(1.6, 2.4);
    roofFront.castShadow = true;
    roofFront.receiveShadow = true;
    this.houseGroup.add(roofFront);

    // Crisp White Eaves / Ridge Fascia Board
    const ridgeFascia = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.22, 0.22), matWhiteTrim);
    ridgeFascia.position.set(-0.1, 4.66, 0.1);
    ridgeFascia.castShadow = true;
    this.houseGroup.add(ridgeFascia);

    const frontEavesTrim = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.18, 0.12), matWhiteTrim);
    frontEavesTrim.position.set(-0.1, 3.02, 2.68);
    frontEavesTrim.castShadow = true;
    this.houseGroup.add(frontEavesTrim);

    // ----------------------------------------
    // 5. ROOFTOP PHOTOVOLTAIC SOLAR ARRAY (4 PANELS)
    // ----------------------------------------
    // Anodized aluminum mounting rails
    const railMat = matDarkMetal;
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.05, 0.05), railMat);
    rail1.position.set(-0.1, 4.15, 0.85);
    rail1.rotation.x = -Math.atan2(1.6, 2.4);
    this.houseGroup.add(rail1);

    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.05, 0.05), railMat);
    rail2.position.set(-0.1, 3.52, 1.8);
    rail2.rotation.x = -Math.atan2(1.6, 2.4);
    this.houseGroup.add(rail2);

    // 4 Symmetrical Solar Panel Modules
    const panelWidth = 1.45;
    const panelHeight = 2.15;
    const panelDepth = 0.05;
    const panelSpacing = 1.55;
    const solarAngle = -Math.atan2(1.6, 2.4);

    this.solarPanelMeshes = [];
    for (let i = 0; i < 4; i++) {
      const panelGroup = new THREE.Group();
      
      // Panel frame (Silver aluminum border)
      const frameGeo = new THREE.BoxGeometry(panelWidth, panelDepth, panelHeight);
      const frameMesh = new THREE.Mesh(frameGeo, matMetalSilver);
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      panelGroup.add(frameMesh);

      // Photovoltaic cell face (textured silicon)
      const faceGeo = new THREE.PlaneGeometry(panelWidth - 0.08, panelHeight - 0.08);
      const faceMesh = new THREE.Mesh(faceGeo, matSolarPanel);
      faceMesh.rotation.x = -Math.PI / 2;
      faceMesh.position.y = 0.03;
      panelGroup.add(faceMesh);

      // Position along roof slope
      const px = -2.32 + (i * panelSpacing);
      panelGroup.position.set(px, 3.86, 1.34);
      panelGroup.rotation.x = solarAngle;

      this.solarPanelMeshes.push(panelGroup);
      this.houseGroup.add(panelGroup);
    }

    // Solar DC Conduit Pipe running down side wall to battery
    const conduitMat = matMetalSilver;
    const conduit1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), conduitMat);
    conduit1.position.set(-3.75, 2.9, 1.6);
    this.houseGroup.add(conduit1);

    const conduit2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), conduitMat);
    conduit2.position.set(-3.75, 2.2, 0.95);
    conduit2.rotation.z = Math.PI / 4;
    this.houseGroup.add(conduit2);

    // ----------------------------------------
    // 6. EXTERIOR SMART BATTERY UNIT (POWERWALL STYLE)
    // ----------------------------------------
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-3.78, 1.35, 0.35);

    // Battery Chassis (Matte white beveled casing)
    const battChassisGeo = new THREE.BoxGeometry(0.24, 1.25, 0.85);
    const battChassis = new THREE.Mesh(battChassisGeo, matWhiteTrim);
    battChassis.castShadow = true;
    battChassis.receiveShadow = true;
    batteryGroup.add(battChassis);

    // Dark glass front faceplate
    const faceplateGeo = new THREE.BoxGeometry(0.04, 1.1, 0.72);
    const faceplate = new THREE.Mesh(faceplateGeo, matDarkMetal);
    faceplate.position.set(-0.11, 0, 0);
    batteryGroup.add(faceplate);

    // Vertical glowing LED battery level indicator bars (5 bars)
    for (let b = 0; b < 5; b++) {
      const ledGeo = new THREE.BoxGeometry(0.05, 0.06, 0.42);
      const isLit = b < 4; // 82% capacity
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
    waterGroup.position.set(-3.65, 0.75, -2.3);

    // Rainwater Harvester Tank (Cylinder with metal hoops)
    const tankGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.2, 24);
    const matTank = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.7
    });
    const tankMesh = new THREE.Mesh(tankGeo, matTank);
    tankMesh.castShadow = true;
    waterGroup.add(tankMesh);

    // Water level glass sight gauge
    const gaugeGlassGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12);
    const gaugeGlass = new THREE.Mesh(gaugeGlassGeo, matGlass);
    gaugeGlass.position.set(0.5, 0, 0);
    waterGroup.add(gaugeGlass);

    const waterLevelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.65, 12);
    const matWaterLevel = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8
    });
    const waterLevelMesh = new THREE.Mesh(waterLevelGeo, matWaterLevel);
    waterLevelMesh.position.set(0.5, -0.12, 0);
    waterGroup.add(waterLevelMesh);

    // Electric pressure booster pump motor
    const pumpGeo = new THREE.BoxGeometry(0.35, 0.35, 0.45);
    const pumpMesh = new THREE.Mesh(pumpGeo, matDarkMetal);
    pumpMesh.position.set(0, -0.42, 0.65);
    waterGroup.add(pumpMesh);

    this.houseGroup.add(waterGroup);

    // ----------------------------------------
    // 8. LIVING ROOM INTERIOR FURNITURE
    // (Exact Designer Pieces from Image)
    // ----------------------------------------
    // Modern Designer Sectional Sofa (Beige Fabric)
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(-0.85, 0.32, 0.15);

    // Sofa Base Plinth
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.14, 1.2), matWarmOak);
    sofaBase.position.y = 0.07;
    sofaGroup.add(sofaBase);

    // Thick Seat Cushions (3 sections)
    for (let s = 0; s < 3; s++) {
      const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.26, 1.1), matFabricSofa);
      seatCushion.position.set(-0.95 + s * 0.95, 0.26, 0.02);
      seatCushion.castShadow = true;
      seatCushion.receiveShadow = true;
      sofaGroup.add(seatCushion);

      // Angled Back Cushions
      const backCushion = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.52, 0.28), matFabricSofa);
      backCushion.position.set(-0.95 + s * 0.95, 0.56, -0.42);
      backCushion.rotation.x = 0.12;
      backCushion.castShadow = true;
      sofaGroup.add(backCushion);
    }

    // Left Armrest
    const armrestLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.46, 1.15), matFabricSofa);
    armrestLeft.position.set(-1.48, 0.38, 0.02);
    armrestLeft.castShadow = true;
    sofaGroup.add(armrestLeft);

    this.houseGroup.add(sofaGroup);

    // Modern Low Oak Coffee Table
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-0.8, 0.32, 1.35);

    // Tabletop
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.07, 0.78), matWarmOak);
    tableTop.position.y = 0.38;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // 4 Angled Tapered Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.38, 12);
    const legPositions = [
      [-0.7, 0.19, -0.3],
      [0.7, 0.19, -0.3],
      [-0.7, 0.19, 0.3],
      [0.7, 0.19, 0.3]
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, matWarmOak);
      leg.position.set(lx, ly, lz);
      leg.rotation.z = lx > 0 ? -0.1 : 0.1;
      tableGroup.add(leg);
    });

    // Decorative ceramic bowl on coffee table
    const bowlGeo = new THREE.CylinderGeometry(0.12, 0.06, 0.08, 16);
    const bowlMesh = new THREE.Mesh(bowlGeo, matWhiteTrim);
    bowlMesh.position.set(0.1, 0.44, 0);
    tableGroup.add(bowlMesh);

    this.houseGroup.add(tableGroup);

    // Low TV Console Media Credenza (Natural Wood)
    const tvConsoleGroup = new THREE.Group();
    tvConsoleGroup.position.set(2.4, 0.32, 0.2);

    const consoleBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 1.8), matWarmOak);
    consoleBody.position.y = 0.34;
    consoleBody.castShadow = true;
    consoleBody.receiveShadow = true;
    tvConsoleGroup.add(consoleBody);

    // Open cubby hole cutouts in console
    const cubbyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.75), matDarkMetal);
    cubbyMesh.position.set(0.01, 0.34, 0.35);
    tvConsoleGroup.add(cubbyMesh);

    // Slender Console Legs
    const cLegGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12);
    [[-0.25, 0.07, -0.75], [0.25, 0.07, -0.75], [-0.25, 0.07, 0.75], [0.25, 0.07, 0.75]].forEach(([cx, cy, cz]) => {
      const cLeg = new THREE.Mesh(cLegGeo, matDarkMetal);
      cLeg.position.set(cx, cy, cz);
      tvConsoleGroup.add(cLeg);
    });

    // Large OLED Flat TV Screen
    const tvGroup = new THREE.Group();
    tvGroup.position.set(0, 0.58, -0.1);

    // TV Metal Base Stand & Neck
    const tvBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.48), matMetalSilver);
    tvBase.position.y = 0.01;
    tvGroup.add(tvBase);

    const tvNeck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), matMetalSilver);
    tvNeck.position.set(0, 0.09, 0);
    tvGroup.add(tvNeck);

    // Slim TV Bezel & Screen
    const tvBezel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 1.55), matDarkMetal);
    tvBezel.position.y = 0.65;
    tvGroup.add(tvBezel);

    const matTVScreen = new THREE.MeshBasicMaterial({ map: tvTex });
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), matTVScreen);
    tvScreen.rotation.y = -Math.PI / 2;
    tvScreen.position.set(-0.035, 0.65, 0);
    tvGroup.add(tvScreen);

    tvConsoleGroup.add(tvGroup);
    this.houseGroup.add(tvConsoleGroup);

    // Framed Abstract Artwork on Rear Wall Above Sofa
    const artFrameGroup = new THREE.Group();
    artFrameGroup.position.set(-0.85, 2.05, -1.9);

    const artOuterFrame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 0.04), matWarmOak);
    artFrameGroup.add(artOuterFrame);

    const matArt = new THREE.MeshBasicMaterial({ map: artTex });
    const artCanvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.75), matArt);
    artCanvasMesh.position.z = 0.025;
    artFrameGroup.add(artCanvasMesh);

    this.houseGroup.add(artFrameGroup);

    // Potted Indoor Botanical Plant (Next to Archway)
    const plantGroup = new THREE.Group();
    plantGroup.position.set(1.4, 0.32, -1.6);

    // Ceramic Planter Pot
    const potGeo = new THREE.CylinderGeometry(0.22, 0.16, 0.45, 16);
    const potMesh = new THREE.Mesh(potGeo, matWhiteTrim);
    potMesh.position.y = 0.22;
    potMesh.castShadow = true;
    plantGroup.add(potMesh);

    // Dark soil
    const soilMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), matDarkMetal);
    soilMesh.position.y = 0.42;
    plantGroup.add(soilMesh);

    // Lush Green Leaves
    const matLeaf = new THREE.MeshStandardMaterial({
      color: 0x2e6b36,
      roughness: 0.4,
      metalness: 0.1
    });

    const leafAngles = [0, 1.2, 2.3, 3.5, 4.7];
    leafAngles.forEach((ang, idx) => {
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

    // ----------------------------------------
    // 9. OUTDOOR FLOWER GARDEN & SHRUBS (Right Side)
    // ----------------------------------------
    const gardenGroup = new THREE.Group();
    gardenGroup.position.set(4.2, 0, 0.5);

    const bushMat = new THREE.MeshStandardMaterial({
      color: 0x3d6631,
      roughness: 0.9
    });
    const yellowFlowerMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.3,
      roughness: 0.5
    });
    const whiteFlowerMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4
    });

    for (let g = 0; g < 7; g++) {
      const bRad = 0.35 + (Math.random() * 0.2);
      const bMesh = new THREE.Mesh(new THREE.SphereGeometry(bRad, 12, 10), bushMat);
      bMesh.position.set(
        (Math.random() - 0.5) * 1.2,
        bRad * 0.8,
        -1.8 + g * 0.65
      );
      bMesh.castShadow = true;
      gardenGroup.add(bMesh);

      // Flower blossoms on bushes
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
    // 1. Solar Energy Flow: Rooftop Panels -> Eaves -> Left Wall Conduit -> Home Battery
    const solarPathPoints = [
      new THREE.Vector3(-0.1, 4.2, 1.2),
      new THREE.Vector3(-2.3, 3.9, 1.3),
      new THREE.Vector3(-3.7, 3.2, 1.5),
      new THREE.Vector3(-3.7, 2.1, 0.9),
      new THREE.Vector3(-3.7, 1.4, 0.4)
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

    // 2. Water Flow Particles: Rainwater Tank -> In-floor conduit
    const waterPathPoints = [
      new THREE.Vector3(-3.65, 0.4, -1.8),
      new THREE.Vector3(-2.4, 0.35, -1.2),
      new THREE.Vector3(-0.8, 0.35, -0.4),
      new THREE.Vector3(1.2, 0.35, -0.4)
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
        pos: new THREE.Vector3(-0.1, 4.75, 1.4),
        color: 0xfbbf24
      },
      {
        id: 'living',
        name: 'Living Room & Smart Hub',
        desc: 'Current draw 1.3 kW • 24°C Comfort Temp • Smart lighting & OLED Hub active',
        pos: new THREE.Vector3(-0.8, 1.8, 0.6),
        color: 0x2dd4bf
      },
      {
        id: 'battery',
        name: 'Home Energy Storage',
        desc: '13.5 kWh Capacity • 82% Charged • Ready for evening peak hours with zero grid costs',
        pos: new THREE.Vector3(-4.1, 1.7, 0.35),
        color: 0x34d399
      },
      {
        id: 'water',
        name: 'Rainwater & Pressure Pump',
        desc: '42 L Used Today • Pressure Pump: 1.2 kW • Rain harvesting cistern 78% full',
        pos: new THREE.Vector3(-3.9, 1.4, -2.1),
        color: 0x38bdf8
      }
    ];

    zones.forEach(zone => {
      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(zone.pos);
      beaconGroup.userData = zone;

      // Inner glowing core
      const coreGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const coreMat = new THREE.MeshStandardMaterial({
        color: zone.color,
        emissive: zone.color,
        emissiveIntensity: 2.2,
        roughness: 0.2
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      beaconGroup.add(coreMesh);

      // Pulsing outer ripple ring
      const ringGeo = new THREE.RingGeometry(0.18, 0.26, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: zone.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
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

    // Pointer Down (Mouse & Touch)
    const onPointerDown = (e) => {
      this.isDragging = true;
      this.autoRotate = false; // Pause spin while user controls view
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.prevPointer = { x: clientX, y: clientY };
    };

    // Pointer Move (Mouse & Touch Orbit)
    const onPointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (this.isDragging) {
        const deltaX = clientX - this.prevPointer.x;
        const deltaY = clientY - this.prevPointer.y;

        // Azimuthal angle (yaw)
        this.orbit.targetTheta -= deltaX * 0.007;

        // Polar elevation angle (pitch)
        this.orbit.targetPhi -= deltaY * 0.006;
        this.orbit.targetPhi = Math.max(this.orbit.minPhi, Math.min(this.orbit.maxPhi, this.orbit.targetPhi));

        this.prevPointer = { x: clientX, y: clientY };
      }

      // Check Hotspot Raycasting Hover
      if (!this.isDragging && !e.touches) {
        const rect = el.getBoundingClientRect();
        this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        this.checkHotspotHover();
      }
    };

    // Pointer Up
    const onPointerUp = () => {
      this.isDragging = false;
    };

    // Mouse Wheel Zoom
    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.012;
      this.orbit.targetRadius = Math.max(
        this.orbit.minRadius,
        Math.min(this.orbit.maxRadius, this.orbit.targetRadius + zoomFactor)
      );
    };

    // Click Detection for Hotspots
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

    // Touch Support
    el.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // HUD Close button
    const closeHudBtn = document.getElementById('hud-close-btn');
    if (closeHudBtn) {
      closeHudBtn.addEventListener('click', () => {
        const hud = document.getElementById('hotspot-hud');
        if (hud) hud.classList.add('hidden');
      });
    }

    // Responsive Canvas Resize
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
      // Smooth Damping Lerp
      this.orbit.radius += (this.orbit.targetRadius - this.orbit.radius) * this.orbit.damping;
      this.orbit.theta += (this.orbit.targetTheta - this.orbit.theta) * this.orbit.damping;
      this.orbit.phi += (this.orbit.targetPhi - this.orbit.phi) * this.orbit.damping;
      this.orbit.center.lerp(this.orbit.targetCenter, this.orbit.damping);
    }

    // Convert Spherical Coordinates (Radius, Theta, Phi) to 3D Cartesian (X, Y, Z)
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
    this.orbit.targetRadius = Math.max(this.orbit.minRadius, this.orbit.targetRadius - 2.2);
  }

  zoomOut() {
    this.orbit.targetRadius = Math.min(this.orbit.maxRadius, this.orbit.targetRadius + 2.2);
  }

  resetCamera() {
    this.currentZone = 'overview';
    this.orbit.targetRadius = 13.5;
    this.orbit.targetTheta = 0.85;
    this.orbit.targetPhi = 1.05;
    this.orbit.targetCenter.set(0, 1.3, 0);
  }

  focusOnZone(zoneKey) {
    this.currentZone = zoneKey;
    const presets = {
      overview: {
        radius: 13.5,
        theta: 0.85,
        phi: 1.05,
        center: new THREE.Vector3(0, 1.3, 0)
      },
      solar: {
        radius: 7.2,
        theta: 0.35,
        phi: 0.72,
        center: new THREE.Vector3(-0.2, 3.8, 1.2)
      },
      living: {
        radius: 6.8,
        theta: 0.55,
        phi: 1.22,
        center: new THREE.Vector3(-0.4, 1.1, 0.4)
      },
      bedroom: {
        radius: 7.5,
        theta: 0.95,
        phi: 1.15,
        center: new THREE.Vector3(1.2, 1.3, -1.0)
      },
      battery: {
        radius: 5.6,
        theta: 1.55,
        phi: 1.25,
        center: new THREE.Vector3(-3.7, 1.35, 0.35)
      },
      water: {
        radius: 5.8,
        theta: 2.15,
        phi: 1.28,
        center: new THREE.Vector3(-3.5, 0.85, -2.1)
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

    // 1. Auto-rotation when active
    if (this.autoRotate && !this.isDragging) {
      this.orbit.targetTheta += this.autoRotateSpeed;
    }

    // 2. Smooth Camera Interpolation
    this.updateCameraPosition(false);

    // 3. Day / Night Dynamic Smooth Lighting Lerp
    const targetSunIntensity = this.isDayMode ? 1.35 : 0.08;
    const targetHemiIntensity = this.isDayMode ? 0.55 : 0.18;
    const targetInteriorIntensity = this.isDayMode ? 0.85 : 2.4; // Glowing cozy warm interior at night!
    const targetBatteryGlow = this.isDayMode ? 0.45 : 1.2;

    this.lights.sun.intensity += (targetSunIntensity - this.lights.sun.intensity) * 0.05;
    this.lights.hemi.intensity += (targetHemiIntensity - this.lights.hemi.intensity) * 0.05;
    this.lights.interiorSpot.intensity += (targetInteriorIntensity - this.lights.interiorSpot.intensity) * 0.05;
    this.lights.batteryGlow.intensity += (targetBatteryGlow - this.lights.batteryGlow.intensity) * 0.05;

    // Background sky color lerp
    const targetBg = this.isDayMode ? new THREE.Color(0x0f1d24) : new THREE.Color(0x070c14);
    this.scene.background.lerp(targetBg, 0.05);
    this.scene.fog.color.lerp(targetBg, 0.05);

    // 4. Solar Energy Particle Pulse Stream
    if (this.solarCurve) {
      this.solarParticles.forEach(p => {
        p.userData.t = (p.userData.t + p.userData.speed) % 1.0;
        const pt = this.solarCurve.getPoint(p.userData.t);
        p.position.copy(pt);
        const pulseScale = 1.0 + 0.3 * Math.sin(time * 6 + p.userData.t * 10);
        p.scale.set(pulseScale, pulseScale, pulseScale);
      });
    }

    // 5. Water Particle Flow
    if (this.waterCurve) {
      this.waterParticles.forEach(wp => {
        wp.userData.t = (wp.userData.t + wp.userData.speed) % 1.0;
        const pt = this.waterCurve.getPoint(wp.userData.t);
        wp.position.copy(pt);
      });
    }

    // 6. Breathing Battery LED Indicator Pulse
    const ledPulse = 1.2 + 0.4 * Math.sin(time * 3.5);
    this.batteryLedMaterials.forEach(m => {
      m.emissiveIntensity = ledPulse;
    });

    // 7. Hotspot Ring Ripple Animation
    this.hotspots.forEach(h => {
      const ringScale = 1.0 + 0.35 * Math.sin(time * 3.0);
      h.ring.scale.set(ringScale, ringScale, 1.0);
      h.ring.material.opacity = 0.8 - (ringScale - 1.0) * 1.5;
    });

    // 8. Render Frame
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
