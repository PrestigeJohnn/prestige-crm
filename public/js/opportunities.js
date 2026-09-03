/**
 * Opportunities — 商机页面
 * 看板视图（按阶段分列）、列表视图、创建/编辑模态框、详情页、删除确认
 */
(() => {
  // ==================== State ====================
  let currentView = 'kanban'; // 'kanban' | 'list'
  let searchQuery = '';
  let currentOppId = null;

  // Opportunity stage columns (6 columns as required)
  const OPP_STAGES = [
    { key: 'discovery',         label: 'Discovery',         color: '#6b7280' },
    { key: 'qualification',     label: 'Qualification',     color: '#3b82f6' },
    { key: 'proposal',          label: 'Proposal',          color: '#f59e0b' },
    { key: 'negotiation',       label: 'Negotiation',       color: '#f97316' },
    { key: 'closed_won',        label: 'Closed Won',        color: '#22c55e' },
    { key: 'closed_lost',       label: 'Closed Lost',       color: '#ef4444' }
  ];

  // ==================== Register Page ====================
  App.registerPage('opportunities', {
    render: renderOpportunities,
    destroy: () => { currentOppId = null; }
  });

  // ==================== Main Render ====================
  async function renderOpportunities() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-page-header">
        <h1 class="sf-page-title">Opportunities</h1>
        <div class="sf-page-actions">
          <div class="sf-btn-group">
            <button class="sf-btn sf-btn--sm ${currentView === 'kanban' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="kanban">Kanban</button>
            <button class="sf-btn sf-btn--sm ${currentView === 'list' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="list">List</button>
          </div>
          <button class="sf-btn sf-btn--primary sf-btn--sm" id="btnNewOpp">+ New Opportunity</button>
        </div>
      </div>
      <div id="oppsContent">
        ${Components.renderSkeleton(6, 4)}
      </div>
    `;

    document.getElementById('btnNewOpp').addEventListener('click', () => showOppForm());

    // View toggle
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentView = btn.dataset.view;
        renderOpportunities();
      });
    });

    // Check if viewing a specific opportunity (hash: #opportunities/{id})
    const hash = window.location.hash;
    const match = hash.match(/#opportunities\/(.+)/);
    if (match) {
      currentOppId = match[1];
      await renderOppDetail(currentOppId);
    } else {
      await loadOpportunities();
    }
  }

  // ==================== Load Opportunities ====================
  async function loadOpportunities() {
    const container = document.getElementById('oppsContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({ ...(searchQuery && { q: searchQuery }) });
      const opps = await API.get(`/opportunities?${params}`);

      if (currentView === 'kanban') {
        renderKanban(opps);
      } else {
        renderList(opps);
      }
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load opportunities',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'opportunities\')">Retry</button>'
      );
    }
  }

  // ==================== Kanban View ====================
  function renderKanban(opportunities) {
    const container = document.getElementById('oppsContent');
    if (!container) return;

    if (!opportunities || opportunities.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '💼',
        'No opportunities found',
        searchQuery ? 'Try a different search term' : 'Create your first opportunity',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewOpp\').click()">+ New Opportunity</button>'
      );
      return;
    }

    // Group by stage
    const grouped = {};
    OPP_STAGES.forEach(s => { grouped[s.key] = []; });
    opportunities.forEach(opp => {
      const stage = opp.stage || 'discovery';
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage].push(opp);
    });

    // Calculate pipeline value per stage
    const stageValues = {};
    OPP_STAGES.forEach(s => {
      stageValues[s.key] = (grouped[s.key] || []).reduce((sum, o) => sum + (parseFloat(o.value) || 0), 0);
    });

    const columns = OPP_STAGES.map(stage => {
      const items = grouped[stage.key] || [];
      const stageTotal = stageValues[stage.key];
      return `
        <div class="sf-kanban__column" data-stage="${stage.key}">
          <div class="sf-kanban__column-header" style="border-top-color: ${stage.color};">
            <span class="sf-kanban__column-title">${stage.label}</span>
            <span class="sf-kanban__column-count">${items.length}</span>
          </div>
          <div class="sf-kanban__column-body" id="opp_kanban_${stage.key}">
            ${items.map(opp => renderKanbanCard(opp)).join('')}
          </div>
          <div class="sf-kanban__column-footer">
            <span class="sf-kanban__column-value">${Components.formatCurrency(stageTotal)}</span>
            <button class="sf-btn sf-btn--xs sf-btn--ghost" onclick="window._oppAddToStage('${stage.key}')">+ Add</button>
          </div>
        </div>
      `;
    }).join('');

    // Pipeline summary
    const totalPipeline = Object.values(stageValues).reduce((s, v) => s + v, 0);
    const totalItems = opportunities.length;

    container.innerHTML = `
      <div class="sf-kanban">
        <div class="sf-kanban__toolbar">
          <div class="sf-kanban__summary">
            <span>Pipeline: <strong>${Components.formatCurrency(totalPipeline)}</strong></span>
            <span>${totalItems} opportunities</span>
          </div>
          <input type="text" class="sf-input sf-input--search" id="oppSearch"
                 placeholder="Search opportunities..." value="${Components.escapeHtml(searchQuery)}">
        </div>
        <div class="sf-kanban__columns">${columns}</div>
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('oppSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadOpportunities();
      }, 300));
    }

    // Bind drag and drop
    initDragAndDrop();

    // Expose inline handlers
    window._oppAddToStage = (stage) => showOppForm(null, stage);
    window._oppEditById = (id) => loadOppForEdit(id);
    window._oppDelete = (id, name) => {
      Components.showConfirm(
        `Delete opportunity "${name}"?`,
        async () => {
          try {
            await API.del(`/opportunities/${id}`);
            Components.showToast('Opportunity deleted', 'success');
            loadOpportunities();
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

  function renderKanbanCard(opp) {
    const probability = parseInt(opp.probability) || 0;
    const probabilityHtml = probability > 0 ? `
      <div class="sf-kanban-card__prob">
        <div class="sf-kanban-card__prob-bar">
          <div class="sf-kanban-card__prob-fill" style="width: ${probability}%; background: ${getProbColor(probability)};"></div>
        </div>
        <span class="sf-kanban-card__prob-value">${probability}%</span>
      </div>
    ` : '';

    return `
      <div class="sf-kanban-card" draggable="true" data-id="${opp.id}" onclick="App.navigateTo('opportunities','${opp.id}')">
        <div class="sf-kanban-card__header">
          <span class="sf-kanban-card__title">${Components.escapeHtml(opp.name)}</span>
          <button class="sf-btn sf-btn--icon sf-btn--xs" onclick="event.stopPropagation(); window._oppEditById('${opp.id}')" title="Edit">✏️</button>
        </div>
        <div class="sf-kanban-card__account">${Components.escapeHtml(opp.account_name || '')}</div>
        <div class="sf-kanban-card__value">${Components.formatCurrency(opp.value)}</div>
        ${probabilityHtml}
        <div class="sf-kanban-card__meta">
          <span>Close: ${Components.formatDate(opp.expected_close_date)}</span>
        </div>
      </div>
    `;
  }

  // ==================== Drag & Drop ====================
  function initDragAndDrop() {
    const cards = document.querySelectorAll('.sf-kanban-card');
    const columns = document.querySelectorAll('.sf-kanban__column-body');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('sf-kanban-card--dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('sf-kanban-card--dragging');
      });
    });

    columns.forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        column.classList.add('sf-kanban__column-body--dragover');
      });

      column.addEventListener('dragleave', () => {
        column.classList.remove('sf-kanban__column-body--dragover');
      });

      column.addEventListener('drop', async (e) => {
        e.preventDefault();
        column.classList.remove('sf-kanban__column-body--dragover');
        const oppId = e.dataTransfer.getData('text/plain');
        const newStage = column.id.replace('opp_kanban_', '');

        if (oppId && newStage) {
          try {
            await API.put(`/opportunities/${oppId}`, { stage: newStage });
            Components.showToast('Opportunity stage updated', 'success');
            loadOpportunities();
          } catch (error) {
            Components.showToast(error.message, 'error');
          }
        }
      });
    });
  }

  // ==================== List View ====================
  function renderList(opportunities) {
    const container = document.getElementById('oppsContent');
    if (!container) return;

    if (!opportunities || opportunities.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '💼',
        'No opportunities found',
        searchQuery ? 'Try a different search term' : 'Create your first opportunity',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewOpp\').click()">+ New Opportunity</button>'
      );
      return;
    }

    const rows = opportunities.map(o => {
      const prob = parseInt(o.probability) || 0;
      return `
        <tr class="sf-table__row" data-id="${o.id}">
          <td>
            <a class="sf-link" href="#opportunities/${o.id}" onclick="App.navigateTo('opportunities','${o.id}'); return false;">
              ${Components.escapeHtml(o.name)}
            </a>
          </td>
          <td>${Components.escapeHtml(o.account_name || '—')}</td>
          <td class="sf-table__cell--number">${Components.formatCurrency(o.value)}</td>
          <td>${Components.getStatusBadge(o.stage, 'opportunity')}</td>
          <td>
            <div class="sf-kanban-card__prob" style="min-width:80px">
              <div class="sf-kanban-card__prob-bar">
                <div class="sf-kanban-card__prob-fill" style="width: ${prob}%; background: ${getProbColor(prob)};"></div>
              </div>
              <span class="sf-kanban-card__prob-value">${prob}%</span>
            </div>
          </td>
          <td>${Components.formatDate(o.expected_close_date)}</td>
          <td>${Components.escapeHtml(o.competitor || '—')}</td>
          <td class="sf-table__cell--action">
            <div class="sf-row-actions">
              <button class="sf-btn sf-btn--icon sf-btn--sm" title="Edit" onclick="window._oppEditById('${o.id}')">✏️</button>
              <button class="sf-btn sf-btn--icon sf-btn--sm" title="Delete" onclick="window._oppDelete('${o.id}', '${Components.escapeHtml(o.name)}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="sf-card">
        <div class="sf-card__header">
          <div class="sf-card__toolbar">
            <input type="text" class="sf-input sf-input--search" id="oppSearch"
                   placeholder="Search opportunities..." value="${Components.escapeHtml(searchQuery)}">
          </div>
          <span class="sf-card__count">${opportunities.length} opportunities</span>
        </div>
        <div class="sf-table-wrapper sf-table-wrapper--scroll">
          <table class="sf-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Account</th>
                <th class="sf-table__th--sortable">Value</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Expected Close</th>
                <th>Competitor</th>
                <th class="sf-table__cell--action">Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('oppSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadOpportunities();
      }, 300));
    }
  }

  // ==================== Detail View ====================
  async function renderOppDetail(oppId) {
    const container = document.getElementById('oppsContent');
    if (!container) return;

    container.innerHTML = '<div class="sf-page-loading"><div class="sf-spinner"></div></div>';

    try {
      const opp = await API.get(`/opportunities/${oppId}`);
      currentOppId = oppId;
      renderDetail(opp);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load opportunity',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'opportunities\')">Back to List</button>'
      );
    }
  }

  function renderDetail(opp) {
    const container = document.getElementById('oppsContent');
    if (!container) return;

    const probability = parseInt(opp.probability) || 0;
    const stageInfo = OPP_STAGES.find(s => s.key === opp.stage) || OPP_STAGES[0];

    container.innerHTML = `
      <div class="sf-page-header">
        <div>
          <button class="sf-btn sf-btn--secondary sf-btn--sm" onclick="App.navigateTo('opportunities')">← Back</button>
          <h1 class="sf-page-title">${Components.escapeHtml(opp.name)}</h1>
          <p class="sf-text sf-text--muted">${Components.escapeHtml(opp.account_name || '')}</p>
        </div>
        <div class="sf-page-actions">
          <button class="sf-btn sf-btn--secondary sf-btn--sm" id="btnEditOpp">✏️ Edit</button>
          <button class="sf-btn sf-btn--danger sf-btn--sm" id="btnDeleteOpp">🗑️ Delete</button>
        </div>
      </div>

      <div class="sf-card sf-card--detail">
        <div class="sf-card__header" style="border-left: 4px solid ${stageInfo.color}; padding-left: 16px;">
          <div class="sf-card__kpi">
            <div class="sf-card__kpi-value">${Components.formatCurrency(opp.value)}</div>
            <div class="sf-card__kpi-label">Weighted: ${Components.formatCurrency((parseFloat(opp.value) || 0) * probability / 100)}</div>
          </div>
          <div class="sf-card__kpi">
            <div class="sf-card__kpi-value">${probability}%</div>
            <div class="sf-kanban-card__prob" style="min-width:100px;margin-top:4px">
              <div class="sf-kanban-card__prob-bar" style="height:8px">
                <div class="sf-kanban-card__prob-fill" style="width: ${probability}%; background: ${getProbColor(probability)};"></div>
              </div>
            </div>
          </div>
          <div class="sf-card__kpi">
            <div class="sf-card__kpi-value">${Components.getStatusBadge(opp.stage, 'opportunity')}</div>
            <div class="sf-card__kpi-label">Stage</div>
          </div>
        </div>
        <div class="sf-card__body">
          <div class="sf-detail-grid">
            <div class="sf-detail-field">
              <label class="sf-detail-label">Account</label>
              <div class="sf-detail-value">${Components.escapeHtml(opp.account_name || '—')}</div>
            </div>
            <div class="sf-detail-field">
              <label class="sf-detail-label">Contact</label>
              <div class="sf-detail-value">${Components.escapeHtml(opp.contact_name || '—')}</div>
            </div>
            <div class="sf-detail-field">
              <label class="sf-detail-label">Expected Close</label>
              <div class="sf-detail-value">${Components.formatDate(opp.expected_close_date)}</div>
            </div>
            <div class="sf-detail-field">
              <label class="sf-detail-label">Competitor</label>
              <div class="sf-detail-value">${Components.escapeHtml(opp.competitor || '—')}</div>
            </div>
            <div class="sf-detail-field sf-detail-field--full">
              <label class="sf-detail-label">Description</label>
              <div class="sf-detail-value">${Components.escapeHtml(opp.description || '—')}</div>
            </div>
            <div class="sf-detail-field sf-detail-field--full">
              <label class="sf-detail-label">Notes</label>
              <div class="sf-detail-value">${Components.escapeHtml(opp.notes || '—')}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnEditOpp').addEventListener('click', () => showOppForm(opp));
    document.getElementById('btnDeleteOpp').addEventListener('click', () => {
      window._oppDelete(opp.id, opp.name);
    });
  }

  // ==================== Create / Edit Form ====================
  function showOppForm(opp = null, defaultStage = 'discovery') {
    const isEdit = !!opp;
    const formId = 'oppForm_' + Components.uid();

    const stageOptions = OPP_STAGES.map(s =>
      `<option value="${s.key}" ${(opp?.stage || defaultStage) === s.key ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    const fields = [
      { name: 'name',               label: 'Opportunity Name',     type: 'text',     required: true,  value: opp?.name || '' },
      { name: 'account_id',         label: 'Account',              type: 'select',   required: true,  value: opp?.account_id || '', id: 'select_account_id', placeholder: '— Select Account —' },
      { name: 'contact_id',         label: 'Contact',              type: 'select',   required: false, value: opp?.contact_id || '', id: 'select_contact_id', placeholder: '— Select Contact —' },
      { name: 'description',        label: 'Description',          type: 'textarea', required: false, value: opp?.description || '' },
      { name: 'value',              label: 'Value (SGD)',          type: 'number',   required: true,  value: opp?.value || '', min: 0 },
      { name: 'probability',        label: 'Probability (%)',      type: 'number',   required: false, value: opp?.probability || 0, min: 0, max: 100 },
      { name: 'stage',              label: 'Stage',                type: 'select',   required: true,  value: opp?.stage || defaultStage, options: stageOptions },
      { name: 'competitor',         label: 'Competitor',           type: 'text',     required: false, value: opp?.competitor || '' },
      { name: 'expected_close_date',label: 'Expected Close Date',  type: 'date',     required: false, value: opp?.expected_close_date || '' },
      { name: 'notes',              label: 'Notes',                type: 'textarea', required: false, value: opp?.notes || '' }
    ];

    const formHtml = `
      <form id="${formId}" class="sf-form">
        <div class="sf-form__grid">
          ${fields.map(f => {
            const requiredMark = f.required ? '<span class="sf-required">*</span>' : '';
            const commonAttrs = `name="${f.name}" ${f.required ? 'required' : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''}`;

            if (f.type === 'textarea') {
              return `
                <div class="sf-form-group sf-form-group--full">
                  <label class="sf-label sf-label--required">${f.label}${requiredMark}</label>
                  <textarea class="sf-textarea" ${commonAttrs} rows="3">${Components.escapeHtml(String(f.value || ''))}</textarea>
                </div>`;
            }
            if (f.type === 'select') {
              if (f.options) {
                return `
                  <div class="sf-form-group">
                    <label class="sf-label">${f.label}${requiredMark}</label>
                    <select class="sf-select" ${commonAttrs}>${f.options}</select>
                  </div>`;
              }
              return `
                <div class="sf-form-group">
                  <label class="sf-label">${f.label}${requiredMark}</label>
                  <select class="sf-select" name="${f.name}" id="${f.id}" ${f.required ? 'required' : ''}>
                    <option value="">${f.placeholder || '— Select —'}</option>
                  </select>
                </div>`;
            }
            return `
              <div class="sf-form-group">
                <label class="sf-label">${f.label}${requiredMark}</label>
                <input class="sf-input" type="${f.type}" value="${Components.escapeHtml(String(f.value || ''))}" ${commonAttrs}>
              </div>`;
          }).join('')}
        </div>
        <div class="sf-form__actions">
          <button type="button" class="sf-btn sf-btn--secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="sf-btn sf-btn--primary">${isEdit ? 'Update' : 'Create'} Opportunity</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Opportunity: ${opp.name}` : 'New Opportunity',
      formHtml,
      'lg'
    );

    // Load accounts and contacts for selects
    loadAccountOptions('select_account_id', opp?.account_id || '');
    loadContactOptions('select_contact_id', opp?.account_id || '', opp?.contact_id || '');

    // When account changes, reload contacts
    const accountSelect = document.getElementById('select_account_id');
    if (accountSelect) {
      accountSelect.addEventListener('change', () => {
        loadContactOptions('select_contact_id', accountSelect.value, '');
      });
    }

    // Bind form submit
    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => {
        if (key === 'value' || key === 'probability') {
          data[key] = value ? parseFloat(value) : null;
        } else {
          data[key] = value || null;
        }
      });

      try {
        if (isEdit) {
          await API.put(`/opportunities/${opp.id}`, data);
          Components.showToast('Opportunity updated', 'success');
        } else {
          await API.post('/opportunities', data);
          Components.showToast('Opportunity created', 'success');
        }
        Components.closeModal();
        if (currentOppId) {
          renderOppDetail(currentOppId);
        } else {
          loadOpportunities();
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  async function loadAccountOptions(selectId, selectedId = '') {
    try {
      const accounts = await API.get('/accounts?limit=1000');
      const select = document.getElementById(selectId);
      if (!select) return;
      const items = accounts.data || accounts;
      const options = items.map(a =>
        `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${Components.escapeHtml(a.company_name)}</option>`
      ).join('');
      select.innerHTML = '<option value="">— Select Account —</option>' + options;
    } catch (error) {
      // Silent
    }
  }

  async function loadContactOptions(selectId, accountId = '', selectedId = '') {
    try {
      const select = document.getElementById(selectId);
      if (!select) return;
      if (!accountId) {
        select.innerHTML = '<option value="">— Select Account First —</option>';
        return;
      }
      const contacts = await API.get(`/accounts/${accountId}/contacts`);
      const options = (contacts.data || contacts).map(c =>
        `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${Components.escapeHtml(c.first_name + ' ' + c.last_name)}</option>`
      ).join('');
      select.innerHTML = '<option value="">— Select Contact —</option>' + options;
    } catch (error) {
      select.innerHTML = '<option value="">— Select Contact —</option>';
    }
  }

  async function loadOppForEdit(id) {
    try {
      const opp = await API.get(`/opportunities/${id}`);
      showOppForm(opp);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

  // ==================== Helpers ====================
  function getProbColor(prob) {
    if (prob >= 80) return '#22c55e';
    if (prob >= 60) return '#f59e0b';
    if (prob >= 40) return '#f97316';
    return '#ef4444';
  }
})();
