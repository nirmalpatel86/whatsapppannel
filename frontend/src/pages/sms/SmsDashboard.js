import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiSend, FiCheckCircle, FiXCircle, FiClock, FiUsers, FiFileText, FiNavigation, FiTrendingUp } from 'react-icons/fi';

const SmsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, campaignsRes, contactsRes] = await Promise.all([
          api.get('/sms/wallet/me'),
          api.get('/sms/campaigns', { params: { limit: 5 } }),
          api.get('/sms/contacts', { params: { limit: 1 } }),
        ]);
        setStats({
          balance: walletRes.data.wallet?.balance || 0,
          campaigns: campaignsRes.data.campaigns?.length || 0,
          totalCampaigns: campaignsRes.data.total || 0,
          contacts: contactsRes.data.total || 0,
        });
        setRecentCampaigns(campaignsRes.data.campaigns || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  const cards = [
    { label: 'SMS Balance', value: stats?.balance?.toFixed(0) || '0', icon: FiSend, color: '#3B82F6' },
    { label: 'Total Campaigns', value: stats?.totalCampaigns || 0, icon: FiNavigation, color: '#8b5cf6' },
    { label: 'Contacts', value: stats?.contacts || 0, icon: FiUsers, color: '#10b981' },
  ];

  const statusColors = {
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    pending: { bg: '#fef3c7', color: '#92400e' },
    running: { bg: '#dbeafe', color: '#1d4ed8' },
    completed: { bg: '#d1fae5', color: '#065f46' },
    failed: { bg: '#fee2e2', color: '#991b1b' },
    paused: { bg: '#fef3c7', color: '#92400e' },
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>SMS Dashboard</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Welcome back, {user?.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {cards.map((card, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: `${card.color}15`, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#111827' }}>Recent Campaigns</h3>
        {recentCampaigns.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No campaigns yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Sent</th>
                <th style={styles.th}>Delivered</th>
                <th style={styles.th}>Failed</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.map(c => {
                const sc = statusColors[c.status] || statusColors.draft;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={styles.td}><span style={{ fontWeight: 500, color: '#111827' }}>{c.name}</span></td>
                    <td style={styles.td}>
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>{c.status}</span>
                    </td>
                    <td style={styles.td}>{c.sentCount || 0}</td>
                    <td style={{ ...styles.td, color: '#059669' }}>{c.deliveredCount || 0}</td>
                    <td style={{ ...styles.td, color: '#ef4444' }}>{c.failedCount || 0}</td>
                    <td style={{ ...styles.td, fontSize: 12, color: '#9ca3af' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  statCard: {
    background: 'white', borderRadius: 14, padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  statIcon: {
    width: 48, height: 48, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  card: {
    background: 'white', borderRadius: 14, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  th: {
    textAlign: 'left', padding: '10px 14px', borderBottom: '2px solid #f3f4f6',
    fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  td: { padding: '10px 14px', fontSize: 13, color: '#374151' },
};

export default SmsDashboard;
