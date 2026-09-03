import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Table, Typography, Space, ConfigProvider, theme, Modal, Form, message, Divider, Tag, Steps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Title, Text } = Typography;

const entityTypeColors = { quotation: 'blue', pr_request: 'green', equipment_loan: 'purple', contract: 'orange', invoice: 'red' };

const ApprovalWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [form] = Form.useForm();
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const l = lang === 'zh'
    ? { title:'审批流程', subtitle:'配置审批流程', new:'新建流程', name:'名称', entityType:'实体类型', steps:'步骤数', created:'创建时间', actions:'操作', createTitle:'创建新审批流程', wfName:'流程名称', description:'描述', close:'关闭', edit:'编辑', noWf:'暂无流程，点击"新建流程"创建', quotation:'报价单', prRequest:'采购申请', equipLoan:'设备借用', contract:'合同', invoice:'发票', save:'保存', success:'保存成功', error:'操作失败', noSteps:'尚未配置步骤', stepOrder:'步骤', placeholder:'例如：高价值采购审批', descPlaceholder:'描述审批流程' }
    : { title:'Approval Workflows', subtitle:'Configure approval processes', new:'New Workflow', name:'Name', entityType:'Entity Type', steps:'Steps', created:'Created', actions:'Actions', createTitle:'Create New Approval Workflow', wfName:'Workflow Name', description:'Description', close:'Close', edit:'Edit', noWf:'No workflows yet. Click "New Workflow" to create one.', quotation:'Quotation', prRequest:'PR Request', equipLoan:'Equipment Loan', contract:'Contract', invoice:'Invoice', save:'Save', success:'Saved successfully', error:'Operation failed', noSteps:'No steps configured yet.', stepOrder:'Step', placeholder:'e.g., High-value Purchase Approval', descPlaceholder:'Describe the approval workflow' };

  const fetchWorkflows = async () => {
    setLoading(true);
    try { const res = await fetch('/api/approvals'); const data = await res.json(); if (data.success) setWorkflows(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchWorkflows(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/approvals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); form.resetFields(); fetchWorkflows(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/approvals/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetchWorkflows(); } }
    catch (err) { message.error(l.error); }
  };

  const columns = [
    { title: l.name, dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
    { title: l.entityType, dataIndex: 'entity_type', key: 'entity_type', render: (type) => <Tag color={entityTypeColors[type] || 'default'}>{type}</Tag> },
    { title: l.steps, dataIndex: 'step_count', key: 'step_count' },
    { title: l.created, dataIndex: 'created_at', key: 'created_at', render: (date) => date ? new Date(date).toLocaleDateString() : '-' },
    { title: l.actions, key: 'actions', render: (_, record) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelectedWorkflow(record); setViewModalVisible(true); }} />
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
        <Table columns={columns} dataSource={workflows} rowKey="id" loading={loading} scroll={{ x: 800 }} locale={{ emptyText: l.noWf }} />
        <Modal title={l.createTitle} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.close}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="name" label={l.wfName} rules={[{ required: true }]}><Input placeholder={l.placeholder} /></Form.Item>
            <Form.Item name="entity_type" label={l.entityType} rules={[{ required: true }]}>
              <Select placeholder={l.entityType}>
                <Select.Option value="quotation">{l.quotation}</Select.Option>
                <Select.Option value="pr_request">{l.prRequest}</Select.Option>
                <Select.Option value="equipment_loan">{l.equipLoan}</Select.Option>
                <Select.Option value="contract">{l.contract}</Select.Option>
                <Select.Option value="invoice">{l.invoice}</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="description" label={l.description}><Input.TextArea rows={3} placeholder={l.descPlaceholder} /></Form.Item>
          </Form>
        </Modal>
        <Modal title="Workflow Details" open={viewModalVisible} onCancel={() => setViewModalVisible(false)} footer={[
          <Button key="back" onClick={() => setViewModalVisible(false)}>{l.close}</Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />}>{l.edit} {l.title}</Button>,
        ]} width={800}>
          {selectedWorkflow && (
            <div>
              <Title level={5} style={{ marginBottom: 8 }}>{selectedWorkflow.name}</Title>
              <Tag color={entityTypeColors[selectedWorkflow.entity_type] || 'default'}>{selectedWorkflow.entity_type}</Tag>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>{selectedWorkflow.description}</Text>
              <Divider style={{ margin: '12px 0' }} />
              <Typography.Paragraph><Text strong>Steps:</Text></Typography.Paragraph>
              {selectedWorkflow.steps && selectedWorkflow.steps.length > 0 ? (
                <Steps direction="vertical" size="small" current={selectedWorkflow.steps.length} items={selectedWorkflow.steps.map((s) => ({ title: s.approver_role, description: `${l.stepOrder} ${s.step_order}` }))} />
              ) : (<Text type="secondary">{l.noSteps}</Text>)}
            </div>
          )}
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default ApprovalWorkflows;
