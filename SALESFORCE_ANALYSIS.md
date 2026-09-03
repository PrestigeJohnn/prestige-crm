# Salesforce Lightning Experience — 完整分析

## 导航结构（左侧 Sidebar）

Salesforce Lightning 的导航称为 "App Launcher"，包含以下顶级模块：

### 核心销售模块
1. **Home** — 首页仪表板，显示关键指标、任务、日历
2. **Accounts** — 客户公司管理（B2B 客户）
3. **Contacts** — 联系人管理（关联到 Accounts）
4. **Leads** — 潜在客户（未成交的销售线索）
5. **Opportunities** — 商机（正在跟进的成交机会）
6. **Cases** — 客户问题/售后支持工单

### 协作模块
7. **Chatter** — 企业内部社交网络（类似企业微信/钉钉）
8. **Calendar** — 日程管理
9. **Tasks** — 任务管理
10. **Notes** — 笔记
11. **Files** — 文件管理
12. **Reports** — 报表
13. **Dashboards** — 仪表盘

### 管理模块
14. **Campaigns** — 营销活动
15. **Products** — 产品目录
16. **Price Books** — 价格手册
17. **Orders** — 订单管理
18. **Contracts** — 合同管理
19. **Forecasts** — 销售预测
20. **Territories** — 销售区域管理

### AI 模块
21. **Einstein** — AI 助手（预测、推荐、自动生成）

## 每个模块的详细功能

### 1. Home（首页）
- **My Tasks** — 今日待办任务列表
- **My Events** — 今日日历事件
- **Today's Leads** — 今日新增潜在客户
- **Top Opportunities** — 金额最大的商机
- **Pipeline Summary** — 销售管线总览
- **Key Deals Closing This Month** — 本月即将成交的商机
- **Performance Charts** — 业绩图表
- **Assistant** — Einstein AI 推荐事项

### 2. Accounts（客户公司）
**列表视图：**
- 可自定义列显示
- 搜索/筛选/排序
- 快速创建（Quick Action）
- 批量操作（导入/导出）

**详情页：**
- 公司信息（名称、行业、地址、电话、网站、员工数、年营业额）
- 关联联系人（子列表）
- 关联商机（子列表）
- 关联活动（时间线视图）
- 关联订单（子列表）
- 关联合同（子列表）
- 关联笔记和文件
- 活动时间线（所有历史交互按时间排列）
- "Path" — 客户旅程路径指引
- "Chatter" — 该客户的讨论串

### 3. Contacts（联系人）
**列表视图：**
- 按客户分组显示
- 卡片视图（头像/姓名/职位/邮箱/电话）
- 快速联系（一键发邮件/打电话）

**详情页：**
- 基本信息（姓名、职位、部门、邮箱、电话、LinkedIn）
- 关联客户（Account）
- 关联商机（Opportunities）
- 关联活动（Activities）
- 决策者标记（Decision Maker）
- 影响力等级（Influence Level 1-5）
- 活动时间线

### 4. Leads（潜在客户）
**视图：**
- 看板视图（按状态分列：New → Contacted → Qualified → Converted）
- 列表视图
- 可拖拽改变状态

**详情页：**
- 公司名、联系人、邮箱、电话
- 来源（Source：展会、网站、推荐等）
- 评分（Lead Score 0-100）
- 状态（Status）
- 转换为商机（Convert Lead 按钮）

### 5. Opportunities（商机）— 最核心模块
**看板视图（Kanban）：**
- 按阶段分列：Prospecting → Qualification → Needs Analysis → Proposal → Negotiation → Closed Won / Closed Lost
- 每列显示：商机数量 + 总金额
- 可拖拽卡片改变阶段
- 卡片显示：商机名、客户、金额、概率、预计成交日

**列表视图：**
- 可排序表格
- 可自定义列
- 快速编辑（Inline Edit）

**详情页：**
- 基本信息（名称、客户、联系人、金额、概率、阶段、预计成交日）
- 竞争对手（Competitor）
- 产品关联（Products）
- 报价关联（Quotes）
- 活动历史（Activity Timeline）
- 阶段推进历史（Stage History）
- "Path" — 销售路径指引（每个阶段的关键步骤）
- Einstein 预测（AI 成交概率）

### 6. Cases（客户问题）
**视图：**
- 列表视图（按状态/优先级筛选）
- 看板视图（New → In Progress → Resolved → Closed）

**详情页：**
- 工单号、主题、描述
- 关联客户、联系人
- 优先级（Low/Medium/High/Urgent）
- 状态（New/In Progress/Resolved/Closed）
- 解决方案（Resolution）
- 活动时间线

### 7. Reports（报表）
**报表类型：**
- Tabular（表格）
- Summary（汇总）
- Matrix（矩阵）
- Joined（联合）

**报表功能：**
- 拖拽式报表构建器
- 筛选/分组/排序
- 公式字段
- 条件高亮
- 图表嵌入
- 订阅（定时邮件发送）
- 导出（Excel/CSV/PDF）

### 8. Dashboards（仪表盘）
**功能：**
- 多组件仪表盘
- 实时刷新
- 交互式筛选
- 组件类型：图表、表格、指标、仪表
- 可自定义布局
- 可订阅/分享

### 9. Chatter（企业社交）
- 类似企业微信/钉钉
- 可以 @人、分享文件、点赞
- 按记录关联（每个客户/商机都有 Chatter 串）
- 群组功能

### 10. Einstein（AI 助手）
- **Einstein Lead Scoring** — AI 自动给线索评分
- **Einstein Opportunity Scoring** — AI 预测商机成交概率
- **Einstein Forecasting** — AI 销售预测
- **Einstein Email Insights** — 邮件智能分析
- **Einstein Next Best Action** — 推荐下一步行动
- **Einstein Search** — 自然语言搜索

## Salesforce Lightning UI 设计规范

### 颜色系统
- **主色**: Salesforce Blue #032D60（深蓝）
- **强调色**: #0176D3（亮蓝）
- **成功**: #2E844A（绿）
- **警告**: #DD7A01（橙）
- **错误**: #EA001E（红）
- **中性灰**: #706E6B

### 布局
- **左侧 Sidebar**: 导航菜单（可折叠为图标模式）
- **顶部 Topbar**: 搜索框、通知、用户头像、App Launcher
- **主内容区**: 页面内容
- **右侧面板**: 活动详情、报表预览（可滑入）

### 组件
- **Cards** — 卡片（带阴影、圆角）
- **Data Tables** — 数据表格（可排序、可筛选、可分页）
- **Modals** — 模态框（居中弹出）
- **Toasts** — 通知提示（右上角滑入）
- **Badges** — 状态标签（彩色药丸形）
- **Tabs** — 标签页
- **Accordion** — 手风琴折叠
- **Kanban** — 看板（拖拽卡片）
- **Path** — 路径指引（步骤条）
- **Timeline** — 时间线
- **Quick Actions** — 快速操作按钮

### 交互特性
- **Inline Edit** — 列表单元格直接编辑
- **Drag & Drop** — 看板卡片拖拽
- **Keyboard Shortcuts** — 快捷键支持
- **Responsive** — 响应式布局（桌面/平板/手机）
- **Dark Mode** — 暗色模式（2024+）
- **Compact Mode** — 紧凑模式（更多内容密度）

## 与我们当前 CRM 的对比

| 功能 | Salesforce Lightning | 我们的 CRM | 差距 |
|------|-------------------|-----------|------|
| Accounts | ✅ 完整 | ✅ 基础 | 缺少 Path、Chatter |
| Contacts | ✅ 完整 | ✅ 基础 | 缺少 活动时间线 |
| Leads | ✅ 看板+列表 | ✅ 看板+列表 | 基本匹配 |
| Opportunities | ✅ Kanban+Path | ✅ Kanban | 缺少 Path、Einstein |
| Cases | ✅ 完整 | ✅ 基础 | 基本匹配 |
| Reports | ✅ 拖拽构建器 | ⚠️ 基础图表 | 差距大 |
| Dashboards | ✅ 多组件 | ⚠️ KPI 卡片 | 差距大 |
| Chatter | ✅ 企业社交 | ❌ 无 | 缺失 |
| Einstein AI | ✅ AI 助手 | ❌ 无 | 缺失 |
| Calendar | ✅ 日程 | ⚠️ 基础 | 差距 |
| Tasks | ✅ 任务 | ✅ 基础 | 基本匹配 |
| Notes | ✅ 笔记 | ⚠️ 基础 | 差距 |
| Files | ✅ 文件管理 | ✅ 上传/下载 | 基本匹配 |
| Products | ✅ 产品目录 | ✅ 基础 | 基本匹配 |
| Orders | ✅ 订单 | ✅ 基础 | 基本匹配 |
| Quotes | ✅ 报价 | ✅ 基础 | 基本匹配 |
| Workflow | ✅ 工作流 | ⚠️ 基础 | 差距 |
| Auth | ✅ 完整 | ⚠️ 基础 | 缺少 OAuth、MFA |
| Mobile | ✅ 原生 App | ⚠️ 响应式 | 差距 |
| Dark Mode | ✅ | ❌ | 缺失 |
| Inline Edit | ✅ | ❌ | 缺失 |
| Drag & Drop | ✅ | ⚠️ 部分 | 差距 |
| Search | ✅ 全局搜索 | ✅ 全局搜索 | 基本匹配 |
| Notifications | ✅ 实时 | ⚠️ 轮询 | 差距 |
