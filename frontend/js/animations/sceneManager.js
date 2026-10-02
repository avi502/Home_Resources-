// Cinematic Scene Sequence Manager
// Implements Blueprint Section 5.A: "The Living Resource System"
// Scene 1: The First Drop (0-3s) -> Concentric ripples, logo appears
// Scene 2: Resources Connect (3-6s) -> Particles form energy lines & 5 resource nodes
// Scene 3: The Intelligent Home (6-10s) -> Modern sustainable home visualization

export class CinematicSceneManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.currentScene = 1;
    this.startTime = null;
    this.animationFrameId = null;
    this.ripples = [];
    this.droplet = { y: -50, speed: 7, radius: 4, hit: false };
    this.nodes = [];
    this.lines = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initNodes();
  }

  resize() {
    this.width = this.canvas.width = this.canvas.parentElement.clientWidth || window.innerWidth;
    this.height = this.canvas.height = this.canvas.parentElement.clientHeight || window.innerHeight;
  }

  initNodes() {
    // 5 Interconnected Resource Nodes (Blueprint Section 1)
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.28;

    const resourceConfigs = [
      { name: 'Electricity', color: '#FBBF24', angle: 0 },
      { name: 'Water', color: '#2DD4BF', angle: (2 * Math.PI) / 5 },
      { name: 'Time', color: '#38BDF8', angle: (4 * Math.PI) / 5 },
      { name: 'Money', color: '#34D399', angle: (6 * Math.PI) / 5 },
      { name: 'Food', color: '#FB923C', angle: (8 * Math.PI) / 5 },
    ];

    this.nodes = resourceConfigs.map(cfg => ({
      ...cfg,
      x: centerX + Math.cos(cfg.angle) * radius,
      y: centerY + Math.sin(cfg.angle) * radius,
      baseRadius: 16,
      pulse: 0
    }));
  }

  start() {
    this.startTime = performance.now();
    this.loop();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  setScene(sceneNum) {
    this.currentScene = sceneNum;
    document.querySelectorAll('.scene-step').forEach((el, idx) => {
      el.classList.toggle('active', idx + 1 === sceneNum);
    });
  }

  loop(currentTime = performance.now()) {
    const elapsedSeconds = (currentTime - this.startTime) / 1000;
    
    // Scene Progression (0-3s Scene 1, 3-6s Scene 2, 6-10s Scene 3)
    if (elapsedSeconds < 3.0) {
      if (this.currentScene !== 1) this.setScene(1);
      this.renderScene1(elapsedSeconds);
    } else if (elapsedSeconds < 6.5) {
      if (this.currentScene !== 2) this.setScene(2);
      this.renderScene2(elapsedSeconds - 3.0);
    } else {
      if (this.currentScene !== 3) this.setScene(3);
      this.renderScene3(elapsedSeconds - 6.5);
    }

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  // Scene 01: Water droplet falls, strikes water, generates concentric ripples
  renderScene1(time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const impactY = this.height * 0.58;

    // Background ambient glow
    const grad = ctx.createRadialGradient(centerX, impactY, 20, centerX, impactY, this.width * 0.6);
    grad.addColorStop(0, 'rgba(23, 61, 50, 0.45)');
    grad.addColorStop(1, 'rgba(11, 20, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Droplet physics
    if (!this.droplet.hit) {
      this.droplet.y += this.droplet.speed;
      this.droplet.speed += 0.35; // gravity

      ctx.beginPath();
      ctx.arc(centerX, this.droplet.y, this.droplet.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#2DD4BF';
      ctx.shadowColor = '#2DD4BF';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (this.droplet.y >= impactY) {
        this.droplet.hit = true;
        // Generate 3 concentric expanding ripples
        this.ripples = [
          { r: 2, maxR: 260, alpha: 0.9, speed: 2.8 },
          { r: 2, maxR: 220, alpha: 0.7, speed: 2.2, delay: 0.2 },
          { r: 2, maxR: 180, alpha: 0.5, speed: 1.6, delay: 0.4 }
        ];
      }
    }

    // Render expanding concentric ripples
    this.ripples.forEach(rip => {
      rip.r += rip.speed;
      const progress = rip.r / rip.maxR;
      const curAlpha = Math.max(0, rip.alpha * (1 - progress));

      ctx.beginPath();
      ctx.ellipse(centerX, impactY, rip.r, rip.r * 0.38, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(45, 212, 191, ${curAlpha})`;
      ctx.lineWidth = 2.5 * (1 - progress);
      ctx.shadowColor = '#2DD4BF';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }

  // Scene 02: Particles transform into flowing energy lines connecting nodes
  renderScene2(time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Draw interconnected flowing lines
    ctx.lineWidth = 1.5;
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[j];

        const lineGrad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
        lineGrad.addColorStop(0, n1.color + '66');
        lineGrad.addColorStop(0.5, '#D9A85B99');
        lineGrad.addColorStop(1, n2.color + '66');

        ctx.strokeStyle = lineGrad;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();

        // Flowing energy particle along line
        const particleOffset = ((time * 0.7) + (i * 0.2) + (j * 0.3)) % 1;
        const px = n1.x + (n2.x - n1.x) * particleOffset;
        const py = n1.y + (n2.y - n1.y) * particleOffset;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#D9A85B';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Draw resource nodes with glowing halos
    this.nodes.forEach(node => {
      node.pulse = Math.sin(time * 3 + node.angle) * 3;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.baseRadius + node.pulse, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label text
      ctx.font = '600 13px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#F3F0E7';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + node.baseRadius + 20);
    });
  }

  // Scene 03: The Intelligent Home & Floating Data Flow
  renderScene3(time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Draw glowing stylized architectural smart-home wireframe
    ctx.save();
    ctx.translate(centerX, centerY - 20);

    // House roof and walls
    ctx.strokeStyle = 'rgba(217, 168, 91, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#D9A85B';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    // Roof triangle
    ctx.moveTo(0, -90);
    ctx.lineTo(110, -10);
    ctx.lineTo(-110, -10);
    ctx.closePath();
    ctx.stroke();

    // Body rectangle
    ctx.strokeRect(-90, -10, 180, 120);

    // Warm solar window
    const windowAlpha = 0.5 + Math.sin(time * 2) * 0.3;
    ctx.fillStyle = `rgba(217, 168, 91, ${windowAlpha})`;
    ctx.fillRect(-45, 15, 90, 50);

    ctx.restore();

    // Floating resource streams entering the home
    const angles = [0.2, 1.4, 2.8, 4.1, 5.3];
    angles.forEach((ang, idx) => {
      const dist = 180 + Math.sin(time * 2 + idx) * 20;
      const x = centerX + Math.cos(ang + time * 0.2) * dist;
      const y = centerY + Math.sin(ang + time * 0.2) * dist;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = idx % 2 === 0 ? '#2DD4BF' : '#D9A85B';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }
}
