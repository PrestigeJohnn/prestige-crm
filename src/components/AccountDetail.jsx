import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Card, Typography, Button, Space, ConfigProvider, theme, Descriptions, Tag, Divider } from 'antd';
import { ArrowLeftOutlined, PhoneOutlined, MailOutlined, EditOutlined } from '@ant-design/icons';
import AccountNotes from './AccountNotes';
import ActivityTimeline from './ActivityTimeline';

const { Title, Text } = Typography;

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/accounts/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAccount(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (!account) return <div>Loading...</div>;

  const items = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Company Name" span={2}><Text strong>{account.name}</Text></Descriptions.Item>
          <Descriptions.Item label="Industry">{account.industry || '-'}</Descriptions.Item>
          <Descriptions.Item label="Owner">{account.owner || '-'}</Descriptions.Item>
          <Descriptions.Item label="Phone"><PhoneOutlined /> {account.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email"><MailOutlined /> {account.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Website" span={2}>{account.website ? <a href={account.website} target="_blank" rel="noopener noreferrer">{account.website}</a> : '-'}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>{account.address || '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'notes',
      label: 'Account Notes',
      children: <AccountNotes accountId={parseInt(id)} />,
    },
    {
      key: 'timeline',
      label: 'Activity Timeline',
      children: <ActivityTimeline accountId={parseInt(id)} />,
    },
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <div style={{ padding: 24 }}>
        <Space style={{ marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/accounts')}>Back to Accounts</Button>
          <Button icon={<EditOutlined />}>Edit Account</Button>
        </Space>

        <Title level={3} style={{ marginBottom: 8 }}>{account.name}</Title>
        <Space style={{ marginBottom: 24 }}>
          {account.industry && <Tag color="blue">{account.industry}</Tag>}
          {account.owner && <Tag>{account.owner}</Tag>}
          <Text type="secondary">Account #{account.id}</Text>
        </Space>

        <Tabs defaultActiveKey="overview" items={items} size="large" style={{ background: '#fff', borderRadius: 8, padding: 16 }} />
      </div>
    </ConfigProvider>
  );
};

export default AccountDetail;
