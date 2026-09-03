import React, { useState, useEffect } from 'react';
import { Card, Typography, ConfigProvider, theme, Row, Col, Statistic } from 'antd';
import { DollarOutlined, TeamOutlined, FileTextOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Title } = Typography;

const Reports = () => {
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const l = lang === 'zh'
    ? { title:'报表', subtitle:'商业分析和报表', totalRevenue:'总收入', totalCustomers:'总客户', openQuotes:'待处理报价', openOrders:'待处理订单', reportTemplates:'报表模板', comingSoon:'销售报表、管道分析、活动摘要和自定义报表即将推出...' }
    : { title:'Reports', subtitle:'Business analytics and reports', totalRevenue:'Total Revenue', totalCustomers:'Total Customers', openQuotes:'Open Quotes', openOrders:'Open Orders', reportTemplates:'Report Templates', comingSoon:'Sales reports, pipeline analysis, activity summaries, and custom reports coming soon.' };

  const stats = [
    { title: l.totalRevenue, value: '$1,250,000', icon: <DollarOutlined />, color: '#003DA5' },
    { title: l.totalCustomers, value: 248, icon: <TeamOutlined />, color: '#0073CF' },
    { title: l.openQuotes, value: 34, icon: <FileTextOutlined />, color: '#00A651' },
    { title: l.openOrders, value: 12, icon: <ShoppingCartOutlined />, color: '#FF8C00' },
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title={l.title} subtitle={l.subtitle}>
        <Row gutter={[16, 16]}>
          {stats.map((s, i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card className="page-card" styles={{ body: { padding: '20px 24px' } }}>
                <Statistic title={<span style={{ color: s.color }}>{s.icon} {s.title}</span>} value={s.value} valueStyle={{ fontSize: 28, fontWeight: 700 }} />
              </Card>
            </Col>
          ))}
        </Row>
        <Card className="page-card" style={{ marginTop: 20 }} title={<Title level={5} style={{ margin: 0 }}>{l.reportTemplates}</Title>}>
          <p style={{ color: '#8c8c8c' }}>{l.comingSoon}</p>
        </Card>
      </Page>
    </ConfigProvider>
  );
};

export default Reports;
