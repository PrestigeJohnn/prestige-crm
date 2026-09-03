import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const statusColors = { draft: 'default', pending_approval: 'orange', approved: 'green', rejected: 'red', procurement: 'blue', completed: 'cyan' };

const PRRequest = () => {
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

  const l = lang === 'zh'
    ? { title:'采购申请', subtitle:'采购请求管理', new:'新建采购申请', search:'搜索采购申请...', prNum:'PR编号', requester:'申请人', department:'部门', budget:'预算', type:'类型', status:'状态', actions:'操作', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', justification:'申请理由', equipment:'设备', service:'服务', other:'其他', pendingApproval:'待审批', approved:'已批准', rejected:'已拒绝', procurement:'采购中', completed:'已完成', draft:'草稿' }
    : { title:'PR Requests', subtitle:'Purchase request management', new:'New PR Request', search:'Search PR requests...', prNum:'PR #', requester:'Requester', department:'Department', budget:'Budget', type:'Type', status:'Status', actions:'Actions', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', justification:'Justification', equipment:'Equipment', service:'Service', other:'Other', pendingApproval:'Pending Approval', approved:'Approved', rejected:'Rejected', procurement:'Procurement', completed:'Completed', draft:'Draft' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/pr-requests'); const data = await res.json(); if (data.success) setItems(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/pr-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/pr-requests/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? items.filter(p => (p.pr_number || '').toLowerCase().includes(searchText.toLowerCase())) : items;

  const columns = [
    { title: l.prNum, dataIndex: 'pr_number', key: 'pr_number', render: (text) => <Text strong>{text}</Text> },
    { title: l.requester, dataIndex: 'requester', key: 'requester' },
    { title: l.department, dataIndex: 'department', key: 'department' },
    { title: l.budget, dataIndex: 'budget', key: 'budget', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: l.type, dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: l.status, dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{s}</Tag> },
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
          {l.new}
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder={l.search} allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} />
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} scroll={{ x: 1000 }} className="page-table hover-scroll" />
        <Modal title={l.new} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="pr_number" label={l.prNum} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label="客户"><Input type="number" /></Form.Item>
            <Form.Item name="requester" label={l.requester} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="department" label={l.department}><Input /></Form.Item>
            <Form.Item name="type" label={l.type}>
              <Select options={[{value:'equipment',label:l.equipment},{value:'service',label:l.service},{value:'other',label:l.other}]} />
            </Form.Item>
            <Form.Item name="budget" label={l.budget}><Input type="number" /></Form.Item>
            <Form.Item name="justification" label={l.justification}><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default PRRequest;
