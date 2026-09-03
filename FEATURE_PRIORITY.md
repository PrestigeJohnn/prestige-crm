# 高级功能优先级建议

## 🔴 第一优先级：现在必须建（让 CRM 真正能用）

### 1. ✅ React 前端重写（核心）
**原因**：你现在的前端是 vanilla HTML/CSS/JS，子代理生成的代码有 bug（API/Components undefined），页面无法点击。重写为 React 是解决这个问题的根本方案。

**包含**：
- src/index.jsx（React 入口）
- src/App.jsx（主组件 + React Router）
- src/components/Sidebar.jsx
- src/components/Header.jsx
- src/components/Login.jsx
- src/components/CustomerList.jsx
- src/components/CustomerDetail.jsx
- src/components/OrderList.jsx
- src/components/ActivityList.jsx
- src/components/Reports.jsx
- src/components/Modal.jsx
- src/components/Table.jsx
- src/api/client.js（axios + token）
- src/api/customers.js
- src/api/orders.js
- src/api/activities.js
- src/api/reports.js
- src/utils/toast.js
- src/utils/confirm.js
- src/utils/pagination.js
- src/styles/index.css
- public/index.html
- webpack.config.js
- babel.config.js
- package.json（更新）

### 2. ✅ JWT 认证系统（核心）
**原因**：没有认证，任何人都能访问数据。这是桌面软件的基本要求。

**包含**：
- server/routes/auth.js
- server/controllers/authController.js
- server/middleware/auth.js
- database/schema.sql（添加 users 表）
- seed.sql（添加测试用户）

### 3. ✅ 后端路由补全（核心）
**原因**：你给的代码有 orders/activities/reports 路由，我们现有的后端没有。

**包含**：
- server/routes/orders.js
- server/routes/activities.js
- server/routes/reports.js
- server/controllers/ordersController.js
- server/controllers/activitiesController.js
- server/controllers/reportsController.js
- server/index.js（注册新路由）

### 4. ✅ 数据库补全（核心）
**原因**：需要 users 表（认证）、orders 表、activities 表、reports 相关表。

**包含**：
- database/schema.sql（添加 users/orders/activities 表）
- database/seed.sql（添加测试数据）

### 5. ✅ Electron 打包配置（核心）
**原因**：需要能打包成 .exe 桌面软件。

**包含**：
- package.json（electron-builder 配置）
- electron-main.js（更新）
- .env 文件

## 🟡 第二优先级：尽快建（提升用户体验）

### 6. ⚠️ 权限系统
**原因**：单人使用可以暂时不需要，但如果以后给同事用，就需要权限控制。

**包含**：
- departments/roles/permissions 表
- server/middleware/permissions.js
- server/routes/roles.js

### 7. ⚠️ 数据导出（CSV/Excel）
**原因**：用户需要导出数据。

**包含**：
- src/utils/export.js
- server/services/exportService.js

### 8. ⚠️ 多语言（中英文）
**原因**：你之前提到沟通可以用中英文。

**包含**：
- src/utils/i18n.js
- src/components/LanguageSelector.jsx

### 9. ⚠️ 自定义字段
**原因**：不同客户可能需要不同的字段。

**包含**：
- custom_fields 表
- server/services/customFieldService.js
- src/components/CustomFieldManager.jsx

## 🟢 第三优先级：后期建（企业级功能）

### 10. ❌ AI 插件（流失预测/销售推荐）
**原因**：需要大量历史数据训练模型，单人 CRM 数据量不够。
**建议**：等 CRM 运行 3-6 个月，有足够数据后再建。

### 11. ❌ 实时协作（WebSocket）
**原因**：单人使用不需要。多用户协作才需要。
**建议**：等有多人使用需求时再建。

### 12. ❌ 高级图表（Chart.js 仪表盘）
**原因**：我们现有的 Dashboard 已经有 KPI 卡片和 CSS 图表。
**建议**：先用现有 Dashboard，后续再升级。

### 13. ❌ API 版本管理
**原因**：单人桌面应用不需要多版本 API。
**建议**：等有多人使用需求时再建。

### 14. ❌ 缓存策略（Redis）
**原因**：SQLite 本地查询很快，不需要 Redis 缓存。
**建议**：等数据量大了再建。

### 15. ❌ 数据库索引优化
**原因**：SQLite 数据量小时不需要。
**建议**：等数据量大了再建。

### 16. ❌ 错误重试机制（Bull 队列）
**原因**：桌面应用直连本地数据库，不需要队列。
**建议**：等有多人使用需求时再建。

### 17. ❌ 数据归档
**原因**：数据量小时不需要。
**建议**：等数据量大了再建。

### 18. ❌ 知识库
**原因**：单人使用不需要。
**建议**：等有多人使用需求时再建。

### 19. ❌ Webhook
**原因**：单人使用不需要外部集成。
**建议**：等有第三方集成需求时再建。

### 20. ❌ GraphQL API
**原因**：桌面应用用 REST API 就够了。
**建议**：等有第三方集成需求时再建。

### 21. ❌ OAuth 2.0
**原因**：单人桌面应用用 JWT 就够了。
**建议**：等有第三方登录需求时再建。

### 22. ❌ Docker 部署
**原因**：桌面应用打包成 .exe 就够了。
**建议**：等有服务器部署需求时再建。

### 23. ❌ 测试（Jest）
**原因**：先让功能跑起来，再补测试。
**建议**：等功能稳定后再建。

### 24. ❌ 监控/日志（Sentry/PM2）
**原因**：桌面应用不需要服务器监控。
**建议**：等有服务器部署需求时再建。

### 25. ❌ 文档（Swagger）
**原因**：单人使用不需要 API 文档。
**建议**：等有第三方集成需求时再建。

### 26. ❌ 安全增强（HTTPS/加密）
**原因**：桌面应用本地运行，不需要 HTTPS。
**建议**：等有服务器部署需求时再建。

### 27. ❌ 插件市场
**原因**：单人使用不需要插件。
**建议**：等有扩展需求时再建。

## 📊 总结

| 优先级 | 功能 | 数量 | 预计时间 |
|--------|------|------|---------|
| 🔴 **现在建** | React 前端 + 认证 + 后端路由 + 数据库 + Electron 打包 | 5 项 | 3-4 小时 |
| 🟡 **尽快建** | 权限 + 导出 + 多语言 + 自定义字段 | 4 项 | 1-2 小时 |
| 🟢 **后期建** | AI/WebSocket/图表/缓存/队列/归档/知识库/Webhook/GraphQL/OAuth/Docker/测试/监控/文档/安全/插件 | 17 项 | 后续迭代 |

**建议**：先完成 🔴 第一优先级，让 CRM 能跑起来、能点击、能用。然后根据实际使用情况，逐步加 🟢 第三优先级的功能。
