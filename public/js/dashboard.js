/**
 * Dashboard — 仪表盘页面
 * KPI 卡片、销售漏斗、月度趋势、活动、商机
 */
(() => {
  let dashboardData = null;

  // ==================== Register Page ====================
  App.registerPage('dashboard', {
    render: renderDashboard,
    destroy: () => { dashboardData = null; }
  });

  // ==================== Main Render ====================
  async function renderDashboard() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <div class="page-actions">
          <span class="text-muted" id="dashboardTimestamp" style="font-size: var(--sf-text-sm); margin-right: var(--sf-space-3);"></span>
          <button class="btn btn-secondary" onclick="App.navigateTo('dashboard')">
            ↻ Refresh
          </button>
        </div>
      </div>
      <div id="dashboardContent">
        ${Components.renderSkeleton(6, 4)}
      </div>
    `;

    try {
      const data = await API.get('/dashboard');
      dashboardData = data;
      renderContent(data);
      document.getElementById('dashboardTimestamp').textContent =
        'Last updated: ' + new Date().toLocaleTimeString('en-SG');
    } catch (error) {
      document.getElementById('dashboardContent').innerHTML = `
        <div class="sf-empty-state" style="padding: var(--sf-space-16) var(--sf-space-6);">
          <div class="sf-empty-state__icon">⚠️</div>
          <h3 class="sf-empty-state__title">Failed to Load Dashboard</h3>
          <p class="sf-empty-state__description">${Components.escapeHtml(error.message)}</p>
          <button class="sf-btn sf-btn--primary" onclick="App.navigateTo('dashboard')">Retry</button>
        </div>
      `;
    }
  }

  // ==================== Layout ====================
  function renderContent(data) {
    const container = document.getElementById('dashboardContent');
    if (!container) return;

    const {
      total_accounts = 0,
      pipeline_value = 0,
      monthly_revenue = 0,
      open_tasks = 0,
      overdue_tasks: overdueCount = 0,
      win_rate = 0,
      stage_distribution = [],
      monthly_trend = [],
      recent_activities = [],
      top_opportunities = [],
      overdue_tasks_list = []
    } = data;

    container.innerHTML = `
      ${renderKPICards(data)}
      <div class="dashboard-grid">
        <div class="dashboard-col dashboard-col--left">
          ${renderFunnel(stage_distribution)}
          ${renderMonthlyTrend(monthly_trend)}
        </div>
        <div class="dashboard-col dashboard-col--right">
          ${renderRecentActivities(recent_activities)}
          ${renderTopOpportunities(top_opportunities)}
          ${renderOverdueTasks(overdue_tasks_list, overdueCount)}
        </div>
      </div>
    `;
  }

  // ==================== KPI Cards ====================
  function renderKPICards(data) {
    const {
      total_accounts = 0,
      pipeline_value = 0,
      monthly_revenue = 0,
      open_tasks = 0,
      overdue_tasks = 0,
      win_rate = 0
    } = data;

    const cards = [
      {
        label: 'Total Accounts',
        value: (total_accounts || 0).toLocaleString(),
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        color: 'blue',
        accentColor: 'var(--sf-primary-500)',
        bgColor: 'var(--sf-primary-50)',
        subtitle: 'Active customers'
      },
      {
        label: 'Pipeline Value',
        value: Components.formatCurrency(pipeline_value || 0),
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        color: 'green',
        accentColor: 'var(--sf-success-500)',
        bgColor: 'var(--sf-success-50)',
        subtitle: 'Weighted forecast'
      },
      {
        label: 'Won This Month',
        value: Components.formatCurrency(monthly_revenue || 0),
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        color: 'purple',
        accentColor: '#8b5cf6',
        bgColor: '#f5f3ff',
        subtitle: 'Closed won revenue'
      },
      {
        label: 'Open Tasks',
        value: (open_tasks || 0).toLocaleString(),
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        color: 'orange',
        accentColor: 'var(--sf-warning-500)',
        bgColor: 'var(--sf-warning-50)',
        subtitle: 'Pending follow-ups'
      },
      {
        label: 'Overdue Tasks',
        value: (overdue_tasks || 0).toLocaleString(),
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        color: 'red',
        accentColor: 'var(--sf-error-500)',
        bgColor: 'var(--sf-error-50)',
        subtitle: 'Needs attention',
        pulse: overdue_tasks > 0
      },
      {
        label: 'Win Rate',
        value: (win_rate || 0) + '%',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        color: 'teal',
        accentColor: '#0d9488',
        bgColor: '#f0fdfa',
        subtitle: 'Deals won / total'
      }
    ];

    return `
      <div class="kpi-grid">
        ${cards.map(card => `
          <div class="kpi-card kpi-card--${card.color}" ${card.pulse ? 'style="animation: kpi-pulse 2s ease-in-out infinite;"' : ''}>
            <div class="kpi-card__header">
              <div class="kpi-card__icon" style="background: ${card.bgColor}; color: ${card.accentColor};">
                ${card.icon}
              </div>
            </div>
            <div class="kpi-card__body">
              <div class="kpi-card__value">${card.value}</div>
              <div class="kpi-card__label">${card.label}</div>
            </div>
            <div class="kpi-card__footer">
              <span class="kpi-card__subtitle">${card.subtitle}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ==================== Sales Funnel (Pure CSS) ====================
  function renderFunnel(funnel) {
    if (!funnel || funnel.length === 0) {
      return `
        <div class="sf-card">
          <div class="sf-card__header">
            <h3 class="sf-card__title">Sales Funnel</h3>
          </div>
          <div class="sf-card__body">
            ${Components.renderEmptyState('📊', 'No Funnel Data', 'Add opportunities to see funnel analysis')}
          </div>
        </div>
      `;
    }

    const maxCount = Math.max(...funnel.map(f => f.count || 0), 1);
    const stageColors = [
      { bg: 'var(--sf-primary-500)', light: 'var(--sf-primary-100)' },
      { bg: '#8b5cf6', light: '#ede9fe' },
      { bg: '#06b6d4', light: '#cffafe' },
      { bg: 'var(--sf-warning-500)', light: 'var(--sf-warning-100)' },
      { bg: 'var(--sf-success-500)', light: 'var(--sf-success-100)' }
    ];

    const stages = funnel.map((stage, i) => {
      const pct = ((stage.count || 0) / maxCount) * 100;
      const colors = stageColors[i % stageColors.length];
      return `
        <div class="funnel-stage">
          <div class="funnel-stage__header">
            <span class="funnel-stage__name">${Components.escapeHtml(stage.stage || 'Unknown')}</span>
            <span class="funnel-stage__count">${stage.count || 0} deals</span>
          </div>
          <div class="funnel-stage__bar-track">
            <div class="funnel-stage__bar" style="width: ${Math.max(pct, 8)}%; background: ${colors.bg};">
              <div class="funnel-stage__bar-fill" style="background: ${colors.light}; opacity: 0.3;"></div>
            </div>
          </div>
          <div class="funnel-stage__value">${Components.formatCurrency(stage.value || 0)}</div>
        </div>
      `;
    });

    const totalValue = funnel.reduce((sum, s) => sum + (s.value || 0), 0);

    return `
      <div class="sf-card">
        <div class="sf-card__header">
          <h3 class="sf-card__title">Sales Funnel</h3>
          <span class="sf-badge sf-badge--neutral">${Components.formatCurrency(totalValue)} total</span>
        </div>
        <div class="sf-card__body">
          <div class="funnel-chart">
            ${stages.join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ==================== Monthly Trend (CSS Bar Chart) ====================
  function renderMonthlyTrend(trend) {
    if (!trend || trend.length === 0) {
      return `
        <div class="sf-card">
          <div class="sf-card__header">
            <h3 class="sf-card__title">Monthly Trend</h3>
          </div>
          <div class="sf-card__body">
            ${Components.renderEmptyState('📈', 'No Trend Data', 'Monthly performance will appear here')}
          </div>
        </div>
      `;
    }

    const maxValue = Math.max(...trend.map(t => t.revenue || t.value || 0), 1);
    const chartHeight = 200;

    const bars = trend.map((item, i) => {
      const val = item.revenue || item.value || 0;
      const heightPct = (val / maxValue) * 100;
      const barHeight = Math.max(heightPct, 2);
      const isLast = i === trend.length - 1;
      return `
        <div class="trend-bar-wrapper">
          <div class="trend-bar-container" title="${Components.escapeHtml(item.month)}: ${Components.formatCurrency(val)}">
            <div class="trend-bar ${isLast ? 'trend-bar--current' : ''}" style="height: ${barHeight}%;">
              <span class="trend-bar__value">${Components.formatCurrency(val)}</span>
            </div>
          </div>
          <span class="trend-bar__label">${Components.escapeHtml(item.month)}</span>
        </div>
      `;
    });

    return `
      <div class="sf-card">
        <div class="sf-card__header">
          <h3 class="sf-card__title">Monthly Trend</h3>
          <span class="sf-badge sf-badge--info">Last ${trend.length} months</span>
        </div>
        <div class="sf-card__body">
          <div class="trend-chart" style="height: ${chartHeight}px;">
            <div class="trend-chart__grid">
              <div class="trend-chart__grid-line" style="bottom: 25%;"></div>
              <div class="trend-chart__grid-line" style="bottom: 50%;"></div>
              <div class="trend-chart__grid-line" style="bottom: 75%;"></div>
              <div class="trend-chart__grid-line" style="bottom: 100%;"></div>
            </div>
            <div class="trend-chart__bars">
              ${bars.join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== Recent Activities ====================
  function renderRecentActivities(activities) {
    if (!activities || activities.length === 0) {
      return `
        <div class="sf-card">
          <div class="sf-card__header">
            <h3 class="sf-card__title">Recent Activities</h3>
          </div>
          <div class="sf-card__body">
            ${Components.renderEmptyState('📝', 'No Recent Activities', 'Activities will appear here')}
          </div>
        </div>
      `;
    }

    const items = activities.slice(0, 10).map(a => {
      const type = a.type || 'note';
      const icon = getActivityIcon(type);
      const typeLabels = {
        call: 'Call',
        email: 'Email',
        meeting: 'Meeting',
        task: 'Task',
        note: 'Note'
      };
      const typeLabel = typeLabels[type] || 'Activity';

      return `
        <div class="activity-item" onclick="App.navigateTo('activities', '${a.id}')" style="cursor: pointer;">
          <div class="activity-item__icon activity-item__icon--${type}">
            ${icon}
          </div>
          <div class="activity-item__content">
            <div class="activity-item__header">
              <span class="activity-item__type">${typeLabel}</span>
              <span class="activity-item__date">${Components.formatRelative(a.date || a.created_at)}</span>
            </div>
            <div class="activity-item__subject">${Components.escapeHtml(a.subject || a.description || 'Untitled')}</div>
            ${a.account_name ? `<div class="activity-item__account">${Components.escapeHtml(a.account_name)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="sf-card">
        <div class="sf-card__header">
          <h3 class="sf-card__title">Recent Activities</h3>
          <a class="sf-btn sf-btn--ghost sf-btn--sm" href="#activities" onclick="App.navigateTo('activities')">View All →</a>
        </div>
        <div class="sf-card__body" style="padding: 0;">
          <div class="activity-list">${items}</div>
        </div>
      </div>
    `;
  }

  // ==================== Top Opportunities ====================
  function renderTopOpportunities(opportunities) {
    if (!opportunities || opportunities.length === 0) {
      return `
        <div class="sf-card">
          <div class="sf-card__header">
            <h3 class="sf-card__title">Top Opportunities</h3>
          </div>
          <div class="sf-card__body">
            ${Components.renderEmptyState('💼', 'No Opportunities', 'Create opportunities to track')}
          </div>
        </div>
      `;
    }

    const items = opportunities.slice(0, 5).map(o => {
      const prob = o.probability || 0;
      const probColor = prob >= 75 ? 'var(--sf-success-500)' : prob >= 50 ? 'var(--sf-warning-500)' : 'var(--sf-error-500)';
      const stage = (o.stage || 'Unknown').replace(/_/g, ' ');

      return `
        <div class="opp-item" onclick="App.navigateTo('opportunities', '${o.id}')" style="cursor: pointer;">
          <div class="opp-item__info">
            <div class="opp-item__name">${Components.escapeHtml(o.name || 'Untitled')}</div>
            <div class="opp-item__account">${Components.escapeHtml(o.account_name || '')}</div>
            <div class="opp-item__stage">
              <span class="opp-item__stage-badge">${Components.escapeHtml(stage)}</span>
            </div>
          </div>
          <div class="opp-item__metrics">
            <div class="opp-item__value">${Components.formatCurrency(o.value || 0)}</div>
            <div class="opp-item__prob" style="color: ${probColor};">${prob}%</div>
            <div class="opp-item__prob-bar">
              <div class="opp-item__prob-fill" style="width: ${prob}%; background: ${probColor};"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="sf-card">
        <div class="sf-card__header">
          <h3 class="sf-card__title">Top Opportunities</h3>
          <a class="sf-btn sf-btn--ghost sf-btn--sm" href="#opportunities" onclick="App.navigateTo('opportunities')">View All →</a>
        </div>
        <div class="sf-card__body" style="padding: 0;">
          <div class="opp-list">${items}</div>
        </div>
      </div>
    `;
  }

  // ==================== Overdue Tasks ====================
  function renderOverdueTasks(tasks, count) {
    const overdueList = tasks || [];
    if (overdueList.length === 0) return '';

    const items = overdueList.map(t => `
      <div class="overdue-task-item" onclick="App.navigateTo('tasks', '${t.id}')" style="cursor: pointer;">
        <div class="overdue-task-item__icon">⚠️</div>
        <div class="overdue-task-item__content">
          <div class="overdue-task-item__title">${Components.escapeHtml(t.title || 'Untitled Task')}</div>
          <div class="overdue-task-item__meta">
            <span class="overdue-task-item__date">Due: ${Components.formatDate(t.due_date)}</span>
            ${t.account_name ? `<span class="overdue-task-item__account"> · ${Components.escapeHtml(t.account_name)}</span>` : ''}
          </div>
        </div>
        ${t.priority ? `<span class="sf-badge sf-badge--priority-${t.priority.toLowerCase()}">${t.priority}</span>` : ''}
      </div>
    `).join('');

    return `
      <div class="sf-card" style="border-color: var(--sf-error-100);">
        <div class="sf-card__header" style="background: var(--sf-error-50); border-bottom-color: var(--sf-error-100);">
          <h3 class="sf-card__title" style="color: var(--sf-error-700);">
            ⚠️ Overdue Tasks
          </h3>
          <span class="sf-badge sf-badge--error">${count} overdue</span>
        </div>
        <div class="sf-card__body" style="padding: 0;">
          <div class="overdue-list">${items}</div>
        </div>
      </div>
    `;
  }

  // ==================== Helpers ====================
  function getActivityIcon(type) {
    const icons = {
      call: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      email: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      meeting: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      task: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
      note: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
    };
    return icons[type] || icons.note;
  }
})();
