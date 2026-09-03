import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Typography, ConfigProvider, theme, Modal, Form, message, DatePicker } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Page from './Page';

const { Text } = Typography;

const QuotationBuilder = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/quotations'); const data = await res.json(); if (data.success) setQuotations(data.data || []); }
    catch (err) { message.error('Failed to fetch'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { message.success('Quotation created'); setModalVisible(false); form.resetFields(); fetch(); }
    } catch (err) { message.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { message.success('Deleted'); fetch(); } }
    catch (err) { message.error('Failed to delete'); }
  };

  const filtered = searchText ? quotations.filter(q => (q.quote_number || '').toLowerCase().includes(searchText.toLowerCase())) : quotations;

  const columns = [
    { title: 'Quote #', dataIndex: 'quote_number', key: 'quote_number', render: (text) => <Text strong>{text}</Text> },
    { title: 'Account', dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'accepted' ? 'green' : s === 'sent' ? 'blue' : 'default'}>{s}</Tag> },
    { title: 'Valid Until', dataIndex: 'valid_until', key: 'valid_until' },
    { title: 'Actions', key: 'actions', render: (_, record) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelected(record); setPreviewVisible(true); }} />
        <Button type="link" icon={<EditOutlined />} />
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
      </Space>
    )},
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title="Quotation Builder" subtitle="Create and manage quotations" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} style={{ marginTop: 4 }}>
          New Quotation
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder="Search quotations..." allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} />
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} scroll={{ x: 1000 }} className="page-table hover-scroll" />

        <Modal title="New Quotation" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} destroyOnClose width={800}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="quote_number" label="Quote Number" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label="Account"><Input type="number" /></Form.Item>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="subtotal" label="Subtotal"><Input type="number" /></Form.Item>
            <Form.Item name="tax_rate" label="Tax Rate (%)"><Input type="number" /></Form.Item>
            <Form.Item name="discount" label="Discount"><Input type="number" /></Form.Item>
            <Form.Item name="total" label="Total"><Input type="number" /></Form.Item>
            <Form.Item name="valid_until" label="Valid Until"><DatePicker /></Form.Item>
            <Form.Item name="terms_conditions" label="Terms & Conditions"><Input.TextArea rows={4} /></Form.Item>
          </Form>
        </Modal>

        <Modal title="Quotation Preview" open={previewVisible} onCancel={() => setPreviewVisible(false)} footer={[
          <Button key="back" onClick={() => setPreviewVisible(false)}>Close</Button>,
          <Button key="print" type="primary">Print / PDF</Button>,
        ]} width={900}>
          {selected && (
            <div style={{ padding: 24, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Text strong style={{ fontSize: 24 }}>QUOTATION</Text>
                <div style={{ color: '#8c8c8c', marginTop: 8 }}>{selected.quote_number}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Account: </Text> #{selected.account_id}<br />
                <Text strong>Total: </Text> ${(selected.total || 0).toLocaleString()}<br />
                <Text strong>Valid Until: </Text> {selected.valid_until ? new Date(selected.valid_until).toLocaleDateString() : '-'}
              </div>
              <Divider />
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{selected.terms_conditions || 'No terms and conditions.'}</pre>
            </div>
          )}
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default QuotationBuilder;
