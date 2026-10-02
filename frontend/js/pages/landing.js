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
      window.location.href = '/dashboard.html';
    });
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
      try {
        guestBtn.disabled = true;
        guestBtn.innerHTML = '<span>⏳</span> Loading Demo Environment...';
        await getDemoToken();
        window.location.href = '/dashboard.html';
      } catch (err) {
        showError('Could not start demo: ' + err.message);
        guestBtn.disabled = false;
        guestBtn.innerHTML = '<span>⚡</span> Continue as Guest (Instant Demo Access)';
      }
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
      const fullName = document.getElementById('signup-name').value.trim();
      const householdName = document.getElementById('signup-household').value.trim() || 'My Eco Home';

      try {
        const res = await api.auth.register({
          email,
          password,
          full_name: fullName,
          household_name: householdName
        });

        if (res && res.token) {
          storage.setToken(res.token);
          if (res.user) storage.setUser(res.user);
          if (res.household_id) storage.setHouseholdId(res.household_id);
          window.location.href = '/dashboard.html';
        } else {
          // Auto login after register
          const loginRes = await api.auth.login(email, password);
          storage.setToken(loginRes.token);
          if (loginRes.user) storage.setUser(loginRes.user);
          window.location.href = '/dashboard.html';
        }
      } catch (err) {
        showError(err.message || 'Registration failed. Email may already be in use.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get Started — Free';
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
        storage.setToken(res.token);
        if (res.user) storage.setUser(res.user);
        window.location.href = '/dashboard.html';
      } catch (err) {
        showError(err.message || 'Invalid email or password.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Dashboard';
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
