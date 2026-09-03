import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;

const Contacts = () => {
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
    title: lang === 'zh' ? '联系人' : 'Contacts',
    subtitle: lang === 'zh' ? '管理联系人信息' : 'Manage contact information',
    newContact: lang === 'zh' ? '新建联系人' : 'New Contact',
    searchPlaceholder: lang === 'zh' ? '搜索联系人...' : 'Search contacts...',
    firstName: lang === 'zh' ? '名字' : 'First Name',
    lastName: lang === 'zh' ? '姓氏' : 'Last Name',
    position: lang === 'zh' ? '职位' : 'Position',
    department: lang === 'zh' ? '部门' : 'Department',
    email: lang === 'zh' ? '邮箱' : 'Email',
    phone: lang === 'zh' ? '电话' : 'Phone',
    linkedin: lang === 'zh' ? 'LinkedIn' : 'LinkedIn',
    decisionMaker: lang === 'zh' ? '决策者' : 'Decision Maker',
    influenceLevel: lang === 'zh' ? '影响力等级' : 'Influence Level',
    notes: lang === 'zh' ? '备注' : 'Notes',
    account: lang === 'zh' ? '所属客户' : 'Account',
    actions: lang === 'zh' ? '操作' : 'Actions',
    editContact: lang === 'zh' ? '编辑联系人' : 'Edit Contact',
    save: lang === 'zh' ? '保存' : 'Save',
    cancel: lang === 'zh' ? '取消' : 'Cancel',
    success: lang === 'zh' ? '保存成功' : 'Saved successfully',
    error: lang === 'zh' ? '操作失败' : 'Operation failed',
    deleteConfirm: lang === 'zh' ? '确定要删除此联系人吗？' : 'Are you sure you want to delete this contact?',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      if (data.success) setItems(data.data || []);
    } catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const filtered = searchText
    ? items.filter(c =>
        (c.first_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (c.last_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : items;

  const columns = [
    { title: l.firstName, dataIndex: 'first_name', key: 'first_name', render: (text) => <Text strong>{text}</Text> },
    { title: l.lastName, dataIndex: 'last_name', key: 'last_name' },
    { title: l.position, dataIndex: 'position', key: 'position', render: (text) => text ? <Tag color="blue">{text}</Tag> : '-' },
    { title: l.email, dataIndex: 'email', key: 'email' },
    { title: l.phone, dataIndex: 'phone', key: 'phone' },
    { title: l.decisionMaker, dataIndex: 'decision_maker', key: 'decision_maker', render: (val) => val ? <Tag color="green">Yes</Tag> : <Tag>No</Tag> },
    { title: l.actions, key: 'actions', render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => { form.setFieldsValue(record); setEditing(record); setModalVisible(true); }} />
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
      </Space>
    )},
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title={l.title} subtitle={l.subtitle} extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} style={{ marginTop: 4 }}>
          {l.newContact}
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder={l.searchPlaceholder} allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} prefix={<SearchOutlined />} />
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} scroll={{ x: 1200 }} className="page-table hover-scroll" />
        <Modal title={editing ? l.editContact : l.newContact} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="first_name" label={l.firstName} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="last_name" label={l.lastName} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label={l.account}><Input type="number" /></Form.Item>
            <Form.Item name="position" label={l.position}><Input /></Form.Item>
            <Form.Item name="department" label={l.department}><Input /></Form.Item>
            <Form.Item name="email" label={l.email}><Input type="email" /></Form.Item>
            <Form.Item name="phone" label={l.phone}><Input /></Form.Item>
            <Form.Item name="linkedin" label={l.linkedin}><Input /></Form.Item>
            <Form.Item name="decision_maker" label={l.decisionMaker} valuePropName="checked"><Input type="checkbox" /></Form.Item>
            <Form.Item name="influence_level" label={l.influenceLevel}><Input type="number" min={1} max={5} /></Form.Item>
            <Form.Item name="notes" label={l.notes}><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Contacts;
