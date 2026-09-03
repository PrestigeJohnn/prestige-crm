import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Tag, Typography, Space, ConfigProvider, theme, Progress, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { getLanguage, useTranslation } from '../i18n';
import {
  DashboardOutlined,
  ApartmentOutlined,
  TeamOutlined,
  AimOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  LineChartOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Hover scrollbar — ultra-thin, visible on hover
const scrollbarCSS = `
  .dash-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
  .dash-scroll::-webkit-scrollbar-track { background: transparent; }
  .dash-scroll::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 2px;
    transition: background 0.2s ease;
  }
  .dash-scroll:hover::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.3);
  }
  /* Apply same scrollbar to card tables */
  .dash-scroll .ant-table-body::-webkit-scrollbar { width: 3px; height: 3px; }
  .dash-scroll .ant-table-body::-webkit-scrollbar-track { background: transparent; }
  .dash-scroll .ant-table-body::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 2px;
    transition: background 0.2s ease;
  }
  .dash-scroll .ant-table-body:hover::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.3);
  }
  /* Center-align table cells vertically */
  .dash-scroll .ant-table-tbody > tr > td {
    text-align: center !important;
    vertical-align: middle !important;
  }
  .dash-scroll .ant-table-thead > tr > th {
    text-align: center !important;
    vertical-align: middle !important;
  }
/* Drag-and-drop visual feedback — highlight target row during drag */
.task-table .ant-table-tbody > tr.drag-over {
  background-color: #e6f0ff !important;
  border-top: 2px solid #003DA5 !important;
}
.task-table .ant-table-tbody > tr {
  cursor: grab !important;
}
.task-table .ant-table-tbody > tr:active {
  cursor: grabbing !important;
}
`;

// Native HTML5 drag-and-drop for task reordering — handled via onRow on the Table

const Dashboard = () => {
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  const labels = lang === 'zh'
    ? {
      dashboard: '仪表盘',
      welcomeBack: '欢迎回到 Prestige CRM',
      last24h: '最近24小时',
      last7Days: '最近7天',
      last30Days: '最近30天',
      last90Days: '最近90天',
      startDate: '开始日期',
      endDate: '结束日期',
      totalAccounts: '客户总数',
      activeContacts: '活跃联系人',
      pipelineValue: '销售管线总额',
      openOpportunities: '进行中商机',
      revenueThisMonth: '本月营收',
      conversionRate: '转化率',
      recentActivities: '最近活动',
      upcomingTasks: '待办任务',
      topAccounts: '重点客户',
      pipelineByStage: '管线阶段分布',
      weeklyPerformance: '每周业绩',
      account: '客户',
      type: '类型',
      action: '动作',
      user: '用户',
      time: '时间',
      status: '状态',
      task: '工作',
      assignedTo: '负责人',
      due: '截止日',
      priority: '优先级',
      revenue: '营收',
      opportunities: '商机',
      stage: '阶段',
      count: '数量',
      value: '价值',
      ofPipeline: '占管线',
      day: '星期',
      totalActivities: '总活动',
      calls: '电话',
      emails: '邮件',
      noTasks: '无任务',
      call: '电话',
      email: '邮件',
      meeting: '会议',
      taskType: '任务',
      whatsapp: 'WhatsApp',
      followUpCall: '跟进电话',
      sentQuotation: '已送出报价',
      productDemo: '产品演示',
      prepareProposal: '准备提案',
      priceDiscussion: '价格讨论',
      completed: '已完成',
      sent: '已送出',
      scheduled: '已排程',
      pending: '待处理',
      high: '高',
      medium: '中',
      low: '低',
      prospecting: '探索',
      qualification: '认证',
      proposal: '方案',
      negotiation: '谈判',
      closing: '成交',
      accountName: '客户名称',
      employees: '员工数',
      probability: '成功率',
      expectedClose: '预计成交日',
      amount: '金额',
    }
    : {
      dashboard: 'Dashboard',
      welcomeBack: 'Welcome back to Prestige CRM',
      last24h: 'Last 24h',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      startDate: 'Start Date',
      endDate: 'End Date',
      totalAccounts: 'Total Accounts',
      activeContacts: 'Active Contacts',
      pipelineValue: 'Pipeline Value',
      openOpportunities: 'Open Opportunities',
      revenueThisMonth: 'Revenue This Month',
      conversionRate: 'Conversion Rate',
      recentActivities: 'Recent Activities',
      upcomingTasks: 'Upcoming Tasks',
      topAccounts: 'Top Accounts',
      pipelineByStage: 'Pipeline by Stage',
      weeklyPerformance: 'Weekly Performance',
      account: 'Account',
      type: 'Type',
      action: 'Action',
      user: 'User',
      time: 'Time',
      status: 'Status',
      task: 'Task',
      assignedTo: 'Assigned To',
      due: 'Due',
      priority: 'Priority',
      revenue: 'Revenue',
      opportunities: 'Opportunities',
      stage: 'Stage',
      count: 'Count',
      value: 'Value',
      ofPipeline: '% of Pipeline',
      day: 'Day',
      totalActivities: 'Total Activities',
      calls: 'Calls',
      emails: 'Emails',
      noTasks: 'No tasks',
      call: 'Call',
      email: 'Email',
      meeting: 'Meeting',
      taskType: 'Task',
      whatsapp: 'WhatsApp',
      followUpCall: 'Follow-up call',
      sentQuotation: 'Sent quotation',
      productDemo: 'Product demo',
      prepareProposal: 'Prepare proposal',
      priceDiscussion: 'Price discussion',
      completed: 'completed',
      sent: 'sent',
      scheduled: 'scheduled',
      pending: 'pending',
      high: 'high',
      medium: 'medium',
      low: 'low',
      prospecting: 'Prospecting',
      qualification: 'Qualification',
      proposal: 'Proposal',
      negotiation: 'Negotiation',
      closing: 'Closing',
      accountName: 'Account Name',
      employees: 'Employees',
      probability: 'Probability',
      expectedClose: 'Expected Close',
      amount: 'Amount',
    };

  // Prevent page scroll on keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Home', 'End'].includes(e.key)) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  const [dateRange, setDateRange] = useState(['custom']);
  const [pickerDates, setPickerDates] = useState([]);

  // Auto-fill date range when presets selected
  useEffect(() => {
    const preset = dateRange[0];
    if (preset === 'today') {
      setPickerDates([dayjs(), dayjs()]);
    } else if (preset === 'week') {
      // Last week: Monday to Sunday of the previous week (7 full days)
      const today = dayjs();
      const dayOfWeek = today.day() || 7; // Sunday=7
      const lastSunday = today.subtract(dayOfWeek, 'day');
      const lastMonday = lastSunday.subtract(6, 'day');
      setPickerDates([lastMonday, lastSunday]);
    } else if (preset === 'twoweek') {
      // Last 2 weeks: Monday of 2 weeks ago to Sunday of last week (14 full days)
      const today = dayjs();
      const dayOfWeek = today.day() || 7;
      const lastSunday = today.subtract(dayOfWeek, 'day');
      const twoWeeksMonday = lastSunday.subtract(13, 'day');
      setPickerDates([twoWeeksMonday, lastSunday]);
    } else if (preset === 'month') {
      // Last month: full previous month
      const lastMonth = dayjs().subtract(1, 'month');
      setPickerDates([lastMonth.startOf('month'), lastMonth.endOf('month')]);
    } else if (preset === 'thismonth') {
      // This month: full current month
      setPickerDates([dayjs().startOf('month'), dayjs().endOf('month')]);
    } else if (preset === 'quarter') {
      // Last 3 months: from 3 months ago start of month to end of last month
      const threeMonthsAgo = dayjs().subtract(3, 'month');
      const startOfMonth = threeMonthsAgo.startOf('month');
      const endOfLastMonth = dayjs().subtract(1, 'month').endOf('month');
      setPickerDates([startOfMonth, endOfLastMonth]);
    }
    // 'custom' does nothing — keeps current pickerDates
  }, [dateRange]);

  const [kpis] = useState([
    { title: labels.totalAccounts, value: 248, change: '+12%', icon: <ApartmentOutlined />, color: '#003DA5', trend: 'up' },
    { title: labels.activeContacts, value: 1842, change: '+8%', icon: <TeamOutlined />, color: '#0073CF', trend: 'up' },
    { title: labels.pipelineValue, value: 2450000, change: '+15%', icon: <DollarOutlined />, color: '#00A651', trend: 'up' },
    { title: labels.openOpportunities, value: 67, change: '-3%', icon: <AimOutlined />, color: '#FF8C00', trend: 'down' },
    { title: labels.revenueThisMonth, value: 185000, change: '+22%', icon: <DollarOutlined />, color: '#722ED1', trend: 'up' },
    { title: labels.conversionRate, value: 34, change: '+5%', icon: <BarChartOutlined />, color: '#13C2C2', trend: 'up' },
  ]);

  const [recentActivities] = useState([
    { id: 1, account: 'ABC Corp', type: 'Call', action: 'Follow-up call', time: '2 hours ago', status: 'completed', user: 'John' },
    { id: 2, account: 'XYZ Ltd', type: 'Email', action: 'Sent quotation', time: '4 hours ago', status: 'sent', user: 'Sarah' },
    { id: 3, account: 'DEF Inc', type: 'Meeting', action: 'Product demo', time: 'Yesterday', status: 'scheduled', user: 'Mike' },
    { id: 4, account: 'GHI Co', type: 'Task', action: 'Prepare proposal', time: '2 days ago', status: 'pending', user: 'John' },
    { id: 5, account: 'JKL Ltd', type: 'WhatsApp', action: 'Price discussion', time: '2 days ago', status: 'completed', user: 'Sarah' },
  ]);

  const [upcomingTasks, setUpcomingTasks] = useState([
    { id: 1, title: 'Call Sarah Tan', due: 'Today', priority: 'high', assigned: 'John' },
    { id: 2, title: 'Send quotation to ABC Corp', due: 'Tomorrow', priority: 'medium', assigned: 'Sarah' },
    { id: 3, title: 'Follow up with XYZ Ltd', due: 'In 3 days', priority: 'low', assigned: 'Mike' },
    { id: 4, title: 'Review contract with DEF Inc', due: 'In 5 days', priority: 'high', assigned: 'John' },
  ]);

  const [topAccounts] = useState([
    { id: 1, name: 'ABC Corp', revenue: 450000, opportunities: 5, status: 'active' },
    { id: 2, name: 'XYZ Ltd', revenue: 320000, opportunities: 3, status: 'active' },
    { id: 3, name: 'DEF Inc', revenue: 280000, opportunities: 4, status: 'active' },
    { id: 4, name: 'GHI Co', revenue: 150000, opportunities: 2, status: 'inactive' },
    { id: 5, name: 'JKL Ltd', revenue: 120000, opportunities: 1, status: 'active' },
  ]);

  const [pipelineByStage] = useState([
    { stage: 'Prospecting', count: 45, value: 850000 },
    { stage: 'Qualification', count: 23, value: 620000 },
    { stage: 'Proposal', count: 15, value: 580000 },
    { stage: 'Negotiation', count: 8, value: 400000 },
    { stage: 'Closed Won', count: 12, value: 1200000 },
  ]);

  const [weeklyPerformance] = useState([
    { day: 'Mon', activities: 12, calls: 8, emails: 4 },
    { day: 'Tue', activities: 15, calls: 10, emails: 5 },
    { day: 'Wed', activities: 18, calls: 12, emails: 6 },
    { day: 'Thu', activities: 14, calls: 9, emails: 5 },
    { day: 'Fri', activities: 10, calls: 7, emails: 3 },
    { day: 'Sat', activities: 3, calls: 2, emails: 1 },
    { day: 'Sun', activities: 1, calls: 1, emails: 0 },
  ]);

  const activityColors = { Call: 'blue', Email: 'green', Meeting: 'purple', Task: 'orange', WhatsApp: 'cyan' };
  const statusColors = { completed: 'green', sent: 'blue', scheduled: 'purple', pending: 'orange' };
  const priorityColors = { high: 'red', medium: 'orange', low: 'green' };

  const activityColumns = [
    { title: labels.account, dataIndex: 'account', key: 'account', render: (text) => <Text strong>{text}</Text> },
    { title: labels.type, dataIndex: 'type', key: 'type', render: (type) => <Tag color={activityColors[type]}>{type}</Tag> },
    { title: labels.action, dataIndex: 'action', key: 'action' },
    { title: labels.user, dataIndex: 'user', key: 'user', render: (text) => <Tag>{text}</Tag> },
    { title: labels.time, dataIndex: 'time', key: 'time' },
    { title: labels.status, dataIndex: 'status', key: 'status', render: (status) => <Tag color={statusColors[status]}>{status}</Tag> },
  ];

  const taskColumns = [
    { title: '', dataIndex: '_drag', key: '_drag', width: 32, render: () => <UnorderedListOutlined style={{ color: '#999', fontSize: 14, cursor: 'grab' }} /> },
    { title: labels.task, dataIndex: 'title', key: 'title', render: (text) => <Text strong>{text}</Text> },
    { title: labels.assignedTo, dataIndex: 'assigned', key: 'assigned', render: (text) => <Tag>{text}</Tag> },
    { title: labels.due, dataIndex: 'due', key: 'due' },
    { title: labels.priority, dataIndex: 'priority', key: 'priority', render: (priority) => <Tag color={priorityColors[priority]}>{priority}</Tag> },
  ];

  const topAccountColumns = [
    { title: labels.account, dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
    { title: labels.revenue, dataIndex: 'revenue', key: 'revenue', render: (val) => `$${val.toLocaleString()}` },
    { title: labels.opportunities, dataIndex: 'opportunities', key: 'opportunities' },
    { title: labels.status, dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag> },
  ];

  const pipelineColumns = [
    { title: labels.stage, dataIndex: 'stage', key: 'stage', render: (text) => <Tag color="blue">{text}</Tag> },
    { title: labels.count, dataIndex: 'count', key: 'count' },
    { title: labels.value, dataIndex: 'value', key: 'value', render: (val) => `$${val.toLocaleString()}` },
    { title: labels.ofPipeline, key: 'percentage', render: (_, record) => {
      const total = pipelineByStage.reduce((sum, p) => sum + p.value, 0);
      const pct = ((record.value / total) * 100).toFixed(1);
      return <Progress percent={parseFloat(pct)} size="small" />;
    }},
  ];

  const perfColumns = [
    { title: labels.day, dataIndex: 'day', key: 'day' },
    { title: labels.totalActivities, dataIndex: 'activities', key: 'activities', render: (val) => <Tag color="blue">{val}</Tag> },
    { title: labels.calls, dataIndex: 'calls', key: 'calls', render: (val) => <Tag color="green">{val}</Tag> },
    { title: labels.emails, dataIndex: 'emails', key: 'emails', render: (val) => <Tag color="purple">{val}</Tag> },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#003DA5',
          borderRadius: 8,
          colorBgLayout: '#F5F7FA',
          colorBgContainer: '#FFFFFF',
        },
      }}
    >
      <div>
        <style>{scrollbarCSS}</style>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{labels.dashboard}</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>{labels.welcomeBack}</Text>
          </div>
          <Space wrap>
            <Select
              defaultValue="custom"
              style={{ width: 150 }}
              onChange={(v) => setDateRange([v])}
              options={[
                { value: 'custom', label: 'Custom period' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Last week' },
                { value: 'twoweek', label: 'Last 2 weeks' },
                { value: 'month', label: 'Last month' },
                { value: 'thismonth', label: 'This month' },
                { value: 'quarter', label: 'Last 3 months' },
              ]}
            />
            <RangePicker
              size="middle"
              value={pickerDates}
              onChange={(dates) => {
                // Only update when user has selected both dates or is actively selecting
                if (dates && dates.length === 2) {
                  setPickerDates(dates);
                  setDateRange(['custom']);
                } else if (dates && dates.length === 1) {
                  // User picked start date only — keep it, don't clear
                  setPickerDates(dates);
                }
                // If dates is null (calendar closed without selection), do nothing
              }}
              format="YYYY-MM-DD"
              placeholder={[labels.startDate, labels.endDate]}
              style={{ minWidth: 240 }}
            />
          </Space>
        </div>

        {/* KPI Cards */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {kpis.map((kpi, index) => (
            <Col xs={24} sm={12} md={8} lg={8} xl={4} key={index}>
              <Card
                hoverable
                style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: kpi.color, fontSize: 18 }}>{kpi.icon}</span>
                  <Tag color={kpi.trend === 'up' ? 'green' : 'red'} style={{ fontSize: 10 }}>
                    {kpi.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {kpi.change}
                  </Tag>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
                  {typeof kpi.value === 'number' && kpi.value > 10000 ? `$${(kpi.value / 1000).toFixed(0)}K` : kpi.value}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>{kpi.title}</Text>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Main Content Grid */}
        <Row gutter={[12, 12]}>
          {/* Recent Activities */}
          <Col xs={24} lg={12}>
            <Card
              title={<><ClockCircleOutlined /> {labels.recentActivities}</>}
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', height: '100%', boxSizing: 'border-box' }}
              styles={{ body: { padding: '0 12px 12px' } }}
              className="dash-scroll"
            >
              <Table
                dataSource={recentActivities}
                columns={activityColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ y: 200 }}
              />
            </Card>
          </Col>

          {/* Upcoming Tasks — with drag to reorder */}
          <Col xs={24} lg={12}>
            <Card
              title={<><CheckCircleOutlined /> {labels.upcomingTasks}</>}
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', height: '100%', boxSizing: 'border-box' }}
              styles={{ body: { padding: '0 12px 12px' } }}
              className="dash-scroll"
            >
              <Table
                dataSource={upcomingTasks}
                columns={taskColumns}
                rowKey="id"
                pagination={false}
                size="small"
                className="task-table"
                locale={{ emptyText: labels.noTasks }}
                scroll={{ y: 200 }}
                onRow={(record, index) => ({
                  draggable: true,
                  style: { cursor: 'grab', userSelect: 'none' },
                  onDragStart: (e) => {
                    e.dataTransfer.setData('text/plain', String(index));
                    e.dataTransfer.effectAllowed = 'move';
                    // Create a solid, opaque ghost image
                    const ghost = e.currentTarget.cloneNode(true);
                    ghost.style.opacity = '1';
                    ghost.style.position = 'absolute';
                    ghost.style.top = '0';
                    ghost.style.left = '0';
                    ghost.style.width = e.currentTarget.offsetWidth + 'px';
                    ghost.style.pointerEvents = 'none';
                    // Match cell widths
                    const cells = e.currentTarget.querySelectorAll('td');
                    const gCells = ghost.querySelectorAll('td');
                    for (let i = 0; i < cells.length; i++) {
                      if (gCells[i] && cells[i]) {
                        gCells[i].style.width = cells[i].offsetWidth + 'px';
                        gCells[i].style.minWidth = cells[i].offsetWidth + 'px';
                        gCells[i].style.boxSizing = 'border-box';
                      }
                    }
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, 20, 15);
                    setTimeout(() => {
                      if (document.body.contains(ghost)) {
                        document.body.removeChild(ghost);
                      }
                    }, 0);
                  },
                  onDragEnd: (e) => {
                    e.currentTarget.style.opacity = '';
                    document.querySelectorAll('.task-table .ant-table-tbody > tr.drag-over').forEach(r => {
                      r.classList.remove('drag-over');
                      r.style.background = '';
                    });
                  },
                  onDragOver: (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    e.currentTarget.classList.add('drag-over');
                  },
                  onDragLeave: (e) => {
                    e.currentTarget.classList.remove('drag-over');
                    e.currentTarget.style.background = '';
                  },
                  onDrop: (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag-over');
                    e.currentTarget.style.background = '';
                    const srcIndex = Number(e.dataTransfer.getData('text/plain'));
                    const destIndex = index;
                    if (srcIndex !== destIndex && srcIndex >= 0 && destIndex >= 0) {
                      setUpcomingTasks((prev) => {
                        const copy = [...prev];
                        const [moved] = copy.splice(srcIndex, 1);
                        copy.splice(destIndex, 0, moved);
                        return copy;
                      });
                    }
                  },
                })}
              />
            </Card>
          </Col>

          {/* Top Accounts */}
          <Col xs={24} lg={12}>
            <Card
              title={<><ApartmentOutlined /> {labels.topAccounts}</>}
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: '0 12px 12px' } }}
            >
              <Table
                dataSource={topAccounts}
                columns={topAccountColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>

          {/* Pipeline by Stage */}
          <Col xs={24} lg={12}>
            <Card
              title={<><LineChartOutlined /> {labels.pipelineByStage}</>}
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: '0 12px 12px' } }}
            >
              <Table
                dataSource={pipelineByStage}
                columns={pipelineColumns}
                rowKey="stage"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>

          {/* Weekly Performance */}
          <Col xs={24}>
            <Card
              title={<><BarChartOutlined /> {labels.weeklyPerformance}</>}
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: '0 12px 12px' } }}
            >
              <Table
                dataSource={weeklyPerformance}
                columns={perfColumns}
                rowKey="day"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default Dashboard;
