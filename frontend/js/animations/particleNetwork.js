// Three.js Interactive 3D Resource Network
// Blueprint Section 5.B: Interactive 3D resource network, particles and camera movement

export class ThreeResourceNetwork {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container || !window.THREE) return;

    this.isDisposed = false;
    this.init();
  }

  init() {
    const THREE = window.THREE;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0B1412, 0.002);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    this.camera.position.z = 240;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Particle Cloud Count based on device performance (mobile fallback)
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 300 : 900;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const emerald = new THREE.Color(0x2DD4BF);
    const amber = new THREE.Color(0xD9A85B);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 500;
      positions[i + 1] = (Math.random() - 0.5) * 500;
      positions[i + 2] = (Math.random() - 0.5) * 500;

      const mixed = emerald.clone().lerp(amber, Math.random());
      colors[i] = mixed.r;
      colors[i + 1] = mixed.g;
      colors[i + 2] = mixed.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    // Mouse Interaction
    this.mouseX = 0;
    this.mouseY = 0;
    this.onMouseMove = (e) => {
      this.mouseX = (e.clientX - window.innerWidth / 2) * 0.1;
      this.mouseY = (e.clientY - window.innerHeight / 2) * 0.1;
    };
    window.addEventListener('mousemove', this.onMouseMove);

    // Resize Handler
    this.onResize = () => {
      if (this.isDisposed) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.onResize);

    this.animate();
  }

  animate() {
    if (this.isDisposed) return;
    requestAnimationFrame(() => this.animate());

    this.particles.rotation.y += 0.0015;
    this.particles.rotation.x += 0.0008;

    // Smooth camera drift toward mouse
    this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.04;
    this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.04;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isDisposed = true;
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}
