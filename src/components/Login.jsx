import React, { useState, useEffect } from 'react';
import { Card, Typography, message, ConfigProvider, theme, Space, Modal } from 'antd';
import { SafetyOutlined, GlobalOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store';
import { getLanguage, setLanguage } from '../i18n';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(getLanguage());
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    setLang(newLang);
  };

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const l = {
    welcome: lang === 'zh' ? '欢迎使用 Prestige CRM' : 'Welcome to Prestige CRM',
    subtitle: lang === 'zh' ? '企业客户关系管理' : 'Enterprise Customer Relationship Management',
    pleaseEmail: lang === 'zh' ? '请输入邮箱地址' : 'Please enter your email',
    emailPlaceholder: lang === 'zh' ? '邮箱地址' : 'Email address',
    pleasePassword: lang === 'zh' ? '请输入密码' : 'Please enter your password',
    passwordPlaceholder: lang === 'zh' ? '密码' : 'Password',
    signIn: lang === 'zh' ? '登录' : 'Sign In',
    secureLogin: lang === 'zh' ? '安全登录 · 企业版' : 'Secure login · Enterprise edition',
    invalidCredentials: lang === 'zh' ? '邮箱或密码错误，请重试。' : 'Invalid email or password. Please try again.',
    connectionError: lang === 'zh' ? '无法连接到服务器。请检查网络连接后重试。' : 'Unable to connect to the server. Please check your network connection and try again.',
    authFailed: lang === 'zh' ? '认证失败' : 'Authentication Failed',
    connError: lang === 'zh' ? '连接错误' : 'Connection Error',
    ok: lang === 'zh' ? '确定' : 'OK',
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      
      if (data.success) {
        login(data.data);
        message.success({ content: l.welcome, style: { top: '33px' } });
        onLoginSuccess(data.data);
        navigate('/dashboard');
      } else {
        Modal.error({
          title: l.authFailed,
          content: data.message || l.invalidCredentials,
          centered: false,
          maskClosable: false,
          okText: l.ok,
          style: { top: 120 },
        });
      }
    } catch (err) {
      Modal.error({
        title: l.connError,
        content: l.connectionError,
        centered: false,
        maskClosable: false,
        okText: l.ok,
        style: { top: 120 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit({ email: e.target.email.value, password: e.target.password.value });
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#003DA5',
          borderRadius: 8,
        },
        components: {
          Card: {
            boxShadowTertiary: '0 2px 8px rgba(0,0,0,0.08)',
            colorBgContainer: 'transparent',
          },
        },
      }}
    >
      <div className="login-page-wrapper">
      {/* Language Switch - Top Right Corner */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10, display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(100, 160, 255, 0.2)' }}>
        <button
          onClick={toggleLanguage}
          style={{
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: lang === 'en' ? 'rgba(100, 160, 255, 0.3)' : 'rgba(20, 30, 60, 0.5)',
            color: lang === 'en' ? '#fff' : 'rgba(180, 200, 240, 0.7)',
            transition: 'all 0.2s',
          }}
        >
          EN
        </button>
        <button
          onClick={toggleLanguage}
          style={{
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: lang === 'zh' ? 'rgba(100, 160, 255, 0.3)' : 'rgba(20, 30, 60, 0.5)',
            color: lang === 'zh' ? '#fff' : 'rgba(180, 200, 240, 0.7)',
            transition: 'all 0.2s',
          }}
        >
          中文
        </button>
      </div>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundImage: "url('/assets/login-bg-4k-deepblue.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        {/* Light overlay — keep it readable without being too dark */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(10, 20, 50, 0.35) 0%, rgba(5, 10, 30, 0.6) 100%)',
          zIndex: 0,
        }}></div>
        <Card
          className="login-card"
          style={{
            width: 420,
            borderRadius: 16,
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative',
            zIndex: 1,
            border: '1px solid rgba(100, 160, 255, 0.12)',
            background: 'rgba(10, 15, 30, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: 0,
          }}
        >
          <style>{`
            .ant-card-body {
              padding: 0 !important;
            }
            .login-page-wrapper .login-card .login-input-field {
              width: 100%;
              padding: 13px 16px;
              margin-bottom: 16px;
              border: 1px solid rgba(100, 160, 255, 0.15);
              border-radius: 10px;
              font-size: 14px;
              background: rgba(20, 30, 60, 0.5);
              color: #e0e8ff;
              outline: none;
              transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
              display: block;
              box-sizing: border-box;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .login-page-wrapper .login-card .login-input-field:focus {
              border-color: rgba(100, 180, 255, 0.55);
              box-shadow: 0 0 0 3px rgba(80, 160, 255, 0.1);
              background: rgba(25, 40, 80, 0.6);
            }
            .login-page-wrapper .login-card .login-input-field::placeholder {
              color: rgba(140, 170, 220, 0.45);
            }
            .login-page-wrapper .login-card .login-button {
              width: 100%;
              padding: 13px;
              background: linear-gradient(135deg, #1a6fc4 0%, #003DA5 100%);
              color: #fff;
              border: none;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 700;
              cursor: pointer;
              letter-spacing: 0.5px;
              margin-top: 4px;
              transition: transform 0.15s, box-shadow 0.15s;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .login-page-wrapper .login-card .login-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 6px 20px rgba(26, 111, 196, 0.3);
            }
            .login-page-wrapper .login-card .login-button:active {
              transform: translateY(0);
            }
          `}</style>
          <div style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: '#ffffff', marginBottom: 8, fontWeight: 700, fontSize: 26, letterSpacing: '-0.3px', textAlign: 'center' }}>
              Prestige CRM
            </Title>
            <Text style={{ color: 'rgba(180, 200, 240, 0.7)', fontSize: 13, lineHeight: 1.4, textAlign: 'center', display: 'block' }}>{l.subtitle}</Text>
          </div>

          <form onSubmit={handleFormSubmit} style={{ width: '100%' }}>
            <input
              name="email"
              type="email"
              placeholder={l.emailPlaceholder}
              autoComplete="email"
              className="login-input-field"
            />
            <input
              name="password"
              type="password"
              placeholder={l.passwordPlaceholder}
              autoComplete="current-password"
              className="login-input-field"
            />
            <button
              type="submit"
              className="login-button"
            >
              {l.signIn}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 4 }}>
            <Space>
              <SafetyOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {l.secureLogin}
              </Text>
            </Space>
          </div>
          </div>
        </Card>
      </div>
      </div>
    </ConfigProvider>
  );
};

export default Login;
