import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, ConfigProvider, theme, message, Divider, Card, Space, Switch, Select, InputNumber, Radio, Slider } from 'antd';
import { SaveOutlined, LockOutlined, GlobalOutlined, BellOutlined, SettingOutlined, DashboardOutlined, CloudServerOutlined, DatabaseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Title } = Typography;

const Settings = () => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState({});
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.data || {}); })
      .catch(() => {});
  }, []);

  useEffect(() => { form.setFieldsValue(settings); }, [settings, form]);

  const l = lang === 'zh'
    ? { title:'设置', subtitle:'系统配置和偏好', companyInfo:'公司信息', companyName:'公司名称', companyAddress:'地址', companyPhone:'电话', companyEmail:'邮箱', companyWebsite:'网站', security:'安全', twoFactorAuth:'双因素认证', minPasswordLen:'最小密码长度', sessionTimeout:'会话超时(分钟)', maxLoginAttempts:'最大登录尝试次数', forcePwdChange:'强制定期更换密码', appearance:'外观', themeMode:'主题模式', themeLight:'浅色', themeDark:'深色', themeAuto:'跟随系统', localization:'本地化', language:'语言', timezone:'时区', currency:'货币', dateFormat:'日期格式', notifications:'通知', emailNotif:'邮件通知', pushNotif:'推送通知', notifSound:'通知声音', dashboard:'仪表板', itemsPerPage:'每页项目数', autoRefresh:'自动刷新间隔(秒)', dataManagement:'数据管理', backupFreq:'自动备份频率', dataRetention:'数据保留(天)', auditCompliance:'审计与合规', enableAuditLog:'启用审计日志', auditRetention:'审计日志保留(天)', serverInfo:'服务器信息', saveSettings:'保存设置', reset:'重置', on:'开启', off:'关闭', enabled:'启用', disabled:'禁用', daily:'每日', weekly:'每周', monthly:'每月', default:'默认', chime:'提示音', none:'无', sgt:'新加坡标准时间', cst:'中国标准时间', est:'美国东部时间', gmt:'格林威治时间', sgd:'新加坡元', usd:'美元', eur:'欧元', cny:'人民币', help:'需要帮助？', contactJohnn:'请联系 Johnn', contactEmail:'johnn@prestigesolutions.com.sg' }
    : { title:'Settings', subtitle:'System configuration and preferences', companyInfo:'Company Information', companyName:'Company Name', companyAddress:'Address', companyPhone:'Phone', companyEmail:'Email', companyWebsite:'Website', security:'Security', twoFactorAuth:'Two-Factor Authentication', minPasswordLen:'Minimum Password Length', sessionTimeout:'Session Timeout (minutes)', maxLoginAttempts:'Max Login Attempts Before Lockout', forcePwdChange:'Force Password Change Every (days)', appearance:'Appearance', themeMode:'Theme Mode', themeLight:'Light', themeDark:'Dark', themeAuto:'Auto', localization:'Localization', language:'Language', timezone:'Timezone', currency:'Currency', dateFormat:'Date Format', notifications:'Notifications', emailNotif:'Email Notifications', pushNotif:'Push Notifications', notifSound:'Notification Sound', dashboard:'Dashboard', itemsPerPage:'Items Per Page', autoRefresh:'Auto Refresh Interval (seconds)', dataManagement:'Data Management', backupFreq:'Automatic Backup Frequency', dataRetention:'Data Retention (days)', auditCompliance:'Audit & Compliance', enableAuditLog:'Enable Audit Logging', auditRetention:'Audit Log Retention (days)', serverInfo:'Server Information', saveSettings:'Save Settings', reset:'Reset', on:'ON', off:'OFF', enabled:'Enabled', disabled:'Disabled', daily:'Daily', weekly:'Weekly', monthly:'Monthly', default:'Default', chime:'Chime', none:'None', sgt:'SGT (UTC+8)', cst:'CST (UTC+8)', est:'EST (UTC-5)', gmt:'GMT (UTC+0)', sgd:'SGD - Singapore Dollar', usd:'USD - US Dollar', eur:'EUR - Euro', cny:'CNY - Chinese Yuan', help:'Need Help?', contactJohnn:'Please contact Johnn', contactEmail:'johnn@prestigesolutions.com.sg' };

  const handleSave = async (values) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) { message.success(l.saveSettings); }
    } catch (err) { message.error(l.saveSettings + ' failed'); }
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title={l.title} subtitle={l.subtitle}>
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ maxWidth: 800 }}>
          {/* Company Information */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><SettingOutlined /> {l.companyInfo}</>}>
            <Form.Item name="company_name" label={l.companyName} rules={[{ required: true }]}>
              <Input placeholder="Prestige Solutions Pte Ltd" />
            </Form.Item>
            <Form.Item name="company_address" label={l.companyAddress}>
              <Input placeholder="123 Business Ave, Singapore" />
            </Form.Item>
            <Form.Item name="company_phone" label={l.companyPhone}>
              <Input placeholder="+65 1234 5678" />
            </Form.Item>
            <Form.Item name="company_email" label={l.companyEmail}>
              <Input type="email" placeholder="info@prestigecrm.com.sg" />
            </Form.Item>
            <Form.Item name="company_website" label={l.companyWebsite}>
              <Input placeholder="https://prestigecrm.com.sg" />
            </Form.Item>
          </Card>

          {/* Appearance — Theme Mode */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><GlobalOutlined /> {l.appearance}</>}>
            <Form.Item name="theme_mode" label={l.themeMode} initialValue="auto">
              <Select options={[
                { value: 'light', label: l.themeLight },
                { value: 'dark', label: l.themeDark },
                { value: 'auto', label: l.themeAuto },
              ]} />
            </Form.Item>
          </Card>

          {/* Security */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><LockOutlined /> {l.security}</>}>
            <Form.Item name="two_factor_auth" label={l.twoFactorAuth} valuePropName="checked" initialValue={false}>
              <Switch checkedChildren={l.on} uncheckedChildren={l.off} />
            </Form.Item>
            <Form.Item name="password_min_length" label={l.minPasswordLen}>
              <InputNumber min={6} max={32} defaultValue={8} />
            </Form.Item>
            <Form.Item name="session_timeout" label={l.sessionTimeout}>
              <InputNumber min={5} max={1440} defaultValue={30} />
            </Form.Item>
            <Form.Item name="max_login_attempts" label={l.maxLoginAttempts}>
              <InputNumber min={1} max={10} defaultValue={5} />
            </Form.Item>
            <Form.Item name="require_password_change" label={l.forcePwdChange} valuePropName="checked" initialValue={false}>
              <Switch checkedChildren={l.enabled} uncheckedChildren={l.disabled} />
            </Form.Item>
          </Card>

          {/* Localization */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><GlobalOutlined /> {l.localization}</>}>
            <Form.Item name="language" label={l.language}>
              <Select options={[{ value: 'en', label: 'English' }, { value: 'zh', label: '简体中文' }]} />
            </Form.Item>
            <Form.Item name="timezone" label={l.timezone}>
              <Select options={[
                { value: 'Asia/Singapore', label: l.sgt },
                { value: 'Asia/Shanghai', label: l.cst },
                { value: 'America/New_York', label: l.est },
                { value: 'Europe/London', label: l.gmt },
              ]} />
            </Form.Item>
            <Form.Item name="currency" label={l.currency}>
              <Select options={[
                { value: 'SGD', label: l.sgd },
                { value: 'USD', label: l.usd },
                { value: 'EUR', label: l.eur },
                { value: 'CNY', label: l.cny },
              ]} />
            </Form.Item>
            <Form.Item name="date_format" label={l.dateFormat}>
              <Select options={[
                { value: 'YYYY-MM-DD', label: '2026-06-24' },
                { value: 'DD/MM/YYYY', label: '24/06/2026' },
                { value: 'MM/DD/YYYY', label: '06/24/2026' },
              ]} />
            </Form.Item>
          </Card>

          {/* Notifications */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><BellOutlined /> {l.notifications}</>}>
            <Form.Item name="email_notifications" label={l.emailNotif} valuePropName="checked" initialValue={true}>
              <Switch checkedChildren={l.on} uncheckedChildren={l.off} />
            </Form.Item>
            <Form.Item name="push_notifications" label={l.pushNotif} valuePropName="checked" initialValue={true}>
              <Switch checkedChildren={l.on} uncheckedChildren={l.off} />
            </Form.Item>
            <Form.Item name="notification_sound" label={l.notifSound}>
              <Select options={[
                { value: 'default', label: l.default },
                { value: 'chime', label: l.chime },
                { value: 'none', label: l.none },
              ]} />
            </Form.Item>
          </Card>

          {/* Dashboard */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><DashboardOutlined /> {l.dashboard}</>}>
            <Form.Item name="dashboard_items_per_page" label={l.itemsPerPage}>
              <Slider min={5} max={50} step={5} defaultValue={20} />
            </Form.Item>
            <Form.Item name="auto_refresh_interval" label={l.autoRefresh}>
              <InputNumber min={0} max={3600} defaultValue={60} />
            </Form.Item>
          </Card>

          {/* Data Management */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><DatabaseOutlined /> {l.dataManagement}</>}>
            <Form.Item name="backup_frequency" label={l.backupFreq}>
              <Radio.Group options={[
                { value: 'daily', label: l.daily },
                { value: 'weekly', label: l.weekly },
                { value: 'monthly', label: l.monthly },
              ]} />
            </Form.Item>
            <Form.Item name="data_retention_days" label={l.dataRetention}>
              <InputNumber min={30} max={3650} defaultValue={365} />
            </Form.Item>
          </Card>

          {/* Audit & Compliance */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><SafetyCertificateOutlined /> {l.auditCompliance}</>}>
            <Form.Item name="audit_log_enabled" label={l.enableAuditLog} valuePropName="checked" initialValue={true}>
              <Switch checkedChildren={l.on} uncheckedChildren={l.off} />
            </Form.Item>
            <Form.Item name="audit_log_retention" label={l.auditRetention}>
              <InputNumber min={30} max={3650} defaultValue={730} />
            </Form.Item>
          </Card>

          {/* Server Info */}
          <Card className="page-card" style={{ marginBottom: 16 }} title={<><CloudServerOutlined /> {l.serverInfo}</>}>
            <Divider style={{ margin: '8px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div><strong>Server:</strong> localhost:3002</div>
              <div><strong>Database:</strong> SQLite (PrestigeCRM.db)</div>
              <div><strong>Version:</strong> 2.0.0</div>
              <div><strong>Last Backup:</strong> N/A</div>
            </Space>
          </Card>

          {/* Help / Contact */}
          <Card className="page-card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f0f5ff, #e6f0ff)', borderColor: '#bae0ff' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                <SafetyCertificateOutlined style={{ color: '#003DA5', marginRight: 8 }} />
                {l.help}
              </div>
              <div style={{ fontSize: 13, color: '#555' }}>
                {l.contactJohnn}:
              </div>
              <a href="mailto:johnn@prestigesolutions.com.sg" style={{ fontSize: 14, fontWeight: 500 }}>
                johnn@prestigesolutions.com.sg
              </a>
            </Space>
          </Card>

          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" size="large">
              {l.saveSettings}
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => form.resetFields()}>
              {l.reset}
            </Button>
          </Form.Item>
        </Form>
      </Page>
    </ConfigProvider>
  );
};

export default Settings;
