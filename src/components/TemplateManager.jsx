import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Table, Typography, Space, ConfigProvider, theme, Modal, Form, message, Divider, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Title, Text } = Typography;

const typeColors = { quotation: 'blue', pr_request: 'green', equipment_loan: 'purple', contract: 'orange', invoice: 'red' };

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form] = Form.useForm();
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const l = lang === 'zh'
    ? { title:'模板管理', subtitle:'管理文档模板', new:'新建模板', search:'搜索模板...', name:'名称', type:'类型', created:'创建时间', actions:'操作', createTitle:'创建新模板', tplName:'模板名称', tplType:'模板类型', tplContent:'模板内容', close:'关闭', use:'使用模板', noTpl:'暂无模板，点击"新建模板"创建', quotation:'报价单', prRequest:'采购申请', equipLoan:'设备借用', contract:'合同', invoice:'发票', save:'保存', cancel:'Cancel', success:'保存成功', error:'操作失败', placeholder:'输入模板名称', contentPlaceholder:'输入模板内容，使用{{变量}}' }
    : { title:'Template Manager', subtitle:'Manage document templates', new:'New Template', search:'Search templates...', name:'Name', type:'Type', created:'Created', actions:'Actions', createTitle:'Create New Template', tplName:'Template Name', tplType:'Template Type', tplContent:'Template Content', close:'Close', use:'Use Template', noTpl:'No templates yet. Click "New Template" to create one.', quotation:'Quotation', prRequest:'PR Request', equipLoan:'Equipment Loan', contract:'Contract', invoice:'Invoice', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', placeholder:'e.g., Standard Quotation', contentPlaceholder:'Enter template content with {{variables}}' };

  const fetchTemplates = async () => {
    setLoading(true);
    try { const res = await fetch('/api/templates'); const data = await res.json(); if (data.success) setTemplates(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchTemplates(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); form.resetFields(); fetchTemplates(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetchTemplates(); } }
    catch (err) { message.error(l.error); }
  };

  const columns = [
    { title: l.name, dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
    { title: l.type, dataIndex: 'type', key: 'type', render: (type) => <Tag color={typeColors[type] || 'default'}>{type}</Tag> },
    { title: l.created, dataIndex: 'created_at', key: 'created_at', render: (date) => date ? new Date(date).toLocaleDateString() : '-' },
    { title: l.actions, key: 'actions', render: (_, record) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelectedTemplate(record); setViewModalVisible(true); }} />
        <Button type="link" icon={<CopyOutlined />} />
        <Button type="link" icon={<EditOutlined />} />
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
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
        <Table columns={columns} dataSource={templates} rowKey="id" loading={loading} scroll={{ x: 800 }} locale={{ emptyText: l.noTpl }} />
        <Modal title={l.createTitle} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="name" label={l.tplName} rules={[{ required: true }]}><Input placeholder={l.placeholder} /></Form.Item>
            <Form.Item name="type" label={l.tplType} rules={[{ required: true }]}>
              <Select placeholder={l.tplType}>
                <Select.Option value="quotation">{l.quotation}</Select.Option>
                <Select.Option value="pr_request">{l.prRequest}</Select.Option>
                <Select.Option value="equipment_loan">{l.equipLoan}</Select.Option>
                <Select.Option value="contract">{l.contract}</Select.Option>
                <Select.Option value="invoice">{l.invoice}</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="content" label={l.tplContent}><Input.TextArea rows={6} placeholder={l.contentPlaceholder} /></Form.Item>
          </Form>
        </Modal>
        <Modal title="Template Details" open={viewModalVisible} onCancel={() => setViewModalVisible(false)} footer={[
          <Button key="back" onClick={() => setViewModalVisible(false)}>{l.close}</Button>,
          <Button key="copy" type="primary" icon={<CopyOutlined />}>{l.use} {l.tplName}</Button>,
        ]} width={800}>
          {selectedTemplate && (
            <div>
              <Title level={5} style={{ marginBottom: 8 }}>{selectedTemplate.name}</Title>
              <Tag color={typeColors[selectedTemplate.type] || 'default'}>{selectedTemplate.type}</Tag>
              <Divider style={{ margin: '12px 0' }} />
              <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, whiteSpace: 'pre-wrap', fontSize: 13, maxHeight: 400, overflow: 'auto' }}>
                {selectedTemplate.content}
              </pre>
            </div>
          )}
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default TemplateManager;
