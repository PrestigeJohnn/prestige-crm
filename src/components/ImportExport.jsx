import React, { useState, useEffect } from 'react';
import { Typography, Card, Descriptions, Button, Space, ConfigProvider, theme } from 'antd';
import { DownloadOutlined, UploadOutlined, FileTextOutlined, DatabaseOutlined } from '@ant-design/icons';
import Page from './Page';
import { getLanguage } from '../i18n';

const { Title, Text, Paragraph } = Typography;

const ImportExport = () => {
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const l = lang === 'zh'
    ? { title:'导入/导出', subtitle:'以各种格式导入导出数据', importData:'导入数据', exportData:'导出数据', supportedFormats:'支持的格式', entities:'实体', instructions:'说明', uploadFile:'上传文件', downloadTemplate:'下载模板', exportAll:'导出全部数据', exportSelected:'导出选中', supportedFormatsCsv:'CSV, Excel (.xlsx), JSON', supportedFormatsExport:'CSV, Excel (.xlsx), PDF', entitiesDesc:'账户、联系人、潜在客户、商机、订单、产品', entitiesAll:'支持所有实体', step1:'1. 下载您的实体模板', step2:'2. 填写数据', step3:'3. 上传文件', step4:'4. 审核并确认导入' }
    : { title:'Import / Export', subtitle:'Import and export data in various formats', importData:'Import Data', exportData:'Export Data', supportedFormats:'Supported Formats', entities:'Entities', instructions:'Instructions', uploadFile:'Upload File', downloadTemplate:'Download Template', exportAll:'Export All Data', exportSelected:'Export Selected', supportedFormatsCsv:'CSV, Excel (.xlsx), JSON', supportedFormatsExport:'CSV, Excel (.xlsx), PDF', entitiesDesc:'Accounts, Contacts, Leads, Opportunities, Orders, Products', entitiesAll:'All entities supported', step1:'1. Download the template for your entity', step2:'2. Fill in the data', step3:'3. Upload the file', step4:'4. Review and confirm import' };

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#003DA5', borderRadius: 8 } }}>
      <Page title={l.title} subtitle={l.subtitle}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card className="page-card">
            <Descriptions title={<><UploadOutlined /> {l.importData}</>} bordered column={1}>
              <Descriptions.Item label={l.supportedFormats}>{l.supportedFormatsCsv}</Descriptions.Item>
              <Descriptions.Item label={l.entities}>{l.entitiesDesc}</Descriptions.Item>
              <Descriptions.Item label={l.instructions}>
                <Paragraph style={{ margin: 0 }}>{l.step1}<br />{l.step2}<br />{l.step3}<br />{l.step4}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16 }}>
              <Button icon={<UploadOutlined />}>{l.uploadFile}</Button>
              <Button>{l.downloadTemplate}</Button>
            </Space>
          </Card>
          <Card className="page-card">
            <Descriptions title={<><DownloadOutlined /> {l.exportData}</>} bordered column={1}>
              <Descriptions.Item label={l.supportedFormats}>{l.supportedFormatsExport}</Descriptions.Item>
              <Descriptions.Item label={l.entities}>{l.entitiesAll}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16 }}>
              <Button icon={<DownloadOutlined />}>{l.exportAll}</Button>
              <Button>{l.exportSelected}</Button>
            </Space>
          </Card>
        </Space>
      </Page>
    </ConfigProvider>
  );
};

export default ImportExport;
