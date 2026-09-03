import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;

const statusColors = { active: 'green', inactive: 'default' };

const Accounts = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const l = {
    title: lang === 'zh' ? '客户管理' : 'Accounts',
    subtitle: lang === 'zh' ? '管理您的客户公司' : 'Manage your client companies',
    newAccount: lang === 'zh' ? '新建客户' : 'New Account',
    searchPlaceholder: lang === 'zh' ? '搜索客户...' : 'Search accounts...',
    companyName: lang === 'zh' ? '公司名称' : 'Company Name',
    industry: lang === 'zh' ? '行业' : 'Industry',
    country: lang === 'zh' ? '国家' : 'Country',
    city: lang === 'zh' ? '城市' : 'City',
    website: lang === 'zh' ? '网站' : 'Website',
    phone: lang === 'zh' ? '电话' : 'Phone',
    employees: lang === 'zh' ? '员工数' : 'Employees',
    annualRevenue: lang === 'zh' ? '年收入' : 'Annual Revenue',
    notes: lang === 'zh' ? '备注' : 'Notes',
    status: lang === 'zh' ? '状态' : 'Status',
    actions: lang === 'zh' ? '操作' : 'Actions',
    created: lang === 'zh' ? '创建时间' : 'Created',
    editAccount: lang === 'zh' ? '编辑客户' : 'Edit Account',
    newAccountTitle: lang === 'zh' ? '新建客户' : 'New Account',
    active: lang === 'zh' ? '活跃' : 'Active',
    inactive: lang === 'zh' ? '不活跃' : 'Inactive',
    save: lang === 'zh' ? '保存' : 'Save',
    cancel: lang === 'zh' ? '取消' : 'Cancel',
    deleteConfirm: lang === 'zh' ? '确定要删除此客户吗？' : 'Are you sure you want to delete this account?',
    successCreate: lang === 'zh' ? '客户创建成功' : 'Account created successfully',
    successUpdate: lang === 'zh' ? '客户更新成功' : 'Account updated successfully',
    successDelete: lang === 'zh' ? '已删除' : 'Deleted',
    fetchError: lang === 'zh' ? '获取失败' : 'Failed to fetch',
    saveError: lang === 'zh' ? '保存失败' : 'Failed to save',
    deleteError: lang === 'zh' ? '删除失败' : 'Failed to delete',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success) setItems(data.data || []);
    } catch (err) {
      message.error(l.fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        message.success(editing ? l.successUpdate : l.successCreate);
        setModalVisible(false);
        form.resetFields();
        fetch();
      }
    } catch (err) {
      message.error(l.saveError);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        message.success(l.successDelete);
        fetch();
      }
    } catch (err) {
      message.error(l.deleteError);
    }
  };

  const filtered = searchText
    ? items.filter(a =>
        (a.company_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (a.industry || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (a.city || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : items;

  const columns = [
    { title: l.companyName, dataIndex: 'company_name', key: 'company_name', render: (text) => <Text strong>{text}</Text>, sorter: (a, b) => (a.company_name || '').localeCompare(b.company_name || '') },
    { title: l.industry, dataIndex: 'industry', key: 'industry', render: (text) => text ? <Tag color="blue">{text}</Tag> : '-' },
    { title: l.country, dataIndex: 'country', key: 'country', render: (text) => text || '-' },
    { title: l.city, dataIndex: 'city', key: 'city', render: (text) => text || '-' },
    { title: l.phone, dataIndex: 'phone', key: 'phone', render: (text) => text || '-' },
    { title: l.status, dataIndex: 'is_active', key: 'is_active', render: (val) => <Tag color={val ? statusColors.active : statusColors.inactive}>{val ? l.active : l.inactive}</Tag> },
    { title: l.actions, key: 'actions', render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => { form.setFieldsValue(record); setEditing(record); setModalVisible(true); }} />
        <Button type="link" onClick={() => navigate(`/accounts/${record.id}`)}>View</Button>
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
      </Space>
    )},
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title={l.title} subtitle={l.subtitle} extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} style={{ marginTop: 4 }}>
          {l.newAccount}
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder={l.searchPlaceholder}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          className="page-table hover-scroll"
          onRow={(record) => ({ onClick: () => navigate(`/accounts/${record.id}`) })}
        />
        <Modal
          title={editing ? l.editAccount : l.newAccountTitle}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
          destroyOnClose
          okText={l.save}
          cancelText={l.cancel}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="company_name" label={l.companyName} rules={[{ required: true, message: l.companyName }]}>
              <Input placeholder="e.g., Acme Corp" />
            </Form.Item>
            <Form.Item name="industry" label={l.industry}>
              <Select options={['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Hospitality', 'Other'].map(v => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="country" label={l.country}><Input defaultValue="Singapore" /></Form.Item>
            <Form.Item name="city" label={l.city}><Input /></Form.Item>
            <Form.Item name="website" label={l.website}><Input placeholder="https://" /></Form.Item>
            <Form.Item name="phone" label={l.phone}><Input /></Form.Item>
            <Form.Item name="employees" label={l.employees}><Input type="number" /></Form.Item>
            <Form.Item name="annual_revenue" label={l.annualRevenue}><Input type="number" /></Form.Item>
            <Form.Item name="notes" label={l.notes}><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Accounts;
