/**
 * Components — 通用 UI 组件函数
 * 提供 toast、模态框、确认框、格式化工具等
 */
const Components = (() => {
  // ==================== Toast ====================

  /**
   * 显示 Toast 通知
   * @param {string} message - 消息内容
   * @param {string} type - 'info' | 'success' | 'warning' | 'error'
   * @param {number} duration - 自动消失毫秒数
   */
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }

  // ==================== Modal ====================

  /**
   * 显示模态框
   * @param {string} title - 标题
   * @param {string|HTMLElement} content - 内容（HTML 字符串或 DOM 元素）
   * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
   * @returns {HTMLElement} modal 元素
   */
  function showModal(title, content, size = 'md') {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (!overlay || !modal) return null;

    modalTitle.textContent = title;
    modalBody.innerHTML = '';

    if (typeof content === 'string') {
      modalBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      modalBody.appendChild(content);
    }

    modal.className = `modal modal-${size}`;
    overlay.classList.add('active');
    modal.classList.add('active');

    // Focus trap
    setTimeout(() => {
      const focusable = modal.querySelector('input, select, textarea, button:not(.modal-close)');
      if (focusable) focusable.focus();
    }, 100);

    return modal;
  }

  /**
   * 关闭模态框
   */
  function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modal');
    if (overlay) overlay.classList.remove('active');
    if (modal) {
      modal.classList.remove('active');
      modal.innerHTML = '';
    }
  }

  // ==================== Confirm Dialog ====================

  /**
   * 显示确认对话框
   * @param {string} message - 确认消息
   * @param {Function} onOk - 确认回调
   * @param {Function} onCancel - 取消回调（可选）
   * @param {string} okText - 确认按钮文字
   * @param {string} type - 'danger' | 'warning' | 'info'
   */
  function showConfirm(message, onOk, onCancel, okText = 'Confirm', type = 'danger') {
    const dialog = document.getElementById('confirmDialog');
    const text = document.getElementById('confirmText');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    if (!dialog || !text || !okBtn || !cancelBtn) return;

    text.textContent = message;
    okBtn.textContent = okText;
    okBtn.className = `btn btn-${type === 'info' ? 'primary' : type}`;

    // Remove old listeners by cloning
    const newOk = okBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newOk.addEventListener('click', () => {
      dialog.classList.remove('active');
      if (typeof onOk === 'function') onOk();
    });

    newCancel.addEventListener('click', () => {
      dialog.classList.remove('active');
      if (typeof onCancel === 'function') onCancel();
    });

    dialog.classList.add('active');
  }

  // ==================== Formatters ====================

  /**
   * 格式化货币
   * @param {number} amount 
   * @param {string} currency - 货币代码
   * @returns {string}
   */
  function formatCurrency(amount, currency = 'SGD') {
    if (amount == null || isNaN(amount)) return '—';
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * 格式化日期
   * @param {string|Date} dateStr 
   * @returns {string}
   */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * 格式化日期时间
   * @param {string|Date} dateStr 
   * @returns {string}
   */
  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 格式化相对时间
   * @param {string|Date} dateStr 
   * @returns {string}
   */
  function formatRelative(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return formatDate(dateStr);
  }

  // ==================== Badges ====================

  /**
   * 返回状态标签 HTML
   * @param {string} status - 状态文本
   * @param {string} type - 状态类型（决定颜色）
   * @returns {string}
   */
  function getStatusBadge(status, type) {
    if (!status) return '—';
    const statusClasses = {
      // Account / Contact types
      'customer': 'badge-success',
      'prospect': 'badge-info',
      'partner': 'badge-primary',
      'vendor': 'badge-warning',
      'inactive': 'badge-secondary',
      // Lead status
      'new': 'badge-info',
      'contacted': 'badge-primary',
      'qualified': 'badge-success',
      'proposal': 'badge-warning',
      'negotiation': 'badge-warning',
      'won': 'badge-success',
      'lost': 'badge-danger',
      // Opportunity stage
      'prospecting': 'badge-secondary',
      'qualification': 'badge-info',
      'needs_analysis': 'badge-info',
      'value_proposition': 'badge-primary',
      'id_decision_makers': 'badge-primary',
      'proposal_price_quote': 'badge-warning',
      'negotiation_review': 'badge-warning',
      'closed_won': 'badge-success',
      'closed_lost': 'badge-danger',
      // Activity types
      'call': 'badge-primary',
      'email': 'badge-info',
      'meeting': 'badge-success',
      'task': 'badge-warning',
      'note': 'badge-secondary',
      // Task status
      'pending': 'badge-warning',
      'in_progress': 'badge-primary',
      'completed': 'badge-success',
      'cancelled': 'badge-secondary',
      // Case status
      'open': 'badge-primary',
      'in_progress': 'badge-primary',
      'resolved': 'badge-success',
      'closed': 'badge-secondary',
      // Quote status
      'draft': 'badge-secondary',
      'sent': 'badge-info',
      'revised': 'badge-warning',
      'accepted': 'badge-success',
      'rejected': 'badge-danger',
      // Order status
      'pending': 'badge-warning',
      'confirmed': 'badge-primary',
      'delivered': 'badge-success',
      'cancelled': 'badge-danger'
    };

    const cls = statusClasses[type?.toLowerCase()] || statusClasses[status.toLowerCase()] || 'badge-secondary';
    const display = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `<span class="badge ${cls}">${escapeHtml(display)}</span>`;
  }

  /**
   * 返回优先级标签 HTML
   * @param {string} priority 
   * @returns {string}
   */
  function getPriorityBadge(priority) {
    if (!priority) return '—';
    const classes = {
      'high': 'badge-danger',
      'medium': 'badge-warning',
      'low': 'badge-success',
      'urgent': 'badge-danger'
    };
    const cls = classes[priority.toLowerCase()] || 'badge-secondary';
    const display = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
    return `<span class="badge ${cls}">${escapeHtml(display)}</span>`;
  }

  // ==================== Render Helpers ====================

  /**
   * 渲染空状态
   * @param {string} icon - 图标（emoji 或 HTML）
   * @param {string} title - 标题
   * @param {string} desc - 描述
   * @param {string} actionHtml - 操作按钮 HTML
   * @returns {string}
   */
  function renderEmptyState(icon, title, desc, actionHtml = '') {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <h3 class="empty-state-title">${escapeHtml(title)}</h3>
        <p class="empty-state-desc">${escapeHtml(desc)}</p>
        ${actionHtml}
      </div>
    `;
  }

  /**
   * 渲染骨架屏
   * @param {number} rows - 行数
   * @param {number} cols - 列数
   * @returns {string}
   */
  function renderSkeleton(rows = 5, cols = 4) {
    let html = '<div class="skeleton-table">';
    for (let i = 0; i < rows; i++) {
      html += '<div class="skeleton-row">';
      for (let j = 0; j < cols; j++) {
        html += '<div class="skeleton-cell skeleton-pulse"></div>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  /**
   * 渲染分页
   * @param {number} current - 当前页
   * @param {number} total - 总页数
   * @param {Function} onPageChange - 回调
   * @returns {string}
   */
  function renderPagination(current, total, onPageChange) {
    if (total <= 1) return '';
    let html = '<div class="sf-pagination">';

    // Prev
    html += `<button class="sf-pagination__btn" ${current <= 1 ? 'disabled' : ''} data-page="${current - 1}">‹</button>`;

    // Pages
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    if (start > 1) html += `<button class="sf-pagination__btn" data-page="1">1</button><span class="sf-pagination__ellipsis">…</span>`;

    for (let i = start; i <= end; i++) {
      html += `<button class="sf-pagination__btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (end < total) html += `<span class="sf-pagination__ellipsis">…</span><button class="sf-pagination__btn" data-page="${total}">${total}</button>`;

    // Next
    html += `<button class="sf-pagination__btn" ${current >= total ? 'disabled' : ''} data-page="${current + 1}">›</button>`;
    html += '</div>';
    return html;
  }

  // ==================== Utility ====================

  /**
   * 防抖函数
   * @param {Function} fn 
   * @param {number} ms 
   * @returns {Function}
   */
  function debounce(fn, ms = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /**
   * 节流函数
   * @param {Function} fn 
   * @param {number} ms 
   * @returns {Function}
   */
  function throttle(fn, ms = 300) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  /**
   * XSS 防护 — 转义 HTML 特殊字符
   * @param {string} str 
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * 生成唯一 ID
   * @returns {string}
   */
  function uid() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  // Public API
  return {
    showToast,
    showModal,
    closeModal,
    showConfirm,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatRelative,
    getStatusBadge,
    getPriorityBadge,
    renderEmptyState,
    renderSkeleton,
    renderPagination,
    debounce,
    throttle,
    escapeHtml,
    uid
  };
})();
