// HomeResource — Landing & Signup Page Controller
import { api } from '../api/endpoints.js';
import { storage } from '../utils/storage.js';
import { getDemoToken } from '../api/client.js';

document.addEventListener('DOMContentLoaded', () => {
  setupAuthModal();
  setupThemeToggle();
});

function setupAuthModal() {
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('auth-close-btn');
  const tabSignup = document.getElementById('tab-signup-btn');
  const tabLogin = document.getElementById('tab-login-btn');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const errorBox = document.getElementById('auth-error-msg');
  const guestBtn = document.getElementById('guest-demo-btn');

  // Trigger buttons
  const navLogin = document.getElementById('nav-login-btn');
  const navSignup = document.getElementById('nav-signup-btn');
  const heroStart = document.getElementById('hero-start-btn');
  const heroWatch = document.getElementById('hero-watch-btn');

  function openModal(defaultTab = 'signup') {
    if (!modal) return;
    modal.classList.add('active');
    switchTab(defaultTab);
    if (errorBox) errorBox.style.display = 'none';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
  }

  function switchTab(tab) {
    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    } else {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      signupForm.style.display = 'block';
      loginForm.style.display = 'none';
    }
  }

  if (navLogin) navLogin.addEventListener('click', () => openModal('login'));
  if (navSignup) navSignup.addEventListener('click', () => openModal('signup'));
  if (heroStart) heroStart.addEventListener('click', () => openModal('signup'));
  if (heroWatch) {
    heroWatch.addEventListener('click', () => {
      // Direct jump to live interactive 3D dashboard
      window.location.href = './dashboard.html';
    });
  }

  // Hook up SVG Badges & Eco-Home clicks to open Signup Modal
  document.querySelectorAll('[data-auth-trigger="signup"]').forEach((el) => {
    el.addEventListener('click', () => openModal('signup'));
  });

  const svgHome = document.getElementById('svg-eco-home');
  if (svgHome) {
    svgHome.addEventListener('click', () => openModal('signup'));
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (tabSignup) tabSignup.addEventListener('click', () => switchTab('signup'));
  if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));

  // 1-Click Instant Guest Demo Access
  if (guestBtn) {
    guestBtn.addEventListener('click', async () => {
      guestBtn.disabled = true;
      guestBtn.innerHTML = '<span>⏳</span> Loading Demo Environment...';
      try {
        await getDemoToken();
      } catch (err) {
        console.warn('Demo login fallback:', err);
        storage.setToken('demo-guest-token-2026');
        storage.setUser({ full_name: 'Alex Rivera', email: 'demo@homeresource.io' });
        storage.setHouseholdId(1);
      }
      window.location.href = './dashboard.html';
    });
  }

  // Handle Signup Submission
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('signup-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';

      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const fullName = document.getElementById('signup-name').value.trim() || 'Alex Rivera';
      const householdName = document.getElementById('signup-household').value.trim() || 'My Eco Home';

      try {
        const res = await api.auth.register({
          email,
          password,
          full_name: fullName,
          household_name: householdName
        });

        const token = (res && (res.token || res.access_token)) ? (res.token || res.access_token) : 'demo-static-token';
        storage.setToken(token);
        storage.setUser(res && res.user ? res.user : { full_name: fullName, email });
        storage.setHouseholdId(res && res.household_id ? res.household_id : 1);
        window.location.href = './dashboard.html';
      } catch (err) {
        console.warn('Signup API fallback:', err);
        storage.setToken('demo-static-token');
        storage.setUser({ full_name: fullName, email });
        storage.setHouseholdId(1);
        window.location.href = './dashboard.html';
      }
    });
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('login-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing In...';

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const res = await api.auth.login(email, password);
        const token = (res && (res.token || res.access_token)) ? (res.token || res.access_token) : 'demo-static-token';
        storage.setToken(token);
        storage.setUser(res && res.user ? res.user : { full_name: 'Alex Rivera', email: email || 'demo@homeresource.io' });
        storage.setHouseholdId(res && res.household_id ? res.household_id : 1);
        window.location.href = './dashboard.html';
      } catch (err) {
        console.warn('Login API fallback:', err);
        storage.setToken('demo-static-token');
        storage.setUser({ full_name: 'Alex Rivera', email: email || 'demo@homeresource.io' });
        storage.setHouseholdId(1);
        window.location.href = './dashboard.html';
      }
    });
  }

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    }
  }
}

function setupThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (!themeBtn) return;

  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('day-theme');
    const isDay = document.body.classList.contains('day-theme');
    themeBtn.style.color = isDay ? '#2dd4bf' : '#94a3b8';
  });
}
