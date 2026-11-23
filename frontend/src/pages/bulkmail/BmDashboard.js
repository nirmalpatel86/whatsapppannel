import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiMail, FiSend, FiUsers, FiCheckCircle, FiAlertCircle, FiDollarSign, FiArrowRight, FiEye, FiMousePointer, FiArrowUpCircle, FiNavigation } from 'react-icons/fi';

const ACCENT = '#EF4444';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: 'white', borderRadius: 14, padding: '22px 24px',
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 12, background: color + '12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={22} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const MiniStat = ({ label, value, color, icon: Icon }) => (
  <div style={{
    padding: '14px 16px', background: '#f9fafb', borderRadius: 10,
    border: '1px solid #f3f4f6',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      {Icon && <Icon size={14} color={color} />}
      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
  </div>
);

const QuickAction = ({ title, desc, to }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 18px', background: '#f9fafb', borderRadius: 10,
    textDecoration: 'none', color: '#111827', border: '1px solid #f3f4f6',
  }}>
    <div>
      <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{desc}</div>
    </div>
    <FiArrowRight size={16} color="#9ca3af" />
  </Link>
);

const BmDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/bulkmail/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>
          Welcome back, {user?.name}
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
          {user?.role?.replace('_', ' ')} {user?.Company?.name ? `· ${user.Company.name}` : ''}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={FiMail} label="Total Emails Sent" value={stats.totalSent || 0} color={ACCENT} />
        <StatCard icon={FiCheckCircle} label="Delivered" value={stats.delivered || 0} color="#10b981" />
        <StatCard icon={FiEye} label="Opened" value={stats.opened || 0} color="#3b82f6" />
        <StatCard icon={FiMousePointer} label="Clicked" value={stats.clicked || 0} color="#8b5cf6" />
        <StatCard icon={FiNavigation} label="Campaigns" value={stats.campaigns || 0} color="#f97316" />
        <StatCard icon={FiDollarSign} label="Wallet Balance" value={`₹${(stats.balance || 0).toFixed(2)}`} color="#e8b931" />
      </div>

      <div style={{
        background: 'white', borderRadius: 14, padding: 24, marginBottom: 28,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
      }}>
        <h3 style={{ margin: '0 0 16px', color: '#111827', fontSize: 16, fontWeight: 600 }}>Email Delivery Report</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <MiniStat label="Total Sent" value={stats.totalSent || 0} color="#374151" />
          <MiniStat label="Delivered" value={stats.delivered || 0} color="#10b981" icon={FiCheckCircle} />
          <MiniStat label="Opened" value={stats.opened || 0} color="#3b82f6" icon={FiEye} />
          <MiniStat label="Clicked" value={stats.clicked || 0} color="#8b5cf6" icon={FiMousePointer} />
          <MiniStat label="Bounced" value={stats.bounced || 0} color={ACCENT} icon={FiAlertCircle} />
          <MiniStat label="Unsubscribed" value={stats.unsubscribed || 0} color="#f97316" icon={FiArrowUpCircle} />
        </div>
      </div>

      <div style={{
        background: 'white', borderRadius: 14, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
      }}>
        <h3 style={{ margin: '0 0 16px', color: '#111827', fontSize: 16, fontWeight: 600 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <QuickAction title="Send Email" desc="Compose and send emails to contacts" to="/bulkmail/send" />
          <QuickAction title="Create Campaign" desc="Launch a new email campaign" to="/bulkmail/campaigns" />
          <QuickAction title="Manage Templates" desc="Create and edit email templates" to="/bulkmail/templates" />
        </div>
      </div>
    </div>
  );
};

export default BmDashboard;
