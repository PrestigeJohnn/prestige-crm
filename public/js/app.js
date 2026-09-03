/**
 * App — 主应用逻辑
 * 路由、导航、全局搜索、通知、初始化
 */
const App = (() => {
  // ==================== State ====================
  const state = {
    currentPage: 'dashboard',
    sidebarCollapsed: false,
    searchTimeout: null,
    notifInterval: null,
    user: null,
    notifFilter: 'all',
    notifPanelOpen: false,
    ready: false,
  };

  // ==================== Page Registry ====================
  const pages = {};
  const pendingPages = [];

  /**
   * 注册页面
   * @param {string} name - 页面名
   * @param {object} config - { init, render, destroy }
   */
  function registerPage(name, config) {
    pages[name] = config;
  }

  /**
   * 延迟注册 — 供其他脚本在 App 就绪前调用
   */
  function onReady() {
    state.ready = true;
    // 执行所有待注册的页面
    for (let i = 0; i < pendingPages.length; i++) {
      const p = pendingPages[i];
      registerPage(p.name, p.config);
    }
    pendingPages.length = 0;
  }

  // ==================== Routing ====================

  /**
   * 导航到指定页面
   * @param {string} pageName
   */
  function navigateTo(pageName) {
    if (!pages[pageName]) {
      console.warn(`Page "${pageName}" not registered`);
      return;
    }

    // Destroy current page
    if (pages[state.currentPage]?.destroy) {
      pages[state.currentPage].destroy();
    }

    state.currentPage = pageName;

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageName);
    });

    // Update breadcrumb
    updateBreadcrumb(pageName);

    // Render page
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      pageContent.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
    }

    if (pages[pageName]?.render) {
      pages[pageName].render();
    }

    // Update URL hash
    window.location.hash = pageName;
  }

  /**
   * 更新面包屑
   */
  function updateBreadcrumb(pageName) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    const labels = {
      dashboard: 'Dashboard',
      accounts: 'Accounts',
      contacts: 'Contacts',
      leads: 'Leads',
      opportunities: 'Opportunities',
      activities: 'Activities',
      tasks: 'Tasks',
      quotes: 'Quotes',
      orders: 'Orders',
      products: 'Products',
      cases: 'Cases',
      documents: 'Documents',
      settings: 'Settings'
    };
    breadcrumb.innerHTML = `
      <span class="breadcrumb-item">Home</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">${labels[pageName] || pageName}</span>
    `;
  }

  // ==================== Sidebar ====================

  /**
   * 切换 Sidebar 折叠状态
   */
  function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    document.body.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
  }

  // ==================== Global Search ====================

  /**
   * 初始化全局搜索
   */
  function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    const resultsContainer = document.getElementById('globalSearchResults');

    if (!searchInput || !resultsContainer) return;

    const doSearch = Components.debounce(async (query) => {
      if (query.length < 2) {
        resultsContainer.classList.remove('active');
        return;
      }

      try {
        const results = await API.get(`/search?q=${encodeURIComponent(query)}`);
        renderSearchResults(results, resultsContainer);
        resultsContainer.classList.add('active');
      } catch (error) {
        // Silent fail for search
      }
    }, 300);

    searchInput.addEventListener('input', (e) => {
      doSearch(e.target.value.trim());
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2) {
        resultsContainer.classList.add('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.classList.remove('active');
      }
    });
  }

  /**
   * 渲染搜索结果
   */
  function renderSearchResults(results, container) {
    const { accounts = [], contacts = [], opportunities = [] } = results;
    const total = accounts.length + contacts.length + opportunities.length;

    if (total === 0) {
      container.innerHTML = '<div class="search-empty">No results found</div>';
      return;
    }

    let html = '';

    if (accounts.length > 0) {
      html += '<div class="search-group"><div class="search-group-title">Accounts</div>';
      accounts.forEach(item => {
        html += `<a class="search-item" href="#accounts" onclick="App.navigateTo('accounts','${item.id}')">
          <span class="search-item-icon">🏢</span>
          <div><div class="search-item-title">${Components.escapeHtml(item.company_name)}</div>
          <div class="search-item-meta">${Components.escapeHtml(item.industry || '')}</div></div>
        </a>`;
      });
      html += '</div>';
    }

    if (contacts.length > 0) {
      html += '<div class="search-group"><div class="search-group-title">Contacts</div>';
      contacts.forEach(item => {
        html += `<a class="search-item" href="#contacts" onclick="App.navigateTo('contacts','${item.id}')">
          <span class="search-item-icon">👤</span>
          <div><div class="search-item-title">${Components.escapeHtml(item.first_name + ' ' + item.last_name)}</div>
          <div class="search-item-meta">${Components.escapeHtml(item.account_name || '')}</div></div>
        </a>`;
      });
      html += '</div>';
    }

    if (opportunities.length > 0) {
      html += '<div class="search-group"><div class="search-group-title">Opportunities</div>';
      opportunities.forEach(item => {
        html += `<a class="search-item" href="#opportunities" onclick="App.navigateTo('opportunities','${item.id}')">
          <span class="search-item-icon">💼</span>
          <div><div class="search-item-title">${Components.escapeHtml(item.name)}</div>
          <div class="search-item-meta">${Components.formatCurrency(item.value)}</div></div>
        </a>`;
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ==================== Notifications ====================

  /**
   * 启动通知轮询
   */
  function initNotifications() {
    checkNotifications();
    const pollMs = (Number(localStorage.getItem('crm_poll_interval')) || 30) * 1000;
    state.notifInterval = setInterval(checkNotifications, pollMs);
  }

  /**
   * 检查新通知
   */
  async function checkNotifications() {
    try {
      const notifications = await API.get('/notifications?filter=unread');
      const count = Array.isArray(notifications) ? notifications.length : 0;
      updateNotificationBadge(count);
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * 更新通知角标
   */
  function updateNotificationBadge(count) {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.add('active');
      badge.hidden = false;
    } else {
      badge.textContent = '';
      badge.classList.remove('active');
      badge.hidden = true;
    }
  }

  /**
   * 切换通知面板
   */
  function toggleNotifPanel() {
    state.notifPanelOpen = !state.notifPanelOpen;
    if (state.notifPanelOpen) {
      renderNotificationPanel();
    } else {
      closeNotificationPanel();
    }
  }

  /**
   * 关闭通知面板
   */
  function closeNotificationPanel() {
    state.notifPanelOpen = false;
    // If we're on the notification panel page, go back to dashboard or previous
    if (state.currentPage === '__notif_panel__') {
      navigateTo('dashboard');
    }
  }

  /**
   * 渲染通知面板
   */
  async function renderNotificationPanel() {
    const pageContent = document.getElementById('pageContent');
    if (!pageContent) return;

    // Save current page for back navigation
    if (state.currentPage !== '__notif_panel__') {
    }

    state.currentPage = '__notif_panel__';

    pageContent.innerHTML = `
      <div class="notif-panel">
        <div class="notif-panel-header">
          <h2 class="notif-panel-title">🔔 Notifications</h2>
          <div class="notif-panel-actions">
            <div class="notif-filter-bar">
              <button class="notif-filter-btn ${state.notifFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
              <button class="notif-filter-btn ${state.notifFilter === 'unread' ? 'active' : ''}" data-filter="unread">Unread</button>
              <button class="notif-filter-btn ${state.notifFilter === 'task' ? 'active' : ''}" data-filter="task">Tasks</button>
              <button class="notif-filter-btn ${state.notifFilter === 'opportunity' ? 'active' : ''}" data-filter="opportunity">Opportunities</button>
              <button class="notif-filter-btn ${state.notifFilter === 'system' ? 'active' : ''}" data-filter="system">System</button>
            </div>
            <button class="notif-panel-close" id="notifPanelClose" aria-label="Close panel">✕</button>
          </div>
        </div>
        <div class="notif-panel-body" id="notifPanelBody">
          <div class="page-loading"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    // Bind close button
    const closeBtn = document.getElementById('notifPanelClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeNotificationPanel());
    }

    // Bind filter buttons
    document.querySelectorAll('.notif-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.notifFilter = btn.dataset.filter;
        document.querySelectorAll('.notif-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadNotifications();
      });
    });

    // Load notifications
    await loadNotifications();
  }

  /**
   * 加载通知列表
   */
  async function loadNotifications() {
    const body = document.getElementById('notifPanelBody');
    if (!body) return;

    try {
      const notifications = await API.get(`/notifications?filter=${state.notifFilter}`);
      renderNotifList(notifications || [], body);
    } catch (error) {
      body.innerHTML = '<div class="notif-empty">Failed to load notifications</div>';
    }
  }

  /**
   * 渲染通知列表
   */
  function renderNotifList(notifications, container) {
    if (!notifications || notifications.length === 0) {
      container.innerHTML = `
        <div class="notif-empty">
          <div class="notif-empty-icon">🔔</div>
          <div class="notif-empty-text">No notifications</div>
        </div>
      `;
      return;
    }

    const typeIcons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      task: '📋',
      opportunity: '💼',
      system: '⚙️',
    };

    const typeClasses = {
      info: 'notif-type-info',
      success: 'notif-type-success',
      warning: 'notif-type-warning',
      error: 'notif-type-error',
      task: 'notif-type-task',
      opportunity: 'notif-type-opportunity',
      system: 'notif-type-system',
    };

    let html = '<div class="notif-list">';
    notifications.forEach(n => {
      const icon = typeIcons[n.type] || '📌';
      const cls = typeClasses[n.type] || 'notif-type-info';
      const time = Components.formatRelative(n.created_at);
      const readClass = n.read ? 'notif-read' : 'notif-unread';

      html += `
        <div class="notif-item ${readClass} ${cls}" data-id="${n.id}">
          <div class="notif-item-icon">${icon}</div>
          <div class="notif-item-content">
            <div class="notif-item-title">${Components.escapeHtml(n.title || 'Notification')}</div>
            <div class="notif-item-message">${Components.escapeHtml(n.message)}</div>
            <div class="notif-item-time">${time}</div>
          </div>
          <div class="notif-item-actions">
            ${!n.read ? `<button class="notif-mark-read" data-id="${n.id}" title="Mark as read">✓</button>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;

    // Bind mark-read buttons
    container.querySelectorAll('.notif-mark-read').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        try {
          await API.request(`/notifications/${id}`, { method: 'PATCH' });
          // Remove the item visually
          const item = btn.closest('.notif-item');
          if (item) {
            item.classList.remove('notif-unread');
            item.classList.add('notif-read');
            btn.remove();
          }
          // Refresh badge
          checkNotifications();
        } catch (err) {
          // Silent fail
        }
      });
    });
  }

  // ==================== User Menu ====================

  /**
   * 初始化用户菜单下拉
   */
  function initUserMenu() {
    const userBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (!userBtn || !userDropdown) return;

    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      userDropdown.classList.remove('active');
    });
  }

  // ==================== Initialization ====================

  /**
   * 绑定全局事件
   */
  function bindGlobalEvents() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) navigateTo(page);
      });
    });

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Modal overlay click to close
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) Components.closeModal();
      });
    }

    // ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Components.closeModal();
    });

    // Notification button — toggle notification panel
    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        toggleNotifPanel();
      });
    }
  }

  /**
   * 初始化应用
   */
  async function init() {
    // Restore sidebar state
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed === 'true') {
      state.sidebarCollapsed = true;
      document.body.classList.add('sidebar-collapsed');
    }

    // Bind events
    bindGlobalEvents();
    initGlobalSearch();
    initNotifications();
    initUserMenu();

    // Determine initial page from hash
    const hashPage = window.location.hash.replace('#', '');
    const initialPage = pages[hashPage] ? hashPage : 'dashboard';

    // Navigate to initial page
    navigateTo(initialPage);

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.replace('#', '');
      if (page && page !== state.currentPage && pages[page]) {
        navigateTo(page);
      }
    });

    // Mark App as ready — flushes pending page registrations
    onReady();
  }

  // Public API
  return {
    init,
    navigateTo,
    toggleSidebar,
    registerPage,
    onReady,
    state
  };
})();

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
