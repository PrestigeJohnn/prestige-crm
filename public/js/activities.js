/**
 * Activities — 跟进记录页面
 * 列表视图（表格）、时间线视图、创建/编辑模态框、详情页、删除确认
 */
;(function() {
  'use strict';

  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let filterType = '';
  let filterAccountId = '';
  let viewMode = 'list'; // 'list' | 'timeline'
  let currentActivityId = null;

  const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Site Visit', 'Note'];
  const ACTIVITY_ICONS = {
    'Call': '📞',
    'Email': '✉️',
    'Meeting': '🤝',
    'WhatsApp': '💬',
    'Site Visit': '🏗️',
    'Note': '📝'
  };

  // ==================== Register Page ====================
  App.registerPage('activities', {
    render: renderActivities,
    destroy: () => { currentActivityId = null; }
  });

  // ==================== Main Render ====================
  async function renderActivities() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-page-header">
        <h1 class="sf-page-title">Activities</h1>
        <div class="sf-page-actions">
          <div class="sf-btn-group">
            <button class="sf-btn sf-btn--sm ${viewMode === 'list' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="list">List</button>
            <button class="sf-btn sf-btn--sm ${viewMode === 'timeline' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="timeline">Timeline</button>
          </div>
          <button class="sf-btn sf-btn--primary sf-btn--sm" id="btnNewActivity">+ New Activity</button>
        </div>
      </div>
      <div id="activitiesContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnNewActivity').addEventListener('click', () => showActivityForm());

    // View toggle
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        renderActivities();
      });
    });

    // Check if viewing a specific activity
    const hash = window.location.hash;
    const match = hash.match(/#activities\/(.+)/);
    if (match) {
      currentActivityId = match[1];
      await renderActivityDetail(currentActivityId);
    } else {
      await loadActivities(1);
    }
  }

  // ==================== Load Activities ====================
  async function loadActivities(page = 1) {
    const container = document.getElementById('activitiesContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(filterType && { type: filterType }),
        ...(filterAccountId && { account_id: filterAccountId })
      });

      const result = await API.get(`/activities?${params}`);
      const { data: activities, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;

      if (viewMode === 'timeline') {
        renderTimelineView(activities, total);
      } else {
        renderActivitiesList(activities, total);
      }
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load activities',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'activities\')">Retry</button>'
      );
    }
  }

  // ==================== List View ====================
  function renderActivitiesList(activities, total) {
    const container = document.getElementById('activitiesContent');
    if (!container) return;

    if (!activities || activities.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '📝',
        'No activities found',
        searchQuery ? 'Try a different search term' : 'Log your first activity to get started',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewActivity\').click()">+ New Activity</button>'
      );
      return;
    }

    const rows = activities.map(a => `
      <tr class="sf-table__row" data-id="${a.id}">
        <td>
          <a class="sf-link" href="#activities/${a.id}" onclick="App.navigateTo('activities','${a.id}'); return false;">
            ${Components.escapeHtml(a.subject || '—')}
          </a>
        </td>
        <td>${getActivityIcon(a.type)} ${Components.escapeHtml(a.type || '—')}</td>
        <td>${Components.escapeHtml(a.account_name || '—')}</td>
        <td>${Components.escapeHtml(a.contact_name || '—')}</td>
        <td>${Components.formatDateTime(a.date)}</td>
        <td>${a.duration ? a.duration + ' min' : '—'}</td>
        <td class="sf-table__cell--action">
          <div class="sf-row-actions">
            <button class="sf-btn sf-btn--icon sf-btn--sm" title="Edit" onclick="window._actEdit('${a.id}')">✏️</button>
            <button class="sf-btn sf-btn--icon sf-btn--sm" title="Delete" onclick="window._actDelete('${a.id}', '${Components.escapeHtml(a.subject || '')}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    const typeOptions = ACTIVITY_TYPES.map(t =>
      `<option value="${t}" ${filterType === t ? 'selected' : ''}>${t}</option>`
    ).join('');

    container.innerHTML = `
      <div class="sf-card">
        <div class="sf-card__header">
          <div class="sf-card__toolbar">
            <input type="text" class="sf-input" id="activitySearch"
                   placeholder="Search activities..." value="${Components.escapeHtml(searchQuery)}">
            <select class="sf-select" id="filterType" style="width:150px">
              <option value="">All Types</option>
              ${typeOptions}
            </select>
          </div>
          <span class="sf-card__count">${total} activities</span>
        </div>
        <div class="sf-table-wrapper sf-table-wrapper--scroll">
          <table class="sf-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Type</th>
                <th>Account</th>
                <th>Contact</th>
                <th>Date</th>
                <th>Duration</th>
                <th class="sf-table__cell--action">Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${totalPages > 1 ? `
          <div class="sf-card__footer">
            ${Components.renderPagination(currentPage, totalPages, (p) => loadActivities(p))}
          </div>
        ` : ''}
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('activitySearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadActivities(1);
      }, 300));
    }

    // Bind type filter
    const typeFilter = document.getElementById('filterType');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        filterType = e.target.value;
        loadActivities(1);
      });
    }

    // Bind pagination
    container.querySelectorAll('.sf-pagination__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadActivities(page);
      });
    });

    // Expose inline handlers
    window._actEdit = (id) => loadActivityForEdit(id);
    window._actDelete = (id, subject) => {
      Components.showConfirm(
        `Delete activity "${subject}"?`,
        async () => {
          try {
            await API.del(`/activities/${id}`);
            Components.showToast('Activity deleted', 'success');
            loadActivities(currentPage);
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

  // ==================== Timeline View ====================
  function renderTimelineView(activities, total) {
    const container = document.getElementById('activitiesContent');
    if (!container) return;

    if (!activities || activities.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '📝',
        'No activities found',
        'Log your first activity to get started',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewActivity\').click()">+ New Activity</button>'
      );
      return;
    }

    // Group by date
    const groups = {};
    activities.forEach(a => {
      const dateKey = (a.date || '').slice(0, 10) || 'Unknown';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(a);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return new Date(b) - new Date(a);
    });

    const typeOptions = ACTIVITY_TYPES.map(t =>
      `<option value="${t}" ${filterType === t ? 'selected' : ''}>${t}</option>`
    ).join('');

    const timelineHtml = sortedDates.map(date => `
      <div class="sf-timeline__group">
        <div class="sf-timeline__date">
          <span class="sf-timeline__date-badge">${date === 'Unknown' ? 'Unknown' : Components.formatDate(date)}</span>
        </div>
        <div class="sf-timeline__items">
          ${groups[date].map(a => {
            const typeKey = (a.type || 'note').toLowerCase().replace(/\s/g, '-');
            return `
              <div class="sf-timeline__item" onclick="App.navigateTo('activities','${a.id}')">
                <div class="sf-timeline__icon sf-timeline__icon--${typeKey}">
                  ${getActivityIcon(a.type)}
                </div>
                <div class="sf-timeline__content">
                  <div class="sf-timeline__header">
                    <span class="sf-timeline__type">${Components.escapeHtml(a.type || '')}</span>
                    <span class="sf-timeline__time">${Components.formatDateTime(a.date)}</span>
                  </div>
                  <div class="sf-timeline__subject">${Components.escapeHtml(a.subject || '')}</div>
                  <div class="sf-timeline__meta">
                    ${a.account_name ? `<span class="sf-badge sf-badge--neutral">${Components.escapeHtml(a.account_name)}</span>` : ''}
                    ${a.contact_name ? `<span class="sf-badge sf-badge--neutral">${Components.escapeHtml(a.contact_name)}</span>` : ''}
                    ${a.duration ? `<span class="sf-badge sf-badge--neutral">⏱️ ${a.duration} min</span>` : ''}
                  </div>
                  ${a.description ? `<div class="sf-timeline__desc">${Components.escapeHtml(a.description)}</div>` : ''}
                  ${a.next_action ? `<div class="sf-timeline__next">➡️ Next: ${Components.escapeHtml(a.next_action)}${a.next_action_date ? ' (' + Components.formatDate(a.next_action_date) + ')' : ''}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="sf-card">
        <div class="sf-card__header">
          <div class="sf-card__toolbar">
            <input type="text" class="sf-input" id="activitySearchTimeline"
                   placeholder="Search activities..." value="${Components.escapeHtml(searchQuery)}">
            <select class="sf-select" id="filterTypeTimeline" style="width:150px">
              <option value="">All Types</option>
              ${typeOptions}
            </select>
          </div>
          <span class="sf-card__count">${total} activities</span>
        </div>
        <div class="sf-card__body">
          <div class="sf-timeline">${timelineHtml}</div>
        </div>
        ${totalPages > 1 ? `
          <div class="sf-card__footer">
            ${Components.renderPagination(currentPage, totalPages, (p) => loadActivities(p))}
          </div>
        ` : ''}
      </div>
    `;

    const searchInput = document.getElementById('activitySearchTimeline');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadActivities(1);
      }, 300));
    }
    const typeFilter = document.getElementById('filterTypeTimeline');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        filterType = e.target.value;
        loadActivities(1);
      });
    }
    container.querySelectorAll('.sf-pagination__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadActivities(page);
      });
    });
  }

  // ==================== Detail View ====================
  async function renderActivityDetail(activityId) {
    const container = document.getElementById('activitiesContent');
    if (!container) return;

    container.innerHTML = '<div class="sf-page-loading"><div class="sf-spinner"></div></div>';

    try {
      const activity = await API.get(`/activities/${activityId}`);
      currentActivityId = activityId;
      renderDetail(activity);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load activity',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'activities\')">Back to List</button>'
      );
    }
  }

  function renderDetail(activity) {
    const container = document.getElementById('activitiesContent');
    if (!container) return;

    const fields = [
      { label: 'Type',             value: `${getActivityIcon(activity.type)} ${activity.type || '—'}`, isHtml: true },
      { label: 'Subject',          value: activity.subject },
      { label: 'Account',          value: activity.account_name },
      { label: 'Contact',          value: activity.contact_name },
      { label: 'Opportunity',      value: activity.opportunity_name },
      { label: 'Date',             value: Components.formatDateTime(activity.date), isHtml: true },
      { label: 'Duration',         value: activity.duration ? activity.duration + ' minutes' : null },
      { label: 'Next Action',      value: activity.next_action },
      { label: 'Next Action Date', value: Components.formatDate(activity.next_action_date), isHtml: true },
      { label: 'Description',      value: activity.description }
    ];

    container.innerHTML = `
      <div class="sf-page-header">
        <div>
          <button class="sf-btn sf-btn--secondary sf-btn--sm" onclick="App.navigateTo('activities')">← Back</button>
          <h1 class="sf-page-title">${getActivityIcon(activity.type)} ${Components.escapeHtml(activity.subject || 'Activity')}</h1>
          <p class="sf-text sf-text--muted">${Components.escapeHtml(activity.type || '')} · ${Components.formatDateTime(activity.date)}</p>
        </div>
        <div class="sf-page-actions">
          <button class="sf-btn sf-btn--secondary sf-btn--sm" id="btnEditActivity">✏️ Edit</button>
          <button class="sf-btn sf-btn--danger sf-btn--sm" id="btnDeleteActivity">🗑️ Delete</button>
        </div>
      </div>

      <div class="sf-card">
        <div class="sf-card__body">
          <div class="sf-detail-grid">
            ${fields.map(f => `
              <div class="sf-detail-field ${!f.value ? 'sf-detail-field--empty' : ''}">
                <label class="sf-detail-label">${f.label}</label>
                <div class="sf-detail-value">${f.value ? (f.isHtml ? f.value : Components.escapeHtml(String(f.value))) : '—'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnEditActivity').addEventListener('click', () => showActivityForm(activity));
    document.getElementById('btnDeleteActivity').addEventListener('click', () => {
      window._actDelete(activity.id, activity.subject || '');
    });
  }

  // ==================== Create / Edit Form ====================
  function showActivityForm(activity = null) {
    const isEdit = !!activity;
    const formId = 'activityForm_' + Components.uid();

    const typeOptions = ACTIVITY_TYPES.map(t =>
      `<option value="${t}" ${activity?.type === t ? 'selected' : ''}>${getActivityIcon(t)} ${t}</option>`
    ).join('');

    const formHtml = `
      <form id="${formId}" class="sf-form">
        <div class="sf-form__grid">
          <div class="sf-form-group">
            <label class="sf-label sf-label--required">Type <span class="sf-required">*</span></label>
            <select class="sf-select" name="type" required>
              <option value="">— Select Type —</option>
              ${typeOptions}
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label sf-label--required">Date <span class="sf-required">*</span></label>
            <input class="sf-input" type="datetime-local" name="date" required
                   value="${activity?.date ? activity.date.slice(0, 16) : ''}">
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Account</label>
            <select class="sf-select" name="account_id" id="select_activity_account">
              <option value="">— Select Account —</option>
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Contact</label>
            <select class="sf-select" name="contact_id" id="select_activity_contact">
              <option value="">— Select Contact —</option>
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Opportunity</label>
            <select class="sf-select" name="opportunity_id" id="select_activity_opportunity">
              <option value="">— Select Opportunity —</option>
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Duration (min)</label>
            <input class="sf-input" type="number" name="duration" min="0"
                   value="${activity?.duration || ''}">
          </div>
          <div class="sf-form-group sf-form-group--full">
            <label class="sf-label sf-label--required">Subject <span class="sf-required">*</span></label>
            <input class="sf-input" type="text" name="subject" required
                   value="${Components.escapeHtml(activity?.subject || '')}">
          </div>
          <div class="sf-form-group sf-form-group--full">
            <label class="sf-label">Description</label>
            <textarea class="sf-textarea" name="description" rows="4">${Components.escapeHtml(activity?.description || '')}</textarea>
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Next Action</label>
            <input class="sf-input" type="text" name="next_action"
                   value="${Components.escapeHtml(activity?.next_action || '')}">
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Next Action Date</label>
            <input class="sf-input" type="date" name="next_action_date"
                   value="${activity?.next_action_date || ''}">
          </div>
        </div>
        <div class="sf-form__actions">
          <button type="button" class="sf-btn sf-btn--secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="sf-btn sf-btn--primary">${isEdit ? 'Update' : 'Create'} Activity</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Activity: ${activity.subject}` : 'New Activity',
      formHtml,
      'lg'
    );

    // Load select options
    loadSelectOptions('select_activity_account', '/accounts?limit=1000', activity?.account_id, 'company_name');
    loadSelectOptions('select_activity_contact', '/contacts?limit=1000', activity?.contact_id, null, true);
    loadSelectOptions('select_activity_opportunity', '/opportunities?limit=1000', activity?.opportunity_id, 'name');

    // Bind form submit
    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => {
        if (key === 'duration') {
          data[key] = value ? parseInt(value) : null;
        } else {
          data[key] = value || null;
        }
      });

      try {
        if (isEdit) {
          await API.put(`/activities/${activity.id}`, data);
          Components.showToast('Activity updated', 'success');
        } else {
          await API.post('/activities', data);
          Components.showToast('Activity created', 'success');
        }
        Components.closeModal();
        if (currentActivityId) {
          renderActivityDetail(currentActivityId);
        } else {
          loadActivities(1);
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  async function loadSelectOptions(selectId, endpoint, selectedId, nameField, isContact = false) {
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

  async function loadActivityForEdit(id) {
    try {
      const activity = await API.get(`/activities/${id}`);
      showActivityForm(activity);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

  // ==================== Helpers ====================
  function getActivityIcon(type) {
    return ACTIVITY_ICONS[type] || '📝';
  }

})();
