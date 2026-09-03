/**
 * Leads — 潜在客户页面
 * 看板视图（按状态分列）、列表视图、创建/编辑
 */
(() => {
  // ==================== State ====================
  let currentView = 'kanban'; // 'kanban' | 'list'
  let searchQuery = '';
  let currentLeadId = null;

  // Lead status columns
  const LEAD_STATUSES = [
    { key: 'new', label: 'New', color: '#3b82f6' },
    { key: 'contacted', label: 'Contacted', color: '#6366f1' },
    { key: 'qualified', label: 'Qualified', color: '#22c55e' },
    { key: 'proposal', label: 'Proposal', color: '#f59e0b' },
    { key: 'negotiation', label: 'Negotiation', color: '#f97316' },
    { key: 'won', label: 'Won', color: '#10b981' },
    { key: 'lost', label: 'Lost', color: '#ef4444' }
  ];

  // ==================== Register Page ====================
  App.registerPage('leads', {
    render: renderLeads,
    destroy: () => { currentLeadId = null; }
  });

  // ==================== Main Render ====================
  async function renderLeads() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Leads</h1>
        <div class="page-actions">
          <div class="view-toggle">
            <button class="sf-btn sf-btn--sm ${currentView === 'kanban' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="kanban">Kanban</button>
            <button class="sf-btn sf-btn--sm ${currentView === 'list' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="list">List</button>
          </div>
          <button class="sf-btn sf-btn--primary" id="btnNewLead">+ New Lead</button>
        </div>
      </div>
      <div id="leadsContent">
        ${Components.renderSkeleton(6, 4)}
      </div>
    `;

    document.getElementById('btnNewLead').addEventListener('click', () => showLeadForm());

    // View toggle
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentView = btn.dataset.view;
        renderLeads();
      });
    });

    // Check if viewing a specific lead
    const hash = window.location.hash;
    const match = hash.match(/#leads\/(.+)/);
    if (match) {
      currentLeadId = match[1];
      await renderLeadDetail(currentLeadId);
    } else {
      await loadLeads();
    }
  }

  // ==================== Load Leads ====================
  async function loadLeads() {
    const container = document.getElementById('leadsContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({ ...(searchQuery && { q: searchQuery }) });
      const leads = await API.get(`/leads?${params}`);

      if (currentView === 'kanban') {
        renderKanban(leads);
      } else {
        renderList(leads);
      }
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load leads',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'leads\')">Retry</button>'
      );
    }
  }

  // ==================== Kanban View ====================
  function renderKanban(leads) {
    const container = document.getElementById('leadsContent');
    if (!container) return;

    if (!leads || leads.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '🎯',
        'No leads found',
        searchQuery ? 'Try a different search term' : 'Create your first lead',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewLead\').click()">+ New Lead</button>'
      );
      return;
    }

    // Group leads by status
    const grouped = {};
    LEAD_STATUSES.forEach(s => { grouped[s.key] = []; });
    leads.forEach(lead => {
      const status = lead.status || 'new';
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(lead);
    });

    const columns = LEAD_STATUSES.map(status => {
      const items = grouped[status.key] || [];
      return `
        <div class="sf-kanban__column sf-kanban__column--${getColumnMod(status.key)}" data-status="${status.key}">
          <div class="sf-kanban__column-header" style="border-top-color: ${status.color};">
            <span class="sf-kanban__column-title">${status.label}</span>
            <span class="sf-kanban__column-count">${items.length}</span>
          </div>
          <div class="sf-kanban__column-body" id="kanban_${status.key}">
            ${items.map(lead => renderKanbanCard(lead)).join('')}
          </div>
          <div class="sf-kanban__column-footer">
            <button class="sf-btn sf-btn--ghost sf-btn--sm" onclick="window._editLead('${status.key}')">+ Add</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="kanban-board">
        <div class="kanban-search">
          <input type="text" class="sf-form__input search-input" id="leadSearch" 
                 placeholder="Search leads..." value="${Components.escapeHtml(searchQuery)}">
        </div>
        <div class="sf-kanban">${columns}</div>
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('leadSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadLeads();
      }, 300));
    }

    // Bind click-to-change-status on each card
    bindKanbanCardActions();

    // Bind drop zones for status change (click-based fallback)
    bindKanbanDropZones();

    // Expose inline handlers
    window._editLead = (status) => showLeadForm(null, status);
    window._editLeadById = (id) => loadLeadForEdit(id);
    window._deleteLead = (id, name) => {
      Components.showConfirm(
        `Delete lead "${name}"?`,
        async () => {
          try {
            await API.del(`/leads/${id}`);
            Components.showToast('Lead deleted', 'success');
            loadLeads();
          } catch (error) {
            Components.showToast(error.message, 'error');
          }
        },
        null,
        'Delete',
        'danger'
      );
    };
    window._changeLeadStatus = (id, newStatus) => changeLeadStatus(id, newStatus);
  }

  function getColumnMod(key) {
    const mods = {
      'new': 'blue',
      'contacted': 'blue',
      'qualified': 'green',
      'proposal': 'orange',
      'negotiation': 'orange',
      'won': 'green',
      'lost': 'red'
    };
    return mods[key] || 'blue';
  }

  function renderKanbanCard(lead) {
    const scoreHtml = lead.score ? `
      <div class="lead-score">
        <div class="score-bar">
          <div class="score-fill" style="width: ${lead.score}%; background: ${getScoreColor(lead.score)};"></div>
        </div>
        <span class="score-value">${lead.score}</span>
      </div>
    ` : '';

    return `
      <div class="sf-kanban-card" data-id="${lead.id}" onclick="App.navigateTo('leads','${lead.id}')">
        <div class="kanban-card-header">
          <span class="sf-kanban-card__title">${Components.escapeHtml(lead.company_name)}</span>
          <button class="sf-btn sf-btn--icon sf-btn--sm" onclick="event.stopPropagation(); window._editLeadById('${lead.id}')">✏️</button>
        </div>
        <div class="kanban-card-contact">${Components.escapeHtml(lead.contact_name || '')}</div>
        ${scoreHtml}
        <div class="sf-kanban-card__meta">
          <span class="kanban-card-source">${Components.escapeHtml(lead.source || '')}</span>
          <span class="kanban-card-date">${Components.formatRelative(lead.created_at)}</span>
        </div>
        <div class="kanban-card-actions">
          ${LEAD_STATUSES.map(s => s.key !== lead.status ? 
            `<button class="sf-btn sf-btn--ghost sf-btn--xs" onclick="event.stopPropagation(); window._changeLeadStatus('${lead.id}', '${s.key}')" title="Move to ${s.label}">→ ${s.label}</button>`
          : '').join('')}
        </div>
      </div>
    `;
  }

  function bindKanbanCardActions() {
    // The onclick handlers are already inline in the rendered HTML
    // This function handles any additional binding if needed
  }

  function bindKanbanDropZones() {
    const columns = document.querySelectorAll('.sf-kanban__column-body');

    columns.forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        column.classList.add('drag-over');
      });

      column.addEventListener('dragleave', () => {
        column.classList.remove('drag-over');
      });

      column.addEventListener('drop', async (e) => {
        e.preventDefault();
        column.classList.remove('drag-over');
        const leadId = e.dataTransfer.getData('text/plain');
        const newStatus = column.id.replace('kanban_', '');

        if (leadId && newStatus) {
          await changeLeadStatus(leadId, newStatus);
        }
      });
    });

    // Also bind dragstart on cards
    const cards = document.querySelectorAll('.sf-kanban-card');
    cards.forEach(card => {
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });
  }

  async function changeLeadStatus(leadId, newStatus) {
    try {
      await API.put(`/leads/${leadId}`, { status: newStatus });
      Components.showToast('Lead status updated', 'success');
      loadLeads();
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

  // ==================== List View ====================
  function renderList(leads) {
    const container = document.getElementById('leadsContent');
    if (!container) return;

    if (!leads || leads.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '🎯',
        'No leads found',
        searchQuery ? 'Try a different search term' : 'Create your first lead',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewLead\').click()">+ New Lead</button>'
      );
      return;
    }

    const rows = leads.map(l => `
      <tr class="sf-table__row" data-id="${l.id}">
        <td>
          <a class="link-primary" href="#leads/${l.id}" onclick="App.navigateTo('leads','${l.id}'); return false;">
            ${Components.escapeHtml(l.company_name)}
          </a>
        </td>
        <td>${Components.escapeHtml(l.contact_name || '—')}</td>
        <td>${Components.escapeHtml(l.email || '—')}</td>
        <td>${Components.escapeHtml(l.source || '—')}</td>
        <td>${Components.getStatusBadge(l.status, 'lead')}</td>
        <td>
          <div class="score-display">
            <div class="score-bar-sm">
              <div class="score-fill" style="width: ${l.score || 0}%; background: ${getScoreColor(l.score || 0)};"></div>
            </div>
            <span>${l.score || 0}</span>
          </div>
        </td>
        <td>
          <div class="row-actions">
            <button class="sf-btn sf-btn--sm sf-btn--icon" title="Edit" onclick="window._editLeadById('${l.id}')">✏️</button>
            <button class="sf-btn sf-btn--sm sf-btn--icon btn-delete" title="Delete" onclick="window._deleteLead('${l.id}', '${Components.escapeHtml(l.company_name)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="sf-card">
        <div class="sf-card__header">
          <div class="card-search">
            <input type="text" class="sf-form__input search-input" id="leadSearch" 
                   placeholder="Search leads..." value="${Components.escapeHtml(searchQuery)}">
          </div>
          <span class="sf-card__subtitle">${leads.length} leads</span>
        </div>
        <div class="sf-table-wrapper sf-table-wrapper--scroll">
          <table class="sf-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Source</th>
                <th>Status</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('leadSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadLeads();
      }, 300));
    }
  }

  // ==================== Detail View ====================
  async function renderLeadDetail(leadId) {
    const container = document.getElementById('leadsContent');
    if (!container) return;

    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const lead = await API.get(`/leads/${leadId}`);
      currentLeadId = leadId;
      renderDetail(lead);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load lead',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'leads\')">Back to List</button>'
      );
    }
  }

  function renderDetail(lead) {
    const container = document.getElementById('leadsContent');
    if (!container) return;

    const fields = [
      { label: 'Company Name', value: lead.company_name },
      { label: 'Contact Name', value: lead.contact_name },
      { label: 'Email', value: lead.email },
      { label: 'Phone', value: lead.phone },
      { label: 'Source', value: lead.source },
      { label: 'Status', value: lead.status, badge: true },
      { label: 'Score', value: lead.score ? `${lead.score}/100` : '—' },
      { label: 'Notes', value: lead.notes }
    ];

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-left">
          <button class="sf-btn sf-btn--sm sf-btn--secondary" onclick="App.navigateTo('leads')">← Back</button>
          <div class="detail-title-group">
            <h1 class="detail-title">${Components.escapeHtml(lead.company_name)}</h1>
            <p class="detail-subtitle">${Components.escapeHtml(lead.contact_name || '')}</p>
          </div>
        </div>
        <div class="detail-header-actions">
          <button class="sf-btn sf-btn--secondary" id="btnEditLead">✏️ Edit</button>
          <button class="sf-btn sf-btn--danger" id="btnDeleteLead">🗑️ Delete</button>
        </div>
      </div>

      <div class="sf-card">
        <div class="sf-card__body">
          <div class="detail-grid">
            ${fields.map(f => `
              <div class="detail-field">
                <label class="detail-label">${f.label}</label>
                <div class="detail-value">
                  ${f.badge ? Components.getStatusBadge(f.value, 'lead') : (f.value ? Components.escapeHtml(String(f.value)) : '—')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnEditLead').addEventListener('click', () => showLeadForm(lead));
    document.getElementById('btnDeleteLead').addEventListener('click', () => {
      window._deleteLead(lead.id, lead.company_name);
    });
  }

  // ==================== Create / Edit Form ====================
  function showLeadForm(lead = null, defaultStatus = 'new') {
    const isEdit = !!lead;
    const formId = 'leadForm_' + Components.uid();

    const fields = [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true, value: lead?.company_name || '' },
      { name: 'contact_name', label: 'Contact Name', type: 'text', value: lead?.contact_name || '' },
      { name: 'email', label: 'Email', type: 'email', value: lead?.email || '' },
      { name: 'phone', label: 'Phone', type: 'tel', value: lead?.phone || '' },
      { name: 'source', label: 'Source', type: 'text', value: lead?.source || '' },
      { name: 'status', label: 'Status', type: 'select', value: lead?.status || defaultStatus },
      { name: 'score', label: 'Score (0-100)', type: 'number', value: lead?.score || 0 },
      { name: 'notes', label: 'Notes', type: 'textarea', value: lead?.notes || '' }
    ];

    const statusOptions = LEAD_STATUSES.map(s =>
      `<option value="${s.key}" ${fields.find(f => f.name === 'status').value === s.key ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    const formHtml = `
      <form id="${formId}" class="sf-form">
        <div class="form-grid">
          ${fields.map(f => {
            if (f.type === 'textarea') {
              return `
                <div class="sf-form-group sf-form-group--full">
                  <label class="sf-form__label">${f.label}</label>
                  <textarea class="sf-form__textarea" name="${f.name}" rows="3">${Components.escapeHtml(String(f.value || ''))}</textarea>
                </div>`;
            }
            if (f.type === 'select' && f.name === 'status') {
              return `
                <div class="sf-form-group">
                  <label class="sf-form__label">${f.label}</label>
                  <select class="sf-form__select" name="${f.name}">${statusOptions}</select>
                </div>`;
            }
            return `
              <div class="sf-form-group">
                <label class="sf-form__label">${f.label} ${f.required ? '<span class="required">*</span>' : ''}</label>
                <input class="sf-form__input" type="${f.type}" name="${f.name}" value="${Components.escapeHtml(String(f.value || ''))}" ${f.required ? 'required' : ''} ${f.type === 'number' ? 'min="0" max="100"' : ''}>
              </div>`;
          }).join('')}
        </div>
        <div class="sf-form__actions">
          <button type="button" class="sf-btn sf-btn--secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="sf-btn sf-btn--primary">${isEdit ? 'Update' : 'Create'} Lead</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Lead: ${lead.company_name}` : 'New Lead',
      formHtml,
      'lg'
    );

    // Bind form submit
    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => {
        if (key === 'score') {
          data[key] = value ? parseInt(value, 10) : 0;
        } else {
          data[key] = value;
        }
      });

      try {
        if (isEdit) {
          await API.put(`/leads/${lead.id}`, data);
          Components.showToast('Lead updated', 'success');
        } else {
          await API.post('/leads', data);
          Components.showToast('Lead created', 'success');
        }
        Components.closeModal();
        if (currentLeadId) {
          renderLeadDetail(currentLeadId);
        } else {
          loadLeads();
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  async function loadLeadForEdit(id) {
    try {
      const lead = await API.get(`/leads/${id}`);
      showLeadForm(lead);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

  // ==================== Helpers ====================
  function getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }
})();
