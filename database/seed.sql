-- AI CRM Seed Data
-- Insert sample data for testing
-- Disable foreign keys during seed, re-enable after
PRAGMA foreign_keys = OFF;

-- =============================================
-- 1. USERS
-- =============================================
DELETE FROM users;
INSERT INTO users (username, email, password_hash, role, is_active) VALUES
('Johnn', 'Johnn@admin.com.sg', 'p2bVFBqJ5T4UwvsHpO18Bab2orf16/KJ4s91uAlpeTI=', 'admin', 1);

-- =============================================
-- 2. ACCOUNTS (客户公司) - 8 records
-- =============================================
DELETE FROM accounts;
INSERT INTO accounts (company_name, industry, country, city, website, phone, employees, annual_revenue, notes) VALUES
('Marina Bay Hotels', 'Hospitality', 'Singapore', 'Marina Bay', 'marinabayhotels.com', '+65 6888 8888', 500, 50000000, 'Premium hotel chain, digital signage solution'),
('Orchard Retail Group', 'Retail', 'Singapore', 'Orchard', 'orchardretail.com', '+65 6738 8888', 200, 25000000, 'IPTV system for retail stores'),
('TechVision Solutions', 'Technology', 'Singapore', 'Raffles Place', 'techvision.com', '+65 6536 8888', 150, 15000000, 'AV integration partner'),
('Grand Pacific Resorts', 'Hospitality', 'Singapore', 'Sentosa', 'grandpacific.com', '+65 6275 8888', 350, 35000000, 'Resort with 200 rooms'),
('City Medical Centre', 'Healthcare', 'Singapore', 'Novena', 'citymedical.com', '+65 6394 8888', 800, 80000000, 'Hospital waiting area signage'),
('Singapore Finance Hub', 'Finance', 'Singapore', 'Shenton Way', 'sgfinance.com', '+65 6530 8888', 400, 60000000, 'Corporate lobby display'),
('Eastern Manufacturing', 'Manufacturing', 'Singapore', 'Tuas', 'easternmfg.com', '+65 6861 8888', 600, 45000000, 'Factory monitoring displays'),
('West Coast Education', 'Education', 'Singapore', 'Clementi', 'westcoastedu.com', '+65 6774 8888', 120, 8000000, 'Campus-wide IPTV');

-- =============================================
-- 3. CONTACTS (联系人) - 9 records
-- =============================================
DELETE FROM contacts;
INSERT INTO contacts (account_id, first_name, last_name, position, email, phone, decision_maker, influence_level, notes) VALUES
(1, 'Tan', 'Wei Ming', 'IT Director', 'weiming@marinabayhotels.com', '+65 9123 4567', 1, 5, 'Key decision maker'),
(1, 'Sarah', 'Lim', 'Operations Manager', 'sarah@marinabayhotels.com', '+65 9234 5678', 0, 3, 'Day-to-day operations'),
(2, 'Rajesh', 'Kumar', 'General Manager', 'rajesh@orchardretail.com', '+65 9345 6789', 1, 4, 'Budget holder'),
(3, 'David', 'Chen', 'CTO', 'david@techvision.com', '+65 9456 7890', 1, 5, 'Technical partner'),
(4, 'Michelle', 'Wong', 'Facilities Manager', 'michelle@grandpacific.com', '+65 9567 8901', 1, 4, 'Resort facilities'),
(5, 'Lim', 'Swee Hock', 'Medical Director', 'sweehock@citymedical.com', '+65 9678 9012', 1, 5, 'Project sponsor'),
(6, 'James', 'Ng', 'CFO', 'james@sgfinance.com', '+65 9789 0123', 1, 5, 'Final budget approval'),
(7, 'Ahmad', 'Ismail', 'Plant Manager', 'ahmad@easternmfg.com', '+65 9890 1234', 1, 4, 'Factory operations'),
(8, 'Lee', 'Kok Wai', 'Dean', 'kokwai@westcoastedu.com', '+65 9012 3456', 1, 4, 'Academic decision maker');

-- =============================================
-- 4. LEADS (潜在客户) - 5 records
-- =============================================
DELETE FROM leads;
INSERT INTO leads (company_name, contact_name, email, phone, source, status, score, notes) VALUES
('Jewel Airport Services', 'Michael Tan', 'michael@jewelairport.com', '+65 9111 2222', 'Website', 'Qualified', 75, 'Airport digital displays'),
('VivoCity Mall', 'Jennifer Ho', 'jennifer@vivocity.com', '+65 9222 3333', 'Referral', 'Contacted', 60, 'Large mall project'),
('Resorts World Sentosa', 'Peter Goh', 'peter@rwsentosa.com', '+65 9333 4444', 'Trade Show', 'Proposal', 85, 'Proposal sent last week'),
('Changi Airport Group', 'Alice Wong', 'alice@changiairport.com', '+65 9444 5555', 'Cold Call', 'New', 40, 'Initial contact'),
('National Gallery', 'Robert Teo', 'robert@nationalgallery.sg', '+65 9555 6666', 'Website', 'Negotiation', 90, 'Final negotiation');

-- =============================================
-- 5. OPPORTUNITIES (商机) - 7 records
-- =============================================
DELETE FROM opportunities;
INSERT INTO opportunities (account_id, contact_id, name, value, probability, stage, expected_close_date, notes) VALUES
(1, 1, 'Marina Bay Digital Signage', 250000, 75, 'Proposal', '2025-07-15', 'Proposal sent'),
(2, 3, 'Orchard Retail IPTV', 180000, 60, 'Negotiation', '2025-08-01', 'Negotiating pricing'),
(4, 4, 'Grand Pacific AV System', 450000, 40, 'Qualification', '2025-09-30', 'Early stage'),
(5, 5, 'City Medical Waiting Area', 120000, 85, 'Negotiation', '2025-06-30', 'Almost closed'),
(6, 6, 'Finance Hub Lobby Display', 80000, 50, 'Proposal', '2025-08-15', 'Under review'),
(7, 7, 'Eastern Mfg Monitoring', 200000, 30, 'Discovery', '2025-10-01', 'Just started'),
(8, 8, 'West Coast Campus IPTV', 350000, 65, 'Proposal', '2025-07-30', 'Tech team approved');

-- =============================================
-- 6. ACTIVITIES (跟进记录) - 10 records
-- =============================================
DELETE FROM activities;
INSERT INTO activities (account_id, contact_id, opportunity_id, type, subject, description, date, duration, next_action, next_action_date) VALUES
(1, 1, 1, 'Meeting', 'Product Demo at Marina Bay', 'Demonstrated digital signage solution', '2025-06-01', 120, 'Follow up with proposal', '2025-06-08'),
(1, 1, 1, 'Email', 'Sent proposal document', 'Emailed detailed proposal', '2025-06-03', 0, 'Wait for feedback', '2025-06-10'),
(2, 3, 2, 'Call', 'Follow-up call with Rajesh', 'Discussed IPTV requirements', '2025-06-05', 30, 'Schedule site visit', '2025-06-12'),
(4, 4, 3, 'Site Visit', 'Grand Pacific site survey', 'Assessed AV requirements', '2025-06-08', 180, 'Prepare quote', '2025-06-15'),
(5, 5, 4, 'Meeting', 'Contract review meeting', 'Reviewed contract terms', '2025-06-10', 60, 'Finalize contract', '2025-06-17'),
(6, 6, 5, 'Email', 'Proposal submission', 'Submitted lobby display proposal', '2025-06-12', 0, 'Follow up next week', '2025-06-19'),
(7, 7, 6, 'Call', 'Initial discussion with Ahmad', 'Discussed factory monitoring', '2025-06-14', 45, 'Send technical specs', '2025-06-21'),
(8, 8, 7, 'Meeting', 'Campus tour', 'Toured campus for IPTV planning', '2025-06-15', 90, 'Draft proposal', '2025-06-22'),
(3, 3, NULL, 'WhatsApp', 'Quick check-in', 'Partner program update', '2025-06-16', 0, NULL, NULL),
(1, 2, 1, 'Note', 'Internal notes', 'Budget approval expected end of month', '2025-06-16', 0, 'Check budget status', '2025-06-30');

-- =============================================
-- 7. TASKS (待办事项) - 8 records
-- =============================================
DELETE FROM tasks;
INSERT INTO tasks (account_id, opportunity_id, title, due_date, priority, status, assigned_to) VALUES
(1, 1, 'Prepare Marina Bay quote', '2025-06-20', 'High', 'In Progress', 'Johnn'),
(2, 2, 'Schedule Orchard site visit', '2025-06-18', 'High', 'Not Started', 'Johnn'),
(4, 3, 'Grand Pacific survey report', '2025-06-25', 'Medium', 'Not Started', 'Johnn'),
(5, 4, 'City Medical contract finalization', '2025-06-22', 'Urgent', 'In Progress', 'Johnn'),
(6, 5, 'Finance Hub follow-up', '2025-06-19', 'Medium', 'Not Started', 'Johnn'),
(NULL, NULL, 'Update product catalog', '2025-06-30', 'Low', 'Not Started', 'Johnn'),
(NULL, NULL, 'Team meeting', '2025-06-20', 'Medium', 'Not Started', 'Johnn'),
(7, 6, 'Eastern Mfg technical specs', '2025-06-28', 'Medium', 'Not Started', 'Johnn');

-- =============================================
-- 8. QUOTES (报价) - 6 records
-- =============================================
DELETE FROM quotes;
INSERT INTO quotes (account_id, opportunity_id, quote_no, amount, discount, tax, total, status, valid_until, notes) VALUES
(1, 1, 'QT-2025-001', 250000, 10, 17500, 242500, 'Sent', '2025-07-15', 'Digital signage 3 properties'),
(2, 2, 'QT-2025-002', 180000, 5, 12600, 183600, 'Sent', '2025-07-30', 'IPTV 15 outlets'),
(4, 3, 'QT-2025-003', 450000, 15, 31500, 406500, 'Draft', '2025-08-30', 'Full AV solution'),
(5, 4, 'QT-2025-004', 120000, 0, 8400, 128400, 'Accepted', '2025-06-30', 'Waiting area displays'),
(6, 5, 'QT-2025-005', 80000, 5, 5600, 81600, 'Sent', '2025-07-15', 'Lobby display'),
(8, 7, 'QT-2025-006', 350000, 10, 24500, 339500, 'Sent', '2025-07-30', 'Campus IPTV');

-- =============================================
-- 9. ORDERS (订单) - 5 records
-- =============================================
DELETE FROM orders;
INSERT INTO orders (account_id, opportunity_id, quote_id, order_no, amount, status, delivery_date, notes) VALUES
(5, 4, 4, 'ORD-2025-001', 128400, 'Confirmed', '2025-07-15', 'City Medical - confirmed'),
(1, 1, 1, 'ORD-2025-002', 242500, 'Pending', '2025-08-01', 'Marina Bay - awaiting deposit'),
(2, 2, 2, 'ORD-2025-003', 183600, 'Pending', '2025-08-15', 'Orchard - awaiting signature'),
(6, 5, 5, 'ORD-2025-004', 81600, 'Delivered', '2025-06-10', 'Finance Hub - completed'),
(8, 7, 6, 'ORD-2025-005', 339500, 'Pending', '2025-09-01', 'West Coast - awaiting approval');

-- =============================================
-- 10. PRODUCTS (产品库) - 10 records
-- =============================================
DELETE FROM products;
INSERT INTO products (name, sku, category, cost, selling_price, stock, unit) VALUES
('55 inch Commercial Display', 'DISP-55-4K', 'Display', 800, 1200, 50, 'Unit'),
('65 inch Touch Panel', 'TOUCH-65-4K', 'Display', 1500, 2500, 30, 'Unit'),
('4K Media Player', 'MEDIA-4K-01', 'Player', 200, 350, 100, 'Unit'),
('IPTV Encoder', 'IPTV-ENC-01', 'IPTV', 500, 800, 25, 'Unit'),
('IPTV Set-Top Box', 'IPTV-STB-01', 'IPTV', 80, 150, 200, 'Unit'),
('Signage Software License', 'SW-DS-1YR', 'Software', 0, 500, 999, 'License'),
('Video Wall Controller', 'VWALL-CTRL', 'Controller', 2000, 3500, 10, 'Unit'),
('Ceiling Speaker', 'SPEAK-CEIL', 'Audio', 50, 100, 100, 'Unit'),
('AV Receiver 8CH', 'AVR-8CH-01', 'Audio', 300, 500, 40, 'Unit'),
('HDMI Extender 100m', 'HDMI-EXT-100', 'Accessory', 100, 200, 80, 'Unit');

-- =============================================
-- 11. CASES (客户问题) - 3 records
-- =============================================
DELETE FROM cases;
INSERT INTO cases (account_id, contact_id, case_no, subject, priority, status, resolution) VALUES
(5, 5, 'CS-2025-001', 'Display flickering issue', 'High', 'Resolved', 'Replaced faulty unit under warranty'),
(6, 6, 'CS-2025-002', 'Remote control not working', 'Medium', 'In Progress', NULL),
(1, 1, 'CS-2025-003', 'Content update request', 'Low', 'New', NULL);

-- =============================================
-- 12. DOCUMENTS (文档) - 6 records
-- =============================================
DELETE FROM documents;
INSERT INTO documents (account_id, opportunity_id, name, file_path, file_size, file_type, category) VALUES
(1, 1, 'Marina Bay Proposal.pdf', '/docs/proposals/marina_bay_2025.pdf', 2048000, 'application/pdf', 'Proposal'),
(1, 1, 'Site Survey Photos.zip', '/docs/surveys/marina_bay_photos.zip', 15360000, 'application/zip', 'Survey'),
(2, 2, 'Orchard Layout.dwg', '/docs/drawings/orchard_layout.dwg', 5120000, 'application/acad', 'Drawing'),
(5, 4, 'City Medical Contract.pdf', '/docs/contracts/city_medical_2025.pdf', 1024000, 'application/pdf', 'Contract'),
(NULL, NULL, 'Product Catalog 2025.pdf', '/docs/products/catalog_2025.pdf', 8192000, 'application/pdf', 'Marketing'),
(NULL, NULL, 'Company Profile.pdf', '/docs/company/profile.pdf', 3072000, 'application/pdf', 'Marketing');

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;
