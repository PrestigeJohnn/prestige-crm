/**
 * Products — 产品页面
 * 产品列表（表格/卡片视图切换）、创建/编辑、详情、删除
 * 库存警告：stock=0 时红色高亮
 */
;(function() {
  'use strict';

  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let filterCategory = '';
  let currentProductId = null;
  let viewMode = 'table'; // 'table' | 'cards'
  let allProducts = []; // Cache for category filter

  // ==================== Register Page ====================
  App.registerPage('products', {
    render: renderProducts,
    destroy: () => { currentProductId = null; }
  });

  // ==================== Main Render ====================
  async function renderProducts() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="text-muted">Manage your product catalog</p>
        </div>
        <div class="page-actions">
          <div class="view-toggle">
            <button class="btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}" data-view="table">☰ Table</button>
            <button class="btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}" data-view="cards">⊞ Cards</button>
          </div>
          <button class="btn btn-primary" id="btnNewProduct">+ New Product</button>
        </div>
      </div>
      <div id="productsContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnNewProduct').addEventListener('click', () => showProductForm());

    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        // Re-render with current data if available
        if (allProducts.length > 0) {
          if (viewMode === 'cards') {
            renderProductCards(allProducts, allProducts.length);
          } else {
            renderProductsList(allProducts, allProducts.length);
          }
        } else {
          renderProducts();
        }
      });
    });

    const hash = window.location.hash;
    const match = hash.match(/#products\/(.+)/);
    if (match) {
      currentProductId = match[1];
      await renderProductDetail(currentProductId);
    } else {
      await loadProducts(1);
    }
  }

  // ==================== Load Products ====================
  async function loadProducts(page = 1) {
    const container = document.getElementById('productsContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(filterCategory && { category: filterCategory })
      });

      const result = await API.get(`/products?${params}`);
      const { data: products, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;
      allProducts = products || [];

      if (viewMode === 'cards') {
        renderProductCards(allProducts, total);
      } else {
        renderProductsList(allProducts, total);
      }
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load products',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'products\')">Retry</button>'
      );
    }
  }

  // ==================== Table View ====================
  function renderProductsList(products, total) {
    const container = document.getElementById('productsContent');
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '📦',
        'No products found',
        searchQuery ? 'Try a different search term' : 'Add your first product',
        '<button class="btn btn-primary" onclick="document.getElementById(\'btnNewProduct\').click()">+ New Product</button>'
      );
      return;
    }

    // Count low/zero stock
    const zeroStock = products.filter(p => p.stock != null && p.stock <= 0).length;
    const lowStock = products.filter(p => p.stock != null && p.stock > 0 && p.stock <= 5).length;

    const rows = products.map(p => {
      const isZeroStock = p.stock != null && p.stock <= 0;
      const isLowStock = p.stock != null && p.stock > 0 && p.stock <= 5;
      const stockClass = isZeroStock ? 'text-danger' : (isLowStock ? 'text-warning' : '');
      const rowClass = !p.active ? 'row-inactive' : '';

      return `
        <tr class="data-row ${rowClass}" data-id="${p.id}" data-stock="${p.stock != null ? p.stock : ''}">
          <td>
            <a class="link-primary" href="#products/${p.id}" onclick="App.navigateTo('products','${p.id}'); return false;">
              ${Components.escapeHtml(p.name)}
            </a>
          </td>
          <td>${Components.escapeHtml(p.sku || '—')}</td>
          <td>${Components.escapeHtml(p.category || '—')}</td>
          <td>${Components.formatCurrency(p.cost)}</td>
          <td>${Components.formatCurrency(p.selling_price)}</td>
          <td class="stock-cell ${stockClass}">${p.stock != null ? p.stock : '—'} ${Components.escapeHtml(p.unit || '')}</td>
          <td>${Components.escapeHtml(p.unit || '—')}</td>
          <td>
            ${p.active
              ? '<span class="badge badge-success">Active</span>'
              : '<span class="badge badge-secondary">Inactive</span>'}
          </td>
          <td>
            <div class="row-actions">
              <button class="btn btn-sm btn-icon" title="View" onclick="App.navigateTo('products','${p.id}')">👁️</button>
              <button class="btn btn-sm btn-icon" title="Edit" onclick="window._products_edit('${p.id}')">✏️</button>
              <button class="btn btn-sm btn-icon btn-delete" title="Delete" onclick="window._products_delete('${p.id}', '${Components.escapeHtml(p.name)}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-search">
            <input type="text" class="form-control search-input" id="productSearch"
                   placeholder="Search products..." value="${Components.escapeHtml(searchQuery)}">
            <input type="text" class="form-control search-input" id="filterCategory" style="width:150px"
                   placeholder="Category..." value="${Components.escapeHtml(filterCategory)}">
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            ${zeroStock > 0 ? `<span class="badge badge-danger">${zeroStock} out of stock</span>` : ''}
            ${lowStock > 0 ? `<span class="badge badge-warning">${lowStock} low stock</span>` : ''}
            <span class="card-count">${total} product${total !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Selling Price</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="card-footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadProducts(p))}
        </div>
      </div>
    `;

    bindProductEvents();
  }

  // ==================== Cards View ====================
  function renderProductCards(products, total) {
    const container = document.getElementById('productsContent');
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '📦',
        'No products found',
        searchQuery ? 'Try a different search term' : 'Add your first product',
        '<button class="btn btn-primary" onclick="document.getElementById(\'btnNewProduct\').click()">+ New Product</button>'
      );
      return;
    }

    const zeroStock = products.filter(p => p.stock != null && p.stock <= 0).length;

    const cards = products.map(p => {
      const isZeroStock = p.stock != null && p.stock <= 0;
      const isLowStock = p.stock != null && p.stock > 0 && p.stock <= 5;
      const stockClass = isZeroStock ? 'text-danger' : (isLowStock ? 'text-warning' : '');

      return `
        <div class="product-card ${!p.active ? 'product-card-inactive' : ''}" onclick="App.navigateTo('products','${p.id}')">
          <div class="product-card-header">
            <div class="product-card-name">${Components.escapeHtml(p.name)}</div>
            <div class="product-card-sku">SKU: ${Components.escapeHtml(p.sku || '—')}</div>
          </div>
          <div class="product-card-body">
            <div class="product-card-field">
              <span class="product-card-label">Category</span>
              <span class="product-card-value">${Components.escapeHtml(p.category || '—')}</span>
            </div>
            <div class="product-card-field">
              <span class="product-card-label">Selling Price</span>
              <span class="product-card-value product-card-price">${Components.formatCurrency(p.selling_price)}</span>
            </div>
            <div class="product-card-field">
              <span class="product-card-label">Cost</span>
              <span class="product-card-value">${Components.formatCurrency(p.cost)}</span>
            </div>
            <div class="product-card-field">
              <span class="product-card-label">Stock</span>
              <span class="product-card-value ${stockClass}">
                ${p.stock != null ? p.stock : '—'} ${Components.escapeHtml(p.unit || '')}
                ${isZeroStock ? ' ⚠️ OUT OF STOCK' : ''}
              </span>
            </div>
          </div>
          <div class="product-card-footer">
            ${p.active
              ? '<span class="badge badge-success">Active</span>'
              : '<span class="badge badge-secondary">Inactive</span>'}
            <div class="row-actions">
              <button class="btn btn-sm btn-icon" title="Edit" onclick="event.stopPropagation(); window._products_edit('${p.id}')">✏️</button>
              <button class="btn btn-sm btn-icon btn-delete" title="Delete" onclick="event.stopPropagation(); window._products_delete('${p.id}', '${Components.escapeHtml(p.name)}')">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-search">
            <input type="text" class="form-control search-input" id="productSearch"
                   placeholder="Search products..." value="${Components.escapeHtml(searchQuery)}">
            <input type="text" class="form-control search-input" id="filterCategory" style="width:150px"
                   placeholder="Category..." value="${Components.escapeHtml(filterCategory)}">
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            ${zeroStock > 0 ? `<span class="badge badge-danger">${zeroStock} out of stock</span>` : ''}
            <span class="card-count">${total} product${total !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="product-grid">${cards}</div>
        </div>
        <div class="card-footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadProducts(p))}
        </div>
      </div>
    `;

    bindProductEvents();
  }

  function bindProductEvents() {
    const container = document.getElementById('productsContent');
    if (!container) return;

    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadProducts(1);
      }, 300));
    }
    const catFilter = document.getElementById('filterCategory');
    if (catFilter) {
      catFilter.addEventListener('input', Components.debounce((e) => {
        filterCategory = e.target.value.trim();
        loadProducts(1);
      }, 300));
    }
    container.querySelectorAll('.sf-pagination__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadProducts(page);
      });
    });

    window._products_edit = (id) => loadProductForEdit(id);
    window._products_delete = (id, name) => {
      Components.showConfirm(
        `Delete product "${name}"? This action cannot be undone.`,
        async () => {
          try {
            await API.del(`/products/${id}`);
            Components.showToast('Product deleted successfully', 'success');
            if (currentOrderId === String(id)) {
              currentProductId = null;
              App.navigateTo('products');
            } else {
              loadProducts(currentPage);
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
  async function renderProductDetail(productId) {
    const container = document.getElementById('productsContent');
    if (!container) return;

    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const product = await API.get(`/products/${productId}`);
      currentProductId = productId;
      renderDetail(product);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load product',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'products\')">Back to List</button>'
      );
    }
  }

  function renderDetail(product) {
    const container = document.getElementById('productsContent');
    if (!container) return;

    const isZeroStock = product.stock != null && product.stock <= 0;
    const isLowStock = product.stock != null && product.stock > 0 && product.stock <= 5;
    const stockDisplay = product.stock != null
      ? `<span class="${isZeroStock ? 'text-danger' : (isLowStock ? 'text-warning' : '')}">${product.stock} ${Components.escapeHtml(product.unit || '')}${isZeroStock ? ' ⚠️ OUT OF STOCK' : (isLowStock ? ' ⚠️ Low Stock' : '')}</span>`
      : '—';

    const fields = [
      { label: 'Name', value: product.name },
      { label: 'SKU', value: product.sku },
      { label: 'Category', value: product.category },
      { label: 'Cost', value: Components.formatCurrency(product.cost) },
      { label: 'Selling Price', value: Components.formatCurrency(product.selling_price) },
      { label: 'Stock', value: stockDisplay, raw: true },
      { label: 'Unit', value: product.unit },
      { label: 'Status', value: product.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>', raw: true },
      { label: 'Description', value: product.description, fullWidth: true }
    ];

    container.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('products')">← Back</button>
          <h1 class="page-title" style="margin-top:8px">${Components.escapeHtml(product.name)}</h1>
          <p class="text-muted">SKU: ${Components.escapeHtml(product.sku || '—')} · ${product.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btnEditProduct">✏️ Edit</button>
          <button class="btn btn-danger" id="btnDeleteProduct">🗑️ Delete</button>
        </div>
      </div>

      ${isZeroStock ? `
        <div style="margin-bottom:16px;padding:12px 16px;background:var(--sf-error-50);border:1px solid var(--sf-error-100);border-radius:8px;color:var(--sf-error-700);font-weight:500;">
          ⚠️ This product is out of stock!
        </div>
      ` : ''}
      ${isLowStock ? `
        <div style="margin-bottom:16px;padding:12px 16px;background:var(--sf-warning-50);border:1px solid var(--sf-warning-100);border-radius:8px;color:var(--sf-warning-700);font-weight:500;">
          ⚠️ Low stock warning: Only ${product.stock} ${Components.escapeHtml(product.unit || 'units')} remaining
        </div>
      ` : ''}

      <div class="card">
        <div class="card-body">
          <div class="detail-grid">
            ${fields.map(f => `
              <div class="detail-field ${f.fullWidth ? 'form-group-full' : ''}">
                <label class="detail-label">${f.label}</label>
                <div class="detail-value">${f.raw ? f.value : (f.value ? Components.escapeHtml(String(f.value)) : '—')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnEditProduct').addEventListener('click', () => showProductForm(product));
    document.getElementById('btnDeleteProduct').addEventListener('click', () => {
      window._products_delete(product.id, product.name);
    });
  }

  // ==================== Create / Edit Form ====================
  function showProductForm(product = null) {
    const isEdit = !!product;
    const formId = 'productForm_' + Components.uid();

    const formHtml = `
      <form id="${formId}" class="form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Name <span class="required">*</span></label>
            <input class="form-control" type="text" name="name" required
                   value="${Components.escapeHtml(product?.name || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">SKU</label>
            <input class="form-control" type="text" name="sku"
                   value="${Components.escapeHtml(product?.sku || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input class="form-control" type="text" name="category"
                   value="${Components.escapeHtml(product?.category || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Unit</label>
            <input class="form-control" type="text" name="unit" placeholder="e.g., pcs, kg, box"
                   value="${Components.escapeHtml(product?.unit || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Cost</label>
            <input class="form-control" type="number" name="cost" min="0" step="0.01"
                   value="${product?.cost != null ? product.cost : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Selling Price <span class="required">*</span></label>
            <input class="form-control" type="number" name="selling_price" min="0" step="0.01" required
                   value="${product?.selling_price != null ? product.selling_price : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Stock</label>
            <input class="form-control" type="number" name="stock" min="0" step="1"
                   value="${product?.stock != null ? product.stock : ''}">
          </div>
          <div class="form-group form-group-checkbox">
            <label class="form-label">
              <input type="checkbox" name="active" ${product?.active !== false ? 'checked' : ''}> Active
            </label>
          </div>
          <div class="form-group form-group-full">
            <label class="form-label">Description</label>
            <textarea class="form-control" name="description" rows="3">${Components.escapeHtml(product?.description || '')}</textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Product</button>
        </div>
      </form>
    `;

    Components.showModal(
      isEdit ? `Edit Product: ${product.name}` : 'New Product',
      formHtml,
      'lg'
    );

    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      if (!formData.get('name')) {
        Components.showToast('Product name is required', 'warning');
        return;
      }

      const sellingPrice = parseFloat(formData.get('selling_price'));
      if (isNaN(sellingPrice) || sellingPrice < 0) {
        Components.showToast('Please enter a valid selling price', 'warning');
        return;
      }

      const data = {};
      formData.forEach((value, key) => {
        if (key === 'cost' || key === 'selling_price') {
          data[key] = value ? parseFloat(value) : null;
        } else if (key === 'stock') {
          data[key] = value ? parseInt(value, 10) : null;
        } else {
          data[key] = value;
        }
      });
      data.active = formData.has('active');

      try {
        if (isEdit) {
          await API.put(`/products/${product.id}`, data);
          Components.showToast('Product updated successfully', 'success');
        } else {
          const result = await API.post('/products', data);
          Components.showToast('Product created successfully', 'success');
          if (result?.id) currentProductId = result.id;
        }
        Components.closeModal();
        if (currentProductId && isEdit) {
          renderProductDetail(currentProductId);
        } else {
          loadProducts(1);
        }
      } catch (error) {
        Components.showToast(error.message, 'error');
      }
    });
  }

  async function loadProductForEdit(id) {
    try {
      const product = await API.get(`/products/${id}`);
      showProductForm(product);
    } catch (error) {
      Components.showToast(error.message, 'error');
    }
  }

})();
