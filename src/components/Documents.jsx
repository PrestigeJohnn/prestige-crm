import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;

const Documents = () => {
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
    ? { title:'文档', subtitle:'管理文件', new:'新建文档', search:'搜索文档...', name:'名称', account:'客户', category:'类别', fileType:'文件类型', uploadedBy:'上传人', actions:'操作', edit:'编辑文档', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', fileName:'文件名', description:'描述', document:'文档', image:'图片', pdf:'PDF', spreadsheet:'电子表格', noDocs:'暂无文档', updated:'已更新', created:'已创建', nameLabel:'名称', filePath:'文件路径' }
    : { title:'Documents', subtitle:'Manage your documents', new:'New Document', search:'Search documents...', name:'Name', account:'Account', category:'Category', fileType:'File Type', uploadedBy:'Uploaded By', actions:'Actions', edit:'Edit Document', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', fileName:'File Name', description:'Description', document:'Document', image:'Image', pdf:'PDF', spreadsheet:'Spreadsheet', noDocs:'No documents yet', updated:'Updated', created:'Created', nameLabel:'Name', filePath:'File Path' };


  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/documents'); const data = await res.json(); if (data.success) setItems(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/documents/${editing.id}` : '/api/documents';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...values, id: editing.id } : values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); setEditing(null); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? items.filter(d => (d.name || '').toLowerCase().includes(searchText.toLowerCase())) : items;

  const columns = [
    { title: l.name, dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
    { title: l.account, dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: l.category, dataIndex: 'category', key: 'category' },
    { title: l.fileType, dataIndex: 'file_type', key: 'file_type', render: (t) => <Tag>{t}</Tag> },
    { title: l.uploadedBy, dataIndex: 'uploaded_by', key: 'uploaded_by' },
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
            <Form.Item name="name" label={l.nameLabel} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label={l.account}><Input type="number" /></Form.Item>
            <Form.Item name="file_path" label={l.filePath}><Input /></Form.Item>
            <Form.Item name="file_type" label={l.fileType}><Input /></Form.Item>
            <Form.Item name="category" label={l.category}><Input /></Form.Item>
            <Form.Item name="uploaded_by" label={l.uploadedBy}><Input /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Documents;
