import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import alert from '../utils/alert';
import { FiBarChart2, FiSearch } from 'react-icons/fi';

const ACCENT = '#e8b931';

const statusColors = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  sent: { bg: '#dbeafe', color: '#1d4ed8' },
  delivered: { bg: '#d1fae5', color: '#065f46' },
  read: { bg: '#dcfce7', color: '#166534' },
  failed: { bg: '#fee2e2', color: '#991b1b' },
};

const connectionEventColors = {
  connected: { bg: '#d1fae5', color: '#065f46' },
  disconnected: { bg: '#fee2e2', color: '#991b1b' },
  qr_pending: { bg: '#fef3c7', color: '#92400e' },
  connecting: { bg: '#dbeafe', color: '#1d4ed8' },
};

const WhatsappReports = () => {
  const [usage, setUsage] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ whatsappAccountId: '', status: '', direction: '', search: '' });
  const [connLogs, setConnLogs] = useState([]);
  const [connAccountFilter, setConnAccountFilter] = useState('');

  const fetchUsage = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/reports/usage', { params: { days: 30 } });
      setUsage(res.data.usage || []);
    } catch { alert.error('Failed to load usage report'); }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/accounts');
      setAccounts(res.data.accounts || []);
    } catch { /* ignore */ }
  }, []);

  const fetchDelivery = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (filters.whatsappAccountId) params.whatsappAccountId = filters.whatsappAccountId;
      if (filters.status) params.status = filters.status;
      if (filters.direction) params.direction = filters.direction;
      if (filters.search) params.search = filters.search;
      const res = await api.get('/whatsapp/reports/delivery', { params });
      setMessages(res.data.messages || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || 1);
    } catch { alert.error('Failed to load delivery report'); }
    finally { setLoading(false); }
  }, [filters]);

  const fetchConnections = useCallback(async () => {
    try {
      const params = { limit: 30 };
      if (connAccountFilter) params.whatsappAccountId = connAccountFilter;
      const res = await api.get('/whatsapp/reports/connections', { params });
      setConnLogs(res.data.logs || []);
    } catch { alert.error('Failed to load connection report'); }
  }, [connAccountFilter]);

  useEffect(() => { fetchUsage(); fetchAccounts(); }, [fetchUsage, fetchAccounts]);
  useEffect(() => { fetchDelivery(1); }, [fetchDelivery]);
  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const summary = usage.reduce((acc, d) => ({
    total: acc.total + d.total,
    outbound: acc.outbound + d.outbound,
    inbound: acc.inbound + d.inbound,
    delivered: acc.delivered + d.delivered,
    failed: acc.failed + d.failed,
  }), { total: 0, outbound: 0, inbound: 0, delivered: 0, failed: 0 });

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Reports</h2>
        <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>Usage and delivery reports (last 30 days)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Messages', value: summary.total, color: '#111827' },
          { label: 'Outbound', value: summary.outbound, color: ACCENT },
          { label: 'Inbound', value: summary.inbound, color: '#3B82F6' },
          { label: 'Delivered', value: summary.delivered, color: '#22c55e' },
          { label: 'Failed', value: summary.failed, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 6 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600, color: '#111827' }}>Daily Usage</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Outbound</th>
                <th style={styles.th}>Inbound</th>
                <th style={styles.th}>Delivered</th>
                <th style={styles.th}>Failed</th>
              </tr>
            </thead>
            <tbody>
              {usage.slice().reverse().map(d => (
                <tr key={d.date} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={styles.td}>{new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td style={styles.td}>{d.total}</td>
                  <td style={styles.td}>{d.outbound}</td>
                  <td style={styles.td}>{d.inbound}</td>
                  <td style={styles.td}>{d.delivered}</td>
                  <td style={styles.td}>{d.failed}</td>
                </tr>
              ))}
              {usage.length === 0 && (
                <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: 24 }}>No usage data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#111827' }}>Connection History</h3>
          <select value={connAccountFilter} onChange={e => setConnAccountFilter(e.target.value)} style={styles.filterInput}>
            <option value="">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Account</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {connLogs.map(l => {
                const cc = connectionEventColors[l.event] || connectionEventColors.connecting;
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={styles.td}>{l.WhatsappAccount?.name || '-'}</td>
                    <td style={styles.td}>
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: cc.bg, color: cc.color }}>
                        {l.event.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={styles.td}>{l.phone || '-'}</td>
                    <td style={{ ...styles.td, fontSize: 14, color: '#9ca3af' }}>{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
              {connLogs.length === 0 && (
                <tr><td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: 24 }}>No connection history yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#111827' }}>Delivery Report</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={filters.whatsappAccountId} onChange={e => setFilters({ ...filters, whatsappAccountId: e.target.value })} style={styles.filterInput}>
              <option value="">All Accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={styles.filterInput}>
              <option value="">All Statuses</option>
              {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.direction} onChange={e => setFilters({ ...filters, direction: e.target.value })} style={styles.filterInput}>
              <option value="">All Directions</option>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} />
              <input
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search phone..."
                style={{ ...styles.filterInput, paddingLeft: 30 }}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Account</th>
                <th style={styles.th}>Direction</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(m => {
                const sc = statusColors[m.status] || statusColors.pending;
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={styles.td}>{m.Contact?.name || m.Contact?.phone || '-'}</td>
                    <td style={styles.td}>{m.WhatsappAccount?.name || '-'}</td>
                    <td style={styles.td}>{m.direction}</td>
                    <td style={styles.td}>{m.type}</td>
                    <td style={styles.td}>
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontSize: 14, color: '#9ca3af' }}>{new Date(m.timestamp).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
              {!loading && messages.length === 0 && (
                <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: 24 }}>
                  <FiBarChart2 size={28} style={{ opacity: 0.3, marginBottom: 6 }} /><div>No messages found</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button disabled={page <= 1} onClick={() => fetchDelivery(page - 1)} style={styles.pageBtn}>Prev</button>
            <span style={{ fontSize: 15, color: '#6b7280', padding: '6px 10px' }}>Page {page} of {totalPages} ({total} total)</span>
            <button disabled={page >= totalPages} onClick={() => fetchDelivery(page + 1)} style={styles.pageBtn}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  statCard: { background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #f3f4f6', fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', fontSize: 15, color: '#374151', whiteSpace: 'nowrap' },
  filterInput: { padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none', background: '#f9fafb' },
  pageBtn: { padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 15 },
};

export default WhatsappReports;
