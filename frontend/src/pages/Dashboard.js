import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiSmartphone, FiMessageSquare, FiUsers, FiSend, FiCreditCard, FiArrowRight, FiCheckCircle, FiAlertCircle, FiInbox, FiArrowUpCircle } from 'react-icons/fi';

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
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>
          Welcome back, {user?.name}
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          {user?.role?.replace('_', ' ')} {user?.Company?.name ? `· ${user.Company.name}` : ''}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={FiSmartphone} label="WhatsApp Accounts" value={stats.accounts} color="#e8b931" />
        <StatCard icon={FiMessageSquare} label="Active Chats" value={stats.chats} color="#3b82f6" />
        <StatCard icon={FiUsers} label="Contacts" value={stats.contacts} color="#10b981" />
        <StatCard icon={FiSend} label="Campaigns" value={stats.campaigns} color="#f97316" />
        <StatCard icon={FiCreditCard} label="Wallet Balance" value={`₹${stats.balance.toFixed(2)}`} color="#8b5cf6" />
      </div>

      {/* Message Delivery Report */}
      <div style={{
        background: 'white', borderRadius: 14, padding: 24, marginBottom: 28,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
      }}>
        <h3 style={{ margin: '0 0 16px', color: '#111827', fontSize: 18, fontWeight: 600 }}>Message Delivery Report</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <MiniStat label="Total Messages" value={stats.messages.total} color="#374151" />
          <MiniStat label="Outbound" value={stats.messages.outbound} color="#e8b931" icon={FiArrowUpCircle} />
          <MiniStat label="Inbound" value={stats.messages.inbound} color="#3b82f6" icon={FiInbox} />
          <MiniStat label="Delivered" value={stats.messages.delivered} color="#10b981" icon={FiCheckCircle} />
          <MiniStat label="Read" value={stats.messages.read} color="#8b5cf6" icon={FiCheckCircle} />
          <MiniStat label="Failed" value={stats.messages.failed} color="#ef4444" icon={FiAlertCircle} />
        </div>
      </div>

      <div style={{
        background: 'white', borderRadius: 14, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
      }}>
        <h3 style={{ margin: '0 0 16px', color: '#111827', fontSize: 18, fontWeight: 600 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <QuickAction title="Connect WhatsApp" desc="Add a number by scanning QR code" to="/whatsapp" />
          <QuickAction title="View Inbox" desc="Check your latest messages and reply" to="/inbox" />
          <QuickAction title="Create Campaign" desc="Send bulk messages to your contacts" to="/campaigns" />
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, color, icon: Icon }) => (
  <div style={{
    padding: '14px 16px', background: '#f9fafb', borderRadius: 10,
    border: '1px solid #f3f4f6',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      {Icon && <Icon size={14} color={color} />}
      <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
  </div>
);

const QuickAction = ({ title, desc, to }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 18px', background: '#f9fafb', borderRadius: 10,
    textDecoration: 'none', color: '#111827', border: '1px solid #f3f4f6',
  }}>
    <div>
      <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 16 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#6b7280' }}>{desc}</div>
    </div>
    <FiArrowRight size={16} color="#9ca3af" />
  </Link>
);

export default Dashboard;
