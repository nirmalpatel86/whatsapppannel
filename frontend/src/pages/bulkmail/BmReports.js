import { useState, useEffect } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiBarChart2, FiMail, FiEye, FiMousePointer, FiAlertCircle, FiFilter, FiDownload } from 'react-icons/fi';

const ACCENT = '#EF4444';

const BmReports = () => {
  const [report, setReport] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ campaignId: '', startDate: '', endDate: '' });

  useEffect(() => {
    Promise.all([
      api.get('/bulkmail/reports', { params: { campaignId: filter.campaignId || undefined, startDate: filter.startDate || undefined, endDate: filter.endDate || undefined } }),
      api.get('/bulkmail/campaigns'),
    ]).then(([rRes, cRes]) => {
      setReport(rRes.data);
      setCampaigns(cRes.data.campaigns || []);
    }).catch(() => alert.error('Failed to load report'))
    .finally(() => setLoading(false));
  }, [filter]);

  const exportCsv = () => {
    if (!report?.campaignStats?.length) { alert.error('No data to export'); return; }
    const rows = [['Campaign', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Unsubscribed', 'Open Rate', 'Click Rate']];
    report.campaignStats.forEach(c => {
      rows.push([c.name, c.sent, c.delivered, c.opened, c.clicked, c.bounced, c.unsubscribed,
        `${c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(1) : 0}%`,
        `${c.sent > 0 ? ((c.clicked / c.sent) * 100).toFixed(1) : 0}%`,
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bulkmail_report.csv'; a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  const summary = report?.summary || {};

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Reports & Analytics</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Email campaign performance overview</p>
        </div>
        <button onClick={exportCsv} style={styles.outlineBtn}><FiDownload size={15} /> Export CSV</button>
      </div>

      <div style={styles.filterBar}>
        <FiFilter size={16} color="#9ca3af" />
        <select value={filter.campaignId} onChange={e => setFilter({ ...filter, campaignId: e.target.value })} style={styles.filterSelect}>
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} style={styles.filterSelect} />
        <input type="date" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} style={styles.filterSelect} />
        {(filter.campaignId || filter.startDate || filter.endDate) && (
          <button onClick={() => setFilter({ campaignId: '', startDate: '', endDate: '' })} style={styles.clearBtn}>Clear</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatBox icon={FiMail} label="Total Sent" value={summary.totalSent || 0} color={ACCENT} />
        <StatBox icon={FiMail} label="Delivered" value={summary.delivered || 0} color="#10b981" />
        <StatBox icon={FiEye} label="Opened" value={summary.opened || 0} color="#3b82f6" />
        <StatBox icon={FiMousePointer} label="Clicked" value={summary.clicked || 0} color="#8b5cf6" />
        <StatBox icon={FiAlertCircle} label="Bounced" value={summary.bounced || 0} color="#f97316" />
        <StatBox icon={FiBarChart2} label="Open Rate" value={`${summary.totalSent > 0 ? ((summary.opened / summary.totalSent) * 100).toFixed(1) : 0}%`} color="#374151" />
      </div>

      <div style={styles.tableWrapper}>
        <h3 style={{ margin: '0 0 12px', padding: '16px 16px 0', fontSize: 15, fontWeight: 600, color: '#111827' }}>Campaign Performance</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Campaign</th>
              <th style={styles.th}>Sent</th>
              <th style={styles.th}>Delivered</th>
              <th style={styles.th}>Opened</th>
              <th style={styles.th}>Clicked</th>
              <th style={styles.th}>Bounced</th>
              <th style={styles.th}>Open Rate</th>
              <th style={styles.th}>Click Rate</th>
            </tr>
          </thead>
          <tbody>
            {(report?.campaignStats || []).map(c => {
              const openRate = c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(1) : '0.0';
              const clickRate = c.sent > 0 ? ((c.clicked / c.sent) * 100).toFixed(1) : '0.0';
              return (
                <tr key={c.id} style={styles.tr}>
                  <td style={styles.td}><span style={{ fontWeight: 500, color: '#111827' }}>{c.name}</span></td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{c.sent}</td>
                  <td style={{ ...styles.td, color: '#10b981' }}>{c.delivered}</td>
                  <td style={{ ...styles.td, color: '#3b82f6' }}>{c.opened}</td>
                  <td style={{ ...styles.td, color: '#8b5cf6' }}>{c.clicked}</td>
                  <td style={{ ...styles.td, color: '#f97316' }}>{c.bounced}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(parseFloat(openRate), 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 40 }}>{openRate}%</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(parseFloat(clickRate), 100)}%`, height: '100%', background: '#8b5cf6', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', minWidth: 40 }}>{clickRate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!report?.campaignStats || report.campaignStats.length === 0) && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
            <FiBarChart2 size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>No campaign data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, color }) => (
  <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Icon size={16} color={color} />
      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
  </div>
);

const styles = {
  outlineBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  filterBar: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: 'white', borderRadius: 14, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 20, border: '1px solid #e5e7eb' },
  filterSelect: { padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', background: '#f9fafb' },
  clearBtn: { padding: '7px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: ACCENT, fontWeight: 600 },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  th: { textAlign: 'left', padding: '10px 14px', borderBottom: '2px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '10px 14px', fontSize: 13, color: '#374151' },
};

export default BmReports;
