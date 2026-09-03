import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;

const Products = () => {
  const [products, setProducts] = useState([]);
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
    ? { title:'产品', subtitle:'管理产品目录', new:'新建产品', search:'搜索产品...', sku:'SKU', name:'名称', category:'类别', cost:'成本', sellingPrice:'售价', stock:'库存', active:'是否启用', actions:'操作', edit:'编辑产品', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', yes:'是', no:'否', costLabel:'成本', priceLabel:'售价', unitLabel:'单位', descLabel:'描述' }
    : { title:'Products', subtitle:'Manage your product catalog', new:'New Product', search:'Search products...', sku:'SKU', name:'Name', category:'Category', cost:'Cost', sellingPrice:'Selling Price', stock:'Stock', active:'Active', actions:'Actions', edit:'Edit Product', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', yes:'Yes', no:'No', costLabel:'Cost', priceLabel:'Selling Price', unitLabel:'Unit', descLabel:'Description' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/products'); const data = await res.json(); if (data.success) setProducts(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/products/${editing.id}` : '/api/products';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...values, id: editing.id } : values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); setEditing(null); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/products/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? products.filter(p => (p.name || '').toLowerCase().includes(searchText.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchText.toLowerCase())) : products;

  const columns = [
    { title: l.sku, dataIndex: 'sku', key: 'sku' },
    { title: l.name, dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
    { title: l.category, dataIndex: 'category', key: 'category' },
    { title: l.cost, dataIndex: 'cost', key: 'cost', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: l.sellingPrice, dataIndex: 'selling_price', key: 'selling_price', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: l.stock, dataIndex: 'stock', key: 'stock' },
    { title: l.active, dataIndex: 'active', key: 'active', render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? l.yes : l.no}</Tag> },
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
            <Form.Item name="name" label={l.name} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="sku" label={l.sku} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="category" label={l.category}><Input /></Form.Item>
            <Form.Item name="description" label={l.descLabel}><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="cost" label={l.costLabel}><Input type="number" /></Form.Item>
            <Form.Item name="selling_price" label={l.priceLabel}><Input type="number" /></Form.Item>
            <Form.Item name="stock" label={l.stock}><Input type="number" /></Form.Item>
            <Form.Item name="unit" label={l.unitLabel}><Input defaultValue="Unit" /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Products;
