import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, DatePicker, Tag, Space, Typography, ConfigProvider, theme, message, Card } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ClearOutlined,
  FilterOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getLanguage } from '../i18n';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ user: '', entity: '', action: '', dateRange: null });
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const l = lang === 'zh'
    ? { title:'审计日志', subtitle:'跟踪所有系统活动和变更', filterUser:'按用户筛选', filterEntity:'按实体筛选', filterAction:'按操作筛选', accounts:'账户', contacts:'联系人', opportunities:'商机', orders:'订单', quotations:'报价单', create:'创建', update:'更新', delete:'删除', login:'登录', logout:'登出', filter:'筛选', clear:'清除', refresh:'刷新', exportCsv:'导出CSV', totalLogs:'共 %d 条日志', noLogs:'未找到审计日志' }
    : { title:'Audit Logs', subtitle:'Track all system activities and changes', filterUser:'Filter by user', filterEntity:'Filter by entity', filterAction:'Filter by action', accounts:'Accounts', contacts:'Contacts', opportunities:'Opportunities', orders:'Orders', quotations:'Quotations', create:'Create', update:'Update', delete:'Delete', login:'Login', logout:'Logout', filter:'Filter', clear:'Clear', refresh:'Refresh', exportCsv:'Export CSV', totalLogs:'Total %d logs', noLogs:'No audit logs found' };

  const fetchLogs = async (params = {}) => {
    setLoading(true);
    try {
      const url = new URL('/api/audit-logs', window.location.origin);
      if (params.user) url.searchParams.set('user', params.user);
      if (params.entity) url.searchParams.set('entity', params.entity);
      if (params.action) url.searchParams.set('action', params.action);
      if (params.dateRange) {
        url.searchParams.set('startDate', params.dateRange[0]);
        url.searchParams.set('endDate', params.dateRange[1]);
      }
      url.searchParams.set('limit', params.limit || 100);
      url.searchParams.set('offset', params.offset || 0);

      const res = await fetch(url.href);
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      } else {
        message.error(data.error || 'Failed to load audit logs');
      }
    } catch (err) {
      message.error('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilter = () => {
    fetchLogs({
      user: filters.user,
      entity: filters.entity,
      action: filters.action,
      dateRange: filters.dateRange
        ? [filters.dateRange[0].format('YYYY-MM-DD'), filters.dateRange[1].format('YYYY-MM-DD')]
        : null,
    });
  };

  const handleClear = () => {
    setFilters({ user: '', entity: '', action: null, dateRange: null });
    fetchLogs();
  };

  const actionColors = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    LOGIN: 'purple',
    LOGOUT: 'default',
  };

  const entityIcons = {
    accounts: <DatabaseOutlined />,
    contacts: <UserOutlined />,
    opportunities: <ClockCircleOutlined />,
    orders: <DatabaseOutlined />,
    quotations: <DatabaseOutlined />,
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => <Text type="secondary">{text}</Text>,
    },
    {
      title: 'User',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      render: (text) => <Tag>{text || '-'}</Tag>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => <Tag color={actionColors[action]}>{action}</Tag>,
    },
    {
      title: 'Entity',
      dataIndex: 'entity_type',
      key: 'entity_type',
      width: 120,
      render: (entity) => (
        <Space>
          {entityIcons[entity] || <DatabaseOutlined />}
          <Tag>{entity}</Tag>
        </Space>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (text) => <Text ellipsis={{ tooltip: text }}>{text || '-'}</Text>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (text) => <Text type="secondary">{text || '-'}</Text>,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#003DA5',
          borderRadius: 8,
          colorBgLayout: '#F5F7FA',
          colorBgContainer: '#FFFFFF',
        },
      }}
    >
      <div style={{ padding: 24 }}>
        <Title level={3} style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 700 }}>
          {l.title}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>{l.subtitle}</Text>

        {/* Filters */}
        <Card style={{ marginBottom: 16, borderRadius: 10 }}>
          <Space wrap>
            <Input
              placeholder={l.filterUser}
              prefix={<UserOutlined />}
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              style={{ width: 160 }}
              onPressEnter={handleFilter}
            />
            <Select
              placeholder={l.filterEntity}
              value={filters.entity}
              onChange={(v) => setFilters({ ...filters, entity: v })}
              style={{ width: 160 }}
              options={[
                { value: 'accounts', label: l.accounts },
                { value: 'contacts', label: l.contacts },
                { value: 'opportunities', label: l.opportunities },
                { value: 'orders', label: l.orders },
                { value: 'quotations', label: l.quotations },
              ]}
            />
            <Select
              placeholder={l.filterAction}
              value={filters.action}
              onChange={(v) => setFilters({ ...filters, action: v })}
              style={{ width: 140 }}
              options={[
                { value: 'CREATE', label: l.create },
                { value: 'UPDATE', label: l.update },
                { value: 'DELETE', label: l.delete },
                { value: 'LOGIN', label: l.login },
                { value: 'LOGOUT', label: l.logout },
              ]}
            />
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: 240 }}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleFilter}>
              {l.filter}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              {l.clear}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>
              {l.refresh}
            </Button>
            <Button icon={<DownloadOutlined />}>{l.exportCsv}</Button>
          </Space>
        </Card>

        {/* Logs Table */}
        <Card style={{ borderRadius: 10 }}>
          <Table
            dataSource={logs}
            columns={columns}
            rowKey="id"
            locale={{ emptyText: l.noLogs }}
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => l.totalLogs.replace('%d', total) }}
            scroll={{ x: 800 }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default AuditLogs;
