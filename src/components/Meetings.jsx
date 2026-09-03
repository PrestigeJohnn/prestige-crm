import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const statusColors = { Scheduled: 'blue', Completed: 'green', Cancelled: 'red', Postponed: 'orange' };
const typeOptions = [
  { value: 'meeting', label_zh: '会议', label_en: 'Meeting' },
  { value: 'call', label_zh: '电话', label_en: 'Call' },
  { value: 'video', label_zh: '视频会议', label_en: 'Video Call' },
  { value: 'visit', label_zh: '拜访', label_en: 'Visit' },
];

const Meetings = () => {
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

  const isZh = lang === 'zh';

  const l = isZh
    ? {
      title: '会议',
      subtitle: '安排和跟进会议记录',
      new: '新建会议',
      search: '搜索会议...',
      titleCol: '标题',
      account: '客户',
      scheduledAt: '预定时间',
      duration: '时长',
      location: '地点',
      attendees: '参会人',
      actions: '操作',
      edit: '编辑会议',
      save: '保存',
      cancel: '取消',
      success: '保存成功',
      error: '操作失败',
      scheduled: '已安排',
      completed: '已完成',
      cancelled: '已取消',
      postponed: '已延期',
      meetingType: '会议类型',
      description: '会议内容',
      meetingTypePlaceholder: '请选择会议类型',
      durationPlaceholder: '请输入时长（分钟）',
    }
    : {
      title: 'Meetings',
      subtitle: 'Schedule and follow up on meetings',
      new: 'New Meeting',
      search: 'Search meetings...',
      titleCol: 'Title',
      account: 'Account',
      scheduledAt: 'Scheduled At',
      duration: 'Duration',
      location: 'Location',
      attendees: 'Attendees',
      actions: 'Actions',
      edit: 'Edit Meeting',
      save: 'Save',
      cancel: 'Cancel',
      success: 'Saved successfully',
      error: 'Operation failed',
      scheduled: 'Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled',
      postponed: 'Postponed',
      meetingType: 'Meeting Type',
      description: 'Description',
      meetingTypePlaceholder: 'Select meeting type',
      durationPlaceholder: 'Enter duration (minutes)',
    };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/meetings'); const data = await res.json(); if (data.success) setItems(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/meetings/${editing.id}` : '/api/meetings';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...values, id: editing.id } : values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); setEditing(null); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? items.filter(m => (m.title || '').toLowerCase().includes(searchText.toLowerCase())) : items;

  const columns = [
    { title: l.titleCol, dataIndex: 'title', key: 'title', render: (text) => <Text strong>{text}</Text> },
    { title: l.account, dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: l.scheduledAt, dataIndex: 'scheduled_at', key: 'scheduled_at' },
    { title: l.duration, dataIndex: 'duration', key: 'duration', render: (val) => val ? `${val} ${isZh ? '分钟' : 'min'}` : '-' },
    { title: l.location, dataIndex: 'location', key: 'location' },
    { title: l.attendees, dataIndex: 'attendees', key: 'attendees' },
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
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} scroll={{ x: 1200 }} className="page-table hover-scroll" />
        <Modal title={editing ? l.edit : l.new} open={modalVisible} onCancel={() => { setModalVisible(false); setEditing(null); }} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="title" label={l.titleCol} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label={l.account}><Input type="number" /></Form.Item>
            <Form.Item name="type" label={l.meetingType}>
              <Select placeholder={l.meetingTypePlaceholder} options={typeOptions.map(t => ({ value: t.value, label: isZh ? t.label_zh : t.label_en }))} />
            </Form.Item>
            <Form.Item name="description" label={l.description}><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="scheduled_at" label={l.scheduledAt}><Input type="datetime-local" /></Form.Item>
            <Form.Item name="duration" label={l.duration}><Input type="number" placeholder={l.durationPlaceholder} defaultValue="60" /></Form.Item>
            <Form.Item name="location" label={l.location}><Input /></Form.Item>
            <Form.Item name="attendees" label={l.attendees}><Input /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Meetings;
