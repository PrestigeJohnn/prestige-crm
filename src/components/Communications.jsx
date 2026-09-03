import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const typeColors = { Call: 'blue', Email: 'green', Meeting: 'purple', WhatsApp: 'cyan', Note: 'default', Other: 'default' };

const Communications = () => {
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
    ? { title:'通讯记录', subtitle:'跟踪所有通讯记录', new:'新建通讯', search:'搜索通讯...', account:'客户', type:'类型', subject:'主题', date:'日期', actions:'操作', edit:'编辑通讯', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', content:'内容', call:'电话', email:'邮件', meeting:'会议', whatsapp:'WhatsApp', note:'备注', other:'其他' }
    : { title:'Communications', subtitle:'Track all communication records', new:'New Communication', search:'Search communications...', account:'Account', type:'Type', subject:'Subject', date:'Date', actions:'Actions', edit:'Edit Communication', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', content:'Content', call:'Call', email:'Email', meeting:'Meeting', whatsapp:'WhatsApp', note:'Note', other:'Other' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/communications'); const data = await res.json(); if (data.success) setItems(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/communications/${editing.id}` : '/api/communications';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...values, id: editing.id } : values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); setEditing(null); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/communications/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? items.filter(c => (c.subject || '').toLowerCase().includes(searchText.toLowerCase())) : items;

  const columns = [
    { title: l.account, dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: l.type, dataIndex: 'type', key: 'type', render: (t) => <Tag color={typeColors[t]}>{t}</Tag> },
    { title: l.subject, dataIndex: 'subject', key: 'subject', render: (text) => <Text strong>{text || '-'}</Text> },
    { title: l.date, dataIndex: 'date', key: 'date' },
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
            <Form.Item name="account_id" label={l.account}><Input type="number" /></Form.Item>
            <Form.Item name="type" label={l.type}>
              <Select options={[
                {value:'Call',label:l.call},{value:'Email',label:l.email},{value:'Meeting',label:l.meeting},
                {value:'WhatsApp',label:l.whatsapp},{value:'Note',label:l.note},{value:'Other',label:l.other}
              ]} />
            </Form.Item>
            <Form.Item name="subject" label={l.subject}><Input /></Form.Item>
            <Form.Item name="content" label={l.content}><Input.TextArea rows={4} /></Form.Item>
            <Form.Item name="date" label={l.date}><Input type="date" /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Communications;
