/**
 * API — 统一 API 调用封装
 * 所有请求以 /api 为前缀，统一处理错误和 JSON 解析
 */
const API = (() => {
  /**
   * 核心请求方法
   * @param {string} path - 请求路径
   * @param {object} options - fetch 选项
   * @returns {Promise<any>} 解析后的 data 字段
   */
  async function request(path, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`/api${path}`, config);
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      // 如果 data 是数组，自动包装为分页格式（兼容子代理生成的前端代码）
      if (Array.isArray(result.data)) {
        return { data: result.data, total: result.data.length, page: 1, pages: 1 };
      }

      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error — please check your connection');
      }
      throw error;
    }
  }

  return {
    /**
     * GET 请求
     * @param {string} path 
     * @returns {Promise<any>}
     */
    get(path) {
      return request(path, { method: 'GET' });
    },

    /**
     * POST 请求（JSON body）
     * @param {string} path 
     * @param {object} data 
     * @returns {Promise<any>}
     */
    post(path, data = {}) {
      return request(path, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    /**
     * PUT 请求（JSON body）
     * @param {string} path 
     * @param {object} data 
     * @returns {Promise<any>}
     */
    put(path, data = {}) {
      return request(path, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    /**
     * DELETE 请求
     * @param {string} path 
     * @returns {Promise<any>}
     */
    del(path) {
      return request(path, { method: 'DELETE' });
    },

    /**
     * 上传文件（multipart/form-data）
     * @param {string} path 
     * @param {FormData} formData 
     * @returns {Promise<any>}
     */
    upload(path, formData) {
      return request(path, {
        method: 'POST',
        body: formData,
        headers: {} // 让浏览器自动设置 Content-Type
      });
    }
  };
})();
