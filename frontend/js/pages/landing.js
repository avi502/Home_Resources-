// Landing Page Controller
import { renderNavbar } from '../components/navbar.js';
import { CinematicSceneManager } from '../animations/sceneManager.js';
import { initScrollAnimations } from '../animations/scrollMotion.js';

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('home');

  const canvas = document.getElementById('cinematic-canvas');
  let sceneManager = null;

  if (canvas) {
    sceneManager = new CinematicSceneManager(canvas);
    sceneManager.start();

    // Allow user to click tracker steps to jump between Scene 1, 2, and 3
    document.querySelectorAll('.scene-step').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sceneNum = parseInt(btn.dataset.scene, 10);
        if (sceneManager) {
          sceneManager.setScene(sceneNum);
          if (sceneNum === 1) sceneManager.droplet.hit = false;
        }
      });
    });
  }

  initScrollAnimations();
});
