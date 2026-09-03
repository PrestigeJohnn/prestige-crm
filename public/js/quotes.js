/**
 * Quotes — 报价页面
 * 报价列表、创建/编辑（含报价明细 items 动态添加/删除）、详情、删除
 * 状态流：Draft → Sent → Revised → Accepted / Rejected
 */
;(function() {
  'use strict';

  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let filterStatus = '';
  let currentQuoteId = null;
  let productsCache = []; // Cache for product dropdown

  const QUOTE_STATUSES = ['Draft', 'Sent', 'Revised', 'Accepted', 'Rejected'];

  // Status flow: which statuses can transition to which
  const STATUS_FLOW = {
    'Draft': ['Sent', 'Rejected'],
    'Sent': ['Revised', 'Accepted', 'Rejected'],
    'Revised': ['Accepted', 'Rejected'],
    'Accepted': [],
    'Rejected': ['Draft']
  };

  // ==================== Register Page ====================
  App.registerPage('quotes', {
    render: renderQuotes,
    destroy: () => { currentQuoteId = null; }
  });

  // ==================== Main Render ====================
  async function renderQuotes() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Quotes</h1>
          <p class="text-muted">Manage sales quotes</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btnNewQuote">+ New Quote</button>
        </div>
      </div>
      <div id="quotesContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnNewQuote').addEventListener('click', () => showQuoteForm());

    // Check hash for detail view
    const hash = window.location.hash;
    const match = hash.match(/#quotes\/(.+)/);
    if (match) {
      currentQuoteId = match[1];
      await renderQuoteDetail(currentQuoteId);
    } else {
      await loadQuotes(1);
    }
  }

  // ==================== Load Quotes ====================
  async function loadQuotes(page = 1) {
    const container = document.getElementById('quotesContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(filterStatus && { status: filterStatus })
      });

      const result = await API.get(`/quotes?${params}`);
      const { data: quotes, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;
      renderQuotesList(quotes || [], total);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load quotes',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'quotes\')">Retry</button>'
      );
    }
  }

  // ==================== List View ====================
  function renderQuotesList(quotes, total) {
    const container = document.getElementById('quotesContent');
    if (!container) return;

    if (!quotes || quotes.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '📄',
        'No quotes found',
        searchQuery ? 'Try a different search term' : 'Create your first quote',
        '<button class="btn btn-primary" onclick="document.getElementById(\'btnNewQuote\').click()">+ New Quote</button>'
      );
      return;
    }

    const rows = quotes.map(q => `
      <tr class="data-row" data-id="${q.id}">
        <td>
          <a class="link-primary" href="#quotes/${q.id}" onclick="App.navigateTo('quotes','${q.id}'); return false;">
            ${Components.escapeHtml(q.quote_no || '—')}
          </a>
        </td>
        <td>${Components.escapeHtml(q.account_name || '—')}</td>
        <td>${Components.escapeHtml(q.opportunity_name || '—')}</td>
        <td>${Components.formatCurrency(q.total)}</td>
        <td>${Components.formatDate(q.valid_until)}</td>
        <td>${Components.getStatusBadge(q.status, 'quote')}</td>
        <td>v${Components.escapeHtml(String(q.version || 1))}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-sm btn-icon" title="View" onclick="App.navigateTo('quotes','${q.id}')">👁️</button>
            <button class="btn btn-sm btn-icon" title="Edit" onclick="window._quotes_edit('${q.id}')">✏️</button>
            <button class="btn btn-sm btn-icon" title="Print" onclick="window._quotes_print('${q.id}')">🖨️</button>
            <button class="btn btn-sm btn-icon btn-delete" title="Delete" onclick="window._quotes_delete('${q.id}', '${Components.escapeHtml(q.quote_no || '')}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-search">
            <input type="text" class="form-control search-input" id="quoteSearch"
                   placeholder="Search quotes..." value="${Components.escapeHtml(searchQuery)}">
            <select class="form-control form-control-sm" id="filterQuoteStatus" style="width:150px">
              <option value="">All Statuses</option>
              ${QUOTE_STATUSES.map(s => `<option value="${s}" ${filterStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <span class="card-count">${total} quote${total !== 1 ? 's' : ''}</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Quote No.</th>
                <th>Account</th>
                <th>Opportunity</th>
                <th>Total</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Version</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="card-footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadQuotes(p))}
        </div>
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('quoteSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadQuotes(1);
      }, 300));
    }

    // Bind status filter
    document.getElementById('filterQuoteStatus')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      loadQuotes(1);
    });

    // Bind pagination
    container.querySelectorAll('.sf-pagination__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadQuotes(page);
      });
    });

    // Bind global actions
    window._quotes_edit = (id) => loadQuoteForEdit(id);
    window._quotes_delete = (id, quoteNo) => {
      Components.showConfirm(
        `Delete quote "${quoteNo}"? This action cannot be undone.`,
        async () => {
          try {
            await API.del(`/quotes/${id}`);
            Components.showToast('Quote deleted successfully', 'success');
            // If we're on the detail page of the deleted quote, go back to list
            if (currentQuoteId === String(id)) {
              currentQuoteId = null;
              App.navigateTo('quotes');
            } else {
              loadQuotes(currentPage);
            }
          } catch (error) {
            Components.showToast(error.message, 'error');
          }
        },
        null,
        'Delete',
        'danger'
      );
    };
    window._quotes_print = (id) => {
      window.open(`/api/quotes/${id}/print`, '_blank');
    };
  }

  // ==================== Detail View ====================
  async function renderQuoteDetail(quoteId) {
    const container = document.getElementById('quotesContent');
    if (!container) return;

    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const quote = await API.get(`/quotes/${quoteId}`);
      currentQuoteId = quoteId;
      renderDetail(quote);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load quote',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'quotes\')">Back to List</button>'
      );
    }
  }

  function renderDetail(quote) {
    const container = document.getElementById('quotesContent');
    if (!container) return;

    const items = quote.items || [];
    const currentStatus = quote.status || 'Draft';
    const allowedTransitions = STATUS_FLOW[currentStatus] || [];

    const itemsHtml = items.length ? `
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Disc %</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${Components.escapeHtml(item.product_name || '—')}</td>
              <td>${Components.escapeHtml(item.description || '—')}</td>
              <td class="text-right">${item.quantity || 0}</td>
              <td class="text-right">${Components.formatCurrency(item.unit_price)}</td>
              <td class="text-right">${item.discount ? item.discount + '%' : '—'}</td>
              <td class="text-right">${Components.formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" class="text-right"><strong>Subtotal</strong></td>
            <td class="text-right">${Components.formatCurrency(quote.amount)}</td>
          </tr>
          ${quote.discount ? `<tr><td colspan="6" class="text-right">Discount</td><td class="text-right">-${Components.formatCurrency(quote.discount)}</td></tr>` : ''}
          ${quote.tax ? `<tr><td colspan="6" class="text-right">Tax</td><td class="text-right">${Components.formatCurrency(quote.tax)}</td></tr>` : ''}
          <tr>
            <td colspan="6" class="text-right"><strong>Grand Total</strong></td>
            <td class="text-right"><strong>${Components.formatCurrency(quote.total)}</strong></td>
          </tr>
        </tfoot>
      </table>
    ` : '<p class="text-muted">No line items</p>';

    // Status action buttons
    const statusButtons = allowedTransitions.length > 0
      ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          ${allowedTransitions.map(s => `
            <button class="btn btn-sm btn-secondary" onclick="window._quotes_updateStatus('${quote.id}', '${s}')">
              Mark as ${s}
            </button>
          `).join('')}
         </div>`
      : '<span class="text-muted" style="font-size:13px;">No further actions available</span>';

    container.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('quotes')">← Back</button>
          <h1 class="page-title" style="margin-top:8px">Quote: ${Components.escapeHtml(quote.quote_no || '')}</h1>
          <p class="text-muted">${Components.escapeHtml(quote.account_name || '')} · v${quote.version || 1} · ${Components.formatDate(quote.created_at)}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btnPrintQuote">🖨️ Print</button>
          <button class="btn btn-secondary" id="btnEditQuote">✏️ Edit</button>
          <button class="btn btn-danger" id="btnDeleteQuote">🗑️ Delete</button>
        </div>
      </div>

      <div class="card quote-detail">
        <div class="card-body">
          <div class="quote-header">
            <div class="quote-info">
              <div class="quote-field"><strong>Quote No:</strong> ${Components.escapeHtml(quote.quote_no || '—')}</div>
              <div class="quote-field"><strong>Account:</strong> ${Components.escapeHtml(quote.account_name || '—')}</div>
              <div class="quote-field"><strong>Opportunity:</strong> ${Components.escapeHtml(quote.opportunity_name || '—')}</div>
            </div>
            <div class="quote-info">
              <div class="quote-field"><strong>Date:</strong> ${Components.formatDate(quote.created_at)}</div>
              <div class="quote-field"><strong>Valid Until:</strong> ${Components.formatDate(quote.valid_until)}</div>
              <div class="quote-field"><strong>Status:</strong> ${Components.getStatusBadge(currentStatus, 'quote')}</div>
            </div>
          </div>

          ${quote.notes ? `<div style="margin-bottom:16px;padding:12px;background:var(--sf-gray-50);border-radius:8px;"><strong>Notes:</strong> ${Components.escapeHtml(quote.notes)}</div>` : ''}

          <h3 class="quote-section-title">Line Items (${items.length})</h3>
          <div class="table-responsive">${itemsHtml}</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-body">
          <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;">Status Management</h3>
          <p style="font-size:13px;color:var(--sf-text-secondary);margin-bottom:8px;">Current: ${Components.getStatusBadge(currentStatus, 'quote')}</p>
          ${statusButtons}
        </div>
      </div>
    `;

    document.getElementById('btnPrintQuote').addEventListener('click', () => {
      window.open(`/api/quotes/${quote.id}/print`, '_blank');
    });
    document.getElementById('btnEditQuote').addEventListener('click', () => showQuoteForm(quote));
    document.getElementById('btnDeleteQuote').addEventListener('click', () => {
      window._quotes_delete(quote.id, quote.quote_no || '');
    });

    window._quotes_updateStatus = async (id, newStatus) => {
      try {
        await API.put(`/quotes/${id}`, { ...quote, status: newStatus });
        Components.showToast(`Status updated to "${newStatus}"`, 'success');
        renderQuoteDetail(id);
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    };
  }

  // ==================== Create / Edit Form ====================
  function showQuoteForm(quote = null) {
    const isEdit = !!quote;
    const formId = 'quoteForm_' + Components.uid();
    const items = quote?.items ? JSON.parse(JSON.stringify(quote.items)) : [];

    const formHtml = `
      <form id="${formId}" class="form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Account <span class="required">*</span></label>
            <select class="form-control" name="account_id" id="select_quote_account" required>
              <option value="">— Select Account —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Opportunity</label>
            <select class="form-control" name="opportunity_id" id="select_quote_opportunity">
              <option value="">— Select Opportunity —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Valid Until</label>
            <input class="form-control" type="date" name="valid_until"
                   value="${quote?.valid_until ? quote.valid_until.slice(0, 10) : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" name="status">
              ${QUOTE_STATUSES.map(s => `<option value="${s}" ${quote?.status === s ? 'selected' : (!quote && s === 'Draft' ? 'selected' : '')}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group form-group-full">
            <label class="form-label">Notes</label>
            <textarea class="form-control" name="notes" rows="2">${Components.escapeHtml(quote?.notes || '')}</textarea>
          </div>
        </div>

        <h3 class="quote-section-title">Line Items</h3>
        <div id="quoteItemsContainer">
          <div class="table-responsive">
            <table class="data-table" id="quoteItemsTable">
              <thead>
                <tr>
                  <th style="width:200px">Product</th>
                  <th>Description</th>
                  <th style="width:80px">Qty</th>
                  <th style="width:110px">Unit Price</th>
                  <th style="width:80px">Disc %</th>
                  <th style="width:110px">Total</th>
                  <th style="width:40px"></th>
                </tr>
              </thead>
              <tbody id="quoteItemsBody"></tbody>
            </table>
          </div>
          <button type="button" class="btn btn-sm btn-secondary" id="btnAddQuoteItem" style="margin-top:8px">+ Add Item</button>
        </div>

        <div class="quote-totals">
          <div class="quote-total-row">
            <span>Subtotal:</span>
            <span id="quoteSubtotal">${Components.formatCurrency(quote?.amount || 0)}</span>
          </div>
          <div class="form-grid" style="margin-top:8px">
            <div class="form-group">
              <label class="form-label">Discount ($)</label>
              <input class="form-control" type="number" name="discount" id="quoteDiscount"
                     min="0" step="0.01" value="${quote?.discount || 0}">
            </div>
            <div class="form-group">
              <label class="form-label">Tax ($)</label>
              <input class="form-control" type="number" name="tax" id="quoteTax"
                     min="0" step="0.01" value="${quote?.tax || 0}">
            </div>
          </div>
          <div class="quote-total-row quote-total-final">
            <span><strong>Grand Total:</strong></span>
            <span id="quoteTotal"><strong>${Components.formatCurrency(quote?.total || 0)}</strong></span>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Quote</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Quote: ${quote.quote_no}` : 'New Quote',
      formHtml,
      'xl'
    );

    // Load select options
    loadQuoteSelect('select_quote_account', '/accounts?limit=1000', quote?.account_id, 'company_name');
    loadQuoteSelect('select_quote_opportunity', '/opportunities?limit=1000', quote?.opportunity_id, 'name');

    // Load products for dropdown
    loadProductsForQuote();

    // Render existing items
    if (items.length) {
      items.forEach(item => addQuoteItemRow(item));
    } else {
      addQuoteItemRow();
    }

    // Bind add item
    document.getElementById('btnAddQuoteItem').addEventListener('click', () => addQuoteItemRow());

    // Bind discount/tax recalculation
    document.getElementById('quoteDiscount')?.addEventListener('input', recalculateQuoteTotals);
    document.getElementById('quoteTax')?.addEventListener('input', recalculateQuoteTotals);

    // Bind form submit
    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      if (!formData.get('account_id')) {
        Components.showToast('Please select an Account', 'warning');
        return;
      }

      const data = {
        account_id: formData.get('account_id') || null,
        opportunity_id: formData.get('opportunity_id') || null,
        valid_until: formData.get('valid_until') || null,
        status: formData.get('status') || 'Draft',
        notes: formData.get('notes') || null,
        discount: parseFloat(formData.get('discount')) || 0,
        tax: parseFloat(formData.get('tax')) || 0,
        items: []
      };

      // Collect items from table rows
      const rows = document.querySelectorAll('#quoteItemsBody tr.quote-item-row');
      let hasValidItem = false;
      rows.forEach(row => {
        const productSelect = row.querySelector('.item-product-select');
        const productName = row.querySelector('.item-product')?.value || '';
        const productId = productSelect?.value || null;
        const description = row.querySelector('.item-description')?.value || '';
        const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
        const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
        const disc = parseFloat(row.querySelector('.item-discount')?.value) || 0;
        if (productName || description) {
          hasValidItem = true;
          data.items.push({
            product_id: productId,
            product_name: productName,
            description,
            quantity: qty,
            unit_price: price,
            discount: disc,
            total: Math.round(qty * price * (1 - disc / 100) * 100) / 100
          });
        }
      });

      // Remove items if none valid
      if (!hasValidItem) data.items = [];

      try {
        if (isEdit) {
          await API.put(`/quotes/${quote.id}`, data);
          Components.showToast('Quote updated successfully', 'success');
        } else {
          const result = await API.post('/quotes', data);
          Components.showToast('Quote created successfully', 'success');
          // If server returns the new quote ID, navigate to it
          if (result?.id) currentQuoteId = result.id;
        }
        Components.closeModal();
        if (currentQuoteId && isEdit) {
          renderQuoteDetail(currentQuoteId);
        } else {
          loadQuotes(1);
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  function addQuoteItemRow(item = null) {
    const tbody = document.getElementById('quoteItemsBody');
    if (!tbody) return;
    const rowId = 'quoteItem_' + Components.uid();
    const row = document.createElement('tr');
    row.className = 'quote-item-row';
    row.id = rowId;

    // Build product select options from cache
    const productOptions = productsCache.map(p =>
      `<option value="${p.id}" ${item?.product_id == p.id ? 'selected' : ''}>${Components.escapeHtml(p.name)}</option>`
    ).join('');

    row.innerHTML = `
      <td>
        <select class="form-control form-control-sm item-product-select" style="width:180px">
          <option value="">— Select —</option>
          ${productOptions}
        </select>
        <input class="form-control form-control-sm item-product" type="text" placeholder="Or type name"
               value="${Components.escapeHtml(item?.product_name || '')}" style="margin-top:4px">
      </td>
      <td><input class="form-control form-control-sm item-description" type="text" placeholder="Description"
                 value="${Components.escapeHtml(item?.description || '')}"></td>
      <td><input class="form-control form-control-sm item-qty" type="number" min="0" step="1" style="width:70px"
                 value="${item?.quantity || 1}"></td>
      <td><input class="form-control form-control-sm item-price" type="number" min="0" step="0.01" style="width:100px"
                 value="${item?.unit_price || 0}"></td>
      <td><input class="form-control form-control-sm item-discount" type="number" min="0" max="100" step="0.1" style="width:70px"
                 value="${item?.discount || 0}"></td>
      <td class="item-total text-right" style="min-width:100px">${Components.formatCurrency(item?.total || 0)}</td>
      <td><button type="button" class="btn btn-sm btn-icon btn-remove-item" title="Remove">✕</button></td>
    `;
    tbody.appendChild(row);

    // Bind product select change → auto-fill price and name
    const productSelect = row.querySelector('.item-product-select');
    productSelect.addEventListener('change', (e) => {
      const productId = e.target.value;
      const product = productsCache.find(p => String(p.id) === String(productId));
      if (product) {
        const priceInput = row.querySelector('.item-price');
        const nameInput = row.querySelector('.item-product');
        const descInput = row.querySelector('.item-description');
        if (priceInput && !priceInput.value) priceInput.value = product.selling_price || 0;
        if (nameInput && !nameInput.value) nameInput.value = product.name || '';
        if (descInput && !descInput.value) descInput.value = product.description || '';
        recalculateRowTotal(row);
        recalculateQuoteTotals();
      }
    });

    // Bind input events for recalculation
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        recalculateRowTotal(row);
        recalculateQuoteTotals();
      });
    });

    // Bind remove button
    row.querySelector('.btn-remove-item').addEventListener('click', () => {
      const allRows = tbody.querySelectorAll('tr.quote-item-row');
      if (allRows.length > 1) {
        row.remove();
      } else {
        // Clear the row instead of removing
        row.querySelectorAll('input').forEach(i => i.value = '');
        row.querySelector('.item-product-select').value = '';
        row.querySelector('.item-qty').value = '1';
        row.querySelector('.item-discount').value = '0';
        row.querySelector('.item-total').textContent = Components.formatCurrency(0);
      }
      recalculateQuoteTotals();
    });
  }

  // ==================== Calculations ====================
  function recalculateRowTotal(row) {
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    const disc = parseFloat(row.querySelector('.item-discount')?.value) || 0;
    const total = Math.round(qty * price * (1 - disc / 100) * 100) / 100;
    const totalCell = row.querySelector('.item-total');
    if (totalCell) totalCell.textContent = Components.formatCurrency(total);
  }

  function recalculateQuoteTotals() {
    let subtotal = 0;
    document.querySelectorAll('#quoteItemsBody tr.quote-item-row').forEach(row => {
      const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
      const disc = parseFloat(row.querySelector('.item-discount')?.value) || 0;
      subtotal += qty * price * (1 - disc / 100);
    });
    subtotal = Math.round(subtotal * 100) / 100;
    const discount = parseFloat(document.getElementById('quoteDiscount')?.value) || 0;
    const tax = parseFloat(document.getElementById('quoteTax')?.value) || 0;
    const total = Math.max(0, Math.round((subtotal - discount + tax) * 100) / 100);

    const subtotalEl = document.getElementById('quoteSubtotal');
    if (subtotalEl) subtotalEl.textContent = Components.formatCurrency(subtotal);
    const totalEl = document.getElementById('quoteTotal');
    if (totalEl) totalEl.innerHTML = `<strong>${Components.formatCurrency(total)}</strong>`;
  }

  // ==================== Helpers ====================
  async function loadQuoteSelect(selectId, endpoint, selectedId, nameField) {
    try {
      const result = await API.get(endpoint);
      const select = document.getElementById(selectId);
      if (!select) return;
      const items = result.data || result || [];
      const options = items.map(item => {
        const label = item[nameField] || item.name || item.id;
        return `<option value="${item.id}" ${item.id == selectedId ? 'selected' : ''}>${Components.escapeHtml(label)}</option>`;
      }).join('');
      select.innerHTML = '<option value="">— Select —</option>' + options;
    } catch (error) {
      // Silent
    }
  }

  async function loadProductsForQuote() {
    try {
      const result = await API.get('/products?limit=1000');
      productsCache = result.data || result || [];
    } catch (error) {
      // Silent
    }
  }

  async function loadQuoteForEdit(id) {
    try {
      const quote = await API.get(`/quotes/${id}`);
      showQuoteForm(quote);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

})();
