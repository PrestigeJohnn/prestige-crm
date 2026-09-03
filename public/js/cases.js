/**
 * Cases — 客户问题页面
 * 问题列表（按状态分组）、创建/编辑、详情页（含解决记录）、状态流转
 */
;(function() {
  'use strict';

  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let filterStatus = '';
  let filterPriority = '';
  let currentCaseId = null;
  let viewMode = 'list'; // 'list' | 'grouped'

  const CASE_STATUSES = ['New', 'In Progress', 'Resolved', 'Closed'];
  const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

  // Status transition map: current -> next
  const STATUS_TRANSITIONS = {
    'New': 'In Progress',
    'In Progress': 'Resolved',
    'Resolved': 'Closed'
  };

  // Status icon map
  const STATUS_ICONS = { 'New': '🆕', 'In Progress': '🔄', 'Resolved': '✅', 'Closed': '🔒' };

  // ==================== Register Page ====================
  App.registerPage('cases', {
    render: renderCases,
    destroy: () => { currentCaseId = null; }
  });

  // ==================== Main Render ====================
  async function renderCases() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Cases</h1>
        <div class="page-actions">
          <div class="view-toggle">
            <button class="btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}" data-view="list">List</button>
            <button class="btn btn-sm ${viewMode === 'grouped' ? 'btn-primary' : 'btn-secondary'}" data-view="grouped">By Status</button>
          </div>
          <button class="btn btn-primary" id="btnNewCase">+ New Case</button>
        </div>
      </div>
      <div id="casesContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnNewCase').addEventListener('click', () => showCaseForm());

    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        renderCases();
      });
    });

    const hash = window.location.hash;
    const match = hash.match(/#cases\/(.+)/);
    if (match) {
      currentCaseId = match[1];
      await renderCaseDetail(currentCaseId);
    } else {
      await loadCases(1);
    }
  }

  // ==================== Load Cases ====================
  async function loadCases(page = 1) {
    const container = document.getElementById('casesContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority })
      });

      const result = await API.get(`/cases?${params}`);
      const { data: cases, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;

      if (viewMode === 'grouped') {
        renderGroupedCases(cases, total);
      } else {
        renderCasesList(cases, total);
      }
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load cases',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'cases\')">Retry</button>'
      );
    }
  }

  // ==================== List View ====================
  function renderCasesList(cases, total) {
    const container = document.getElementById('casesContent');
    if (!container) return;

    if (!cases || cases.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '🎫',
        'No cases found',
        searchQuery ? 'Try a different search term' : 'Create your first case',
        '<button class="btn btn-primary" onclick="document.getElementById(\'btnNewCase\').click()">+ New Case</button>'
      );
      return;
    }

    const rows = cases.map(c => `
      <tr class="data-row" data-id="${c.id}">
        <td>
          <a class="link-primary" href="#cases/${c.id}" onclick="App.navigateTo('cases','${c.id}'); return false;">
            ${Components.escapeHtml(c.case_no || '—')}
          </a>
        </td>
        <td>${Components.escapeHtml(c.subject || '—')}</td>
        <td>${Components.escapeHtml(c.account_name || '—')}</td>
        <td>${Components.escapeHtml(c.contact_name || '—')}</td>
        <td>${getPriorityBadgeHtml(c.priority)}</td>
        <td>${getCaseStatusBadgeHtml(c.status)}</td>
        <td>${Components.formatDate(c.created_at)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-sm btn-icon" title="View" onclick="App.navigateTo('cases','${c.id}')">👁️</button>
            <button class="btn btn-sm btn-icon" title="Edit" onclick="window._cases_edit('${c.id}')">✏️</button>
            <button class="btn btn-sm btn-icon" title="Delete" onclick="window._cases_delete('${c.id}', '${Components.escapeHtml(c.case_no || '')}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-search">
            <input type="text" class="search-input" id="caseSearch"
                   placeholder="Search cases..." value="${Components.escapeHtml(searchQuery)}">
            <select class="form-control form-control-sm" id="filterCaseStatus" style="width:140px">
              <option value="">All Statuses</option>
              ${CASE_STATUSES.map(s => `<option value="${s}" ${filterStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <select class="form-control form-control-sm" id="filterCasePriority" style="width:130px">
              <option value="">All Priorities</option>
              ${PRIORITIES.map(p => `<option value="${p}" ${filterPriority === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
          <span class="card-count">${total} cases</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Case No.</th>
                <th>Subject</th>
                <th>Account</th>
                <th>Contact</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="card-footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadCases(p))}
        </div>
      </div>
    `;

    const searchInput = document.getElementById('caseSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadCases(1);
      }, 300));
    }
    document.getElementById('filterCaseStatus')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      loadCases(1);
    });
    document.getElementById('filterCasePriority')?.addEventListener('change', (e) => {
      filterPriority = e.target.value;
      loadCases(1);
    });
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadCases(page);
      });
    });

    window._cases_edit = (id) => loadCaseForEdit(id);
    window._cases_delete = (id, caseNo) => {
      Components.showConfirm(
        `Delete case "${caseNo}"?`,
        async () => {
          try {
            await API.del(`/cases/${id}`);
            Components.showToast('Case deleted', 'success');
            loadCases(currentPage);
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

  // ==================== Grouped View ====================
  function renderGroupedCases(cases, total) {
    const container = document.getElementById('casesContent');
    if (!container) return;

    if (!cases || cases.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '🎫',
        'No cases found',
        'Create your first case',
        '<button class="btn btn-primary" onclick="document.getElementById(\'btnNewCase\').click()">+ New Case</button>'
      );
      return;
    }

    const groups = {};
    CASE_STATUSES.forEach(s => { groups[s] = []; });
    cases.forEach(c => {
      const status = c.status || 'New';
      if (!groups[status]) groups[status] = [];
      groups[status].push(c);
    });

    const statusColors = { 'New': '#0176D3', 'In Progress': '#FE9339', 'Resolved': '#4BCE97', 'Closed': '#93979B' };

    const groupsHtml = CASE_STATUSES.map(status => {
      const items = groups[status] || [];
      return `
        <div class="case-group">
          <div class="case-group-header" style="border-left: 4px solid ${statusColors[status] || '#93979B'}">
            <span class="case-group-icon">${STATUS_ICONS[status] || '📋'}</span>
            <span class="case-group-name">${status}</span>
            <span class="case-group-count">${items.length}</span>
          </div>
          ${items.length === 0 ? '<div class="case-group-empty">No cases</div>' : `
            <div class="case-group-body">
              ${items.map(c => `
                <div class="case-card" onclick="App.navigateTo('cases','${c.id}')">
                  <div class="case-card-header">
                    <span class="case-card-no">${Components.escapeHtml(c.case_no || '')}</span>
                    ${getPriorityBadgeHtml(c.priority)}
                  </div>
                  <div class="case-card-subject">${Components.escapeHtml(c.subject || '')}</div>
                  <div class="case-card-meta">
                    ${c.account_name ? `<span>🏢 ${Components.escapeHtml(c.account_name)}</span>` : ''}
                    <span>📅 ${Components.formatDate(c.created_at)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-search">
            <input type="text" class="search-input" id="caseSearch"
                   placeholder="Search cases..." value="${Components.escapeHtml(searchQuery)}">
            <select class="form-control form-control-sm" id="filterCasePriority" style="width:130px">
              <option value="">All Priorities</option>
              ${PRIORITIES.map(p => `<option value="${p}" ${filterPriority === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
          <span class="card-count">${total} cases</span>
        </div>
        <div class="card-body">
          <div class="case-groups">${groupsHtml}</div>
        </div>
      </div>
    `;

    const searchInput = document.getElementById('caseSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadCases(1);
      }, 300));
    }
    document.getElementById('filterCasePriority')?.addEventListener('change', (e) => {
      filterPriority = e.target.value;
      loadCases(1);
    });
  }

  // ==================== Detail View ====================
  async function renderCaseDetail(caseId) {
    const container = document.getElementById('casesContent');
    if (!container) return;

    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const c = await API.get(`/cases/${caseId}`);
      currentCaseId = caseId;
      renderDetail(c);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load case',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'cases\')">Back to List</button>'
      );
    }
  }

  function renderDetail(c) {
    const container = document.getElementById('casesContent');
    if (!container) return;

    const nextStatus = STATUS_TRANSITIONS[c.status];
    const canTransition = !!nextStatus;

    const fields = [
      { label: 'Case No', value: c.case_no },
      { label: 'Account', value: c.account_name },
      { label: 'Contact', value: c.contact_name },
      { label: 'Priority', value: null, badge: getPriorityBadgeHtml(c.priority) },
      { label: 'Status', value: null, badge: getCaseStatusBadgeHtml(c.status) },
      { label: 'Created', value: Components.formatDateTime(c.created_at) },
      { label: 'Subject', value: c.subject },
      { label: 'Description', value: c.description }
    ];

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-left">
          <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('cases')">← Back</button>
          <div class="detail-title-group">
            <h1 class="detail-title">${Components.escapeHtml(c.case_no || '')}: ${Components.escapeHtml(c.subject || '')}</h1>
            <p class="detail-subtitle">${Components.escapeHtml(c.account_name || '')} · Created ${Components.formatDateTime(c.created_at)}</p>
          </div>
        </div>
        <div class="detail-header-actions">
          ${canTransition ? `
            <button class="btn btn-primary" id="btnTransitionStatus" title="Move to ${nextStatus}">
              ➡️ Move to ${nextStatus}
            </button>
          ` : ''}
          <button class="btn btn-secondary" id="btnEditCase">✏️ Edit</button>
          <button class="btn btn-danger" id="btnDeleteCase">🗑️ Delete</button>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="detail-grid">
            ${fields.map(f => `
              <div class="detail-field">
                <label class="detail-label">${f.label}</label>
                <div class="detail-value">
                  ${f.badge || (f.value ? Components.escapeHtml(String(f.value)) : '—')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>📝 Resolution</h3>
        </div>
        <div class="card-body">
          ${c.resolution ? `<p class="resolution-text">${Components.escapeHtml(c.resolution)}</p>` : '<p class="text-muted">No resolution recorded yet.</p>'}
        </div>
      </div>

      ${c.status !== 'Closed' ? `
        <div class="card">
          <div class="card-header">
            <h3>⚡ Quick Status Actions</h3>
          </div>
          <div class="card-body">
            <div class="status-flow">
              ${CASE_STATUSES.map((s, i) => {
                const isActive = s === c.status;
                const isPast = CASE_STATUSES.indexOf(c.status) > i;
                const isFuture = CASE_STATUSES.indexOf(c.status) < i;
                return `
                  <div class="status-flow-item ${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}">
                    <div class="status-flow-dot">${isPast ? '✓' : STATUS_ICONS[s] || (i + 1)}</div>
                    <div class="status-flow-label">${s}</div>
                  </div>
                  ${i < CASE_STATUSES.length - 1 ? '<div class="status-flow-line"></div>' : ''}
                `;
              }).join('')}
            </div>
          </div>
        </div>
      ` : ''}
    `;

    document.getElementById('btnEditCase').addEventListener('click', () => loadCaseForEdit(c.id));
    document.getElementById('btnDeleteCase').addEventListener('click', () => {
      window._cases_delete(c.id, c.case_no || '');
    });

    const transitionBtn = document.getElementById('btnTransitionStatus');
    if (transitionBtn) {
      transitionBtn.addEventListener('click', () => {
        Components.showConfirm(
          `Change status from "${c.status}" to "${nextStatus}"?`,
          async () => {
            try {
              await API.put(`/cases/${c.id}`, { status: nextStatus });
              Components.showToast(`Status changed to ${nextStatus}`, 'success');
              renderCaseDetail(c.id);
            } catch (error) {
              Components.showToast(error.message, 'error');
            }
          },
          null,
          `Move to ${nextStatus}`,
          'warning'
        );
      });
    }
  }

  // ==================== Create / Edit Form ====================
  function showCaseForm(c = null) {
    const isEdit = !!c;
    const formId = 'caseForm_' + Components.uid();

    const formHtml = `
      <form id="${formId}" class="form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Account <span class="required">*</span></label>
            <select class="form-control" name="account_id" id="select_case_account" required>
              <option value="">— Select Account —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Contact</label>
            <select class="form-control" name="contact_id" id="select_case_contact">
              <option value="">— Select Contact —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-control" name="priority">
              <option value="">— Select —</option>
              ${PRIORITIES.map(p => `<option value="${p}" ${c?.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" name="status">
              ${CASE_STATUSES.map(s => `<option value="${s}" ${c?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group form-group-full">
            <label class="form-label">Subject <span class="required">*</span></label>
            <input class="form-control" type="text" name="subject" required
                   value="${Components.escapeHtml(c?.subject || '')}">
          </div>
          <div class="form-group form-group-full">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="description" rows="4">${Components.escapeHtml(c?.description || '')}</textarea>
          </div>
          ${isEdit ? `
            <div class="form-group form-group-full">
              <label class="form-label">Resolution</label>
              <textarea class="form-control" name="resolution" rows="3">${Components.escapeHtml(c?.resolution || '')}</textarea>
            </div>
          ` : ''}
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Case</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Case: ${c.case_no}` : 'New Case',
      formHtml,
      'lg'
    );

    loadCaseSelect('select_case_account', '/accounts?limit=1000', c?.account_id, 'company_name');
    loadCaseSelect('select_case_contact', '/contacts?limit=1000', c?.contact_id, null, true);

    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value || null;
      });

      try {
        if (isEdit) {
          await API.put(`/cases/${c.id}`, data);
          Components.showToast('Case updated', 'success');
        } else {
          await API.post('/cases', data);
          Components.showToast('Case created', 'success');
        }
        Components.closeModal();
        if (currentCaseId) {
          renderCaseDetail(currentCaseId);
        } else {
          loadCases(1);
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  async function loadCaseSelect(selectId, endpoint, selectedId, nameField, isContact = false) {
    try {
      const result = await API.get(endpoint);
      const select = document.getElementById(selectId);
      if (!select) return;
      const items = result.data || result;
      const options = items.map(item => {
        const label = isContact
          ? `${item.first_name} ${item.last_name}`
          : (item[nameField] || item.name || item.id);
        return `<option value="${item.id}" ${item.id == selectedId ? 'selected' : ''}>${Components.escapeHtml(label)}</option>`;
      }).join('');
      select.innerHTML = '<option value="">— Select —</option>' + options;
    } catch (error) {
      // Silent
    }
  }

  async function loadCaseForEdit(id) {
    try {
      const c = await API.get(`/cases/${id}`);
      showCaseForm(c);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

  // ==================== Helpers ====================

  function getPriorityBadgeHtml(priority) {
    if (!priority) return '—';
    const classes = {
      'high': 'badge-danger',
      'medium': 'badge-warning',
      'low': 'badge-success',
      'urgent': 'badge-danger'
    };
    const icons = {
      'urgent': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢'
    };
    const cls = classes[priority.toLowerCase()] || 'badge-secondary';
    const icon = icons[priority.toLowerCase()] || '';
    const display = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
    return `<span class="badge ${cls}">${icon} ${Components.escapeHtml(display)}</span>`;
  }

  function getCaseStatusBadgeHtml(status) {
    if (!status) return '—';
    const clsMap = {
      'new': 'badge-info',
      'in progress': 'badge-warning',
      'resolved': 'badge-success',
      'closed': 'badge-secondary'
    };
    const iconMap = {
      'new': '🆕',
      'in progress': '🔄',
      'resolved': '✅',
      'closed': '🔒'
    };
    const key = status.toLowerCase();
    const cls = clsMap[key] || 'badge-secondary';
    const icon = iconMap[key] || '';
    return `<span class="badge ${cls}">${icon} ${Components.escapeHtml(status)}</span>`;
  }

})();
