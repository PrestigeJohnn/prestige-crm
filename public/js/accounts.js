/**
 * Accounts — 客户管理页面
 * 列表、详情、创建/编辑、删除、CSV 导出
 */
(() => {
  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let currentAccountId = null;
  let currentSort = { field: 'company_name', dir: 'asc' };
  let currentAccounts = []; // cached for export

  // ==================== Register Page ====================
  App.registerPage('accounts', {
    render: renderAccounts,
    destroy: () => { currentAccountId = null; }
  });

  // ==================== Main Render ====================
  async function renderAccounts() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Accounts</h1>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btnExportAccounts" title="Export to CSV">📥 Export CSV</button>
          <button class="btn btn-primary" id="btnNewAccount">+ New Account</button>
        </div>
      </div>
      <div id="accountsContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnNewAccount').addEventListener('click', () => showAccountForm());
    document.getElementById('btnExportAccounts').addEventListener('click', exportAccounts);

    // Check if viewing a specific account
    const hash = window.location.hash;
    const match = hash.match(/#accounts\/(.+)/);
    if (match) {
      currentAccountId = match[1];
      await renderAccountDetail(currentAccountId);
    } else {
      await loadAccountsList();
    }
  }

  // ==================== List View ====================
  async function loadAccountsList(page = 1) {
    const container = document.getElementById('accountsContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort: currentSort.field,
        dir: currentSort.dir,
        ...(searchQuery && { q: searchQuery })
      });

      const result = await API.get(`/accounts?${params}`);
      const { data: accounts, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;
      currentAccounts = accounts || [];

      renderAccountsList(accounts || [], total);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load accounts',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'accounts\')">Retry</button>'
      );
    }
  }

  function renderAccountsList(accounts, total) {
    const container = document.getElementById('accountsContent');
    if (!container) return;

    if (!accounts || accounts.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '🏢',
        'No accounts found',
        searchQuery ? 'Try a different search term' : 'Create your first account to get started',
        '<button class="btn btn-primary" onclick="document.getElementById(\'btnNewAccount\').click()">+ New Account</button>'
      );
      return;
    }

    // Sort indicators for headers
    const sortIcon = (field) => {
      if (currentSort.field !== field) return '⇅';
      return currentSort.dir === 'asc' ? '↑' : '↓';
    };

    const rows = accounts.map(a => `
      <tr class="data-row" data-id="${a.id}">
        <td>
          <a class="link-primary" href="#accounts/${a.id}" onclick="App.navigateTo('accounts','${a.id}'); return false;">
            ${Components.escapeHtml(a.company_name)}
          </a>
        </td>
        <td>${Components.escapeHtml(a.industry || '—')}</td>
        <td>${Components.escapeHtml(a.country || '—')}</td>
        <td>${a.employees ? a.employees.toLocaleString() : '—'}</td>
        <td>${Components.formatCurrency(a.annual_revenue)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-sm btn-icon" title="Edit" onclick="window._editAccount('${a.id}')">✏️</button>
            <button class="btn btn-sm btn-icon btn-delete" title="Delete" onclick="window._deleteAccount('${a.id}', '${Components.escapeHtml(a.company_name.replace(/'/g, "\\'"))}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-search">
            <input type="text" class="search-input" id="accountSearch"
                   placeholder="Search accounts..." value="${Components.escapeHtml(searchQuery)}">
          </div>
          <span class="card-count">${total} account${total !== 1 ? 's' : ''}</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" data-sort="company_name">Company Name <span class="sort-icon">${sortIcon('company_name')}</span></th>
                <th class="sortable" data-sort="industry">Industry <span class="sort-icon">${sortIcon('industry')}</span></th>
                <th class="sortable" data-sort="country">Country <span class="sort-icon">${sortIcon('country')}</span></th>
                <th class="sortable" data-sort="employees">Employees <span class="sort-icon">${sortIcon('employees')}</span></th>
                <th class="sortable" data-sort="annual_revenue">Revenue <span class="sort-icon">${sortIcon('annual_revenue')}</span></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="card-footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadAccountsList(p))}
        </div>
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('accountSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadAccountsList(1);
      }, 300));
    }

    // Bind sort clicks
    container.querySelectorAll('th.sortable').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (currentSort.field === field) {
          currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.field = field;
          currentSort.dir = 'asc';
        }
        loadAccountsList(1);
      });
    });

    // Bind pagination clicks
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadAccountsList(page);
      });
    });

    // Expose inline handlers
    window._editAccount = (id) => {
      loadAccountForEdit(id);
    };
    window._deleteAccount = (id, name) => {
      Components.showConfirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
        async () => {
          try {
            await API.del(`/accounts/${id}`);
            Components.showToast('Account deleted successfully', 'success');
            loadAccountsList(currentPage);
          } catch (error) {
            Components.showToast(error.message, 'error');
          }
        },
        null,
        'Delete',
        'danger'
      );
    };
  }

  // ==================== CSV Export ====================
  function exportAccounts() {
    if (!currentAccounts || currentAccounts.length === 0) {
      Components.showToast('No accounts to export', 'warning');
      return;
    }

    const headers = ['Company Name', 'Industry', 'Country', 'City', 'Address', 'Postal Code', 'Website', 'Phone', 'Employees', 'Annual Revenue', 'Notes'];

    const escapeCsv = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = currentAccounts.map(a => [
      escapeCsv(a.company_name),
      escapeCsv(a.industry),
      escapeCsv(a.country),
      escapeCsv(a.city),
      escapeCsv(a.address),
      escapeCsv(a.postal_code),
      escapeCsv(a.website),
      escapeCsv(a.phone),
      a.employees || '',
      a.annual_revenue || '',
      escapeCsv(a.notes)
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Components.showToast(`Exported ${currentAccounts.length} accounts to CSV`, 'success');
  }

  // ==================== Detail View ====================
  async function renderAccountDetail(accountId) {
    const container = document.getElementById('accountsContent');
    if (!container) return;

    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const account = await API.get(`/accounts/${accountId}`);
      currentAccountId = accountId;
      renderDetail(account);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load account',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'accounts\')">Back to List</button>'
      );
    }
  }

  function renderDetail(account) {
    const container = document.getElementById('accountsContent');
    if (!container) return;

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-left">
          <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('accounts')">← Back</button>
          <div class="detail-title-group">
            <h1 class="detail-title">${Components.escapeHtml(account.company_name)}</h1>
            ${account.industry ? `<span class="detail-subtitle">${Components.escapeHtml(account.industry)}</span>` : ''}
          </div>
        </div>
        <div class="detail-header-actions">
          <button class="btn btn-secondary" id="btnEditAccount">✏️ Edit</button>
          <button class="btn btn-danger" id="btnDeleteAccount">🗑️ Delete</button>
        </div>
      </div>

      <div class="detail-tabs">
        <button class="tab-btn active" data-tab="overview">Overview</button>
        <button class="tab-btn" data-tab="contacts">Contacts (${account.contact_count || 0})</button>
        <button class="tab-btn" data-tab="opportunities">Opportunities (${account.opportunity_count || 0})</button>
        <button class="tab-btn" data-tab="activities">Activities</button>
        <button class="tab-btn" data-tab="tasks">Tasks</button>
        <button class="tab-btn" data-tab="documents">Documents</button>
      </div>

      <div class="tab-content" id="tabContent">
        ${renderOverviewTab(account)}
      </div>
    `;

    // Bind tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        renderTabContent(tab, account);
      });
    });

    // Bind action buttons
    document.getElementById('btnEditAccount').addEventListener('click', () => showAccountForm(account));
    document.getElementById('btnDeleteAccount').addEventListener('click', () => {
      window._deleteAccount(account.id, account.company_name);
    });
  }

  function renderTabContent(tab, account) {
    const content = document.getElementById('tabContent');
    if (!content) return;

    switch (tab) {
      case 'overview':
        content.innerHTML = renderOverviewTab(account);
        break;
      case 'contacts':
        content.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
        loadAccountContacts(account.id);
        break;
      case 'opportunities':
        content.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
        loadAccountOpportunities(account.id);
        break;
      case 'activities':
        content.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
        loadAccountActivities(account.id);
        break;
      case 'tasks':
        content.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
        loadAccountTasks(account.id);
        break;
      case 'documents':
        content.innerHTML = Components.renderEmptyState('📁', 'No documents', 'Upload documents for this account');
        break;
    }
  }

  function renderOverviewTab(account) {
    const fields = [
      { label: 'Industry', value: account.industry },
      { label: 'Country', value: account.country },
      { label: 'City', value: account.city },
      { label: 'Address', value: account.address },
      { label: 'Postal Code', value: account.postal_code },
      { label: 'Website', value: account.website, isLink: true },
      { label: 'Phone', value: account.phone },
      { label: 'Employees', value: account.employees?.toLocaleString() },
      { label: 'Annual Revenue', value: Components.formatCurrency(account.annual_revenue) },
      { label: 'Notes', value: account.notes }
    ];

    return `
      <div class="card">
        <div class="card-body">
          <div class="detail-grid">
            ${fields.map(f => {
              let displayValue;
              if (f.value) {
                if (f.isLink) {
                  const href = String(f.value).startsWith('http') ? f.value : `https://${f.value}`;
                  displayValue = `<a href="${Components.escapeHtml(href)}" target="_blank" rel="noopener">${Components.escapeHtml(f.value)}</a>`;
                } else {
                  displayValue = Components.escapeHtml(String(f.value));
                }
              } else {
                displayValue = '<span class="text-muted">—</span>';
              }
              return `
                <div class="detail-field">
                  <label class="detail-label">${f.label}</label>
                  <div class="detail-value">${displayValue}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  async function loadAccountContacts(accountId) {
    const content = document.getElementById('tabContent');
    if (!content) return;
    try {
      const contacts = await API.get(`/accounts/${accountId}/contacts`);
      if (!contacts || !contacts.length) {
        content.innerHTML = Components.renderEmptyState('👤', 'No contacts', 'Add contacts for this account');
        return;
      }
      content.innerHTML = `
        <div class="data-table-container">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Position</th><th>Email</th><th>Phone</th></tr></thead>
            <tbody>
              ${contacts.map(c => `
                <tr>
                  <td>${Components.escapeHtml((c.first_name || '') + ' ' + (c.last_name || ''))}</td>
                  <td>${Components.escapeHtml(c.position || '—')}</td>
                  <td>${Components.escapeHtml(c.email || '—')}</td>
                  <td>${Components.escapeHtml(c.phone || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      content.innerHTML = Components.renderEmptyState('⚠️', 'Failed to load contacts', error.message);
    }
  }

  async function loadAccountOpportunities(accountId) {
    const content = document.getElementById('tabContent');
    if (!content) return;
    try {
      const opps = await API.get(`/accounts/${accountId}/opportunities`);
      if (!opps || !opps.length) {
        content.innerHTML = Components.renderEmptyState('💼', 'No opportunities', 'Add opportunities for this account');
        return;
      }
      content.innerHTML = `
        <div class="data-table-container">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Value</th><th>Stage</th><th>Probability</th></tr></thead>
            <tbody>
              ${opps.map(o => `
                <tr>
                  <td>${Components.escapeHtml(o.name)}</td>
                  <td>${Components.formatCurrency(o.value)}</td>
                  <td>${Components.getStatusBadge(o.stage, 'opportunity')}</td>
                  <td>${o.probability || 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      content.innerHTML = Components.renderEmptyState('⚠️', 'Failed to load opportunities', error.message);
    }
  }

  async function loadAccountActivities(accountId) {
    const content = document.getElementById('tabContent');
    if (!content) return;
    try {
      const activities = await API.get(`/accounts/${accountId}/activities`);
      if (!activities || !activities.length) {
        content.innerHTML = Components.renderEmptyState('📝', 'No activities', 'Activities will appear here');
        return;
      }
      content.innerHTML = `
        <div class="activity-list">
          ${activities.map(a => `
            <div class="activity-item">
              <div class="activity-icon activity-${a.type || 'note'}">${getActivityIcon(a.type)}</div>
              <div class="activity-content">
                <div class="activity-text">${Components.escapeHtml(a.description || a.subject || '')}</div>
                <div class="activity-time">${Components.formatDateTime(a.created_at)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      content.innerHTML = Components.renderEmptyState('⚠️', 'Failed to load activities', error.message);
    }
  }

  async function loadAccountTasks(accountId) {
    const content = document.getElementById('tabContent');
    if (!content) return;
    try {
      const tasks = await API.get(`/accounts/${accountId}/tasks`);
      if (!tasks || !tasks.length) {
        content.innerHTML = Components.renderEmptyState('📋', 'No tasks', 'No tasks for this account');
        return;
      }
      content.innerHTML = `
        <div class="task-list">
          ${tasks.map(t => `
            <div class="task-item ${t.status === 'completed' ? 'task-completed' : ''}">
              <div class="task-checkbox" data-id="${t.id}">${t.status === 'completed' ? '✓' : '○'}</div>
              <div class="task-content">
                <div class="task-title">${Components.escapeHtml(t.title)}</div>
                <div class="task-due">Due: ${Components.formatDate(t.due_date)}</div>
              </div>
              ${Components.getPriorityBadge(t.priority)}
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      content.innerHTML = Components.renderEmptyState('⚠️', 'Failed to load tasks', error.message);
    }
  }

  // ==================== Create / Edit Form ====================
  function showAccountForm(account = null) {
    const isEdit = !!account;
    const formId = 'accountForm_' + Components.uid();

    const fields = [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true, value: account?.company_name || '', half: false },
      { name: 'industry', label: 'Industry', type: 'text', value: account?.industry || '', half: true },
      { name: 'country', label: 'Country', type: 'text', value: account?.country || '', half: true },
      { name: 'city', label: 'City', type: 'text', value: account?.city || '', half: true },
      { name: 'postal_code', label: 'Postal Code', type: 'text', value: account?.postal_code || '', half: true },
      { name: 'website', label: 'Website', type: 'url', value: account?.website || '', half: true },
      { name: 'phone', label: 'Phone', type: 'tel', value: account?.phone || '', half: true },
      { name: 'employees', label: 'Employees', type: 'number', value: account?.employees ?? '', half: true },
      { name: 'annual_revenue', label: 'Annual Revenue', type: 'number', step: '0.01', value: account?.annual_revenue ?? '', half: true },
      { name: 'address', label: 'Address', type: 'textarea', value: account?.address || '', half: false },
      { name: 'notes', label: 'Notes', type: 'textarea', value: account?.notes || '', half: false }
    ];

    const formHtml = `
      <form id="${formId}" class="form">
        <div class="form-grid">
          ${fields.map(f => `
            <div class="form-group${f.half ? '' : ' form-group-full'}">
              <label class="form-label">${f.label} ${f.required ? '<span class="required">*</span>' : ''}</label>
              ${f.type === 'textarea'
                ? `<textarea class="form-control" name="${f.name}" rows="3" placeholder="Enter ${f.label.toLowerCase()}...">${Components.escapeHtml(String(f.value || ''))}</textarea>`
                : `<input class="form-control" type="${f.type}" name="${f.name}" value="${Components.escapeHtml(String(f.value ?? ''))}" ${f.step ? `step="${f.step}"` : ''} placeholder="Enter ${f.label.toLowerCase()}..." ${f.required ? 'required' : ''}>`
              }
            </div>
          `).join('')}
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Account</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Account: ${account.company_name}` : 'New Account',
      formHtml,
      'lg'
    );

    // Bind form submit
    const formEl = document.getElementById(formId);
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => {
        if (key === 'employees') {
          data[key] = value ? parseInt(value, 10) : null;
        } else if (key === 'annual_revenue') {
          data[key] = value ? parseFloat(value) : null;
        } else {
          data[key] = value;
        }
      });

      try {
        if (isEdit) {
          await API.put(`/accounts/${account.id}`, data);
          Components.showToast('Account updated successfully', 'success');
        } else {
          await API.post('/accounts', data);
          Components.showToast('Account created successfully', 'success');
        }
        Components.closeModal();
        if (currentAccountId) {
          renderAccountDetail(currentAccountId);
        } else {
          loadAccountsList(1);
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  async function loadAccountForEdit(id) {
    try {
      const account = await API.get(`/accounts/${id}`);
      showAccountForm(account);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

  // ==================== Helpers ====================
  function getActivityIcon(type) {
    const icons = { call: '📞', email: '✉️', meeting: '🤝', task: '✅', note: '📝' };
    return icons[type] || '📌';
  }
})();
