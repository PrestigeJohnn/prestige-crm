import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const statusColors = { Draft: 'default', Sent: 'blue', Revised: 'purple', Accepted: 'green', Rejected: 'red' };

const Quotes = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
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
    ? { title:'报价单', subtitle:'管理报价记录', new:'新建报价', search:'搜索报价...', quoteNo:'报价编号', account:'客户', amount:'金额', total:'总计', status:'状态', validUntil:'有效期至', actions:'操作', edit:'编辑', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', quoteNumber:'报价编号', discount:'折扣', tax:'税费', notes:'备注', draft:'草稿', sent:'已发送', revised:'已修订', accepted:'已接受', rejected:'已拒绝' }
    : { title:'Quotes', subtitle:'Manage quotation records', new:'New Quote', search:'Search quotes...', quoteNo:'Quote No', account:'Account', amount:'Amount', total:'Total', status:'Status', validUntil:'Valid Until', actions:'Actions', edit:'Edit', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', quoteNumber:'Quote Number', discount:'Discount', tax:'Tax', notes:'Notes', draft:'Draft', sent:'Sent', revised:'Revised', accepted:'Accepted', rejected:'Rejected' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/quotes'); const data = await res.json(); if (data.success) setQuotes(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/quotes/${editing.id}` : '/api/quotes';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...values, id: editing.id } : values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); setEditing(null); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? quotes.filter(q => (q.quote_no || '').toLowerCase().includes(searchText.toLowerCase())) : quotes;

  const columns = [
    { title: l.quoteNo, dataIndex: 'quote_no', key: 'quote_no', render: (text) => <Text strong>{text}</Text> },
    { title: l.account, dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: l.amount, dataIndex: 'amount', key: 'amount', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: l.total, dataIndex: 'total', key: 'total', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: l.status, dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: l.validUntil, dataIndex: 'valid_until', key: 'valid_until' },
    { title: l.actions, key: 'actions', render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => navigate(`/quotes/${record.id}`)}>{l.edit}</Button>
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
        <Modal title={editing ? l.edit + ' ' + l.title : l.new} open={modalVisible} onCancel={() => { setModalVisible(false); setEditing(null); }} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="quote_no" label={l.quoteNumber} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label={l.account}><Input type="number" /></Form.Item>
            <Form.Item name="amount" label={l.amount}><Input type="number" /></Form.Item>
            <Form.Item name="discount" label={l.discount}><Input type="number" /></Form.Item>
            <Form.Item name="tax" label={l.tax}><Input type="number" /></Form.Item>
            <Form.Item name="total" label={l.total}><Input type="number" /></Form.Item>
            <Form.Item name="status" label={l.status}>
              <Select options={[{value:'Draft',label:l.draft},{value:'Sent',label:l.sent},{value:'Revised',label:l.revised},{value:'Accepted',label:l.accepted},{value:'Rejected',label:l.rejected}]} />
            </Form.Item>
            <Form.Item name="valid_until" label={l.validUntil}><Input type="date" /></Form.Item>
            <Form.Item name="notes" label={l.notes}><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Quotes;
