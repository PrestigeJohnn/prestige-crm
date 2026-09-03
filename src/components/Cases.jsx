import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const statusColors = { New: 'blue', 'In Progress': 'processing', Resolved: 'green', Closed: 'default' };
const priorityColors = { Low: 'green', Medium: 'orange', High: 'red', Urgent: 'magenta' };

const Cases = () => {
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
    ? { title:'工单', subtitle:'管理客户支持工单', new:'新建工单', search:'搜索工单...', caseNo:'工单号', subject:'主题', account:'客户', priority:'优先级', status:'状态', actions:'操作', edit:'编辑工单', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', description:'描述', resolution:'解决方案', newS:'新建', inProgress:'进行中', resolved:'已解决', closed:'已关闭', low:'低', medium:'中', high:'高', urgent:'紧急' }
    : { title:'Cases', subtitle:'Manage customer support cases', new:'New Case', search:'Search cases...', caseNo:'Case No', subject:'Subject', account:'Account', priority:'Priority', status:'Status', actions:'Actions', edit:'Edit Case', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', description:'Description', resolution:'Resolution', newS:'New', inProgress:'In Progress', resolved:'Resolved', closed:'Closed', low:'Low', medium:'Medium', high:'High', urgent:'Urgent' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/cases'); const data = await res.json(); if (data.success) setItems(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/cases/${editing.id}` : '/api/cases';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...values, id: editing.id } : values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); setEditing(null); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? items.filter(c => (c.subject || '').toLowerCase().includes(searchText.toLowerCase())) : items;

  const columns = [
    { title: l.caseNo, dataIndex: 'case_no', key: 'case_no', render: (text) => <Text strong>{text}</Text> },
    { title: l.subject, dataIndex: 'subject', key: 'subject', render: (text) => <Text strong>{text}</Text> },
    { title: l.account, dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: l.priority, dataIndex: 'priority', key: 'priority', render: (p) => <Tag color={priorityColors[p]}>{p}</Tag> },
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setEditing(null); setModalVisible(true); }} style={{ marginTop: 4 }}>
          {l.new}
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder={l.search} allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} />
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} scroll={{ x: 1000 }} className="page-table hover-scroll" />
        <Modal title={editing ? l.edit : l.new} open={modalVisible} onCancel={() => { setModalVisible(false); setEditing(null); }} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="subject" label={l.subject} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label={l.account}><Input type="number" /></Form.Item>
            <Form.Item name="priority" label={l.priority}>
              <Select options={[{value:'Low',label:l.low},{value:'Medium',label:l.medium},{value:'High',label:l.high},{value:'Urgent',label:l.urgent}]} />
            </Form.Item>
            <Form.Item name="status" label={l.status}>
              <Select options={[{value:'New',label:l.newS},{value:'In Progress',label:l.inProgress},{value:'Resolved',label:l.resolved},{value:'Closed',label:l.closed}]} />
            </Form.Item>
            <Form.Item name="description" label={l.description}><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="resolution" label={l.resolution}><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Cases;
