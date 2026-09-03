import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, Select, Input, message, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined, CalendarOutlined, MessageOutlined, EnvironmentOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const typeIcons = {
  call: <PhoneOutlined />, email: <MailOutlined />, meeting: <CalendarOutlined />,
  whatsapp: <MessageOutlined />, visit: <EnvironmentOutlined />, note: <FileTextOutlined />, system: <PlusOutlined />
};

const typeColors = {
  call: 'blue', email: 'green', meeting: 'purple', whatsapp: 'orange',
  visit: 'cyan', note: 'default', system: 'gray'
};

const ActivityTimeline = ({ accountId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [form] = Form.useForm();

  const fetchActivities = async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      const res = await fetch(`/api/activity-log/account/${accountId}?${params}`);
      const data = await res.json();
      if (data.success) setActivities(data.data);
    } catch (err) {
      message.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, [accountId, filterType]);

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/activity-log/${id}`, { method: 'DELETE' });
      message.success('Activity deleted');
      fetchActivities();
    } catch { message.error('Failed to delete'); }
  };

  const handleSave = async (values) => {
    try {
      const url = editingActivity ? `/api/activity-log/${editingActivity.id}` : '/api/activity-log';
      const method = editingActivity ? 'PUT' : 'POST';
      const body = editingActivity ? { ...values, id: editingActivity.id } : { ...values, account_id: accountId };
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        message.success(editingActivity ? 'Activity updated' : 'Activity logged');
        setModalVisible(false);
        form.resetFields();
        fetchActivities();
      }
    } catch { message.error('Failed to save'); }
  };

  // Group by date
  const groupedByDate = {};
  activities.forEach(a => {
    const date = a.created_at ? new Date(a.created_at).toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : 'Unknown';
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(a);
  });

  const dateKeys = Object.keys(groupedByDate).sort((a, b) => {
    const dateA = new Date(a.split(',')[0]);
    const dateB = new Date(b.split(',')[0]);
    return dateB - dateA;
  });

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Card
        title="Activity Timeline"
        extra={
          <Space>
            <Select value={filterType} onChange={setFilterType} style={{ width: 140 }} size="small" options={[{ value: 'all', label: 'All Types' }, ...Object.keys(typeIcons).map(k => ({ value: k, label: k }))]} />
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => { setEditingActivity(null); form.resetFields(); setModalVisible(true); }}>
              Log Activity
            </Button>
          </Space>
        }
      >
        {dateKeys.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>No activities recorded yet.</div>}

        {dateKeys.map(date => (
          <div key={date} style={{ marginBottom: 24 }}>
            <Divider plain style={{ borderColor: '#003DA5', borderWidth: 1 }}>
              <Text strong style={{ color: '#003DA5' }}>{date}</Text>
            </Divider>
            <List
              loading={loading}
              dataSource={groupedByDate[date]}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Tag color={typeColors[item.type] || 'gray'} style={{ padding: '4px 12px', borderRadius: 16, fontSize: 13 }}>
                        {typeIcons[item.type] || <PlusOutlined />} {item.type}
                      </Tag>
                    }
                    title={
                      <Space size="small">
                        <Text strong>{item.subject}</Text>
                        {item.direction === 'inbound' && <Tag color="green">Incoming</Tag>}
                        {item.duration_minutes > 0 && <Tag color="blue">{item.duration_minutes} min</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {item.description || 'No description'}
                        </Text>
                        {item.next_action && (
                          <Text style={{ fontSize: 12, color: '#003DA5' }}>
                            Next action: {item.next_action}
                          </Text>
                        )}
                        <Space size="small" style={{ fontSize: 11, color: '#999' }}>
                          <span>Logged: {item.created_at ? new Date(item.created_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                          <span>by {item.created_by || 'admin'}</span>
                        </Space>
                      </Space>
                    }
                  />
                  <Space style={{ marginLeft: 64 }}>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingActivity(item); form.setFieldsValue(item); setModalVisible(true); }} />
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                  </Space>
                </List.Item>
              )}
            />
          </div>
        ))}

        {/* Log Activity Modal */}
        <Modal
          title={editingActivity ? 'Edit Activity' : 'Log Activity'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select options={['call', 'email', 'meeting', 'whatsapp', 'visit', 'note', 'system']} />
            </Form.Item>
            <Form.Item name="direction" label="Direction">
              <Select options={['outbound', 'inbound']} />
            </Form.Item>
            <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="duration_minutes" label="Duration (minutes)">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item name="next_action" label="Next Action">
              <Input />
            </Form.Item>
            <Form.Item name="next_follow_up" label="Next Follow-up Date">
              <Input type="date" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </ConfigProvider>
  );
};

export default ActivityTimeline;
