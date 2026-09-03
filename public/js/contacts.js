/**
 * Contacts — 联系人页面
 * 列表、详情、创建/编辑、删除
 */
(() => {
  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let currentContactId = null;
  let viewMode = 'grouped'; // 'grouped' | 'list'
  let accountFilter = '';

  // ==================== Register Page ====================
  App.registerPage('contacts', {
    render: renderContacts,
    destroy: () => { currentContactId = null; }
  });

  // ==================== Main Render ====================
  async function renderContacts() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Contacts</h1>
        <div class="page-actions">
          <div class="view-toggle">
            <button class="sf-btn sf-btn--sm ${viewMode === 'grouped' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="grouped">Grouped</button>
            <button class="sf-btn sf-btn--sm ${viewMode === 'list' ? 'sf-btn--primary' : 'sf-btn--secondary'}" data-view="list">List</button>
          </div>
          <button class="sf-btn sf-btn--primary" id="btnNewContact">+ New Contact</button>
        </div>
      </div>
      <div id="contactsContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnNewContact').addEventListener('click', () => showContactForm());

    // View toggle
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        renderContacts();
      });
    });

    // Check if viewing a specific contact
    const hash = window.location.hash;
    const match = hash.match(/#contacts\/(.+)/);
    if (match) {
      currentContactId = match[1];
      await renderContactDetail(currentContactId);
    } else {
      await loadContacts();
    }
  }

  // ==================== Load Contacts ====================
  async function loadContacts(page = 1) {
    const container = document.getElementById('contactsContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchQuery && { q: searchQuery }),
        ...(accountFilter && { account_id: accountFilter })
      });

      const result = await API.get(`/contacts?${params}`);
      const { data: contacts, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;

      if (viewMode === 'grouped') {
        renderGroupedContacts(contacts, total);
      } else {
        renderListContacts(contacts, total);
      }
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load contacts',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'contacts\')">Retry</button>'
      );
    }
  }

  // ==================== Grouped View (by Account) ====================
  function renderGroupedContacts(contacts, total) {
    const container = document.getElementById('contactsContent');
    if (!container) return;

    if (!contacts || contacts.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '👤',
        'No contacts found',
        searchQuery ? 'Try a different search term' : 'Create your first contact',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewContact\').click()">+ New Contact</button>'
      );
      return;
    }

    // Group by account
    const groups = {};
    contacts.forEach(c => {
      const accountName = c.account_name || 'Unassigned';
      if (!groups[accountName]) groups[accountName] = { id: c.account_id, contacts: [] };
      groups[accountName].contacts.push(c);
    });

    const groupHtml = Object.entries(groups).map(([name, group]) => `
      <div class="contact-group">
        <div class="contact-group-header" onclick="this.nextElementSibling.classList.toggle('collapsed'); this.classList.toggle('collapsed')">
          <span class="group-toggle">▼</span>
          <span class="group-name">${Components.escapeHtml(name)}</span>
          <span class="group-count">${group.contacts.length}</span>
        </div>
        <div class="contact-group-body">
          ${group.contacts.map(c => `
            <div class="contact-card" onclick="App.navigateTo('contacts','${c.id}')">
              <div class="contact-avatar">${getInitials(c.first_name, c.last_name)}</div>
              <div class="contact-info">
                <div class="contact-name">${Components.escapeHtml(c.first_name + ' ' + c.last_name)}</div>
                <div class="contact-position">${Components.escapeHtml(c.position || '')}</div>
                <div class="contact-meta">
                  ${c.email ? `<span class="contact-email">${Components.escapeHtml(c.email)}</span>` : ''}
                  ${c.phone ? `<span class="contact-phone">${Components.escapeHtml(c.phone)}</span>` : ''}
                </div>
              </div>
              <div class="contact-badges">
                ${c.decision_maker ? '<span class="sf-badge sf-badge--success">Decision Maker</span>' : ''}
                ${c.influence_level ? Components.getStatusBadge(c.influence_level, 'influence') : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="sf-card">
        <div class="sf-card__header">
          <div class="card-search">
            <input type="text" class="sf-form__input search-input" id="contactSearch" 
                   placeholder="Search contacts..." value="${Components.escapeHtml(searchQuery)}">
          </div>
          <div class="card-filter">
            <select class="sf-form__select" id="accountFilter">
              <option value="">All Accounts</option>
            </select>
          </div>
          <span class="sf-card__subtitle">${total} contacts</span>
        </div>
        <div class="sf-card__body">
          <div class="contact-groups">${groupHtml}</div>
        </div>
        <div class="sf-card__footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadContacts(p))}
        </div>
      </div>
    `;

    bindContactSearch();
    loadAccountFilter();
  }

  // ==================== List View ====================
  function renderListContacts(contacts, total) {
    const container = document.getElementById('contactsContent');
    if (!container) return;

    if (!contacts || contacts.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '👤',
        'No contacts found',
        searchQuery ? 'Try a different search term' : 'Create your first contact',
        '<button class="sf-btn sf-btn--primary" onclick="document.getElementById(\'btnNewContact\').click()">+ New Contact</button>'
      );
      return;
    }

    const rows = contacts.map(c => `
      <tr class="sf-table__row" data-id="${c.id}">
        <td>
          <a class="link-primary" href="#contacts/${c.id}" onclick="App.navigateTo('contacts','${c.id}'); return false;">
            ${Components.escapeHtml(c.first_name + ' ' + c.last_name)}
          </a>
        </td>
        <td>${Components.escapeHtml(c.account_name || '—')}</td>
        <td>${Components.escapeHtml(c.position || '—')}</td>
        <td>${Components.escapeHtml(c.email || '—')}</td>
        <td>${Components.escapeHtml(c.phone || '—')}</td>
        <td>${c.decision_maker ? '<span class="sf-badge sf-badge--success">Yes</span>' : '—'}</td>
        <td>
          <div class="row-actions">
            <button class="sf-btn sf-btn--sm sf-btn--icon" title="Edit" onclick="window._editContact('${c.id}')">✏️</button>
            <button class="sf-btn sf-btn--sm sf-btn--icon btn-delete" title="Delete" onclick="window._deleteContact('${c.id}', '${Components.escapeHtml(c.first_name + ' ' + c.last_name)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="sf-card">
        <div class="sf-card__header">
          <div class="card-search">
            <input type="text" class="sf-form__input search-input" id="contactSearch" 
                   placeholder="Search contacts..." value="${Components.escapeHtml(searchQuery)}">
          </div>
          <div class="card-filter">
            <select class="sf-form__select" id="accountFilter">
              <option value="">All Accounts</option>
            </select>
          </div>
          <span class="sf-card__subtitle">${total} contacts</span>
        </div>
        <div class="sf-table-wrapper sf-table-wrapper--scroll">
          <table class="sf-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Account</th>
                <th>Position</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Decision Maker</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="sf-card__footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadContacts(p))}
        </div>
      </div>
    `;

    bindContactSearch();
    loadAccountFilter();

    // Expose inline handlers
    window._editContact = (id) => loadContactForEdit(id);
    window._deleteContact = (id, name) => {
      Components.showConfirm(
        `Delete contact "${name}"?`,
        async () => {
          try {
            await API.del(`/contacts/${id}`);
            Components.showToast('Contact deleted', 'success');
            loadContacts(currentPage);
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

  function bindContactSearch() {
    const searchInput = document.getElementById('contactSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadContacts(1);
      }, 300));
    }
    document.querySelectorAll('.pagination__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadContacts(page);
      });
    });
  }

  async function loadAccountFilter() {
    const filterSelect = document.getElementById('accountFilter');
    if (!filterSelect) return;
    try {
      const accounts = await API.get('/accounts?limit=1000');
      const accountList = accounts.data || accounts;
      const options = accountList.map(a =>
        `<option value="${a.id}" ${a.id === accountFilter ? 'selected' : ''}>${Components.escapeHtml(a.company_name)}</option>`
      ).join('');
      filterSelect.innerHTML = '<option value="">All Accounts</option>' + options;
      filterSelect.addEventListener('change', (e) => {
        accountFilter = e.target.value;
        loadContacts(1);
      });
    } catch (error) {
      // Silent
    }
  }

  // ==================== Detail View ====================
  async function renderContactDetail(contactId) {
    const container = document.getElementById('contactsContent');
    if (!container) return;

    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const contact = await API.get(`/contacts/${contactId}`);
      currentContactId = contactId;
      renderDetail(contact);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load contact',
        error.message,
        '<button class="sf-btn sf-btn--primary" onclick="App.navigateTo(\'contacts\')">Back to List</button>'
      );
    }
  }

  function renderDetail(contact) {
    const container = document.getElementById('contactsContent');
    if (!container) return;

    const fields = [
      { label: 'First Name', value: contact.first_name },
      { label: 'Last Name', value: contact.last_name },
      { label: 'Account', value: contact.account_name },
      { label: 'Position', value: contact.position },
      { label: 'Department', value: contact.department },
      { label: 'Email', value: contact.email },
      { label: 'Phone', value: contact.phone },
      { label: 'LinkedIn', value: contact.linkedin },
      { label: 'Decision Maker', value: contact.decision_maker ? 'Yes' : 'No' },
      { label: 'Influence Level', value: contact.influence_level },
      { label: 'Notes', value: contact.notes }
    ];

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-left">
          <button class="sf-btn sf-btn--sm sf-btn--secondary" onclick="App.navigateTo('contacts')">← Back</button>
          <div class="detail-title-group">
            <h1 class="detail-title">${Components.escapeHtml(contact.first_name + ' ' + contact.last_name)}</h1>
            <p class="detail-subtitle">${Components.escapeHtml(contact.position || '')} ${contact.account_name ? `at ${Components.escapeHtml(contact.account_name)}` : ''}</p>
          </div>
        </div>
        <div class="detail-header-actions">
          <button class="sf-btn sf-btn--secondary" id="btnEditContact">✏️ Edit</button>
          <button class="sf-btn sf-btn--danger" id="btnDeleteContact">🗑️ Delete</button>
        </div>
      </div>

      <div class="sf-card">
        <div class="sf-card__body">
          <div class="detail-grid">
            ${fields.map(f => `
              <div class="detail-field">
                <label class="detail-label">${f.label}</label>
                <div class="detail-value">${f.value ? Components.escapeHtml(String(f.value)) : '—'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnEditContact').addEventListener('click', () => showContactForm(contact));
    document.getElementById('btnDeleteContact').addEventListener('click', () => {
      window._deleteContact(contact.id, contact.first_name + ' ' + contact.last_name);
    });
  }

  // ==================== Create / Edit Form ====================
  function showContactForm(contact = null) {
    const isEdit = !!contact;
    const formId = 'contactForm_' + Components.uid();

    const fields = [
      { name: 'first_name', label: 'First Name', type: 'text', required: true, value: contact?.first_name || '' },
      { name: 'last_name', label: 'Last Name', type: 'text', required: true, value: contact?.last_name || '' },
      { name: 'account_id', label: 'Account', type: 'select', required: false, value: contact?.account_id || '' },
      { name: 'position', label: 'Position', type: 'text', value: contact?.position || '' },
      { name: 'department', label: 'Department', type: 'text', value: contact?.department || '' },
      { name: 'email', label: 'Email', type: 'email', value: contact?.email || '' },
      { name: 'phone', label: 'Phone', type: 'tel', value: contact?.phone || '' },
      { name: 'linkedin', label: 'LinkedIn', type: 'url', value: contact?.linkedin || '' },
      { name: 'decision_maker', label: 'Decision Maker', type: 'checkbox', value: contact?.decision_maker || false },
      { name: 'influence_level', label: 'Influence Level', type: 'select', value: contact?.influence_level || '' },
      { name: 'notes', label: 'Notes', type: 'textarea', value: contact?.notes || '' }
    ];

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
            if (f.type === 'checkbox') {
              return `
                <div class="sf-form-group sf-form-group--checkbox">
                  <label class="sf-form__label">
                    <input type="checkbox" name="${f.name}" ${f.value ? 'checked' : ''}> ${f.label}
                  </label>
                </div>`;
            }
            if (f.type === 'select' && f.name === 'account_id') {
              return `
                <div class="sf-form-group">
                  <label class="sf-form__label">${f.label}</label>
                  <select class="sf-form__select" name="${f.name}" id="select_${f.name}">
                    <option value="">— Select Account —</option>
                  </select>
                </div>`;
            }
            if (f.type === 'select' && f.name === 'influence_level') {
              return `
                <div class="sf-form-group">
                  <label class="sf-form__label">${f.label}</label>
                  <select class="sf-form__select" name="${f.name}">
                    <option value="">— Select —</option>
                    <option value="High" ${f.value === 'High' ? 'selected' : ''}>High</option>
                    <option value="Medium" ${f.value === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="Low" ${f.value === 'Low' ? 'selected' : ''}>Low</option>
                  </select>
                </div>`;
            }
            return `
              <div class="sf-form-group">
                <label class="sf-form__label">${f.label} ${f.required ? '<span class="required">*</span>' : ''}</label>
                <input class="sf-form__input" type="${f.type}" name="${f.name}" value="${Components.escapeHtml(String(f.value || ''))}" ${f.required ? 'required' : ''}>
              </div>`;
          }).join('')}
        </div>
        <div class="sf-form__actions">
          <button type="button" class="sf-btn sf-btn--secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="sf-btn sf-btn--primary">${isEdit ? 'Update' : 'Create'} Contact</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Contact: ${contact.first_name} ${contact.last_name}` : 'New Contact',
      formHtml,
      'lg'
    );

    // Load accounts for select
    if (fields.find(f => f.name === 'account_id')) {
      loadAccountOptions('select_account_id', contact?.account_id || '');
    }

    // Bind form submit
    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => {
        if (key === 'decision_maker') {
          data[key] = true;
        } else {
          data[key] = value;
        }
      });
      // Handle unchecked checkbox
      if (!formData.has('decision_maker')) data.decision_maker = false;

      try {
        if (isEdit) {
          await API.put(`/contacts/${contact.id}`, data);
          Components.showToast('Contact updated', 'success');
        } else {
          await API.post('/contacts', data);
          Components.showToast('Contact created', 'success');
        }
        Components.closeModal();
        if (currentContactId) {
          renderContactDetail(currentContactId);
        } else {
          loadContacts(1);
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
      const options = (accounts.data || accounts).map(a =>
        `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${Components.escapeHtml(a.company_name)}</option>`
      ).join('');
      select.innerHTML = '<option value="">— Select Account —</option>' + options;
    } catch (error) {
      // Silent
    }
  }

  async function loadContactForEdit(id) {
    try {
      const contact = await API.get(`/contacts/${id}`);
      showContactForm(contact);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

  // ==================== Helpers ====================
  function getInitials(first, last) {
    return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
  }
})();
