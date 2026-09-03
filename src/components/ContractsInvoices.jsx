import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Typography, ConfigProvider, theme, Modal, Form, message, Select, Tag, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Text } = Typography;
const statusColors = { Draft: 'default', Sent: 'blue', Accepted: 'green', Rejected: 'red', Expired: 'orange' };

const ContractsInvoices = ({ contractsTab, invoicesTab }) => {
  const [lang, setLang] = useState(getLanguage());
  const [activeTab, setActiveTab] = useState(contractsTab ? 'contracts' : invoicesTab ? 'invoices' : 'contracts');

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const isZh = lang === 'zh';

  const l = isZh
    ? {
      title: '合同与发票',
      subtitle: '管理合同与发票记录',
      contracts: '合同',
      invoices: '发票',
      newContract: '新建合同',
      newInvoice: '新建发票',
      contractNo: '合同编号',
      title: '标题',
      amount: '金额',
      status: '状态',
      signedDate: '签署日期',
      invoiceNo: '发票编号',
      issuedDate: '开立日期',
      dueDate: '到期日',
      account: '客户',
      description: '说明',
      contractType: '合同种类',
      saved: '保存成功',
      failed: '操作失败',
      deleted: '删除成功',
      editContract: '编辑合同',
      editInvoice: '编辑发票',
      draft: '草稿',
      sent: '已送出',
      accepted: '已接受',
      rejected: '已拒绝',
      expired: '已过期',
      paid: '已付款',
      pending: '待付款',
      partial: '部分付款',
    }
    : {
      title: 'Contracts & Invoices',
      subtitle: 'Manage contracts and invoices',
      contracts: 'Contracts',
      invoices: 'Invoices',
      newContract: 'New Contract',
      newInvoice: 'New Invoice',
      contractNo: 'Contract #',
      title: 'Title',
      amount: 'Amount',
      status: 'Status',
      signedDate: 'Signed Date',
      invoiceNo: 'Invoice #',
      issuedDate: 'Issued Date',
      dueDate: 'Due Date',
      account: 'Account',
      description: 'Description',
      contractType: 'Contract Type',
      saved: 'Saved successfully',
      failed: 'Operation failed',
      deleted: 'Deleted successfully',
      editContract: 'Edit Contract',
      editInvoice: 'Edit Invoice',
      draft: 'Draft',
      sent: 'Sent',
      accepted: 'Accepted',
      rejected: 'Rejected',
      expired: 'Expired',
      paid: 'Paid',
      pending: 'Pending',
      partial: 'Partial',
    };

  const contractData = [
    { id: 1, contract_number: 'CTR-001', title: 'Enterprise Software License', amount: 50000, status: 'Accepted', signed_date: '2026-01-15' },
    { id: 2, contract_number: 'CTR-002', title: 'Maintenance Agreement', amount: 12000, status: 'Draft', signed_date: null },
  ];

  const invoiceData = [
    { id: 1, invoice_number: 'INV-001', amount: 50000, status: 'Paid', issued_date: '2026-01-20', due_date: '2026-02-20' },
    { id: 2, invoice_number: 'INV-002', amount: 12000, status: 'Pending', issued_date: '2026-03-01', due_date: '2026-04-01' },
  ];

  const statusColors = { Draft: 'default', Sent: 'blue', Accepted: 'green', Rejected: 'red', Expired: 'orange', Paid: 'green', Pending: 'orange', Partial: 'processing' };
  const statusLabels = {
    Draft: l.draft, Sent: l.sent, Accepted: l.accepted, Rejected: l.rejected, Expired: l.expired,
    Paid: l.paid, Pending: l.pending, Partial: l.partial,
  };

  const contractColumns = [
    { title: l.contractNo, dataIndex: 'contract_number', key: 'contract_number', render: (text) => <Text strong>{text}</Text> },
    { title: l.title, dataIndex: 'title', key: 'title' },
    { title: l.amount, dataIndex: 'amount', key: 'amount', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: l.status, dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: l.signedDate, dataIndex: 'signed_date', key: 'signed_date' },
  ];

  const invoiceColumns = [
    { title: l.invoiceNo, dataIndex: 'invoice_number', key: 'invoice_number', render: (text) => <Text strong>{text}</Text> },
    { title: l.amount, dataIndex: 'amount', key: 'amount', render: (val) => `$${(val || 0).toLocaleString()}` },
    { title: l.status, dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: l.issuedDate, dataIndex: 'issued_date', key: 'issued_date' },
    { title: l.dueDate, dataIndex: 'due_date', key: 'due_date' },
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title={l.title} subtitle={l.subtitle} extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {}} style={{ marginTop: 4 }}>
            {l.newContract}
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => {}}>
            {l.newInvoice}
          </Button>
        </Space>
      }>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'contracts', label: l.contracts, children: <Table columns={contractColumns} dataSource={contractData} rowKey="id" className="page-table hover-scroll" style={{ marginBottom: 24 }} /> },
            { key: 'invoices', label: l.invoices, children: <Table columns={invoiceColumns} dataSource={invoiceData} rowKey="id" className="page-table hover-scroll" /> },
          ]}
        />
      </Page>
    </ConfigProvider>
  );
};

export default ContractsInvoices;
