import React, { useState, useEffect } from 'react';
import { Typography, Descriptions, Avatar, Space, Tag, Card, ConfigProvider, theme, Input } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Title, Text } = Typography;

const Profile = () => {
  const [lang, setLang] = useState(getLanguage());
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: 'Johnn',
    email: 'johnn@prestigesolutions.com.sg',
    phone: '+65 XXXX XXXX',
    department: 'IT Department',
    role: 'Administrator',
    status: 'Active',
    joinedDate: '18th Feb 2025',
    lastLogin: 'July 2, 2026, 10:30 AM',
    language: 'English',
    timezone: 'SGT (UTC+8)',
  });

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const t = lang === 'zh'
    ? {
        title: '个人资料',
        subtitle: '查看和管理您的个人信息',
        displayName: '显示名称',
        email: '邮箱',
        phone: '电话',
        department: '部门',
        role: '角色',
        status: '状态',
        joinedDate: '加入日期',
        lastLogin: '最后登录',
        language: '语言',
        timezone: '时区',
        online: '在线',
        administrator: '管理员',
        active: '活跃',
        footer: '如需帮助，请联系 Johnn johnn@prestigesolutions.com.sg',
      }
    : {
        title: 'Profile',
        subtitle: 'View and manage your personal information',
        displayName: 'Display Name',
        email: 'Email',
        phone: 'Phone',
        department: 'Department',
        role: 'Role',
        status: 'Status',
        joinedDate: 'Joined Date',
        lastLogin: 'Last Login',
        language: 'Language',
        timezone: 'Timezone',
        online: 'Online',
        administrator: 'Administrator',
        active: 'Active',
        footer: 'For assistance, please contact Johnn johnn@prestigesolutions.com.sg',
      };

  const handleDoubleClick = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSave = () => {
    setProfileData(prev => ({ ...prev, [editingField]: editValue }));
    setEditingField(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderEditableValue = (field, value) => {
    if (editingField === field) {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onPressEnter={handleSave}
            autoFocus
            style={{ width: '100%' }}
          />
          <Tag color="green" style={{ cursor: 'pointer', marginTop: 4 }} onClick={handleSave}>✓</Tag>
          <Tag color="red" style={{ cursor: 'pointer', marginTop: 4 }} onClick={handleCancel}>✗</Tag>
        </div>
      );
    }
    return (
      <span
        onDoubleClick={() => handleDoubleClick(field, value)}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        title="Double-click to edit"
      >
        {value}
        <EditOutlined style={{ fontSize: 12, color: '#999' }} />
      </span>
    );
  };

  const avatarInitial = profileData.displayName.charAt(0).toUpperCase();

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title={t.title} subtitle={t.subtitle}>
        <Card className="page-card" style={{ maxWidth: 720, margin: '0 auto', minHeight: 500 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#003DA5', fontSize: 32 }}>{avatarInitial}</Avatar>
            <Title level={4} style={{ marginBottom: 4, marginTop: 16 }}>{renderEditableValue('displayName', profileData.displayName)}</Title>
            <Space>
              <Tag color="green">{t.online}</Tag>
              <Tag color="blue">{t.administrator}</Tag>
            </Space>
          </div>

          <Descriptions
            bordered
            size="small"
            column={1}
            style={{ maxWidth: 500, margin: '0 auto' }}
            items={[
              { label: t.displayName, children: renderEditableValue('displayName', profileData.displayName) },
              { label: t.email, children: renderEditableValue('email', profileData.email) },
              { label: t.phone, children: renderEditableValue('phone', profileData.phone) },
              { label: t.department, children: renderEditableValue('department', profileData.department) },
              { label: t.role, children: renderEditableValue('role', profileData.role) },
              { label: t.status, children: <Tag color="green">{t.active}</Tag> },
              { label: t.joinedDate, children: renderEditableValue('joinedDate', profileData.joinedDate) },
              { label: t.lastLogin, children: renderEditableValue('lastLogin', profileData.lastLogin) },
              { label: t.language, children: renderEditableValue('language', profileData.language) },
              { label: t.timezone, children: renderEditableValue('timezone', profileData.timezone) },
            ]}
          />

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t.footer}
            </Text>
          </div>
        </Card>
      </Page>
    </ConfigProvider>
  );
};

export default Profile;