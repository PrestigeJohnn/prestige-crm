import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const statusColors = { pending: 'orange', approved: 'green', rejected: 'red' };

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const l = lang === 'zh'
    ? { title:'通知', subtitle:'管理您的通知', new:'新建通知', message:'消息', type:'类型', status:'状态', created:'创建时间', actions:'操作', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', pending:'待处理', approved:'已批准', rejected:'已拒绝' }
    : { title:'Notifications', subtitle:'Manage your notifications', new:'New Notification', message:'Message', type:'Type', status:'Status', created:'Created', actions:'Actions', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', pending:'Pending', approved:'Approved', rejected:'Rejected' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/notifications'); const data = await res.json(); if (data.success) setNotifications(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const columns = [
    { title: l.message, dataIndex: 'message', key: 'message', render: (text) => <Text strong>{text}</Text> },
    { title: l.type, dataIndex: 'type', key: 'type', render: (type) => <Tag>{type}</Tag> },
    { title: l.status, dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: l.created, dataIndex: 'created_at', key: 'created_at', render: (date) => date ? new Date(date).toLocaleDateString() : '-' },
    { title: l.actions, key: 'actions', render: (_, record) => (
      <Space>
        <Button type="link" icon={<CheckCircleOutlined />} onClick={() => { /* mark as read */ }} />
        <Button type="link" danger icon={<CloseCircleOutlined />} onClick={() => handleDelete(record.id)} />
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
        <Table columns={columns} dataSource={notifications} rowKey="id" loading={loading} scroll={{ x: 1000 }} className="page-table hover-scroll" />
        <Modal title={l.new} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="message" label={l.message} rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="type" label={l.type}><Input /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Notifications;
