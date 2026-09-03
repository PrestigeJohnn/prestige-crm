# AI CRM — Final Verification Checklist

> Last updated: 2026-06-19

---

## 1. Page Loading (12 Pages)

| # | Page | Route/Selector | Status | Notes |
|---|------|----------------|--------|-------|
| 1 | Dashboard | `data-page="dashboard"` | ☐ | KPI cards, charts, recent activity |
| 2 | Accounts | `data-page="accounts"` | ☐ | Data table with CRUD |
| 3 | Contacts | `data-page="contacts"` | ☐ | Data table with CRUD |
| 4 | Leads | `data-page="leads"` | ☐ | Kanban board view |
| 5 | Opportunities | `data-page="opportunities"` | ☐ | Pipeline view |
| 6 | Activities | `data-page="activities"` | ☐ | Activity timeline |
| 7 | Tasks | `data-page="tasks"` | ☐ | Task list with status |
| 8 | Quotes | `data-page="quotes"` | ☐ | Quote builder |
| 9 | Orders | `data-page="orders"` | ☐ | Order management |
| 10 | Products | `data-page="products"` | ☐ | Product catalog |
| 11 | Cases | `data-page="cases"` | ☐ | Support case list |
| 12 | Documents | `data-page="documents"` | ☐ | Document manager |
| 13 | Settings | `data-page="settings"` | ☐ | Theme, notifications, sidebar |

### How to verify
1. Open http://localhost:3002
2. Click each nav item in the sidebar
3. Confirm the page title updates and content renders without errors
4. Check browser console for JS errors

---

## 2. CRUD Operations

### Accounts
| Operation | Steps | Status |
|-----------|-------|--------|
| Create | Click "New Account" → fill form → Save | ☐ |
| Read | Click account name in table → detail view | ☐ |
| Update | Click Edit → modify fields → Save | ☐ |
| Delete | Click Delete → confirm → verify removed | ☐ |

### Contacts
| Operation | Steps | Status |
|-----------|-------|--------|
| Create | Click "New Contact" → fill form → Save | ☐ |
| Read | Click contact name → detail view | ☐ |
| Update | Click Edit → modify fields → Save | ☐ |
| Delete | Click Delete → confirm → verify removed | ☐ |

### Leads
| Operation | Steps | Status |
|-----------|-------|--------|
| Create | Click "New Lead" → fill form → Save | ☐ |
| Read | Click lead in Kanban → detail view | ☐ |
| Update | Drag to new status or Edit form | ☐ |
| Delete | Click Delete → confirm → verify removed | ☐ |

### Opportunities
| Operation | Steps | Status |
|-----------|-------|--------|
| Create | Click "New Opportunity" → fill form → Save | ☐ |
| Read | Click opportunity → detail view | ☐ |
| Update | Click Edit → modify fields → Save | ☐ |
| Delete | Click Delete → confirm → verify removed | ☐ |

### All Remaining Modules
| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Activities | ☐ | ☐ | ☐ | ☐ |
| Tasks | ☐ | ☐ | ☐ | ☐ |
| Quotes | ☐ | ☐ | ☐ | ☐ |
| Orders | ☐ | ☐ | ☐ | ☐ |
| Products | ☐ | ☐ | ☐ | ☐ |
| Cases | ☐ | ☐ | ☐ | ☐ |
| Documents | ☐ | ☐ | ☐ | ☐ |

---

## 3. Search Function

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Global search | Type in topbar search → results dropdown | Matching records appear | ☐ |
| Search accounts | Type "Acme" | Account results shown | ☐ |
| Search contacts | Type "John" | Contact results shown | ☐ |
| Search deals | Type "Q4" | Opportunity results shown | ☐ |
| Clear search | Clear input | Results disappear | ☐ |
| No results | Type "zzzzz" | "No results" message | ☐ |

---

## 4. Notification Function

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Notification bell | Click bell icon | Notification panel opens | ☐ |
| Badge count | Create a task → check badge | Badge number updates | ☐ |
| Mark as read | Click notification | Notification marked read | ☐ |
| Filter notifications | Click filter tabs | Filtered list shown | ☐ |
| Real-time toast | Perform CRUD action | Toast message appears | ☐ |
| Dismiss toast | Wait 5s or click X | Toast disappears | ☐ |

---

## 5. Theme Switching

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Open theme picker | Click theme button in settings | Theme options shown | ☐ |
| Switch to Dark | Select Dark theme | UI changes to dark mode | ☐ |
| Switch to Light | Select Light theme | UI changes to light mode | ☐ |
| Switch to Ocean | Select Ocean theme | UI changes to ocean theme | ☐ |
| Switch to Forest | Select Forest theme | UI changes to forest theme | ☐ |
| Persistence | Refresh page | Theme stays the same | ☐ |

---

## 6. Data Export

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Export Accounts | Accounts page → Export | CSV/JSON file downloaded | ☐ |
| Export Contacts | Contacts page → Export | CSV/JSON file downloaded | ☐ |
| Export Leads | Leads page → Export | CSV/JSON file downloaded | ☐ |
| Export Opportunities | Opportunities page → Export | CSV/JSON file downloaded | ☐ |
| Export format | Open downloaded file | Valid CSV/JSON data | ☐ |

---

## 7. Responsive Layout

### Mobile (<= 768px)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Sidebar hidden | Resize to 768px wide | Sidebar not visible | ☐ |
| Menu button | Click hamburger icon | Sidebar slides in | ☐ |
| Overlay | Sidebar open → click overlay | Sidebar closes | ☐ |
| Body scroll lock | Sidebar open → scroll body | Background doesn't scroll | ☐ |
| KPI cards | View dashboard | Single column cards | ☐ |
| Table scroll | View any data table | Horizontally scrollable | ☐ |
| Kanban | View leads page | Single column, scrollable | ☐ |
| Modal fullscreen | Open any form modal | Modal fills entire screen | ☐ |
| Search hidden | Check topbar | Search box not visible | ☐ |
| Collapse btn hidden | Check sidebar | Collapse button not visible | ☐ |

### Tablet (<= 1024px)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Sidebar collapsed | Resize to 900px | Sidebar shows icons only | ☐ |
| KPI 3 columns | View dashboard | 3-column KPI grid | ☐ |
| Hover sidebar | Hover over collapsed sidebar | Sidebar expands | ☐ |
| Table 2 columns | View data cards | 2-column layout | ☐ |

### Desktop (> 1024px)

| Test | Steps | Expected | Status |
|------|-------|----------|--------|
| Full sidebar | Resize to 1200px | Full sidebar visible | ☐ |
| KPI 4 columns | View dashboard | 4-column KPI grid | ☐ |
| Collapse toggle | Click collapse button | Sidebar collapses | ☐ |
| Expand sidebar | Click expand button | Sidebar expands | ☐ |

---

## 8. API Health Check

| Endpoint | Method | Expected | Status |
|----------|--------|----------|--------|
| `/api/health` | GET | `{ success: true, data: { status: "ok" } }` | ☐ |
| `/api/accounts` | GET | Array of accounts | ☐ |
| `/api/contacts` | GET | Array of contacts | ☐ |
| `/api/leads` | GET | Array of leads | ☐ |
| `/api/opportunities` | GET | Array of opportunities | ☐ |
| `/api/dashboard` | GET | Dashboard stats | ☐ |
| `/api/search?q=test` | GET | Search results | ☐ |
| `/api/notifications` | GET | Notification list | ☐ |

---

## 9. Quick Start Verification

| Step | Command/Action | Expected | Status |
|------|---------------|----------|--------|
| 1 | Run `start.bat` | Server starts on port 3002 | ☐ |
| 2 | Open http://localhost:3002 | App loads with dashboard | ☐ |
| 3 | Click Desktop shortcut | App opens in browser | ☐ |
| 4 | Navigate all 12 pages | All pages render correctly | ☐ |
| 5 | Create a record | Record appears in list | ☐ |
| 6 | Search for record | Search returns result | ☐ |
| 7 | Change theme | Theme applies correctly | ☐ |
| 8 | Export data | File downloads | ☐ |

---

## Summary

- **Total checks**: ~80+
- **Passed**: ___
- **Failed**: ___
- **Notes**: _________________________________

---

## How to Run Tests

1. **Start the server**: Double-click `start.bat` or run `node server.js`
2. **Open browser**: Navigate to http://localhost:3002
3. **Go through each section** above, checking off items as you verify
4. **Report any failures** with browser console errors and steps to reproduce
