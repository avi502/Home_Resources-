// Interactive 3D Eco-Smart Home Component using Three.js
// Features: Full 360 Orbit, Smooth Zooming, Cinematic Room Focus, Energy Particle Flow, Hotspot Tracking

export class SmartHome3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Container #${containerId} not found.`);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.houseGroup = null;
    this.particlesGroup = null;
    this.solarPanels = [];
    this.interiorLights = [];
    this.hotspots = [];

    // Orbit & Zoom State
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0.45, y: -0.75 };
    this.currentRotation = { x: 0.45, y: -0.75 };
    this.targetDistance = 24;
    this.currentDistance = 24;
    this.minDistance = 10;
    this.maxDistance = 38;
    this.autoRotate = true;
    this.autoRotateSpeed = 0.003;
    this.isDayMode = true;

    // Camera target for smooth tweening
    this.cameraTarget = new THREE.Vector3(0, 1.5, 0);
    this.currentLookAt = new THREE.Vector3(0, 1.5, 0);

    this.init();
  }

  init() {
    if (!window.THREE) {
      console.error('Three.js library is not loaded');
      return;
    }

    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 520;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent to blend with glass card

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.updateCameraPosition();

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Build 3D Eco-Home Model
    this.houseGroup = new THREE.Group();
    this.scene.add(this.houseGroup);
    this.buildHouseModel();

    // 6. Energy & Water Particle Flow Animations
    this.setupParticleFlows();

    // 7. Event Listeners for Orbit & Zoom
    this.setupControls();

    // 8. Setup 3D Hotspot Anchors
    this.setup3DHotspots();

    // 9. Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // 10. Handle Resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient Soft Light
    this.ambientLight = new THREE.AmbientLight(0xd4e9e2, 0.9);
    this.scene.add(this.ambientLight);

    // Main Sun Directional Light
    this.sunLight = new THREE.DirectionalLight(0xfff7e6, 1.6);
    this.sunLight.position.set(16, 26, 14);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 60;
    this.sunLight.shadow.bias = -0.0005;
    const d = 14;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    // Soft Blue Sky Hemispheric Light
    this.hemiLight = new THREE.HemisphereLight(0x2dd4bf, 0x0f2427, 0.45);
    this.scene.add(this.hemiLight);

    // Cozy Living Room Interior Spotlight
    const livingLight = new THREE.PointLight(0xffb050, 1.8, 12, 1.5);
    livingLight.position.set(0.5, 2.2, 1);
    this.scene.add(livingLight);
    this.interiorLights.push(livingLight);

    // Upper Bedroom Light
    const bedLight = new THREE.PointLight(0xffe2b8, 1.4, 8, 1.5);
    bedLight.position.set(1.2, 5.2, -0.8);
    this.scene.add(bedLight);
    this.interiorLights.push(bedLight);
  }

  buildHouseModel() {
    const materials = {
      grass: new THREE.MeshStandardMaterial({ color: 0x1f4a38, roughness: 0.8, metalness: 0.1 }),
      earth: new THREE.MeshStandardMaterial({ color: 0x122624, roughness: 0.9 }),
      foundation: new THREE.MeshStandardMaterial({ color: 0x223637, roughness: 0.6 }),
      stuccoWhite: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 }),
      stuccoDark: new THREE.MeshStandardMaterial({ color: 0x1b2f33, roughness: 0.5 }),
      woodSiding: new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.6 }),
      woodFloor: new THREE.MeshStandardMaterial({ color: 0x8a5d3b, roughness: 0.4 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x8be9fd,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        transmission: 0.85,
        thickness: 0.5
      }),
      solarCell: new THREE.MeshStandardMaterial({
        color: 0x0f1d30,
        roughness: 0.15,
        metalness: 0.85,
        emissive: 0x07111c,
        emissiveIntensity: 0.2
      }),
      solarFrame: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 }),
      batteryCase: new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.2 }),
      batteryGlow: new THREE.MeshBasicMaterial({ color: 0x2dd4bf }),
      sofa: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }),
      furnitureWood: new THREE.MeshStandardMaterial({ color: 0x644123, roughness: 0.5 }),
      tvScreen: new THREE.MeshBasicMaterial({ color: 0x020617 }),
      pipeWater: new THREE.MeshPhysicalMaterial({
        color: 0x2dd4bf,
        transparent: true,
        opacity: 0.7,
        roughness: 0.2,
        emissive: 0x0d9488,
        emissiveIntensity: 0.4
      }),
      bedSheet: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }),
      foliage: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 }),
      pavers: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 })
    };

    // 1. Ground Island with 3D Cutaway Soil Bed
    const islandGeo = new THREE.BoxGeometry(16, 1.2, 16);
    const island = new THREE.Mesh(islandGeo, materials.earth);
    island.position.y = -0.6;
    island.receiveShadow = true;
    this.houseGroup.add(island);

    // Top Lawn
    const lawnGeo = new THREE.BoxGeometry(15.9, 0.15, 15.9);
    const lawn = new THREE.Mesh(lawnGeo, materials.grass);
    lawn.position.y = 0.05;
    lawn.receiveShadow = true;
    this.houseGroup.add(lawn);

    // Stone Garden Walkway
    for (let i = 0; i < 5; i++) {
      const paver = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.7), materials.pavers);
      paver.position.set(-2.5 - i * 0.9, 0.14, 4.5 + i * 0.4);
      paver.rotation.y = 0.2;
      paver.receiveShadow = true;
      this.houseGroup.add(paver);
    }

    // 2. Concrete House Foundation Slab
    const slabGeo = new THREE.BoxGeometry(10.5, 0.4, 9.5);
    const slab = new THREE.Mesh(slabGeo, materials.foundation);
    slab.position.set(0.5, 0.2, 0.2);
    slab.receiveShadow = true;
    this.houseGroup.add(slab);

    // Hardwood Flooring
    const floorGeo = new THREE.BoxGeometry(10.2, 0.05, 9.2);
    const floor = new THREE.Mesh(floorGeo, materials.woodFloor);
    floor.position.set(0.5, 0.42, 0.2);
    floor.receiveShadow = true;
    this.houseGroup.add(floor);

    // 3. Ground Floor Walls (Architectural Cutaway: Front and Right Open for Interior View)
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.4, 0.35), materials.stuccoWhite);
    backWall.position.set(0.5, 2.1, -4.3);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.houseGroup.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 9.2), materials.stuccoWhite);
    leftWall.position.set(-4.6, 2.1, 0.2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.houseGroup.add(leftWall);

    // Partial Dividing Wall with Cedar Slats
    const partition = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 4.5), materials.woodSiding);
    partition.position.set(-0.5, 2.1, -2);
    partition.castShadow = true;
    this.houseGroup.add(partition);

    // 4. Living Room Interior Details (Open Cutaway)
    // Sectional Couch
    const couchBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 1.4), materials.sofa);
    couchBase.position.set(2.0, 0.65, 1.2);
    couchBase.castShadow = true;
    this.houseGroup.add(couchBase);

    const couchBack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.7, 0.4), materials.sofa);
    couchBack.position.set(2.0, 1.1, 0.5);
    couchBack.castShadow = true;
    this.houseGroup.add(couchBack);

    const couchL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.6), materials.sofa);
    couchL.position.set(3.0, 0.65, 2.3);
    couchL.castShadow = true;
    this.houseGroup.add(couchL);

    // Coffee Table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), materials.furnitureWood);
    tableTop.position.set(1.8, 0.6, 2.5);
    tableTop.castShadow = true;
    this.houseGroup.add(tableTop);

    // TV Media Stand & TV
    const tvStand = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.45, 0.6), materials.furnitureWood);
    tvStand.position.set(2.0, 0.62, 4.2);
    tvStand.castShadow = true;
    this.houseGroup.add(tvStand);

    const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.08), materials.tvScreen);
    tvScreen.position.set(2.0, 1.6, 4.2);
    tvScreen.castShadow = true;
    this.houseGroup.add(tvScreen);

    // Potted Indoor Plant
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.6, 16), materials.stuccoWhite);
    pot.position.set(4.0, 0.7, 3.8);
    pot.castShadow = true;
    this.houseGroup.add(pot);

    const plantLeaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), materials.foliage);
    plantLeaves.position.set(4.0, 1.3, 3.8);
    plantLeaves.castShadow = true;
    this.houseGroup.add(plantLeaves);

    // 5. Upper Floor (Cantilevered Bedroom Suite & Terrace)
    const upperFloorSlab = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.35, 7.5), materials.stuccoWhite);
    upperFloorSlab.position.set(1.5, 3.8, -0.6);
    upperFloorSlab.castShadow = true;
    upperFloorSlab.receiveShadow = true;
    this.houseGroup.add(upperFloorSlab);

    // Upper Floor Wood Siding Cube (Bedroom)
    const upperBedWall = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.8, 0.25), materials.woodSiding);
    upperBedWall.position.set(2.4, 5.2, -4.2);
    upperBedWall.castShadow = true;
    this.houseGroup.add(upperBedWall);

    const upperBedSideWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 5.0), materials.woodSiding);
    upperBedSideWall.position.set(5.0, 5.2, -1.8);
    upperBedSideWall.castShadow = true;
    this.houseGroup.add(upperBedSideWall);

    // Large Bedroom Window
    const bedWindow = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 0.1), materials.glass);
    bedWindow.position.set(2.6, 5.2, 0.6);
    this.houseGroup.add(bedWindow);

    // Bed Furniture
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 2.8), materials.furnitureWood);
    bedFrame.position.set(3.2, 4.15, -2.2);
    bedFrame.castShadow = true;
    this.houseGroup.add(bedFrame);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 2.6), materials.bedSheet);
    mattress.position.set(3.2, 4.5, -2.2);
    mattress.castShadow = true;
    this.houseGroup.add(mattress);

    const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.6), materials.bedSheet);
    pillow.position.set(3.2, 4.7, -3.1);
    this.houseGroup.add(pillow);

    // 6. Rooftop Photovoltaic Solar Array (Blueprint Section 1 & Reference Design)
    const roofGeo = new THREE.BoxGeometry(6.4, 0.25, 7.8);
    const roof = new THREE.Mesh(roofGeo, materials.stuccoDark);
    roof.position.set(-1.8, 6.7, -0.4);
    roof.rotation.z = -0.12; // Realistic slight tilt towards sunlight
    roof.castShadow = true;
    roof.receiveShadow = true;
    this.houseGroup.add(roof);

    // 8 Detailed Solar Panels Arranged in 2x4 Grid
    const panelGeo = new THREE.BoxGeometry(1.3, 0.08, 1.6);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        const panel = new THREE.Mesh(panelGeo, materials.solarCell);
        panel.position.set(-2.6 + c * 1.5, 6.95 + c * 0.18, -2.8 + r * 1.8);
        panel.rotation.z = -0.12;
        panel.castShadow = true;
        this.houseGroup.add(panel);
        this.solarPanels.push(panel);
      }
    }

    // 7. High-Tech Exterior Wall Battery Storage Pack (Section 6 Cascading)
    const batteryPack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 1.1), materials.batteryCase);
    batteryPack.position.set(5.15, 1.7, -1.8);
    batteryPack.castShadow = true;
    this.houseGroup.add(batteryPack);

    // Battery LED Charge Meter (3 Glowing Green/Cyan Bars)
    for (let b = 0; b < 3; b++) {
      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.6), materials.batteryGlow);
      ledBar.position.set(5.34, 1.4 + b * 0.25, -1.8);
      this.houseGroup.add(ledBar);
    }

    // 8. Subterranean Water Well & Booster Pump Loop (Cutaway)
    const wellPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 16), materials.pipeWater);
    wellPipe.position.set(3.8, -0.8, -2.5);
    this.houseGroup.add(wellPipe);

    const pumpModule = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), materials.stuccoDark);
    pumpModule.position.set(3.8, 0.4, -2.5);
    pumpModule.castShadow = true;
    this.houseGroup.add(pumpModule);

    // 9. Outdoor Landscaping (Trees & Patio Planters)
    this.createTree(-5.2, 0.1, -4.8, materials);
    this.createTree(5.8, 0.1, 4.8, materials);
  }

  createTree(x, y, z, materials) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 8), materials.furnitureWood);
    trunk.position.set(x, y + 0.7, z);
    trunk.castShadow = true;
    this.houseGroup.add(trunk);

    const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 8), materials.foliage);
    foliage.position.set(x, y + 2.2, z);
    foliage.castShadow = true;
    this.houseGroup.add(foliage);
  }

  setupParticleFlows() {
    this.particlesGroup = new THREE.Group();
    this.scene.add(this.particlesGroup);

    // 1. Solar Energy Flow Particles (Gold particles traveling from roof to battery)
    const solarCount = 45;
    const solarGeo = new THREE.BufferGeometry();
    const solarPos = new Float32Array(solarCount * 3);
    this.solarFlowProgress = new Float32Array(solarCount);

    for (let i = 0; i < solarCount; i++) {
      this.solarFlowProgress[i] = i / solarCount;
      solarPos[i * 3] = -1.5;
      solarPos[i * 3 + 1] = 6.8;
      solarPos[i * 3 + 2] = -0.5;
    }

    solarGeo.setAttribute('position', new THREE.BufferAttribute(solarPos, 3));
    const solarMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.28,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.solarPoints = new THREE.Points(solarGeo, solarMat);
    this.particlesGroup.add(this.solarPoints);

    // 2. Water Flow Particles (Cyan particles traveling from pump into plumbing)
    const waterCount = 35;
    const waterGeo = new THREE.BufferGeometry();
    const waterPos = new Float32Array(waterCount * 3);
    this.waterFlowProgress = new Float32Array(waterCount);

    for (let i = 0; i < waterCount; i++) {
      this.waterFlowProgress[i] = i / waterCount;
      waterPos[i * 3] = 3.8;
      waterPos[i * 3 + 1] = 0.2;
      waterPos[i * 3 + 2] = -2.5;
    }

    waterGeo.setAttribute('position', new THREE.BufferAttribute(waterPos, 3));
    const waterMat = new THREE.PointsMaterial({
      color: 0x2dd4bf,
      size: 0.24,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.waterPoints = new THREE.Points(waterGeo, waterMat);
    this.particlesGroup.add(this.waterPoints);
  }

  updateParticles() {
    if (!this.solarPoints || !this.waterPoints) return;

    // Solar particle curve: Solar Roof (-1.5, 6.8, -0.5) -> Exterior Wall (5.1, 2.5, -1.8) -> Battery Pack (5.15, 1.7, -1.8)
    const solarPos = this.solarPoints.geometry.attributes.position.array;
    for (let i = 0; i < this.solarFlowProgress.length; i++) {
      this.solarFlowProgress[i] = (this.solarFlowProgress[i] + 0.008) % 1.0;
      const t = this.solarFlowProgress[i];

      // Interpolate along conduit
      let x, y, z;
      if (t < 0.6) {
        const sub = t / 0.6;
        x = -1.5 + sub * (5.1 - (-1.5));
        y = 6.8 - sub * 4.3;
        z = -0.5 + sub * (-1.8 - (-0.5));
      } else {
        const sub = (t - 0.6) / 0.4;
        x = 5.1;
        y = 2.5 - sub * 0.8;
        z = -1.8;
      }

      solarPos[i * 3] = x;
      solarPos[i * 3 + 1] = y;
      solarPos[i * 3 + 2] = z;
    }
    this.solarPoints.geometry.attributes.position.needsUpdate = true;

    // Water flow particle movement: Up well pump (3.8, -1.8, -2.5) -> through ground slab (3.8, 0.4, -2.5) -> to kitchen (1.0, 0.4, 0.0)
    const waterPos = this.waterPoints.geometry.attributes.position.array;
    for (let i = 0; i < this.waterFlowProgress.length; i++) {
      this.waterFlowProgress[i] = (this.waterFlowProgress[i] + 0.007) % 1.0;
      const t = this.waterFlowProgress[i];

      let x, y, z;
      if (t < 0.5) {
        const sub = t / 0.5;
        x = 3.8;
        y = -1.8 + sub * 2.2;
        z = -2.5;
      } else {
        const sub = (t - 0.5) / 0.5;
        x = 3.8 - sub * 2.8;
        y = 0.4;
        z = -2.5 + sub * 2.5;
      }

      waterPos[i * 3] = x;
      waterPos[i * 3 + 1] = y;
      waterPos[i * 3 + 2] = z;
    }
    this.waterPoints.geometry.attributes.position.needsUpdate = true;
  }

  setupControls() {
    const el = this.renderer.domElement;

    // Mouse Down
    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
      this.autoRotate = false; // Pause auto-rotate during user interaction
    });

    // Mouse Move
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.prevMouse = { x: e.clientX, y: e.clientY };

      this.targetRotation.y += dx * 0.008;
      this.targetRotation.x = Math.max(0.1, Math.min(Math.PI / 2.2, this.targetRotation.x + dy * 0.008));
    });

    // Mouse Up
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Mouse Wheel Zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetDistance += e.deltaY * 0.02;
      this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
    }, { passive: false });

    // Touch Support for Mobile / Tablets
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

        this.targetRotation.y += dx * 0.008;
        this.targetRotation.x = Math.max(0.1, Math.min(Math.PI / 2.2, this.targetRotation.x + dy * 0.008));
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = initialTouchDist - dist;
        initialTouchDist = dist;
        this.targetDistance += diff * 0.05;
        this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
      }
    }, { passive: false });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  updateCameraPosition() {
    // Spherical coordinates from rotation and distance
    const r = this.currentDistance;
    const phi = this.currentRotation.x;
    const theta = this.currentRotation.y;

    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.cos(theta);

    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y,
      this.cameraTarget.z + z
    );
    this.currentLookAt.lerp(this.cameraTarget, 0.08);
    this.camera.lookAt(this.currentLookAt);
  }

  setup3DHotspots() {
    this.hotspots = [
      {
        id: 'solar',
        title: 'Rooftop Solar Array',
        subtitle: 'Peak 3.8 kW • 94% Efficiency',
        worldPos: new THREE.Vector3(-1.8, 7.2, 0),
        camTarget: new THREE.Vector3(-1.5, 6.5, 0),
        camDistance: 14,
        camRot: { x: 0.6, y: -0.5 }
      },
      {
        id: 'bedroom',
        title: 'Upper Bedroom Zone',
        subtitle: '28°C • Automated Shading',
        worldPos: new THREE.Vector3(2.8, 5.4, -1.0),
        camTarget: new THREE.Vector3(2.5, 4.8, -0.8),
        camDistance: 13,
        camRot: { x: 0.5, y: -1.2 }
      },
      {
        id: 'living',
        title: 'Open Living Room Cutaway',
        subtitle: '26°C • CO₂ 520 ppm • Draw 1.3 kW',
        worldPos: new THREE.Vector3(2.2, 1.8, 2.0),
        camTarget: new THREE.Vector3(1.8, 1.6, 2.0),
        camDistance: 12,
        camRot: { x: 0.35, y: -0.6 }
      },
      {
        id: 'battery',
        title: 'Wall Energy Storage Unit',
        subtitle: '82% Stored • 11.2 kWh Reserve',
        worldPos: new THREE.Vector3(5.3, 1.8, -1.8),
        camTarget: new THREE.Vector3(4.8, 1.6, -1.8),
        camDistance: 11,
        camRot: { x: 0.4, y: -1.57 }
      },
      {
        id: 'water',
        title: 'Ground Well & Cascading Loop',
        subtitle: '42 L Consumption • Ground Loop Active',
        worldPos: new THREE.Vector3(3.8, 0.3, -2.5),
        camTarget: new THREE.Vector3(3.6, 0.2, -2.5),
        camDistance: 13,
        camRot: { x: 0.45, y: -1.9 }
      }
    ];

    // Bind click events on hotspot DOM elements
    document.querySelectorAll('.hotspot-beacon').forEach(el => {
      el.addEventListener('click', () => {
        const zoneId = el.dataset.zone;
        this.focusOnZone(zoneId);
      });
    });
  }

  focusOnZone(zoneId) {
    const spot = this.hotspots.find(h => h.id === zoneId);
    if (!spot) return;

    this.autoRotate = false;
    this.cameraTarget.copy(spot.camTarget);
    this.targetDistance = spot.camDistance;
    this.targetRotation.x = spot.camRot.x;
    this.targetRotation.y = spot.camRot.y;

    // Show HUD
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
    this.cameraTarget.set(0, 1.5, 0);
    this.targetDistance = 24;
    this.targetRotation.x = 0.45;
    this.targetRotation.y = -0.75;
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
    if (this.isDayMode) {
      this.sunLight.intensity = 1.6;
      this.ambientLight.intensity = 0.9;
      this.ambientLight.color.setHex(0xd4e9e2);
      this.interiorLights.forEach(l => l.intensity = 1.4);
    } else {
      // Night Mode
      this.sunLight.intensity = 0.15;
      this.ambientLight.intensity = 0.35;
      this.ambientLight.color.setHex(0x112233);
      this.interiorLights.forEach(l => l.intensity = 3.2); // Warm cozy interior glows at night
    }
    return this.isDayMode;
  }

  updateHotspotScreenPositions() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    const tempV = new THREE.Vector3();

    this.hotspots.forEach(spot => {
      const el = document.querySelector(`.hotspot-beacon[data-zone="${spot.id}"]`);
      if (!el) return;

      tempV.copy(spot.worldPos);
      tempV.project(this.camera);

      // Check if behind camera
      if (tempV.z > 1) {
        el.style.display = 'none';
        return;
      }

      el.style.display = 'block';
      const screenX = (tempV.x * 0.5 + 0.5) * w;
      const screenY = (-(tempV.y * 0.5) + 0.5) * h;

      el.style.left = `${screenX}px`;
      el.style.top = `${screenY}px`;
    });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Auto-Rotate when idle
    if (this.autoRotate && !this.isDragging) {
      this.targetRotation.y += this.autoRotateSpeed;
    }

    // Smooth Interpolation (Damping)
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;
    this.currentDistance += (this.targetDistance - this.currentDistance) * 0.08;

    this.updateCameraPosition();
    this.updateParticles();
    this.updateHotspotScreenPositions();

    this.renderer.render(this.scene, this.camera);
  }
}
