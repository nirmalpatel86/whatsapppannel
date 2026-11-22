import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiBarChart2, FiSearch, FiDownload } from 'react-icons/fi';

const SmsReports = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await api.get('/sms/campaigns');
        setCampaigns(res.data.campaigns || []);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      } finally { setLoading(false); }
    };
    fetchCampaigns();
  }, []);

  const viewReport = async (campaign) => {
    setSelectedCampaign(campaign);
    setMessagesLoading(true);
    try {
      const res = await api.get(`/sms/campaigns/${campaign.id}`);
      setMessages(res.data.campaign?.messages || res.data.messages || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load report' });
    } finally { setMessagesLoading(false); }
  };

  const statusColors = {
    pending: { bg: '#fef3c7', color: '#92400e' },
    sent: { bg: '#dbeafe', color: '#1d4ed8' },
    delivered: { bg: '#d1fae5', color: '#065f46' },
    failed: { bg: '#fee2e2', color: '#991b1b' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
  };

  const filteredMessages = messages.filter(m => !search || m.phone?.includes(search) || m.status?.includes(search));

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>SMS Reports</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Campaign delivery reports</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Campaigns</h3>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            {campaigns.map(c => (
              <div key={c.id} onClick={() => viewReport(c)} style={{ ...styles.campaignItem, borderColor: selectedCampaign?.id === c.id ? '#3B82F6' : '#e5e7eb', background: selectedCampaign?.id === c.id ? '#eff6ff' : 'white' }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: '#111827' }}>{c.name}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  <span>Sent: {c.sentCount || 0}</span>
                  <span style={{ color: '#059669' }}>Delivered: {c.deliveredCount || 0}</span>
                  <span style={{ color: '#ef4444' }}>Failed: {c.failedCount || 0}</span>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
            ))}
            {campaigns.length === 0 && !loading && (
              <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>No campaigns</p>
            )}
          </div>
        </div>

        <div style={styles.card}>
          {!selectedCampaign ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
              <FiBarChart2 size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>Select a campaign to view report</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#111827' }}>{selectedCampaign.name}</h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span>Total: <b>{selectedCampaign.totalRecipients}</b></span>
                    <span style={{ color: '#059669' }}>Delivered: <b>{selectedCampaign.deliveredCount}</b></span>
                    <span style={{ color: '#ef4444' }}>Failed: <b>{selectedCampaign.failedCount}</b></span>
                  </div>
                </div>
                <div style={styles.searchBox}>
                  <FiSearch size={15} color="#9ca3af" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={styles.searchInput} />
                </div>
              </div>

              {selectedCampaign.totalRecipients > 0 && (
                <div style={{ display: 'flex', gap: 4, marginBottom: 16, height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ flex: selectedCampaign.deliveredCount, background: '#22c55e' }} />
                  <div style={{ flex: selectedCampaign.failedCount, background: '#ef4444' }} />
                  <div style={{ flex: (selectedCampaign.totalRecipients - selectedCampaign.deliveredCount - selectedCampaign.failedCount), background: '#e5e7eb' }} />
                </div>
              )}

              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Phone</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Sent At</th>
                      <th style={styles.th}>Delivered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((m, i) => {
                      const sc = statusColors[m.status] || statusColors.pending;
                      return (
                        <tr key={m.id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={styles.td}><span style={{ fontFamily: 'monospace', fontSize: 13 }}>{m.phone}</span></td>
                          <td style={styles.td}>
                            <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>{m.status}</span>
                          </td>
                          <td style={{ ...styles.td, fontSize: 12, color: '#9ca3af' }}>{m.sentAt ? new Date(m.sentAt).toLocaleString('en-IN') : '-'}</td>
                          <td style={{ ...styles.td, fontSize: 12, color: '#9ca3af' }}>{m.deliveredAt ? new Date(m.deliveredAt).toLocaleString('en-IN') : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {messagesLoading && <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Loading...</div>}
                {!messagesLoading && filteredMessages.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No delivery data</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  campaignItem: { padding: 12, border: '2px solid #e5e7eb', borderRadius: 10, marginBottom: 8, cursor: 'pointer' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' },
  searchInput: { border: 'none', outline: 'none', fontSize: 13, width: 150, color: '#111827', background: 'transparent' },
  th: { textAlign: 'left', padding: '10px 14px', borderBottom: '2px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '10px 14px', fontSize: 13, color: '#374151' },
};

export default SmsReports;
