import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;

const Leads = () => {
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
    title: lang === 'zh' ? '潜在客户' : 'Leads',
    subtitle: lang === 'zh' ? '管理和跟踪潜在客户' : 'Manage and track leads',
    newLead: lang === 'zh' ? '新建潜在客户' : 'New Lead',
    searchPlaceholder: lang === 'zh' ? '搜索潜在客户...' : 'Search leads...',
    companyName: lang === 'zh' ? '公司名称' : 'Company Name',
    contactName: lang === 'zh' ? '联系人' : 'Contact Name',
    email: lang === 'zh' ? '邮箱' : 'Email',
    phone: lang === 'zh' ? '电话' : 'Phone',
    source: lang === 'zh' ? '来源' : 'Source',
    status: lang === 'zh' ? '状态' : 'Status',
    score: lang === 'zh' ? '评分' : 'Score',
    notes: lang === 'zh' ? '备注' : 'Notes',
    actions: lang === 'zh' ? '操作' : 'Actions',
    editLead: lang === 'zh' ? '编辑潜在客户' : 'Edit Lead',
    save: lang === 'zh' ? '保存' : 'Save',
    cancel: lang === 'zh' ? '取消' : 'Cancel',
    success: lang === 'zh' ? '保存成功' : 'Saved successfully',
    error: lang === 'zh' ? '操作失败' : 'Operation failed',
    sources: lang === 'zh' ? ['网站', '推荐', '展会', '电话营销', '其他'] : ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Other'],
    statuses: lang === 'zh' ? ['新', '已联系', '合格', '提案', '谈判', '丢失'] : ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Lost'],
  };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/leads'); const data = await res.json(); if (data.success) setItems(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? items.filter(ld => (ld.company_name || '').toLowerCase().includes(searchText.toLowerCase()) || (ld.contact_name || '').toLowerCase().includes(searchText.toLowerCase())) : items;

  const statusColors = { New: 'default', Contacted: 'blue', Qualified: 'green', Proposal: 'orange', Negotiation: 'purple', Lost: 'red' };

  const columns = [
    { title: l.companyName, dataIndex: 'company_name', key: 'company_name', render: (text) => <Text strong>{text}</Text> },
    { title: l.contactName, dataIndex: 'contact_name', key: 'contact_name' },
    { title: l.email, dataIndex: 'email', key: 'email' },
    { title: l.phone, dataIndex: 'phone', key: 'phone' },
    { title: l.source, dataIndex: 'source', key: 'source', render: (text) => <Tag color="blue">{text}</Tag> },
    { title: l.status, dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: l.score, dataIndex: 'score', key: 'score', render: (val) => <Tag color={val >= 70 ? 'green' : val >= 40 ? 'orange' : 'default'}>{val}</Tag> },
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
          {l.newLead}
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder={l.searchPlaceholder} allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} prefix={<SearchOutlined />} />
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} scroll={{ x: 1400 }} className="page-table hover-scroll" />
        <Modal title={editing ? l.editLead : l.newLead} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="company_name" label={l.companyName} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="contact_name" label={l.contactName} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="email" label={l.email}><Input type="email" /></Form.Item>
            <Form.Item name="phone" label={l.phone}><Input /></Form.Item>
            <Form.Item name="source" label={l.source}>
              <Select options={l.sources.map(v => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="status" label={l.status}>
              <Select options={Object.keys(statusColors).map(v => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="score" label={l.score}><Input type="number" min={0} max={100} /></Form.Item>
            <Form.Item name="notes" label={l.notes}><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Leads;
