-- AI CRM Database Schema
-- Core Tables: Users, Accounts, Contacts, Leads, Opportunities, Activities, Tasks, Quotes, Quote Items, Orders, Products, Cases, Documents, Contracts, Invoices, Communications, Meetings

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- =============================================
-- 0. USERS (系统用户)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 0b. REFRESH TOKENS (JWT 刷新令牌)
-- =============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- =============================================
-- 1. ACCOUNTS (客户公司)
-- =============================================
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    industry TEXT,
    country TEXT DEFAULT 'Singapore',
    city TEXT,
    address TEXT,
    postal_code TEXT,
    website TEXT,
    phone TEXT,
    employees INTEGER,
    annual_revenue REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 2. CONTACTS (联系人)
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    position TEXT,
    department TEXT,
    email TEXT,
    phone TEXT,
    linkedin TEXT,
    decision_maker INTEGER DEFAULT 0,
    influence_level INTEGER DEFAULT 3 CHECK(influence_level BETWEEN 1 AND 5),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 3. LEADS (潜在客户)
-- =============================================
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    source TEXT,
    status TEXT DEFAULT 'New' CHECK(status IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')),
    score INTEGER DEFAULT 0 CHECK(score BETWEEN 0 AND 100),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 4. OPPORTUNITIES (商机)
-- =============================================
CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    value REAL DEFAULT 0,
    probability INTEGER DEFAULT 0 CHECK(probability BETWEEN 0 AND 100),
    stage TEXT DEFAULT 'Discovery' CHECK(stage IN ('Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost')),
    competitor TEXT,
    expected_close_date TEXT,
    actual_close_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 5. ACTIVITIES (跟进记录)
-- =============================================
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
    type TEXT CHECK(type IN ('Call', 'Email', 'Meeting', 'WhatsApp', 'Site Visit', 'Note')),
    subject TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    next_action TEXT,
    next_action_date TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 6. TASKS (待办事项)
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT DEFAULT 'Not Started' CHECK(status IN ('Not Started', 'In Progress', 'Completed', 'Cancelled')),
    assigned_to TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 7. QUOTES (报价)
-- =============================================
CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
    quote_no TEXT UNIQUE,
    amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL DEFAULT 0,
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Draft' CHECK(status IN ('Draft', 'Sent', 'Revised', 'Accepted', 'Rejected')),
    valid_until TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 8. QUOTE ITEMS (报价明细)
-- =============================================
CREATE TABLE IF NOT EXISTS quote_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL DEFAULT 0
);

-- =============================================
-- 9. ORDERS (订单)
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
    order_no TEXT UNIQUE,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Confirmed', 'Delivered', 'Cancelled')),
    delivery_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 10. PRODUCTS (产品库)
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    description TEXT,
    cost REAL DEFAULT 0,
    selling_price REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'Unit',
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 11. CASES (客户问题/售后)
-- =============================================
CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    case_no TEXT UNIQUE,
    subject TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT DEFAULT 'New' CHECK(status IN ('New', 'In Progress', 'Resolved', 'Closed')),
    resolution TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 12. DOCUMENTS (文档)
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    file_type TEXT,
    category TEXT,
    uploaded_by TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- INDEXES (性能优化)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_account ON opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_activities_account ON activities(account_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_tasks_account ON tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_cases_account ON cases(account_id);
CREATE INDEX IF NOT EXISTS idx_documents_account ON documents(account_id);
CREATE INDEX IF NOT EXISTS idx_quotes_account ON quotes(account_id);
CREATE INDEX IF NOT EXISTS idx_orders_account ON orders(account_id);

-- =============================================
-- 13. CONTRACTS (合同)
-- =============================================
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    contract_number TEXT,
    title TEXT NOT NULL,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft' CHECK(status IN ('Draft', 'Sent', 'Signed', 'Expired', 'Cancelled')),
    signed_date TEXT,
    expired_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 14. INVOICES (发票)
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    invoice_number TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Sent', 'Paid', 'Overdue', 'Cancelled')),
    issued_date TEXT,
    due_date TEXT,
    paid_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 15. COMMUNICATIONS (沟通记录)
-- =============================================
CREATE TABLE IF NOT EXISTS communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    type TEXT DEFAULT 'Note' CHECK(type IN ('Call', 'Email', 'Meeting', 'WhatsApp', 'Note', 'Other')),
    subject TEXT,
    content TEXT,
    date TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- 16. MEETINGS (会议)
-- =============================================
CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TEXT,
    duration INTEGER DEFAULT 60,
    location TEXT,
    attendees TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- =============================================
-- INDEXES (性能优化)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_contracts_account ON contracts(account_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_communications_account ON communications(account_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(type);
CREATE INDEX IF NOT EXISTS idx_meetings_account ON meetings(account_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings(scheduled_at);

-- =============================================
-- 18. ACCOUNT NOTES (账户备注)
-- =============================================
CREATE TABLE IF NOT EXISTS account_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('general', 'preference', 'decision_maker', 'pain_point', 'competitor', 'budget', 'timeline', 'personal')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    importance TEXT DEFAULT 'medium' CHECK(importance IN ('low', 'medium', 'high', 'critical')),
    is_pinned INTEGER DEFAULT 0,
    created_by TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now', '+8 hours')),
    updated_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX IF NOT EXISTS idx_account_notes_account ON account_notes(account_id);
CREATE INDEX IF NOT EXISTS idx_account_notes_category ON account_notes(category);
CREATE INDEX IF NOT EXISTS idx_account_notes_pinned ON account_notes(is_pinned);

-- =============================================
-- 19. ACTIVITY LOG (活动时间线)
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK(type IN ('call', 'email', 'meeting', 'whatsapp', 'note', 'visit', 'system')),
    direction TEXT DEFAULT 'outbound' CHECK(direction IN ('inbound', 'outbound')),
    subject TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 0,
    next_follow_up TEXT,
    next_action TEXT,
    attachments TEXT,
    created_by TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now', '+8 hours')),
    updated_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX IF NOT EXISTS idx_activity_log_account ON activity_log(account_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at);

-- =============================================
-- NOTE: duplicate v2 QUOTES definition removed — v1 in section 7 is authoritative (server code uses quote_no).

-- =============================================
-- NOTE: duplicate v2 QUOTE ITEMS definition removed — v1 in section 8 is authoritative.

-- =============================================
-- NOTE: duplicate v2 PRODUCTS definition removed — v1 in section 10 is authoritative (server code uses cost/selling_price/stock).

-- =============================================
-- 23. PR REQUESTS (采购申请单)
-- =============================================
CREATE TABLE IF NOT EXISTS pr_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pr_number TEXT NOT NULL UNIQUE,
    account_id INTEGER REFERENCES accounts(id),
    requester TEXT NOT NULL,
    department TEXT,
    type TEXT DEFAULT 'equipment' CHECK(type IN ('equipment', 'service', 'other')),
    budget REAL,
    justification TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending_approval', 'approved', 'rejected', 'procurement', 'completed')),
    created_by TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now', '+8 hours')),
    updated_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX IF NOT EXISTS idx_pr_requests_status ON pr_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_requests_number ON pr_requests(pr_number);

-- =============================================
-- 24. PR REQUEST ITEMS (采购申请物品明细)
-- =============================================
CREATE TABLE IF NOT EXISTS pr_request_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pr_request_id INTEGER NOT NULL REFERENCES pr_requests(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit_price REAL,
    total_price REAL
);
CREATE INDEX IF NOT EXISTS idx_pr_items_pr ON pr_request_items(pr_request_id);

-- =============================================
-- 25. EQUIPMENT LOANS (设备借用单)
-- =============================================
CREATE TABLE IF NOT EXISTS equipment_loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_number TEXT NOT NULL UNIQUE,
    account_id INTEGER REFERENCES accounts(id),
    borrower_name TEXT NOT NULL,
    borrower_contact TEXT,
    loan_type TEXT DEFAULT 'demo' CHECK(loan_type IN ('internal', 'demo', 'other')),
    purpose TEXT,
    loan_start_date TEXT,
    estimated_return_date TEXT,
    actual_return_date TEXT,
    condition_on_checkout TEXT,
    condition_on_return TEXT,
    damage_report TEXT,
    status TEXT DEFAULT 'requested' CHECK(status IN ('requested', 'approved', 'checked_out', 'returned', 'inspected')),
    created_by TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now', '+8 hours')),
    updated_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX IF NOT EXISTS idx_equip_loans_status ON equipment_loans(status);
CREATE INDEX IF NOT EXISTS idx_equip_loans_number ON equipment_loans(loan_number);

-- =============================================
-- 26. LOAN ITEMS (借用物品明细)
-- =============================================
CREATE TABLE IF NOT EXISTS loan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_loan_id INTEGER NOT NULL REFERENCES equipment_loans(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    serial_number TEXT
);
CREATE INDEX IF NOT EXISTS idx_loan_items_loan ON loan_items(equipment_loan_id);

-- =============================================
-- 27. TEMPLATES (文档模板)
-- =============================================
CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('quotation', 'pr_request', 'equipment_loan', 'contract', 'invoice')),
    content TEXT NOT NULL,
    variables TEXT,
    is_active INTEGER DEFAULT 1,
    created_by TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now', '+8 hours')),
    updated_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);

-- =============================================
-- 28. APPROVAL WORKFLOWS (审批流程)
-- =============================================
CREATE TABLE IF NOT EXISTS approval_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('quotation', 'pr_request', 'equipment_loan')),
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX IF NOT EXISTS idx_approval_wf_entity ON approval_workflows(entity_type);

-- =============================================
-- 29. APPROVAL STEPS (审批步骤)
-- =============================================
CREATE TABLE IF NOT EXISTS approval_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_role TEXT NOT NULL,
    approver_user_id TEXT,
    is_required INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_approval_steps_workflow ON approval_steps(workflow_id);

-- =============================================
-- 30. APPROVAL RECORDS (审批记录)
-- =============================================
CREATE TABLE IF NOT EXISTS approval_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id),
    entity_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    step_id INTEGER NOT NULL REFERENCES approval_steps(id),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    approved_by TEXT,
    approved_at TEXT,
    created_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX IF NOT EXISTS idx_approval_records_entity ON approval_records(entity_id, entity_type);

-- =============================================
-- 31. AUDIT LOGS (审计日志)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);

-- =============================================
-- 32. SYSTEM SETTINGS (系统设置)
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at TEXT DEFAULT (datetime('now', '+8 hours'))
);

-- Seed system settings
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
('company_name', 'Prestige Solutions Pte Ltd', 'Company display name'),
('company_address', '123 Business Street, Singapore 123456', 'Company address'),
('company_phone', '+65 1234 5678', 'Company phone'),
('company_email', 'admin@prestigecrm.com.sg', 'Company email'),
('default_currency', 'SGD', 'Default currency'),
('default_timezone', 'Asia/Singapore', 'Default timezone'),
('tax_rate', '9', 'GST rate (%)'),
('logo_url', '', 'Company logo URL');

-- Seed sample products (v1 columns: cost / selling_price / stock)
INSERT OR IGNORE INTO products (sku, name, description, category, selling_price, cost, stock) VALUES
('ELEC-001', 'Industrial Sensor Module A1', 'High-precision temperature sensor for industrial use', 'Electronics', 150.00, 80.00, 500),
('ELEC-002', 'Control Board X200', 'Multi-channel control board for automation', 'Electronics', 320.00, 180.00, 200),
('MECH-001', 'Hydraulic Pump HP-500', 'Heavy-duty hydraulic pump for construction equipment', 'Mechanical', 2500.00, 1500.00, 50),
('MECH-002', 'Precision Bearing PB-100', 'High-speed precision bearing', 'Mechanical', 45.00, 20.00, 1000),
('SW-001', 'CRM License - Enterprise', 'Annual enterprise license for Prestige CRM', 'Software', 5000.00, 500.00, 999),
('SW-002', 'API Integration Package', 'One-time API integration service', 'Software', 3000.00, 800.00, 999);
