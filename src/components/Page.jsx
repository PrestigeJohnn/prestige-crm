import React from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

/**
 * Unified page wrapper for consistent layout across all pages
 * All pages use identical: title font-size 24px, subtitle 13px, spacing, height
 */
const Page = ({ title, subtitle, children, extra }) => (
  <div className="page-container" style={{ marginBottom: 24, maxWidth: '100%', boxSizing: 'border-box' }}>
    <div className="page-header" style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Title level={3} style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1.2,
          color: '#1a1a1a',
        }}>
          {title}
        </Title>
        {subtitle && (
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
            {subtitle}
          </Text>
        )}
      </div>
      {extra && <div style={{ flexShrink: 0, marginTop: extra ? 0 : 0 }}>{extra}</div>}
    </div>
    {children}
  </div>
);

export default Page;
