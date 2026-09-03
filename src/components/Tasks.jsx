import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const priorityColors = { high: 'red', medium: 'orange', low: 'green', urgent: 'magenta' };
const statusColors = { 'Not Started': 'default', 'In Progress': 'processing', Completed: 'green', Cancelled: 'default' };

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
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
    ? { title:'任务', subtitle:'管理团队任务', new:'新建任务', search:'搜索任务...', titleCol:'标题', assignedTo:'负责人', dueDate:'截止日期', priority:'优先级', status:'状态', actions:'操作', edit:'编辑任务', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', description:'描述', notStarted:'未开始', inProgress:'进行中', completed:'已完成', cancelled:'已取消', low:'低', medium:'中', high:'高', urgent:'紧急' }
    : { title:'Tasks', subtitle:'Manage your team tasks', new:'New Task', search:'Search tasks...', titleCol:'Title', assignedTo:'Assigned To', dueDate:'Due Date', priority:'Priority', status:'Status', actions:'Actions', edit:'Edit Task', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', description:'Description', notStarted:'Not Started', inProgress:'In Progress', completed:'Completed', cancelled:'Cancelled', low:'Low', medium:'Medium', high:'High', urgent:'Urgent' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/tasks'); const data = await res.json(); if (data.success) setTasks(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/tasks/${editing.id}` : '/api/tasks';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...values, id: editing.id } : values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); setEditing(null); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? tasks.filter(t => (t.title || '').toLowerCase().includes(searchText.toLowerCase())) : tasks;

  const columns = [
    { title: l.titleCol, dataIndex: 'title', key: 'title', render: (text) => <Text strong>{text}</Text> },
    { title: l.assignedTo, dataIndex: 'assigned_to', key: 'assigned_to' },
    { title: l.dueDate, dataIndex: 'due_date', key: 'due_date' },
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
            <Form.Item name="title" label={l.titleCol} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="description" label={l.description}><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="assigned_to" label={l.assignedTo}><Input /></Form.Item>
            <Form.Item name="due_date" label={l.dueDate}><Input type="date" /></Form.Item>
            <Form.Item name="priority" label={l.priority}>
              <Select options={[{value:'low',label:l.low},{value:'medium',label:l.medium},{value:'high',label:l.high},{value:'urgent',label:l.urgent}]} />
            </Form.Item>
            <Form.Item name="status" label={l.status}>
              <Select options={[{value:'Not Started',label:l.notStarted},{value:'In Progress',label:l.inProgress},{value:'Completed',label:l.completed},{value:'Cancelled',label:l.cancelled}]} />
            </Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Tasks;
