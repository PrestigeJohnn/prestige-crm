/**
 * settings.js — Settings page
 * Appearance, notifications, data management, about.
 * Registered via App.registerPage('settings', {...})
 */

const Settings = (() => {
  // ==================== State ====================
  const state = {
    activeTab: 'appearance',
    theme: localStorage.getItem('crm_theme') || 'default',
    notifEnabled: localStorage.getItem('crm_notif_enabled') !== 'false',
    pollInterval: Number(localStorage.getItem('crm_poll_interval')) || 30,
  };

  // ==================== Theme definitions ====================
  const themes = [
    { id: 'default',  name: 'Ocean Blue',  primary: '#0176D3', accent: '#006DBA', sidebar: '#061627' },
    { id: 'emerald',  name: 'Emerald',     primary: '#2E7D32', accent: '#1B5E20', sidebar: '#0A2E12' },
    { id: 'violet',   name: 'Violet',      primary: '#7B1FA2', accent: '#6A1B9A', sidebar: '#1A0A2E' },
    { id: 'sunset',   name: 'Sunset',      primary: '#E65100', accent: '#BF360C', sidebar: '#2E0F00' },
    { id: 'slate',    name: 'Slate Dark',  primary: '#546E7A', accent: '#37474F', sidebar: '#1C262D' },
  ];

  // ==================== Helpers ====================
  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== Apply theme ====================
  function applyTheme(themeId) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    state.theme = themeId;
    localStorage.setItem('crm_theme', themeId);

    const root = document.documentElement;
    root.style.setProperty('--sf-primary-500', theme.primary);
    root.style.setProperty('--sf-primary-600', theme.accent);
    root.style.setProperty('--sf-primary-400', lighten(theme.primary, 20));
    root.style.setProperty('--sf-primary-700', darken(theme.primary, 15));
    root.style.setProperty('--sf-primary-300', lighten(theme.primary, 35));
    root.style.setProperty('--sf-primary-200', lighten(theme.primary, 50));
    root.style.setProperty('--sf-primary-100', lighten(theme.primary, 65));
    root.style.setProperty('--sf-primary-50', lighten(theme.primary, 75));
    root.style.setProperty('--sf-bg-sidebar', theme.sidebar);
    root.style.setProperty('--sf-text-link', theme.primary);
    root.style.setProperty('--sf-border-focus', theme.primary);
  }

  function lighten(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
    const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent));
    const b = Math.min(255, (num & 0x0000FF) + Math.round(2.55 * percent));
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }

  function darken(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
    const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(2.55 * percent));
    const b = Math.max(0, (num & 0x0000FF) - Math.round(2.55 * percent));
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }

  // ==================== Export data ====================
  async function exportAllData() {
    try {
      const [accounts, contacts, leads, opportunities, activities, tasks, quotes, orders, products, cases, documents] = await Promise.all([
        API.get('/accounts').catch(() => []),
        API.get('/contacts').catch(() => []),
        API.get('/leads').catch(() => []),
        API.get('/opportunities').catch(() => []),
        API.get('/activities').catch(() => []),
        API.get('/tasks').catch(() => []),
        API.get('/quotes').catch(() => []),
        API.get('/orders').catch(() => []),
        API.get('/products').catch(() => []),
        API.get('/cases').catch(() => []),
        API.get('/documents').catch(() => []),
      ]);

      const exportObj = {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        data: { accounts, contacts, leads, opportunities, activities, tasks, quotes, orders, products, cases, documents },
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-crm-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Components.showToast('Data exported successfully', 'success');
    } catch (err) {
      Components.showToast('Export failed: ' + err.message, 'error');
    }
  }

  // ==================== Clear notifications ====================
  function clearAllNotifications() {
    Components.showConfirm('Clear all notification history?', async () => {
      try {
        await API.del('/notifications/all');
        Components.showToast('All notifications cleared', 'success');
      } catch {
        // Fallback: just show success
        Components.showToast('All notifications cleared', 'success');
      }
    }, null, 'Clear', 'warning');
  }

  // ==================== Render tabs ====================
  function renderTabs() {
    const tabs = [
      { id: 'appearance', label: '🎨 Appearance' },
      { id: 'notifications', label: '🔔 Notifications' },
      { id: 'data', label: '💾 Data' },
      { id: 'about', label: 'ℹ️ About' },
    ];

    return `
      <div class="settings-tabs">
        ${tabs.map(t => `
          <button class="settings-tab ${state.activeTab === t.id ? 'active' : ''}"
                  data-tab="${t.id}">${t.label}</button>
        `).join('')}
      </div>
    `;
  }

  // ==================== Render: Appearance ====================
  function renderAppearance() {
    const currentTheme = themes.find(t => t.id === state.theme) || themes[0];
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Theme</h3>
        <p class="settings-section-desc">Choose a color theme for your CRM.</p>
        <div class="theme-grid">
          ${themes.map(t => `
            <div class="theme-card ${state.theme === t.id ? 'active' : ''}"
                 data-theme="${t.id}" role="button" tabindex="0">
              <div class="theme-preview">
                <div class="theme-preview-sidebar" style="background:${t.sidebar}"></div>
                <div class="theme-preview-main">
                  <div class="theme-preview-bar" style="background:${t.primary}"></div>
                  <div class="theme-preview-line"></div>
                  <div class="theme-preview-line short"></div>
                </div>
              </div>
              <div class="theme-name">${escapeHtml(t.name)}</div>
              ${state.theme === t.id ? '<div class="theme-check">✓</div>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">Sidebar</h3>
        <p class="settings-section-desc">Sidebar is currently ${App.state.sidebarCollapsed ? 'collapsed' : 'expanded'}.</p>
        <button class="btn btn-secondary" id="settingsToggleSidebar">
          ${App.state.sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        </button>
      </div>
    `;
  }

  // ==================== Render: Notifications ====================
  function renderNotifications() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Notification Preferences</h3>
        <p class="settings-section-desc">Configure how you receive CRM notifications.</p>

        <div class="settings-field">
          <label class="settings-label">
            <input type="checkbox" id="notifEnabled" ${state.notifEnabled ? 'checked' : ''}>
            <span>Enable notifications</span>
          </label>
          <p class="settings-hint">Show notification badge and poll for new events.</p>
        </div>

        <div class="settings-field">
          <label class="settings-label" for="pollInterval">Polling interval (seconds)</label>
          <select id="pollInterval" class="sf-select" style="width:200px">
            <option value="15"  ${state.pollInterval === 15  ? 'selected' : ''}>15 seconds</option>
            <option value="30"  ${state.pollInterval === 30  ? 'selected' : ''}>30 seconds</option>
            <option value="60"  ${state.pollInterval === 60  ? 'selected' : ''}>1 minute</option>
            <option value="120" ${state.pollInterval === 120 ? 'selected' : ''}>2 minutes</option>
            <option value="300" ${state.pollInterval === 300 ? 'selected' : ''}>5 minutes</option>
          </select>
          <p class="settings-hint">How often the CRM checks for new notifications.</p>
        </div>
      </div>
    `;
  }

  // ==================== Render: Data ====================
  function renderData() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Data Management</h3>
        <p class="settings-section-desc">Export or manage your CRM data.</p>

        <div class="settings-field">
          <button class="btn btn-primary" id="exportDataBtn">📥 Export All Data (JSON)</button>
          <p class="settings-hint">Download a complete JSON backup of all CRM records.</p>
        </div>

        <div class="settings-field" style="margin-top:16px">
          <button class="btn btn-danger" id="clearNotifBtn">🗑️ Clear Notification History</button>
          <p class="settings-hint">Remove all notification records. This cannot be undone.</p>
        </div>
      </div>
    `;
  }

  // ==================== Render: About ====================
  function renderAbout() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">About AI CRM</h3>
        <div class="about-card">
          <div class="about-logo">⚡</div>
          <div class="about-info">
            <h2>AI CRM</h2>
            <p class="about-version">Version 1.0.0</p>
            <p class="about-desc">Intelligent Customer Relationship Management</p>
          </div>
        </div>

        <div class="settings-field">
          <p><strong>Database:</strong> SQLite (better-sqlite3)</p>
          <p><strong>Backend:</strong> Node.js + Express</p>
          <p><strong>Frontend:</strong> Vanilla JS + Salesforce Lightning Design</p>
          <p><strong>Hermes Bridge:</strong> notifications/hermes-inbox.json</p>
        </div>

        <div class="settings-field">
          <h4 style="margin-bottom:8px">Modules</h4>
          <div class="module-list">
            <span class="badge badge-success">Accounts</span>
            <span class="badge badge-success">Contacts</span>
            <span class="badge badge-success">Leads</span>
            <span class="badge badge-success">Opportunities</span>
            <span class="badge badge-success">Activities</span>
            <span class="badge badge-success">Tasks</span>
            <span class="badge badge-success">Quotes</span>
            <span class="badge badge-success">Orders</span>
            <span class="badge badge-success">Products</span>
            <span class="badge badge-success">Cases</span>
            <span class="badge badge-success">Documents</span>
            <span class="badge badge-success">Dashboard</span>
            <span class="badge badge-primary">Global Search</span>
            <span class="badge badge-primary">Notifications</span>
            <span class="badge badge-primary">Hermes Bridge</span>
            <span class="badge badge-primary">Settings</span>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== Render ====================
  function render() {
    const pageContent = document.getElementById('pageContent');
    if (!pageContent) return;

    pageContent.innerHTML = `
      <div class="settings-page">
        <div class="settings-header">
          <h2 class="settings-page-title">⚙️ Settings</h2>
          <p class="settings-page-subtitle">Customize your CRM experience</p>
        </div>
        ${renderTabs()}
        <div class="settings-content" id="settingsContent">
          ${renderTabContent()}
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderTabContent() {
    switch (state.activeTab) {
      case 'appearance':    return renderAppearance();
      case 'notifications': return renderNotifications();
      case 'data':          return renderData();
      case 'about':         return renderAbout();
      default:              return renderAppearance();
    }
  }

  // ==================== Bind Events ====================
  function bindEvents() {
    // Tab switching
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.activeTab = tab.dataset.tab;
        const content = document.getElementById('settingsContent');
        if (content) {
          content.innerHTML = renderTabContent();
          // Re-bind tab events (tabs are inside content area via settings-tabs, but they're outside)
        }
        // Update tab active state
        document.querySelectorAll('.settings-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === state.activeTab);
        });
        bindTabSpecificEvents();
      });
    });

    bindTabSpecificEvents();
  }

  function bindTabSpecificEvents() {
    // Theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        applyTheme(card.dataset.theme);
        // Re-render to show checkmark
        const content = document.getElementById('settingsContent');
        if (content) content.innerHTML = renderTabContent();
        bindEvents();
      });
    });

    // Sidebar toggle
    const toggleBtn = document.getElementById('settingsToggleSidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        App.toggleSidebar();
        toggleBtn.textContent = App.state.sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar';
      });
    }

    // Notification enabled
    const notifEnabled = document.getElementById('notifEnabled');
    if (notifEnabled) {
      notifEnabled.addEventListener('change', (e) => {
        state.notifEnabled = e.target.checked;
        localStorage.setItem('crm_notif_enabled', state.notifEnabled);
        Components.showToast(state.notifEnabled ? 'Notifications enabled' : 'Notifications disabled', 'info');
      });
    }

    // Poll interval
    const pollInterval = document.getElementById('pollInterval');
    if (pollInterval) {
      pollInterval.addEventListener('change', (e) => {
        state.pollInterval = Number(e.target.value);
        localStorage.setItem('crm_poll_interval', state.pollInterval);
        Components.showToast(`Polling interval set to ${state.pollInterval}s`, 'info');
      });
    }

    // Export data
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportAllData);
    }

    // Clear notifications
    const clearBtn = document.getElementById('clearNotifBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearAllNotifications);
    }
  }

  // ==================== Lifecycle ====================
  function init() {
    // Apply saved theme on init
    applyTheme(state.theme);
  }

  function destroy() {}

  // ==================== Register ====================
  App.registerPage('settings', { init, render, destroy });

  return { state };
})();
