import React, { useState, useEffect } from 'react';
import { Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  ApartmentOutlined,
  TeamOutlined,
  AimOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  CalendarOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  CheckSquareOutlined,
  FolderOutlined,
  AreaChartOutlined,
  BellOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
  ToolOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLanguage } from '../i18n';

const { Text } = Typography;

// Hover-only scrollbar — 6px wide, visible on hover
const scrollbarCSS = `
  /* Sidebar nav scrollbar — show only when hovering INSIDE the nav area */
  .sidebar-nav::-webkit-scrollbar { width: 5px; }
  .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
  .sidebar-nav::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
    transition: background 0.15s ease;
  }
  .sidebar-nav:hover::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.35);
  }
  /* Hide scrollbar when mouse leaves sidebar entirely */
  .sidebar-container:hover .sidebar-nav::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.35);
  }
  .sidebar-container:not(:hover) .sidebar-nav::-webkit-scrollbar-thumb {
    background: transparent;
  }
  /* Same thin hover scrollbar for card tables */
  .dash-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .dash-scroll::-webkit-scrollbar-track { background: transparent; }
  .dash-scroll::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
    transition: background 0.15s ease;
  }
  .dash-scroll:hover::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.3);
  }
  .dash-scroll .ant-table-body::-webkit-scrollbar { width: 5px; height: 5px; }
  .dash-scroll .ant-table-body::-webkit-scrollbar-track { background: transparent; }
  .dash-scroll .ant-table-body::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
    transition: background 0.15s ease;
  }
  .dash-scroll .ant-table-body:hover::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.3);
  }
`;
// Translation map for sidebar
const sidebarLabels = {
  en: {
    main: 'Main',
    sales: 'Sales',
    operations: 'Operations',
    planning: 'Planning',
    management: 'Management',
    system: 'System',
    dashboard: 'Dashboard',
    accounts: 'Accounts',
    contacts: 'Contacts',
    leads: 'Leads',
    opportunities: 'Opportunities',
    orders: 'Orders',
    products: 'Products',
    quotes: 'Quotes',
    quotationBuilder: 'Quotation Builder',
    contracts: 'Contracts',
    invoices: 'Invoices',
    prRequests: 'PR Requests',
    equipmentLoans: 'Equipment Loans',
    documents: 'Documents',
    importExport: 'Import/Export',
    activities: 'Activities',
    tasks: 'Tasks',
    meetings: 'Meetings',
    communications: 'Communications',
    templates: 'Templates',
    approvalWorkflows: 'Approval Workflows',
    notifications: 'Notifications',
    reports: 'Reports',
    auditLogs: 'Audit Logs',
    settings: 'Settings',
  },
  zh: {
    main: '主菜单',
    sales: '销售',
    operations: '运营',
    planning: '计划',
    management: '管理',
    system: '系统',
    dashboard: '仪表盘',
    accounts: '客户管理',
    contacts: '联系人',
    leads: '线索',
    opportunities: '商机',
    orders: '订单',
    products: '产品',
    quotes: '报价单',
    quotationBuilder: '报价构建器',
    contracts: '合同',
    invoices: '发票',
    prRequests: '采购申请',
    equipmentLoans: '设备借出',
    documents: '附件',
    importExport: '导入/导出',
    activities: '活动',
    tasks: '任务',
    meetings: '会议',
    communications: '沟通记录',
    templates: '模板',
    approvalWorkflows: '审批流程',
    notifications: '通知',
    reports: '报表',
    auditLogs: '审计日志',
    settings: '系统设置',
  },
};

const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const labels = sidebarLabels[lang] || sidebarLabels.en;

  const menuSections = [
    {
      label: labels.main,
      items: [
        { key: '/dashboard', icon: <DashboardOutlined />, label: labels.dashboard },
        { key: '/accounts', icon: <ApartmentOutlined />, label: labels.accounts },
        { key: '/contacts', icon: <TeamOutlined />, label: labels.contacts },
        { key: '/leads', icon: <AimOutlined />, label: labels.leads },
        { key: '/opportunities', icon: <ShoppingCartOutlined />, label: labels.opportunities },
      ],
    },
    {
      label: labels.sales,
      items: [
        { key: '/orders', icon: <FileTextOutlined />, label: labels.orders },
        { key: '/products', icon: <ShoppingCartOutlined />, label: labels.products },
        { key: '/quotes', icon: <FileTextOutlined />, label: labels.quotes },
        { key: '/quotation-builder', icon: <FileTextOutlined />, label: labels.quotationBuilder },
        { key: '/contracts', icon: <FileTextOutlined />, label: labels.contracts },
        { key: '/invoices', icon: <FileTextOutlined />, label: labels.invoices },
      ],
    },
    {
      label: labels.operations,
      items: [
        { key: '/pr-requests', icon: <FileTextOutlined />, label: labels.prRequests },
        { key: '/equipment-loans', icon: <ToolOutlined />, label: labels.equipmentLoans },
        { key: '/documents', icon: <FolderOutlined />, label: labels.documents },
        { key: '/import-export', icon: <DownloadOutlined />, label: labels.importExport },
      ],
    },
    {
      label: labels.planning,
      items: [
        { key: '/activities', icon: <CalendarOutlined />, label: labels.activities },
        { key: '/tasks', icon: <CheckSquareOutlined />, label: labels.tasks },
        { key: '/meetings', icon: <VideoCameraOutlined />, label: labels.meetings },
        { key: '/communications', icon: <MessageOutlined />, label: labels.communications },
      ],
    },
    {
      label: labels.management,
      items: [
        { key: '/templates', icon: <FileTextOutlined />, label: labels.templates },
        { key: '/approval-workflows', icon: <SolutionOutlined />, label: labels.approvalWorkflows },
        { key: '/notifications', icon: <BellOutlined />, label: labels.notifications },
        { key: '/reports', icon: <AreaChartOutlined />, label: labels.reports },
        { key: '/audit-logs', icon: <SafetyCertificateOutlined />, label: labels.auditLogs },
      ],
    },
    {
      label: labels.system,
      items: [
        { key: '/settings', icon: <SettingOutlined />, label: labels.settings },
      ],
    },
  ];

  const menuItems = [];
  menuSections.forEach(section => {
    menuItems.push({
      type: 'group',
      label: collapsed ? null : (
        <span style={{ fontSize: 11, color: '#8899aa', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', padding: '16px 24px 6px 24px', display: 'block' }}>
          {section.label}
        </span>
      ),
      children: section.items,
    });
  });

  const logoHeight = collapsed ? 48 : 60;

  return (
    <>
      <style>{scrollbarCSS}</style>
      <div style={{
        width: collapsed ? 64 : 200,
        height: '100vh',
        background: '#0A1628',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }} className="sidebar-container">
        {/* Brand */}
        <div style={{
          height: logoHeight,
          padding: collapsed ? '10px 0' : '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #003DA5, #0073CF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}>
            PS
          </div>
          {!collapsed && (
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Prestige CRM</div>
              <div style={{ fontSize: 10, color: 'rgba(180, 200, 240, 0.6)', letterSpacing: 0.3, marginTop: 1 }}>Enterprise Edition</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflow: 'auto' }} className="sidebar-nav">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            theme="dark"
            style={{
              background: 'transparent',
              borderRight: 'none',
              paddingLeft: 0,
              fontSize: 14,
            }}
            onSelect={({ key }) => navigate(key)}
            inlineCollapsed={collapsed}
            items={menuItems}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: collapsed ? '6px 0' : '6px 14px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 14,
          color: '#8899aa',
          textAlign: 'center',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
        }}>
          {!collapsed && 'v2.0.0'}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
