import React, { useState, useEffect } from 'react';
import { Layout, Input, Dropdown, Avatar, Space, Typography, Select, Button, Popover, Badge, List, Tooltip, Modal, Tag } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  BellOutlined,
  DownOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getLanguage, setLanguage } from '../i18n';
import { useAuthStore } from '../store';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [lang, setLang] = useState(getLanguage());
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New lead assigned', time: '5 min ago', read: false, type: 'lead' },
    { id: 2, title: 'Quotation approved', time: '1 hour ago', read: false, type: 'quote' },
    { id: 3, title: 'Meeting scheduled', time: '3 hours ago', read: true, type: 'meeting' },
    { id: 4, title: 'PR Request pending', time: '5 hours ago', read: true, type: 'pr' },
  ]);

  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const handleLangChange = (newLang) => {
    setLanguage(newLang);
    setLang(newLang);
    window.dispatchEvent(new CustomEvent('language-change'));
  };

  const handleLogout = () => {
    const content = lang === 'zh' ? '确定要退出登录吗？' : 'Are you sure you want to log out?';
    const title = lang === 'zh' ? '退出登录' : 'Confirm Logout';
    const okText = lang === 'zh' ? '确定' : 'Confirm';
    const cancelText = lang === 'zh' ? '取消' : 'Cancel';

    window.openLogoutConfirm = { title, content, okText, cancelText };
    Modal.confirm({
      title,
      content,
      okText,
      cancelText,
      okButtonProps: { danger: true },
      centered: true,
      maskClosable: false,
      onOk: () => {
        logout();
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        window.location.href = '/login';
      },
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const notifPopoverContent = (
    <div style={{ width: 360, maxHeight: 400, overflowY: 'auto', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <Text strong style={{ fontSize: 14 }}>{lang === 'zh' ? '通知' : 'Notifications'}</Text>
        <Text type="secondary" style={{ fontSize: 12, cursor: 'pointer', fontWeight: 500 }} onClick={markAllRead}>
          {lang === 'zh' ? '全部标为已读' : 'Mark all read'}
        </Text>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#999', fontSize: 13 }}>
            {lang === 'zh' ? '暂无通知' : 'No notifications'}
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              style={{
                padding: '10px 0',
                background: item.read ? 'transparent' : '#f0f5ff',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
              onClick={() => setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n))}
              onMouseEnter={(e) => { e.currentTarget.style.background = item.read ? '#fafafa' : '#e6efff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = item.read ? 'transparent' : '#f0f5ff'; }}
            >
              <div style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                background: item.type === 'lead' ? '#e6f7ff' : item.type === 'quote' ? '#f6ffed' : item.type === 'meeting' ? '#fff7e6' : '#fff1f0',
              }}>
                {item.type === 'lead' ? '🔔' : item.type === 'quote' ? '✓' : item.type === 'meeting' ? '📅' : '⚠️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#333', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: '#999' }}>
                  <span>{item.time}</span>
                  <span>•</span>
                  <span>{item.category}</span>
                  {!item.read && (
                    <span style={{
                      background: '#e6f0ff',
                      color: '#1890ff',
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontWeight: 600,
                    }}>
                      {lang === 'zh' ? '新' : 'NEW'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <Button type="link" size="small" onClick={() => navigate('/notifications')} style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 4 }}>
          {lang === 'zh' ? '查看全部通知' : 'View All Notifications'} →
        </Button>
      </div>
    </div>
  );

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: lang === 'zh' ? '个人资料' : 'Profile' },
      { key: 'settings', icon: <SettingOutlined />, label: lang === 'zh' ? '系统设置' : 'Settings' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: lang === 'zh' ? '退出登录' : 'Logout', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'profile') {
        navigate('/profile');
      } else if (key === 'settings') {
        navigate('/settings');
      } else if (key === 'logout') {
        handleLogout();
      }
    },
  };

  return (
    <>
      <AntHeader
        style={{
          height: 56,
          padding: '0 16px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e8e8e8',
          position: 'fixed',
          top: 0,
          right: 0,
          left: collapsed ? 64 : 200,
          zIndex: 100,
          transition: 'left 0.2s ease, width 0.2s ease',
          width: collapsed ? 'calc(100% - 64px)' : 'calc(100% - 200px)',
        }}
      >
        {/* Left: Collapse toggle + Search */}
        <Space size="middle">
          {collapsed ? (
            <MenuUnfoldOutlined onClick={onToggleCollapse} style={{ fontSize: 18, cursor: 'pointer' }} />
          ) : (
            <MenuFoldOutlined onClick={onToggleCollapse} style={{ fontSize: 18, cursor: 'pointer' }} />
          )}
          
          {/* Search bar - full clickable area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f5f5f5',
              borderRadius: 6,
              padding: '0 12px',
              height: 36,
              width: 300,
              cursor: 'text',
              border: '1px solid transparent',
              transition: 'border-color 0.2s',
            }}
            onClick={() => document.getElementById('global-search')?.focus()}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#003DA5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <SearchOutlined style={{ color: '#999', marginRight: 8, fontSize: 14 }} />
            <input
              id="global-search"
              type="text"
              placeholder={lang === 'zh' ? '全局搜索...' : 'Global search...'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('Searching:', searchValue);
                }
              }}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: 13,
                color: '#333',
              }}
            />
          </div>
        </Space>

        {/* Right: Language + Notifications + User */}
        <Space size="middle">
          <Select
            value={lang}
            onChange={handleLangChange}
            style={{ width: 100 }}
            size="small"
            dropdownStyle={{ minWidth: 100 }}
            options={[
              { value: 'en', label: 'English' },
              { value: 'zh', label: '中文' },
            ]}
          />
          
          {/* Notification Bell with Popover (not Modal) */}
          <Popover
            content={notifPopoverContent}
            trigger="click"
            open={notifOpen}
            onOpenChange={setNotifOpen}
            placement="bottomRight"
            arrow={{ pointAtCenter: true }}
            overlayInnerStyle={{ padding: '8px 0' }}
          >
            <Badge count={unreadCount} size="small" style={{ cursor: 'pointer' }}>
              <BellOutlined 
                style={{ fontSize: 18, color: '#666' }} 
              />
            </Badge>
          </Popover>

          {/* User Dropdown */}
          <Dropdown 
            menu={userMenu} 
            placement="bottomRight" 
            arrow={{ pointAtCenter: true }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" style={{ backgroundColor: '#003DA5' }}>J</Avatar>
              <Text strong style={{ fontSize: 13 }}>Johnn</Text>
              <DownOutlined style={{ fontSize: 12, color: '#999' }} />
            </Space>
          </Dropdown>
        </Space>
      </AntHeader>
    </>
  );
};

export default Header;
