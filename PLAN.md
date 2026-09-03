# PrestigeCRM 剩余修复计划

## 目标
修复所有剩余的UI/UX问题，确保专业级别水平

## 架构
逐个修复每个问题，每修复一个立即验证

## 技术栈
Electron + React + Express + SQLite

---

### Task 1: 修复Profile页面英文显示
**Objective:** 将"在线"改为"Online"，"管理员"改为"Administrator"

**Files:**
- Modify: `D:\AI-CRM\src\components\Profile.jsx`

**Steps:**
1. 读取 Profile.jsx
2. 找到所有中文文本
3. 替换为英文对应文本
4. 保存

---

### Task 2: 修复右上角用户名
**Objective:** 从"Admin"改为"Johnn"

**Files:**
- Modify: `D:\AI-CRM\src\components\Header.jsx`

**Steps:**
1. 读取 Header.jsx
2. 找到用户名显示逻辑
3. 改为从登录用户信息获取真实姓名
4. 保存

---

### Task 3: 修复头像
**Objective:** 从"A"改为"J"

**Files:**
- Modify: `D:\AI-CRM\src\components\Header.jsx`

**Steps:**
1. 读取 Header.jsx
2. 找到头像首字母逻辑
3. 改为从用户信息获取首字母
4. 保存

---

### Task 4: 修复Dashboard右侧滚动条
**Objective:** 滚动不超出页面范围

**Files:**
- Modify: `D:\AI-CRM\src\styles\index.css`

**Steps:**
1. 读取 index.css
2. 检查 .main-scroll 的 overflow 设置
3. 修复滚动边界
4. 保存

---

### Task 5: 修复日历选择器
**Objective:** 选择日期后两个框不清空

**Files:**
- Modify: `D:\AI-CRM\src\components\Dashboard.jsx`

**Steps:**
1. 读取 Dashboard.jsx
2. 找到 RangePicker onChange 逻辑
3. 修复日期保存逻辑
4. 保存

---

### Task 6: 修复所有页面按钮排版
**Objective:** "+ New Contact"等按钮不贴边，完整可见

**Files:**
- Modify: `D:\AI-CRM\src\components\Contacts.jsx`
- Modify: `D:\AI-CRM\src\components\Dashboard.jsx`
- Modify: `D:\AI-CRM\src\styles\index.css`

**Steps:**
1. 逐个检查每个页面的按钮
2. 添加适当的 margin/padding
3. 保存

---

### Task 7: 确保每个页面大卡片四角完整可见
**Objective:** 所有页面的大卡片四个角都不被遮挡

**Files:**
- Modify: `D:\AI-CRM\src\styles\index.css`
- Modify: `D:\AI-CRM\src\components\Page.jsx`

**Steps:**
1. 检查所有页面的卡片布局
2. 调整 padding/margin
3. 保存

---

## 验证步骤
每个任务完成后：
1. 重新编译 webpack
2. 重启服务器
3. 浏览器验证
4. 更新 STEP-LOG.md

## 风险
- 修改可能影响其他功能
- 需要逐个验证

## 开放问题
- 无
