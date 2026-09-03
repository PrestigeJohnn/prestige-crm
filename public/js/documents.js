/**
 * Documents — 文档页面
 * 文档列表、拖拽上传（AJAX + XHR progress）、分类筛选、下载/删除
 */
;(function() {
  'use strict';

  // ==================== State ====================
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let filterCategory = '';
  let filterAccountId = '';
  let currentDocumentId = null;

  const DOC_CATEGORIES = ['Contract', 'Proposal', 'Invoice', 'Report', 'Presentation', 'Other'];

  // ==================== Register Page ====================
  App.registerPage('documents', {
    render: renderDocuments,
    destroy: () => { currentDocumentId = null; }
  });

  // ==================== Main Render ====================
  async function renderDocuments() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Documents</h1>
        <div class="page-actions">
          <button class="btn btn-primary" id="btnUploadDoc">📤 Upload Document</button>
        </div>
      </div>
      <div id="documentsContent">
        ${Components.renderSkeleton(6, 5)}
      </div>
    `;

    document.getElementById('btnUploadDoc').addEventListener('click', () => showUploadForm());

    const hash = window.location.hash;
    const match = hash.match(/#documents\/(.+)/);
    if (match) {
      currentDocumentId = match[1];
      await renderDocumentDetail(currentDocumentId);
    } else {
      await loadDocuments(1);
    }
  }

  // ==================== Load Documents ====================
  async function loadDocuments(page = 1) {
    const container = document.getElementById('documentsContent');
    if (!container) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterAccountId && { account_id: filterAccountId })
      });

      const result = await API.get(`/documents?${params}`);
      const { data: documents, total, page: current, pages } = result;

      currentPage = current;
      totalPages = pages;
      renderDocumentsList(documents, total);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load documents',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'documents\')">Retry</button>'
      );
    }
  }

  // ==================== List View ====================
  function renderDocumentsList(documents, total) {
    const container = document.getElementById('documentsContent');
    if (!container) return;

    if (!documents || documents.length === 0) {
      container.innerHTML = Components.renderEmptyState(
        '📁',
        'No documents found',
        searchQuery ? 'Try a different search term' : 'Upload your first document',
        '<button class="btn btn-primary" onclick="document.getElementById(\'btnUploadDoc\').click()">📤 Upload Document</button>'
      );
      return;
    }

    const rows = documents.map(d => `
      <tr class="data-row" data-id="${d.id}">
        <td>
          <div class="doc-name-cell">
            <span class="doc-icon">${getFileIcon(d.file_type)}</span>
            <a class="link-primary" href="#documents/${d.id}" onclick="App.navigateTo('documents','${d.id}'); return false;">
              ${Components.escapeHtml(d.name)}
            </a>
          </div>
        </td>
        <td>${Components.escapeHtml(d.account_name || '—')}</td>
        <td>${Components.escapeHtml(d.category || '—')}</td>
        <td>${Components.escapeHtml(d.file_type || '—')}</td>
        <td>${formatFileSize(d.file_size)}</td>
        <td>${Components.formatDate(d.created_at)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-sm btn-icon" title="Download" onclick="window._docs_download('${d.id}')">⬇️</button>
            <button class="btn btn-sm btn-icon" title="Delete" onclick="window._docs_delete('${d.id}', '${Components.escapeHtml(d.name)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-search">
            <input type="text" class="search-input" id="docSearch"
                   placeholder="Search documents..." value="${Components.escapeHtml(searchQuery)}">
            <select class="form-control form-control-sm" id="filterDocCategory" style="width:150px">
              <option value="">All Categories</option>
              ${DOC_CATEGORIES.map(c => `<option value="${c}" ${filterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <span class="card-count">${total} documents</span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Account</th>
                <th>Category</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="card-footer">
          ${Components.renderPagination(currentPage, totalPages, (p) => loadDocuments(p))}
        </div>
      </div>
    `;

    const searchInput = document.getElementById('docSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Components.debounce((e) => {
        searchQuery = e.target.value.trim();
        loadDocuments(1);
      }, 300));
    }
    document.getElementById('filterDocCategory')?.addEventListener('change', (e) => {
      filterCategory = e.target.value;
      loadDocuments(1);
    });
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) loadDocuments(page);
      });
    });

    window._docs_download = (id) => {
      window.open(`/api/documents/${id}/download`, '_blank');
    };
    window._docs_delete = (id, name) => {
      Components.showConfirm(
        `Delete document "${name}"?`,
        async () => {
          try {
            await API.del(`/documents/${id}`);
            Components.showToast('Document deleted', 'success');
            loadDocuments(currentPage);
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
  async function renderDocumentDetail(docId) {
    const container = document.getElementById('documentsContent');
    if (!container) return;

    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const doc = await API.get(`/documents/${docId}`);
      currentDocumentId = docId;
      renderDetail(doc);
    } catch (error) {
      container.innerHTML = Components.renderEmptyState(
        '⚠️',
        'Failed to load document',
        error.message,
        '<button class="btn btn-primary" onclick="App.navigateTo(\'documents\')">Back to List</button>'
      );
    }
  }

  function renderDetail(doc) {
    const container = document.getElementById('documentsContent');
    if (!container) return;

    const fields = [
      { label: 'Name', value: doc.name },
      { label: 'Account', value: doc.account_name },
      { label: 'Opportunity', value: doc.opportunity_name },
      { label: 'Category', value: doc.category },
      { label: 'File Type', value: doc.file_type },
      { label: 'File Size', value: formatFileSize(doc.file_size) },
      { label: 'File Path', value: doc.file_path },
      { label: 'Uploaded', value: Components.formatDateTime(doc.created_at) }
    ];

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-left">
          <button class="btn btn-sm btn-secondary" onclick="App.navigateTo('documents')">← Back</button>
          <div class="detail-title-group">
            <h1 class="detail-title">
              <span class="doc-icon-lg">${getFileIcon(doc.file_type)}</span>
              ${Components.escapeHtml(doc.name)}
            </h1>
            <p class="detail-subtitle">${Components.escapeHtml(doc.category || '')} · ${formatFileSize(doc.file_size)}</p>
          </div>
        </div>
        <div class="detail-header-actions">
          <button class="btn btn-primary" id="btnDownloadDoc">⬇️ Download</button>
          <button class="btn btn-danger" id="btnDeleteDoc">🗑️ Delete</button>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
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

    document.getElementById('btnDownloadDoc').addEventListener('click', () => {
      window.open(`/api/documents/${doc.id}/download`, '_blank');
    });
    document.getElementById('btnDeleteDoc').addEventListener('click', () => {
      window._docs_delete(doc.id, doc.name);
    });
  }

  // ==================== Upload Form ====================
  function showUploadForm() {
    const formId = 'docUploadForm_' + Components.uid();
    let selectedFile = null;

    const formHtml = `
      <form id="${formId}" class="form" enctype="multipart/form-data">
        <div class="upload-area" id="uploadDropZone">
          <div class="upload-icon">📤</div>
          <div class="upload-text">Drag & drop files here or <span class="upload-browse" id="uploadBrowse">browse</span></div>
          <div class="upload-hint">PDF, DOC, XLS, PPT, images up to 50MB</div>
          <input type="file" id="fileInput" style="display:none" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.txt">
          <div class="upload-selected" id="uploadSelected" style="display:none">
            <span class="upload-file-icon" id="uploadFileIcon">${getFileIcon('')}</span>
            <div class="upload-file-info">
              <span class="upload-file-name" id="uploadFileName"></span>
              <span class="upload-file-size" id="uploadFileSize"></span>
            </div>
            <button type="button" class="btn btn-sm btn-icon" id="uploadRemove" title="Remove">✕</button>
          </div>
        </div>

        <div class="form-grid" style="margin-top:16px">
          <div class="form-group">
            <label class="form-label">Account</label>
            <select class="form-control" name="account_id" id="select_doc_account">
              <option value="">— Select Account —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Opportunity</label>
            <select class="form-control" name="opportunity_id" id="select_doc_opportunity">
              <option value="">— Select Opportunity —</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-control" name="category">
              <option value="">— Select Category —</option>
              ${DOC_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Name (optional)</label>
            <input class="form-control" type="text" name="name"
                   placeholder="Defaults to filename">
          </div>
        </div>

        <div class="upload-progress" id="uploadProgress" style="display:none">
          <div class="progress-bar">
            <div class="progress-bar-fill" id="progressBarFill" style="width:0%"></div>
          </div>
          <span class="progress-text" id="progressText">0%</span>
        </div>

        <div class="upload-status" id="uploadStatus" style="display:none">
          <span class="upload-status-icon" id="uploadStatusIcon"></span>
          <span class="upload-status-text" id="uploadStatusText"></span>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="Components.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btnSubmitUpload" disabled>Upload</button>
        </div>
      </form>
    `;

    Components.showModal('Upload Document', formHtml, 'lg');

    // Load select options
    loadDocSelect('select_doc_account', '/accounts?limit=1000', null, 'company_name');
    loadDocSelect('select_doc_opportunity', '/opportunities?limit=1000', null, 'name');

    // File input handling
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('uploadDropZone');
    const browseBtn = document.getElementById('uploadBrowse');
    const selectedDiv = document.getElementById('uploadSelected');
    const fileName = document.getElementById('uploadFileName');
    const fileSize = document.getElementById('uploadFileSize');
    const fileIcon = document.getElementById('uploadFileIcon');
    const removeBtn = document.getElementById('uploadRemove');
    const submitBtn = document.getElementById('btnSubmitUpload');

    function handleFile(file) {
      if (!file) return;
      selectedFile = file;
      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);
      fileIcon.textContent = getFileIcon(file.type || file.name.split('.').pop());
      selectedDiv.style.display = 'flex';
      dropZone.classList.add('upload-has-file');
      dropZone.classList.remove('upload-dragover');
      submitBtn.disabled = false;
    }

    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) handleFile(e.target.files[0]);
    });
    removeBtn.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      selectedDiv.style.display = 'none';
      dropZone.classList.remove('upload-has-file');
      submitBtn.disabled = true;
    });

    // Drag and drop
    ['dragenter', 'dragover'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('upload-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (evt === 'dragleave' && e.target === dropZone) {
          dropZone.classList.remove('upload-dragover');
        }
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    // Form submit with real XHR progress
    document.getElementById(formId).addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedFile) return;

      const formData = new FormData();
      formData.append('file', selectedFile);

      const formEl = e.target;
      const accountSelect = formEl.querySelector('[name="account_id"]');
      const oppSelect = formEl.querySelector('[name="opportunity_id"]');
      const catSelect = formEl.querySelector('[name="category"]');
      const nameInput = formEl.querySelector('[name="name"]');

      if (accountSelect?.value) formData.append('account_id', accountSelect.value);
      if (oppSelect?.value) formData.append('opportunity_id', oppSelect.value);
      if (catSelect?.value) formData.append('category', catSelect.value);
      if (nameInput?.value) formData.append('name', nameInput.value);

      const progressDiv = document.getElementById('uploadProgress');
      const progressFill = document.getElementById('progressBarFill');
      const progressText = document.getElementById('progressText');
      const uploadStatus = document.getElementById('uploadStatus');
      const uploadStatusIcon = document.getElementById('uploadStatusIcon');
      const uploadStatusText = document.getElementById('uploadStatusText');

      progressDiv.style.display = 'flex';
      uploadStatus.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading...';

      // Use XMLHttpRequest for real progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = pct + '%';
          progressText.textContent = pct + '%';
        }
      });

      xhr.addEventListener('load', () => {
        progressDiv.style.display = 'none';
        uploadStatus.style.display = 'flex';

        try {
          const result = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && result.success) {
            uploadStatusIcon.textContent = '✅';
            uploadStatusText.textContent = 'Upload complete!';
            Components.showToast('Document uploaded successfully', 'success');
            setTimeout(() => {
              Components.closeModal();
              loadDocuments(1);
            }, 800);
          } else {
            uploadStatusIcon.textContent = '❌';
            uploadStatusText.textContent = result.error || 'Upload failed';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload';
            Components.showToast(result.error || 'Upload failed', 'error');
          }
        } catch (err) {
          uploadStatusIcon.textContent = '❌';
          uploadStatusText.textContent = 'Invalid server response';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Upload';
          Components.showToast('Invalid server response', 'error');
        }
      });

      xhr.addEventListener('error', () => {
        progressDiv.style.display = 'none';
        uploadStatus.style.display = 'flex';
        uploadStatusIcon.textContent = '❌';
        uploadStatusText.textContent = 'Network error — please check your connection';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload';
        Components.showToast('Network error', 'error');
      });

      xhr.addEventListener('abort', () => {
        progressDiv.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload';
        Components.showToast('Upload cancelled', 'warning');
      });

      xhr.open('POST', '/api/documents');
      xhr.send(formData);
    });
  }

  async function loadDocSelect(selectId, endpoint, selectedId, nameField) {
    try {
      const result = await API.get(endpoint);
      const select = document.getElementById(selectId);
      if (!select) return;
      const items = result.data || result;
      const options = items.map(item => {
        const label = item[nameField] || item.name || item.id;
        return `<option value="${item.id}" ${item.id == selectedId ? 'selected' : ''}>${Components.escapeHtml(label)}</option>`;
      }).join('');
      select.innerHTML = '<option value="">— Select —</option>' + options;
    } catch (error) {
      // Silent
    }
  }

  // ==================== Helpers ====================
  function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function getFileIcon(fileType) {
    if (!fileType) return '📄';
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📕';
    if (type.includes('doc') || type.includes('word')) return '📘';
    if (type.includes('xls') || type.includes('excel') || type.includes('sheet') || type.includes('csv')) return '📗';
    if (type.includes('ppt') || type.includes('presentation') || type.includes('powerpoint')) return '📙';
    if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('image') || type.includes('svg') || type.includes('webp')) return '🖼️';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gz') || type.includes('7z')) return '📦';
    if (type.includes('txt') || type.includes('text') || type.includes('md')) return '📝';
    if (type.includes('mp4') || type.includes('avi') || type.includes('mov') || type.includes('video')) return '🎬';
    if (type.includes('mp3') || type.includes('wav') || type.includes('audio')) return '🎵';
    return '📄';
  }

})();
