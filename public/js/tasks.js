/**
 * Tasks — 待办事项页面
 * 今日待办列表、全部任务表格、创建/编辑模态框、标记完成切换、逾期提醒
 */
;(function() {
  'use strict';

  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let filterPriority = '';
  let filterStatus = '';
  let currentTaskId = null;
  let viewMode = 'today'; // 'today' | 'all'

  const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
  const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Cancelled'];

  // ==================== Register Page ====================
  App.registerPage('tasks', {
    render: renderTasks,
    destroy: () => { currentTaskId = null; }
  });

  // ==================== Main Render ====================
  async function renderTasks() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-page-header">
        <h1 class="sf-page-title">Tasks</h1>
        <div class="sf-page-actions">
          <div class="sf-btn-group">
            <button class="sf-btn sf-btn--sm ${viewMode === 'today' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="today">Today</button>
            <button class="sf-btn sf-btn--sm ${viewMode === 'all' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="all">All Tasks</button>
          </div>
          <button class="sf-btn sf-btn--primary sf-btn--sm" id="btnNewTask">+ New Task</button>
        </div>
      </div>
      <div id="tasksContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnNewTask').addEventListener('click', () => showTaskForm());

    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        renderTasks();
      });
    });

    const hash = window.location.hash;
    const match = hash.match(/#tasks\/(.+)/);
    if (match) {
      currentTaskId = match[1];
      await renderTaskDetail(currentTaskId);
    } else {
      await loadTasks(1);
    }
  }

  // ==================== Load Tasks ====================
  async function loadTasks(page = 1) {
    const container = document.getElementById('tasksContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(filterPriority && { priority: filterPriority }),
        ...(filterStatus && { status: filterStatus }),
        ...(viewMode === 'today' && { today: 'true' })
      });

      const result = await API.get(`/tasks?${params}`);
      const { data: tasks, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;

      if (viewMode === 'today') {
        renderTodayTasks(tasks, total);
      } else {
        renderTasksList(tasks, total);
      }
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load tasks',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'tasks\')">Retry</button>'
      );
    }
  }

  // ==================== Today View ====================
  function renderTodayTasks(tasks, total) {
    const container = document.getElementById('tasksContent');
    if (!container) return;

    const today = new Date().toISOString().slice(0, 10);
    const overdue = [];
    const dueToday = [];
    const upcoming = [];

    (tasks || []).forEach(t => {
      if (t.status === 'Completed') return;
      const dueDate = (t.due_date || '').slice(0, 10);
      if (dueDate && dueDate < today) {
        overdue.push(t);
      } else if (dueDate === today) {
        dueToday.push(t);
      } else {
        upcoming.push(t);
      }
    });

    function renderTaskGroup(title, icon, items, groupClass) {
      if (!items.length) return '';
      return `
        <div class="sf-task-group ${groupClass}">
          <div class="sf-task-group__header">${icon} ${title} (${items.length})</div>
          ${items.map(t => {
            const isOverdue = (t.due_date || '').slice(0, 10) < today;
            const done = t.status === 'Completed';
            return `
              <div class="sf-task-item ${isOverdue && !done ? 'sf-task-item--overdue' : ''}" data-id="${t.id}">
                <div class="sf-task-item__check ${done ? 'sf-task-item__check--done' : ''}"
                     onclick="window._taskToggle('${t.id}', '${t.status}', event)">
                  ${done ? '✓' : ''}
                </div>
                <div class="sf-task-item__body" onclick="App.navigateTo('tasks','${t.id}')">
                  <div class="sf-task-item__title ${done ? 'sf-task-item__title--done' : ''}">${Components.escapeHtml(t.title)}</div>
                  <div class="sf-task-item__meta">
                    ${t.account_name ? `<span>🏢 ${Components.escapeHtml(t.account_name)}</span>` : ''}
                    ${t.due_date ? `<span>📅 ${Components.formatDate(t.due_date)}</span>` : ''}
                    ${t.assigned_to ? `<span>👤 ${Components.escapeHtml(t.assigned_to)}</span>` : ''}
                  </div>
                </div>
                <div class="sf-task-item__priority">${Components.getPriorityBadge(t.priority)}</div>
                <div class="sf-row-actions">
                  <button class="sf-btn sf-btn--icon sf-btn--sm" title="Edit" onclick="event.stopPropagation(); window._taskEdit('${t.id}')">✏️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (!tasks || (overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0)) {
      container.innerHTML = Components.renderEmptyState(
        '✅',
        'No tasks for today',
        'Enjoy your free time or create a new task',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewTask\').click()">+ New Task</button>'
      );
      return;
    }

    container.innerHTML = `
      <div class="sf-card">
        <div class="sf-card__header">
          <span class="sf-card__subtitle">Today's Tasks · ${new Date().toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="sf-card__body sf-task-list">
          ${overdue.length ? renderTaskGroup('Overdue', '🔴', overdue, 'sf-task-group--overdue') : ''}
          ${renderTaskGroup('Due Today', '📋', dueToday, 'sf-task-group--today')}
          ${upcoming.length ? renderTaskGroup('Upcoming', '📆', upcoming, 'sf-task-group--upcoming') : ''}
        </div>
      </div>
    `;
  }

  // ==================== List View ====================
  function renderTasksList(tasks, total) {
    const container = document.getElementById('tasksContent');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '📋',
        'No tasks found',
        searchQuery ? 'Try a different search term' : 'Create your first task to get started',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewTask\').click()">+ New Task</button>'
      );
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const priorityOptions = PRIORITIES.map(p =>
      `<option value="${p}" ${filterPriority === p ? 'selected' : ''}>${p}</option>`
    ).join('');
    const statusOptions = STATUSES.map(s =>
      `<option value="${s}" ${filterStatus === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    const rows = tasks.map(t => {
      const isOverdue = (t.due_date || '').slice(0, 10) < today && t.status !== 'Completed' && t.status !== 'Cancelled';
      const done = t.status === 'Completed';
      return `
        <tr class="sf-table__row ${isOverdue ? 'sf-table__row--overdue' : ''}" data-id="${t.id}">
          <td>
            <div class="sf-task-toggle ${done ? 'sf-task-toggle--checked' : ''}"
                 onclick="window._taskToggle('${t.id}', '${t.status}', event)">
              ${done ? '✓' : ''}
            </div>
          </td>
          <td>
            <a class="sf-link ${done ? 'sf-text--strikethrough' : ''}"
               href="#tasks/${t.id}" onclick="App.navigateTo('tasks','${t.id}'); return false;">
              ${Components.escapeHtml(t.title)}
            </a>
          </td>
          <td>${Components.escapeHtml(t.account_name || '—')}</td>
          <td>${Components.formatDate(t.due_date)}</td>
          <td>${Components.getPriorityBadge(t.priority)}</td>
          <td>${Components.getStatusBadge(t.status, 'task')}</td>
          <td>${Components.escapeHtml(t.assigned_to || '—')}</td>
          <td class="sf-table__cell--action">
            <div class="sf-row-actions">
              <button class="sf-btn sf-btn--icon sf-btn--sm" title="Edit" onclick="window._taskEdit('${t.id}')">✏️</button>
              <button class="sf-btn sf-btn--icon sf-btn--sm" title="Delete" onclick="window._taskDelete('${t.id}', '${Components.escapeHtml(t.title)}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="sf-card">
        <div class="sf-card__header">
          <div class="sf-card__toolbar">
            <input type="text" class="sf-input" id="taskSearch"
                   placeholder="Search tasks..." value="${Components.escapeHtml(searchQuery)}">
            <select class="sf-select" id="filterPriority" style="width:130px">
              <option value="">All Priorities</option>
              ${priorityOptions}
            </select>
            <select class="sf-select" id="filterStatus" style="width:150px">
              <option value="">All Statuses</option>
              ${statusOptions}
            </select>
          </div>
          <span class="sf-card__count">${total} tasks</span>
        </div>
        <div class="sf-table-wrapper sf-table-wrapper--scroll">
          <table class="sf-table">
            <thead>
              <tr>
                <th style="width:40px">✓</th>
                <th>Title</th>
                <th>Account</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th class="sf-table__cell--action">Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${totalPages > 1 ? `
          <div class="sf-card__footer">
            ${Components.renderPagination(currentPage, totalPages, (p) => loadTasks(p))}
          </div>
        ` : ''}
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('taskSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadTasks(1);
      }, 300));
    }

    // Bind filters
    document.getElementById('filterPriority')?.addEventListener('change', (e) => {
      filterPriority = e.target.value;
      loadTasks(1);
    });
    document.getElementById('filterStatus')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      loadTasks(1);
    });

    // Bind pagination
    container.querySelectorAll('.sf-pagination__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadTasks(page);
      });
    });
  }

  // ==================== Detail View ====================
  async function renderTaskDetail(taskId) {
    const container = document.getElementById('tasksContent');
    if (!container) return;

    container.innerHTML = '<div class="sf-page-loading"><div class="sf-spinner"></div></div>';

    try {
      const task = await API.get(`/tasks/${taskId}`);
      currentTaskId = taskId;
      renderDetail(task);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load task',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'tasks\')">Back to List</button>'
      );
    }
  }

  function renderDetail(task) {
    const container = document.getElementById('tasksContent');
    if (!container) return;

    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = (task.due_date || '').slice(0, 10) < today && task.status !== 'Completed' && task.status !== 'Cancelled';

    const fields = [
      { label: 'Title',             value: task.title },
      { label: 'Account',           value: task.account_name },
      { label: 'Contact',           value: task.contact_name },
      { label: 'Opportunity',       value: task.opportunity_name },
      { label: 'Due Date',          value: Components.formatDate(task.due_date), isOverdue: isOverdue },
      { label: 'Priority',          value: null, badge: Components.getPriorityBadge(task.priority) },
      { label: 'Status',            value: null, badge: Components.getStatusBadge(task.status, 'task') },
      { label: 'Assigned To',       value: task.assigned_to },
      { label: 'Description',       value: task.description }
    ];

    container.innerHTML = `
      <div class="sf-page-header">
        <div>
          <button class="sf-btn sf-btn--secondary sf-btn--sm" onclick="App.navigateTo('tasks')">← Back</button>
          <h1 class="sf-page-title">${Components.escapeHtml(task.title)}</h1>
          <p class="sf-text sf-text--muted">${Components.getStatusBadge(task.status, 'task')} ${Components.getPriorityBadge(task.priority)}</p>
        </div>
        <div class="sf-page-actions">
          <button class="sf-btn sf-btn--secondary sf-btn--sm" id="btnToggleTask">
            ${task.status === 'Completed' ? '↩ Reopen' : '✓ Complete'}
          </button>
          <button class="sf-btn sf-btn--secondary sf-btn--sm" id="btnEditTask">✏️ Edit</button>
          <button class="sf-btn sf-btn--danger sf-btn--sm" id="btnDeleteTask">🗑️ Delete</button>
        </div>
      </div>

      ${isOverdue ? '<div class="sf-alert sf-alert--danger">⚠️ This task is overdue!</div>' : ''}

      <div class="sf-card">
        <div class="sf-card__body">
          <div class="sf-detail-grid">
            ${fields.map(f => `
              <div class="sf-detail-field ${!f.value && !f.badge ? 'sf-detail-field--empty' : ''}">
                <label class="sf-detail-label">${f.label}</label>
                <div class="sf-detail-value ${f.isOverdue ? 'sf-text sf-text--danger' : ''}">
                  ${f.badge || (f.value ? Components.escapeHtml(String(f.value)) : '—')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnToggleTask').addEventListener('click', () => {
      window._taskToggle(task.id, task.status, { stopPropagation: () => {} });
    });
    document.getElementById('btnEditTask').addEventListener('click', () => showTaskForm(task));
    document.getElementById('btnDeleteTask').addEventListener('click', () => {
      window._taskDelete(task.id, task.title);
    });
  }

  // ==================== Create / Edit Form ====================
  function showTaskForm(task = null) {
    const isEdit = !!task;
    const formId = 'taskForm_' + Components.uid();

    const priorityOptions = PRIORITIES.map(p =>
      `<option value="${p}" ${task?.priority === p ? 'selected' : ''}>${p}</option>`
    ).join('');
    const statusOptions = STATUSES.map(s =>
      `<option value="${s}" ${task?.status === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    const formHtml = `
      <form id="${formId}" class="sf-form">
        <div class="sf-form__grid">
          <div class="sf-form-group sf-form-group--full">
            <label class="sf-label sf-label--required">Title <span class="sf-required">*</span></label>
            <input class="sf-input" type="text" name="title" required
                   value="${Components.escapeHtml(task?.title || '')}">
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Account</label>
            <select class="sf-select" name="account_id" id="select_task_account">
              <option value="">— Select Account —</option>
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Contact</label>
            <select class="sf-select" name="contact_id" id="select_task_contact">
              <option value="">— Select Contact —</option>
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Opportunity</label>
            <select class="sf-select" name="opportunity_id" id="select_task_opportunity">
              <option value="">— Select Opportunity —</option>
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label sf-label--required">Due Date <span class="sf-required">*</span></label>
            <input class="sf-input" type="date" name="due_date" required
                   value="${task?.due_date ? task.due_date.slice(0, 10) : ''}">
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Priority</label>
            <select class="sf-select" name="priority">
              <option value="">— Select —</option>
              ${priorityOptions}
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Status</label>
            <select class="sf-select" name="status">
              ${statusOptions}
            </select>
          </div>
          <div class="sf-form-group">
            <label class="sf-label">Assigned To</label>
            <input class="sf-input" type="text" name="assigned_to"
                   value="${Components.escapeHtml(task?.assigned_to || '')}">
          </div>
          <div class="sf-form-group sf-form-group--full">
            <label class="sf-label">Description</label>
            <textarea class="sf-textarea" name="description" rows="4">${Components.escapeHtml(task?.description || '')}</textarea>
          </div>
        </div>
        <div class="sf-form__actions">
          <button type="button" class="sf-btn sf-btn--secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="sf-btn sf-btn--primary">${isEdit ? 'Update' : 'Create'} Task</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Task: ${task.title}` : 'New Task',
      formHtml,
      'lg'
    );

    loadTaskSelect('select_task_account', '/accounts?limit=1000', task?.account_id, 'company_name');
    loadTaskSelect('select_task_contact', '/contacts?limit=1000', task?.contact_id, null, true);
    loadTaskSelect('select_task_opportunity', '/opportunities?limit=1000', task?.opportunity_id, 'name');

    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value || null;
      });

      try {
        if (isEdit) {
          await API.put(`/tasks/${task.id}`, data);
          Components.showToast('Task updated', 'success');
        } else {
          await API.post('/tasks', data);
          Components.showToast('Task created', 'success');
        }
        Components.closeModal();
        if (currentTaskId) {
          renderTaskDetail(currentTaskId);
        } else {
          loadTasks(1);
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  async function loadTaskSelect(selectId, endpoint, selectedId, nameField, isContact = false) {
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

  async function loadTaskForEdit(id) {
    try {
      const task = await API.get(`/tasks/${id}`);
      showTaskForm(task);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

  // ==================== Global Handlers (exposed for inline onclick) ====================
  window._taskEdit = (id) => loadTaskForEdit(id);
  window._taskDelete = (id, title) => {
    Components.showConfirm(
      `Delete task "${title}"?`,
      async () => {
        try {
          await API.del(`/tasks/${id}`);
          Components.showToast('Task deleted', 'success');
          loadTasks(currentPage);
        } catch (error) {
          Components.showToast(error.message, 'error');
        }
      },
      null,
      'Delete',
      'danger'
    );
  };
  window._taskToggle = async (id, currentStatus, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const newStatus = currentStatus === 'Completed' ? 'Not Started' : 'Completed';
    try {
      await API.put(`/tasks/${id}`, { status: newStatus });
      Components.showToast(
        newStatus === 'Completed' ? 'Task completed ✓' : 'Task reopened',
        'success'
      );
      loadTasks(currentPage);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  };

})();
