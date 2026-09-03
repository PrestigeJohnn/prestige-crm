import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Contacts from './components/Contacts';
import Leads from './components/Leads';
import Opportunities from './components/Opportunities';
import Orders from './components/Orders';
import Activities from './components/Activities';
import Tasks from './components/Tasks';
import Documents from './components/Documents';
import Communications from './components/Communications';
import Meetings from './components/Meetings';
import ContractsInvoices from './components/ContractsInvoices';
import Cases from './components/Cases';
import Reports from './components/Reports';
import AuditLogs from './components/AuditLogs';
import Notifications from './components/Notifications';
import ImportExport from './components/ImportExport';
import Settings from './components/Settings';
import AccountDetail from './components/AccountDetail';
import Products from './components/Products';
import Quotes from './components/Quotes';
import QuotationBuilder from './components/QuotationBuilder';
import PRRequest from './components/PRRequest';
import EquipmentLoanForm from './components/EquipmentLoanForm';
import TemplateManager from './components/TemplateManager';
import ApprovalWorkflows from './components/ApprovalWorkflows';
import Profile from './components/Profile';
import { useAuthStore } from './store';

// Prevent browser back navigation after logout
const BackNavigationGuard = () => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  useEffect(() => {
    // Push a dummy state to prevent back navigation
    history.pushState(null, '', location.pathname);
    const handlePopState = () => {
      // If user tries to go back, push them forward instead
      if (isAuthenticated()) {
        history.pushState(null, '', location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, isAuthenticated]);
  
  return null;
};

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F3F2F1' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div style={{
        flex: 1,
        marginLeft: collapsed ? 64 : 200,
        transition: 'margin-left 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}>
        <Header collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        <div className="main-scroll-container">
          <div className="main-scroll">{children}</div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);

  return (
    <BrowserRouter>
      <BackNavigationGuard />
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={setLoggedInUser} />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
        <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
        <Route path="/quotation-builder" element={<ProtectedRoute><QuotationBuilder /></ProtectedRoute>} />
        <Route path="/pr-requests" element={<ProtectedRoute><PRRequest /></ProtectedRoute>} />
        <Route path="/equipment-loans" element={<ProtectedRoute><EquipmentLoanForm /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><TemplateManager /></ProtectedRoute>} />
        <Route path="/approval-workflows" element={<ProtectedRoute><ApprovalWorkflows /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/communications" element={<ProtectedRoute><Communications /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute><ContractsInvoices contractsTab active /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><ContractsInvoices invoicesTab active /></ProtectedRoute>} />
        <Route path="/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/import-export" element={<ProtectedRoute><ImportExport /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
