import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const statusColors = { requested: 'orange', approved: 'green', checked_out: 'blue', returned: 'cyan', inspected: 'purple' };

const EquipmentLoanForm = () => {
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
    ? { title:'设备借用', subtitle:'管理设备借用请求', new:'新建借用', search:'搜索借用...', loanNum:'借用编号', borrower:'借用人', account:'客户', type:'类型', loanStart:'借用开始', status:'状态', actions:'操作', save:'保存', cancel:'取消', success:'保存成功', error:'操作失败', borrowerContact:'联系电话', purpose:'用途', estReturn:'预计归还日期', internal:'内部', demo:'演示', other:'其他', requested:'已申请', approved:'已批准', checkedOut:'已借出', returned:'已归还', inspected:'已检验' }
    : { title:'Equipment Loans', subtitle:'Manage equipment loan requests', new:'New Equipment Loan', search:'Search equipment loans...', loanNum:'Loan #', borrower:'Borrower', account:'Account', type:'Type', loanStart:'Loan Start', status:'Status', actions:'Actions', save:'Save', cancel:'Cancel', success:'Saved successfully', error:'Operation failed', borrowerContact:'Borrower Contact', purpose:'Purpose', estReturn:'Estimated Return Date', internal:'Internal', demo:'Demo', other:'Other', requested:'Requested', approved:'Approved', checkedOut:'Checked Out', returned:'Returned', inspected:'Inspected' };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch('/api/equipment-loans'); const data = await res.json(); if (data.success) setItems(data.data || []); }
    catch (err) { message.error(l.error); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/equipment-loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { message.success(l.success); setModalVisible(false); form.resetFields(); fetch(); }
    } catch (err) { message.error(l.error); }
  };

  const handleDelete = async (id) => {
    try { const res = await fetch(`/api/equipment-loans/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { fetch(); } }
    catch (err) { message.error(l.error); }
  };

  const filtered = searchText ? items.filter(e => (e.loan_number || '').toLowerCase().includes(searchText.toLowerCase())) : items;

  const columns = [
    { title: l.loanNum, dataIndex: 'loan_number', key: 'loan_number', render: (text) => <Text strong>{text}</Text> },
    { title: l.borrower, dataIndex: 'borrower_name', key: 'borrower_name' },
    { title: l.account, dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: l.type, dataIndex: 'loan_type', key: 'loan_type', render: (t) => <Tag>{t}</Tag> },
    { title: l.loanStart, dataIndex: 'loan_start_date', key: 'loan_start_date' },
    { title: l.status, dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{s}</Tag> },
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} style={{ marginTop: 4 }}>
          {l.new}
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder={l.search} allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} />
        </div>
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} scroll={{ x: 1200 }} className="page-table hover-scroll" />
        <Modal title={l.new} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} destroyOnClose okText={l.save} cancelText={l.cancel}>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="loan_number" label={l.loanNum} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="account_id" label={l.account}><Input type="number" /></Form.Item>
            <Form.Item name="borrower_name" label={l.borrower} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="borrower_contact" label={l.borrowerContact}><Input /></Form.Item>
            <Form.Item name="loan_type" label={l.type}>
              <Select options={[{value:'internal',label:l.internal},{value:'demo',label:l.demo},{value:'other',label:l.other}]} />
            </Form.Item>
            <Form.Item name="purpose" label={l.purpose}><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="loan_start_date" label={l.loanStart}><Input type="date" /></Form.Item>
            <Form.Item name="estimated_return_date" label={l.estReturn}><Input type="date" /></Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default EquipmentLoanForm;
