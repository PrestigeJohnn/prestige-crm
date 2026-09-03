import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Space, Typography, ConfigProvider, theme, Modal, Form, Select, message, Input, Divider, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PushpinOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const categoryLabels = {
  general: 'General', preference: 'Preference', decision_maker: 'Decision Maker',
  pain_point: 'Pain Point', competitor: 'Competitor', budget: 'Budget',
  timeline: 'Timeline', personal: 'Personal'
};

const categoryColors = {
  general: 'blue', preference: 'green', decision_maker: 'purple',
  pain_point: 'red', competitor: 'orange', budget: 'gold',
  timeline: 'cyan', personal: 'magenta'
};

const importanceColors = { low: 'default', medium: 'blue', high: 'orange', critical: 'red' };

const AccountNotes = ({ accountId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchNotes = async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ pinned: 'false' });
      if (filterCategory !== 'all') params.set('category', filterCategory);
      const res = await fetch(`/api/account-notes/account/${accountId}?${params}`);
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } catch (err) {
      message.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [accountId, filterCategory]);

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/account-notes/account/${id}`, { method: 'DELETE' });
      message.success('Note deleted');
      fetchNotes();
    } catch { message.error('Failed to delete'); }
  };

  const handleSave = async (values) => {
    try {
      const url = editingNote ? `/api/account-notes/account/${editingNote.id}` : '/api/account-notes/account';
      const method = editingNote ? 'PUT' : 'POST';
      const body = editingNote ? { ...values, id: editingNote.id } : { ...values, account_id: accountId };
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        message.success(editingNote ? 'Note updated' : 'Note created');
        setModalVisible(false);
        form.resetFields();
        fetchNotes();
      }
    } catch { message.error('Failed to save'); }
  };

  const filteredNotes = notes.filter(n =>
    n.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    n.content?.toLowerCase().includes(searchText.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const normalNotes = filteredNotes.filter(n => !n.is_pinned);

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Card
        title="Account Notes"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingNote(null); form.resetFields(); setModalVisible(true); }}>
            Add Note
          </Button>
        }
      >
        {/* Filters */}
        <Space style={{ marginBottom: 16 }}>
          <Select value={filterCategory} onChange={setFilterCategory} style={{ width: 160 }} options={[{ value: 'all', label: 'All Categories' }, ...Object.keys(categoryLabels).map(k => ({ value: k, label: categoryLabels[k] }))] } />
          <Input placeholder="Search notes..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 200 }} allowClear />
        </Space>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <>
            <Divider orientation="left" plain>
              <PushpinOutlined style={{ color: '#FF8C00' }} /> Pinned
            </Divider>
            <List grid={{ gutter: 16, column: 2 }} dataSource={pinnedNotes} loading={loading} renderItem={(note) => (
              <List.Item>
                <Card size="small" style={{ borderLeft: `4px solid ${categoryColors[note.category] || 'gray'}`, borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <Space size="small">
                        <Text strong>{note.title}</Text>
                        <Tag color={categoryColors[note.category]}>{categoryLabels[note.category]}</Tag>
                        <Tag color={importanceColors[note.importance]}>{note.importance}</Tag>
                      </Space>
                      <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>{note.content}</div>
                      <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
                        Last updated: {note.updated_at ? new Date(note.updated_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }) : '-'}
                      </div>
                    </div>
                    <Space>
                      <Button type="text" size="small" icon={<Pushpin />} style={{ color: '#FF8C00' }} />
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingNote(note); form.setFieldsValue(note); setModalVisible(true); }} />
                      <Popconfirm title="Delete this note?" onConfirm={() => handleDelete(note.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              </List.Item>
            )} />
          </>
        )}

        {/* Normal Notes */}
        {normalNotes.length > 0 && (
          <>
            <Divider orientation="left">All Notes</Divider>
            <List grid={{ gutter: 16, column: 2 }} dataSource={normalNotes} loading={loading} renderItem={(note) => (
              <List.Item>
                <Card size="small" style={{ borderLeft: `4px solid ${categoryColors[note.category] || 'gray'}`, borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <Space size="small">
                        <Text strong>{note.title}</Text>
                        <Tag color={categoryColors[note.category]}>{categoryLabels[note.category]}</Tag>
                        <Tag color={importanceColors[note.importance]}>{note.importance}</Tag>
                      </Space>
                      <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>{note.content}</div>
                      <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
                        Created: {note.created_at ? new Date(note.created_at).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' }) : '-'}
                      </div>
                    </div>
                    <Space>
                      <Button type="text" size="small" icon={<PushpinOutlined />} onClick={() => handleSave({ ...note, is_pinned: 1 })} />
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingNote(note); form.setFieldsValue(note); setModalVisible(true); }} />
                      <Popconfirm title="Delete this note?" onConfirm={() => handleDelete(note.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              </List.Item>
            )} />
          </>
        )}

        {filteredNotes.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>No notes yet. Click "Add Note" to create one.</div>}

        {/* Add/Edit Modal */}
        <Modal
          title={editingNote ? 'Edit Note' : 'Add Note'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select options={Object.keys(categoryLabels).map(k => ({ value: k, label: categoryLabels[k] }))} />
            </Form.Item>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="importance" label="Importance">
              <Select options={['low', 'medium', 'high', 'critical']} />
            </Form.Item>
            <Form.Item name="content" label="Content" rules={[{ required: true }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="is_pinned" label="Pin to top" valuePropName="checked" getValueProps={(v) => ({ value: !!v })} getValueFromEvent={(v) => v ? 1 : 0}>
              <Select options={[{ value: 1, label: 'Pin' }, { value: 0, label: 'Do not pin' }]} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </ConfigProvider>
  );
};

export default AccountNotes;
