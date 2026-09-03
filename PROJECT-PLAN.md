# AI CRM 操作系统 — 实施计划

> **创建日期:** 2026-06-18
> **目标:** 专业级 AI CRM 桌面应用 + Hermes Agent 桥接
> **架构:** 独立 App（数据+UI）+ Hermes Agent（AI 大脑）
> **技术栈:** Node.js + Express + SQLite + 原生 HTML/CSS/JS
> **UI 风格:** Salesforce Lightning Design System 级别

---

## 架构总览

```
┌──────────────────────────────────────────────┐
│          AI CRM 桌面应用 (localhost:3001)       │
│  ┌──────────────────────────────────────┐    │
│  │  专业级 UI (Lightning 风格)            │    │
│  │  Sidebar + Tab 导航 + 数据表格 + 图表  │    │
│  └──────────────┬───────────────────────┘    │
│                 │                             │
│  ┌──────────────▼───────────────────────┐    │
│  │        SQLite 数据库 (crm.db)          │    │
│  └──────────────┬───────────────────────┘    │
│                 │                             │
│  ┌──────────────▼───────────────────────┐    │
│  │     REST API (Express Router)          │    │
│  └──────────────┬───────────────────────┘    │
└─────────────────┼────────────────────────────┘
                  │ HTTP (localhost:3001/api/*)
┌─────────────────▼────────────────────────────┐
│              Hermes Agent                      │
│  你说"更新ABC客户阶段为谈判"                    │
│  → Hermes 调用 PUT /api/opportunities/123     │
│  → CRM 更新数据库 + 返回结果                   │
│                                              │
│  CRM 有30天未跟进客户                          │
│  → CRM 触发通知 → Hermes 提醒你               │
└──────────────────────────────────────────────┘
```

---

## 项目结构

```
C:\Users\prestige\Desktop\AI-CRM\
├── PROJECT-PLAN.md              ← 本文件（进度追踪）
├── server.js                    ← Express 主入口
├── package.json
├── .env
├── database/
│   ├── schema.sql               ← 12 张表结构
│   ├── seed.sql                 ← 示例数据
│   └── crm.db                   ← SQLite 文件（自动生成）
├── routes/
│   ├── accounts.js              ← 客户公司
│   ├── contacts.js              ← 联系人
│   ├── leads.js                 ← 潜在客户
│   ├── opportunities.js         ← 商机
│   ├── activities.js            ← 跟进记录
│   ├── tasks.js                 ← 待办事项
│   ├── quotes.js                ← 报价
│   ├── orders.js                ← 订单
│   ├── products.js              ← 产品库
│   ├── cases.js                 ← 客户问题
│   ├── documents.js             ← 文档
│   └── dashboard.js             ← 仪表盘数据
├── services/
│   ├── db.js                    ← 数据库连接
│   └── notifier.js              ← Hermes 通知桥接
├── public/
│   ├── index.html               ← 主入口
│   ├── css/
│   │   └── style.css            ← Lightning 风格样式
│   └── js/
│       ├── app.js               ← 主应用 + 路由
│       ├── api.js               ← API 调用层
│       ├── accounts.js          ← 客户页面
│       ├── contacts.js          ← 联系人页面
│       ├── leads.js             ← 潜在客户页面
│       ├── opportunities.js     ← 商机页面
│       ├── activities.js        ← 跟进记录页面
│       ├── tasks.js             ← 待办页面
│       ├── quotes.js            ← 报价页面
│       ├── orders.js            ← 订单页面
│       ├── products.js          ← 产品页面
│       ├── cases.js             ← 问题页面
│       ├── documents.js         ← 文档页面
│       ├── dashboard.js         ← 仪表盘页面
│       └── components.js        ← 通用组件
└── uploads/                     ← 上传文件
```

---

## 数据库表（12 张核心表）

### 1. accounts（客户公司）
- id, company_name, industry, country, city, address, postal_code
- website, phone, employees, annual_revenue, notes
- created_at, updated_at

### 2. contacts（联系人）
- id, account_id, first_name, last_name, position, department
- email, phone, linkedin, decision_maker (boolean), influence_level (1-5)
- notes, created_at, updated_at

### 3. leads（潜在客户）
- id, company_name, contact_name, email, phone, source
- status (New/Contacted/Qualified/Proposal/Negotiation/Won/Lost)
- score (0-100), notes, created_at, updated_at

### 4. opportunities（商机）
- id, account_id, contact_id, name, description
- value, probability, stage (Discovery/Qualification/Proposal/Negotiation/Closed Won/Closed Lost)
- competitor, expected_close_date, actual_close_date
- notes, created_at, updated_at

### 5. activities（跟进记录）
- id, account_id, contact_id, opportunity_id
- type (Call/Email/Meeting/WhatsApp/Site Visit/Note)
- subject, description, date, duration
- next_action, next_action_date, created_at

### 6. tasks（待办事项）
- id, account_id, contact_id, opportunity_id
- title, description, due_date, priority (Low/Medium/High/Urgent)
- status (Not Started/In Progress/Completed/Cancelled)
- assigned_to, created_at, updated_at

### 7. quotes（报价）
- id, account_id, opportunity_id, quote_no
- amount, discount, tax, total, version
- status (Draft/Sent/Revised/Accepted/Rejected)
- valid_until, notes, created_at, updated_at

### 8. quote_items（报价明细）
- id, quote_id, product_id, description, quantity, unit_price, discount, total

### 9. orders（订单）
- id, account_id, opportunity_id, quote_id, order_no
- amount, status (Pending/Confirmed/Delivered/Cancelled)
- delivery_date, notes, created_at, updated_at

### 10. products（产品库）
- id, name, sku, category, description
- cost, selling_price, stock, unit, active
- created_at, updated_at

### 11. cases（客户问题）
- id, account_id, contact_id, case_no
- subject, description, priority (Low/Medium/High/Urgent)
- status (New/In Progress/Resolved/Closed)
- resolution, created_at, updated_at

### 12. documents（文档）
- id, account_id, opportunity_id, name, file_path, file_size, file_type
- category, uploaded_by, created_at

---

## Hermes 桥接方案

### 方案：HTTP API + 文件通知

**CRM → Hermes（CRM 主动通知）：**
- CRM 通过 `POST http://localhost:3000/api/notify` 发送通知到 Hermes
- 或者写入 `C:\Users\prestige\Desktop\AI-CRM\notifications\pending.json`
- Hermes 定时检查或通过 cronjob 读取

**Hermes → CRM（Hermes 调用 CRM）：**
- Hermes 直接调用 `http://localhost:3001/api/*` 执行 CRUD
- 例如：`curl -X PUT http://localhost:3001/api/opportunities/1 -d '{"stage":"Negotiation"}'`

### Hermes 快捷指令设计
```
用户: "把ABC客户的商机阶段改为谈判"
Hermes: → PUT /api/opportunities/123 {stage: "Negotiation"}
        → "已更新 ABC Pte Ltd 的 Warehouse Automation Project 商机阶段为 Negotiation"

用户: "今天见了ABC客户，他们担心实施周期"
Hermes: → POST /api/activities {account_id: 1, type: "Meeting", description: "客户担心实施周期过长"}
        → POST /api/tasks {title: "提供实施时间表", due_date: "明天", account_id: 1}
        → "已记录会议并创建待办：提供实施时间表"

用户: "本月成交额多少？"
Hermes: → GET /api/dashboard/sales?month=2026-06
        → "本月成交额 SGD 1,250,000，共 5 笔成交"
```

---

## 实施阶段

### 🔵 阶段 1: 骨架 + 数据库（2-3h）
- [ ] 项目初始化（npm, 目录结构）
- [ ] 数据库 schema（12 张表）
- [ ] Express 服务器 + 基础路由
- [ ] 示例数据 seed
- [ ] 基础 HTML 布局框架
- [ ] Lightning 风格 CSS 基础

### 🟢 阶段 2: 核心模块 UI（3-4h）
- [ ] Accounts 页面（列表+详情+编辑）
- [ ] Contacts 页面
- [ ] Leads 页面
- [ ] Opportunities 页面（Kanban + 列表）
- [ ] Activities 页面
- [ ] Tasks 页面（日历视图）
- [ ] Dashboard 页面（KPI + 图表）

### 🟡 阶段 3: 扩展模块（2-3h）
- [ ] Quotes + Quote Items 页面
- [ ] Orders 页面
- [ ] Products 页面
- [ ] Cases 页面
- [ ] Documents 页面（上传/下载）
- [ ] 全局搜索

### 🔴 阶段 4: Hermes 桥接 + 打磨（2-3h）
- [ ] Hermes 通知桥接
- [ ] Hermes 快捷指令配置
- [ ] UI 细节打磨（动画、响应式）
- [ ] 移动端适配
- [ ] 最终测试

---

## 进度追踪

| 阶段 | 状态 | 备注 |
|------|------|------|
| 阶段 1: 骨架 + 数据库 | ⏳ 未开始 | |
| 阶段 2: 核心模块 UI | ⏳ 未开始 | |
| 阶段 3: 扩展模块 | ⏳ 未开始 | |
| 阶段 4: Hermes 桥接 + 打磨 | ⏳ 未开始 | |

---

## 启动方式

```bash
cd C:\Users\prestige\Desktop\AI-CRM
npm install
npm start
# 浏览器打开 http://localhost:3001
```
