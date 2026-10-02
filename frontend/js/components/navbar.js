// Shared Responsive Navbar Component
import { storage } from '../utils/storage.js';

export function renderNavbar(activePage = 'home') {
  const navContainer = document.getElementById('navbar-mount');
  if (!navContainer) return;

  const isAuth = storage.isAuthenticated();
  const user = storage.getUser();
  const userName = user?.full_name || (isAuth ? 'Account' : 'Demo User');

  navContainer.innerHTML = `
    <header class="site-header">
      <div class="container nav-container">
        <a href="/" class="logo-brand">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
          </div>
          <span>HomeResource</span>
        </a>

        <ul class="nav-links">
          <li><a href="/" class="nav-link ${activePage === 'home' ? 'active' : ''}">Overview</a></li>
          <li><a href="/dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a></li>
          <li><a href="/simulator.html" class="nav-link ${activePage === 'simulator' ? 'active' : ''}">What-If Simulator</a></li>
          <li><a href="/settings.html" class="nav-link ${activePage === 'settings' ? 'active' : ''}">Settings & Export</a></li>
        </ul>

        <div class="nav-actions">
          <span class="badge badge-demo">Demo Mode</span>
          <button id="auth-btn" class="btn btn-outline btn-sm">
            ${isAuth ? `<span>${userName}</span> (Logout)` : 'Sign In'}
          </button>
        </div>
      </div>
    </header>
  `;

  const authBtn = document.getElementById('auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      if (storage.isAuthenticated()) {
        storage.clear();
        window.location.reload();
      } else {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
          loginModal.classList.add('active');
        } else {
          // Quick demo login
          storage.setToken('demo-token');
          storage.setUser({ full_name: 'Alex Rivera', email: 'demo@homeresource.local' });
          storage.setHouseholdId(1);
          window.location.reload();
        }
      }
    });
  }
}
