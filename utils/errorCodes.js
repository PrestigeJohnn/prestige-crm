/**
 * 统一错误码规范
 */

// 错误码定义
const ERROR_CODES = {
  // 客户端错误
  BAD_REQUEST: { code: 400, message: '请求参数错误' },
  UNAUTHORIZED: { code: 401, message: '未授权，请重新登录' },
  FORBIDDEN: { code: 403, message: '权限不足' },
  NOT_FOUND: { code: 404, message: '资源不存在' },
  VALIDATION_ERROR: { code: 422, message: '验证失败' },
  CONFLICT: { code: 409, message: '数据冲突' },

  // 服务器错误
  INTERNAL_ERROR: { code: 500, message: '服务器内部错误' },
  BAD_GATEWAY: { code: 502, message: '服务不可用' },
  SERVICE_UNAVAILABLE: { code: 503, message: '服务暂时不可用' },
  GATEWAY_TIMEOUT: { code: 504, message: '服务超时' },

  // 业务错误
  CUSTOMER_NOT_FOUND: { code: 1001, message: '客户不存在' },
  ORDER_NOT_FOUND: { code: 1002, message: '订单不存在' },
  ACTIVITY_NOT_FOUND: { code: 1003, message: '活动不存在' },
  USER_NOT_FOUND: { code: 1004, message: '用户不存在' },
  INVALID_PASSWORD: { code: 1005, message: '密码错误' },
  EMAIL_EXISTS: { code: 1006, message: '邮箱已存在' },
  USERNAME_EXISTS: { code: 1007, message: '用户名已存在' },
  INVALID_TOKEN: { code: 1008, message: 'Token 无效' },
  TOKEN_EXPIRED: { code: 1009, message: 'Token 已过期' },
  REFRESH_TOKEN_EXPIRED: { code: 1010, message: 'Refresh Token 已过期' }
};

// HTTP 状态码映射
const HTTP_STATUS_MAP = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * 创建 API 错误
 */
class APIError extends Error {
  constructor(errorCode, message = null, data = null) {
    const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.INTERNAL_ERROR;
    super(message || errorInfo.message);
    this.code = errorInfo.code;
    this.errorCode = errorCode;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  toResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        errorCode: this.errorCode,
        message: this.message,
        data: this.data,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * 创建成功响应
 */
function successResponse(data = null, message = '操作成功') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err instanceof APIError) {
    return res.status(err.code).json(err.toResponse());
  }

  // 未知错误
  const apiError = new APIError('INTERNAL_ERROR');
  return res.status(500).json(apiError.toResponse());
}

module.exports = {
  ERROR_CODES,
  HTTP_STATUS_MAP,
  APIError,
  successResponse,
  errorHandler
};
