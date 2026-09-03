import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const statusColors = { Pending: 'orange', Confirmed: 'blue', Delivered: 'green', Cancelled: 'default' };

const Orders = () => {
  const [orders, setOrders] = useState([]);
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
    ? { title:'订单', subtitle:'管理客户订单', new:'新建订单', search:'搜索订单...', orderNo:'订单号', account:'客户', amount:'金额', status:'状态', deliveryDate:'交货日期', actions:'操作', edit:'编辑订单', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', orderNumber:'订单编号', notes:'备注', pending:'待处理', confirmed:'已确认', delivered:'已交付', cancelled:'已取消' }
    : { title:'Orders', subtitle:'Manage customer orders', new:'New Order', search:'Search orders...', orderNo:'Order No', account:'Account', amount:'Amount', status:'Status', deliveryDate:'Delivery Date', actions:'Actions', edit:'Edit Order', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', orderNumber:'Order Number', notes:'Notes', pending:'Pending', confirmed:'Confirmed', delivered:'Delivered', cancelled:'Cancelled' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/orders'); const data = await res.json(); if (data.success) setOrders(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/orders/${editing.id}` : '/api/orders';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...values, id: editing.id } : values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); setEditing(null); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? orders.filter(o => (o.order_no || '').toLowerCase().includes(searchText.toLowerCase())) : orders;

  const columns = [
    { title: l.orderNo, dataIndex: 'order_no', key: 'order_no', render: (text) => <Text strong>{text}</Text> },
    { title: l.account, dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: l.amount, dataIndex: 'amount', key: 'amount', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: l.status, dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: l.deliveryDate, dataIndex: 'delivery_date', key: 'delivery_date' },
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
            <Form.Item name="order_no" label={l.orderNumber} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label={l.account}><Input type="number" /></Form.Item>
            <Form.Item name="amount" label={l.amount}><Input type="number" /></Form.Item>
            <Form.Item name="status" label={l.status}>
              <Select options={[{value:'Pending',label:l.pending},{value:'Confirmed',label:l.confirmed},{value:'Delivered',label:l.delivered},{value:'Cancelled',label:l.cancelled}]} />
            </Form.Item>
            <Form.Item name="delivery_date" label={l.deliveryDate}><Input type="date" /></Form.Item>
            <Form.Item name="notes" label={l.notes}><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Orders;
