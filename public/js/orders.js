/**
 * Orders — 订单页面
 * 订单列表、创建/编辑、详情、删除
 * 状态：Pending → Confirmed → Delivered / Cancelled
 */
;(function() {
  'use strict';

  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let filterStatus = '';
  let currentOrderId = null;

  const ORDER_STATUSES = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];

  const STATUS_FLOW = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Delivered', 'Cancelled'],
    'Delivered': [],
    'Cancelled': ['Pending']
  };

  // ==================== Register Page ====================
  App.registerPage('orders', {
    render: renderOrders,
    destroy: () => { currentOrderId = null; }
  });

  // ==================== Main Render ====================
  async function renderOrders() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Orders</h1>
          <p class="text-muted">Manage customer orders</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btnNewOrder">+ New Order</button>
        </div>
      </div>
      <div id="ordersContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnNewOrder').addEventListener('click', () => showOrderForm());

    const hash = window.location.hash;
    const match = hash.match(/#orders\/(.+)/);
    if (match) {
      currentOrderId = match[1];
      await renderOrderDetail(currentOrderId);
    } else {
      await loadOrders(1);
    }
  }

  // ==================== Load Orders ====================
  async function loadOrders(page = 1) {
    const container = document.getElementById('ordersContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(filterStatus && { status: filterStatus })
      });

      const result = await API.get(`/orders?${params}`);
      const { data: orders, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;
      renderOrdersList(orders || [], total);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load orders',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'orders\')">Retry</button>'
      );
    }
  }

  // ==================== List View ====================
  function renderOrdersList(orders, total) {
    const container = document.getElementById('ordersContent');
    if (!container) return;

    if (!orders || orders.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '📦',
        'No orders found',
        searchQuery ? 'Try a different search term' : 'Create your first order',
        '<button class="btn btn-primary" onclick="document.getElementById(\'btnNewOrder\').click()">+ New Order</button>'
      );
      return;
    }

    const rows = orders.map(o => `
      <tr class="data-row" data-id="${o.id}">
        <td>
          <a class="link-primary" href="#orders/${o.id}" onclick="App.navigateTo('orders','${o.id}'); return false;">
            ${Components.escapeHtml(o.order_no || '—')}
          </a>
        </td>
        <td>${Components.escapeHtml(o.account_name || '—')}</td>
        <td>${Components.escapeHtml(o.opportunity_name || '—')}</td>
        <td>${Components.formatCurrency(o.amount)}</td>
        <td>${Components.getStatusBadge(o.status, 'order')}</td>
        <td>${Components.formatDate(o.delivery_date)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-sm btn-icon" title="View" onclick="App.navigateTo('orders','${o.id}')">👁️</button>
            <button class="btn btn-sm btn-icon" title="Edit" onclick="window._orders_edit('${o.id}')">✏️</button>
            <button class="btn btn-sm btn-icon btn-delete" title="Delete" onclick="window._orders_delete('${o.id}', '${Components.escapeHtml(o.order_no || '')}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-search">
            <input type="text" class="form-control search-input" id="orderSearch"
                   placeholder="Search orders..." value="${Components.escapeHtml(searchQuery)}">
            <select class="form-control form-control-sm" id="filterOrderStatus" style="width:150px">
              <option value="">All Statuses</option>
              ${ORDER_STATUSES.map(s => `<option value="${s}" ${filterStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <span class="card-count">${total} order${total !== 1 ? 's' : ''}</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Account</th>
                <th>Opportunity</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Delivery Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="card-footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadOrders(p))}
        </div>
      </div>
    `;

    const searchInput = document.getElementById('orderSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadOrders(1);
      }, 300));
    }
    document.getElementById('filterOrderStatus')?.addEventListener('change', (e) => {
      filterStatus = e.target.value;
      loadOrders(1);
    });

    container.querySelectorAll('.sf-pagination__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadOrders(page);
      });
    });

    window._orders_edit = (id) => loadOrderForEdit(id);
    window._orders_delete = (id, orderNo) => {
      Components.showConfirm(
        `Delete order "${orderNo}"? This action cannot be undone.`,
        async () => {
          try {
            await API.del(`/orders/${id}`);
            Components.showToast('Order deleted successfully', 'success');
            if (currentOrderId === String(id)) {
              currentOrderId = null;
              App.navigateTo('orders');
            } else {
              loadOrders(currentPage);
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
  }

  // ==================== Detail View ====================
  async function renderOrderDetail(orderId) {
    const container = document.getElementById('ordersContent');
    if (!container) return;

    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const order = await API.get(`/orders/${orderId}`);
      currentOrderId = orderId;
      renderDetail(order);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load order',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'orders\')">Back to List</button>'
      );
    }
  }

  function renderDetail(order) {
    const container = document.getElementById('ordersContent');
    if (!container) return;

    const currentStatus = order.status || 'Pending';
    const allowedTransitions = STATUS_FLOW[currentStatus] || [];

    const fields = [
      { label: 'Order No', value: order.order_no },
      { label: 'Account', value: order.account_name, link: order.account_id ? `#accounts/${order.account_id}` : null },
      { label: 'Opportunity', value: order.opportunity_name, link: order.opportunity_id ? `#opportunities/${order.opportunity_id}` : null },
      { label: 'Quote', value: order.quote_no, link: order.quote_id ? `#quotes/${order.quote_id}` : null },
      { label: 'Amount', value: Components.formatCurrency(order.amount) },
      { label: 'Status', value: null, badge: Components.getStatusBadge(currentStatus, 'order') },
      { label: 'Delivery Date', value: Components.formatDate(order.delivery_date) },
      { label: 'Created', value: Components.formatDate(order.created_at) },
      { label: 'Notes', value: order.notes, fullWidth: true }
    ];

    const statusButtons = allowedTransitions.length > 0
      ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          ${allowedTransitions.map(s => `
            <button class="btn btn-sm btn-secondary" onclick="window._orders_updateStatus('${order.id}', '${s}')">
              Mark as ${s}
            </button>
          `).join('')}
         </div>`
      : '<span class="text-muted" style="font-size:13px;">No further actions available</span>';

    container.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('orders')">← Back</button>
          <h1 class="page-title" style="margin-top:8px">Order: ${Components.escapeHtml(order.order_no || '')}</h1>
          <p class="text-muted">${Components.escapeHtml(order.account_name || '')} · ${Components.formatDate(order.created_at)}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btnEditOrder">✏️ Edit</button>
          <button class="btn btn-danger" id="btnDeleteOrder">🗑️ Delete</button>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="detail-grid">
            ${fields.map(f => `
              <div class="detail-field ${f.fullWidth ? 'form-group-full' : ''}">
                <label class="detail-label">${f.label}</label>
                <div class="detail-value">
                  ${f.badge || ''}
                  ${f.value
                    ? (f.link ? `<a href="${f.link}">${Components.escapeHtml(String(f.value))}</a>` : Components.escapeHtml(String(f.value)))
                    : (f.badge ? '' : '—')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-body">
          <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;">Status Management</h3>
          <p style="font-size:13px;color:var(--sf-text-secondary);margin-bottom:8px;">Current: ${Components.getStatusBadge(currentStatus, 'order')}</p>
          ${statusButtons}
        </div>
      </div>
    `;

    document.getElementById('btnEditOrder').addEventListener('click', () => showOrderForm(order));
    document.getElementById('btnDeleteOrder').addEventListener('click', () => {
      window._orders_delete(order.id, order.order_no || '');
    });

    window._orders_updateStatus = async (id, newStatus) => {
      try {
        await API.put(`/orders/${id}`, { ...order, status: newStatus });
        Components.showToast(`Status updated to "${newStatus}"`, 'success');
        renderOrderDetail(id);
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    };
  }

  // ==================== Create / Edit Form ====================
  function showOrderForm(order = null) {
    const isEdit = !!order;
    const formId = 'orderForm_' + Components.uid();

    const defaultStatus = order?.status || 'Pending';

    const formHtml = `
      <form id="${formId}" class="form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Account <span class="required">*</span></label>
            <select class="form-control" name="account_id" id="select_order_account" required>
              <option value="">— Select Account —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Opportunity</label>
            <select class="form-control" name="opportunity_id" id="select_order_opportunity">
              <option value="">— Select Opportunity —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quote</label>
            <select class="form-control" name="quote_id" id="select_order_quote">
              <option value="">— Select Quote —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Amount <span class="required">*</span></label>
            <input class="form-control" type="number" name="amount" min="0" step="0.01" required
                   value="${order?.amount != null ? order.amount : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" name="status">
              ${ORDER_STATUSES.map(s => `<option value="${s}" ${defaultStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Date</label>
            <input class="form-control" type="date" name="delivery_date"
                   value="${order?.delivery_date ? order.delivery_date.slice(0, 10) : ''}">
          </div>
          <div class="form-group form-group-full">
            <label class="form-label">Notes</label>
            <textarea class="form-control" name="notes" rows="3">${Components.escapeHtml(order?.notes || '')}</textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Order</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Order: ${order.order_no}` : 'New Order',
      formHtml,
      'lg'
    );

    loadOrderSelect('select_order_account', '/accounts?limit=1000', order?.account_id, 'company_name');
    loadOrderSelect('select_order_opportunity', '/opportunities?limit=1000', order?.opportunity_id, 'name');
    loadOrderSelect('select_order_quote', '/quotes?limit=1000&status=Accepted', order?.quote_id, 'quote_no');

    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      if (!formData.get('account_id')) {
        Components.showToast('Please select an Account', 'warning');
        return;
      }

      const amountVal = parseFloat(formData.get('amount'));
      if (isNaN(amountVal) || amountVal <= 0) {
        Components.showToast('Please enter a valid amount', 'warning');
        return;
      }

      const data = {};
      formData.forEach((value, key) => {
        if (key === 'amount') {
          data[key] = parseFloat(value) || 0;
        } else {
          data[key] = value || null;
        }
      });

      try {
        if (isEdit) {
          await API.put(`/orders/${order.id}`, data);
          Components.showToast('Order updated successfully', 'success');
        } else {
          const result = await API.post('/orders', data);
          Components.showToast('Order created successfully', 'success');
          if (result?.id) currentOrderId = result.id;
        }
        Components.closeModal();
        if (currentOrderId && isEdit) {
          renderOrderDetail(currentOrderId);
        } else {
          loadOrders(1);
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  // ==================== Helpers ====================
  async function loadOrderSelect(selectId, endpoint, selectedId, nameField) {
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

  async function loadOrderForEdit(id) {
    try {
      const order = await API.get(`/orders/${id}`);
      showOrderForm(order);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

})();
