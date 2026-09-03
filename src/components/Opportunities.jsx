import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { t, useTranslation } from '../i18n';

const { Text } = Typography;
const stageColors = { Discovery: 'blue', Qualification: 'cyan', Proposal: 'purple', Negotiation: 'orange', 'Closed Won': 'green', 'Closed Lost': 'default' };

const Opportunities = () => {
  const { t: translate } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [fetchError, setFetchError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch('/api/opportunities');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      } else {
        setFetchError(true);
        message.error(translate('connectionError') || 'Connection error');
      }
    } catch (err) {
      setFetchError(true);
      message.error(translate('connectionError') || 'Connection error');
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const url = editing ? `/api/opportunities/${editing.id}` : '/api/opportunities';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...values, id: editing.id } : values),
      });
      const data = await res.json();
      if (data.success) {
        message.success(editing ? translate('save') + ' ✓' : translate('save') + ' ✓');
        setModalVisible(false);
        setEditing(null);
        form.resetFields();
        fetch();
      }
    } catch (err) {
      message.error(translate('error'));
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        message.success(translate('success'));
        fetch();
      }
    } catch (err) {
      message.error(translate('error'));
    }
  };

  const filtered = searchText ? items.filter(o => (o.name || '').toLowerCase().includes(searchText.toLowerCase())) : items;

  const columns = [
    { title: translate('name'), dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text || '-'}</Text> },
    { title: translate('account'), dataIndex: 'account_id', key: 'account_id', render: (id) => id ? `#${id}` : '-' },
    { title: translate('amount') || 'Amount', dataIndex: 'value', key: 'value', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: translate('probability'), dataIndex: 'probability', key: 'probability', render: (val) => `${val || 0}%` },
    { title: translate('status') || 'Status', dataIndex: 'stage', key: 'stage', render: (s) => <Tag color={stageColors[s]}>{s || '-'}</Tag> },
    { title: translate('expectedClose'), dataIndex: 'expected_close_date', key: 'expected_close_date', render: (d) => d || '-' },
    { title: translate('actions'), key: 'actions', render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => { form.setFieldsValue(record); setEditing(record); setModalVisible(true); }} />
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
      </Space>
    )},
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title={translate('opportunities')} subtitle={translate('manageOpportunities')} extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setEditing(null); setModalVisible(true); }} style={{ marginTop: 4 }}>
          {translate('newOpportunity') || 'New Opportunity'}
        </Button>
      }>
        <div style={{ marginBottom: 16 }}>
          <Input.Search placeholder={translate('search') + ' ' + translate('opportunities') + '...'} allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} />
        </div>
        {fetchError && (
          <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6, padding: '8px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cf1322' }}>{translate('connectionError') || 'Connection error. Please check the server.'}</span>
            <Button type="link" size="small" onClick={fetch}>{translate('reset') || 'Retry'}</Button>
          </div>
        )}
        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} scroll={{ x: 1200 }} className="page-table hover-scroll" locale={{ emptyText: translate('noData') }} />
        <Modal
          title={editing ? translate('edit') + ' ' + (translate('opportunities') || 'Opportunity') : translate('newOpportunity') || 'New Opportunity'}
          open={modalVisible}
          onCancel={() => { setModalVisible(false); setEditing(null); }}
          onOk={() => form.submit()}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="name" label={translate('name')} rules={[{ required: true, message: translate('name') + ' ' + (translate('required') || 'Required')}]}>
              <Input />
            </Form.Item>
            <Form.Item name="account_id" label={translate('account')}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="value" label={translate('amount') || 'Amount'}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="probability" label={translate('probability')}>
              <Input type="number" min="0" max="100" />
            </Form.Item>
            <Form.Item name="stage" label={translate('status') || 'Status'}>
              <Select options={Object.keys(stageColors).map(k => ({ value: k, label: k }))} />
            </Form.Item>
            <Form.Item name="expected_close_date" label={translate('expectedClose')}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="notes" label={translate('notes') || 'Notes'}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>
      </Page>
    </ConfigProvider>
  );
};

export default Opportunities;
