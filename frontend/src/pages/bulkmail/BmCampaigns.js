import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiPlus, FiX, FiSend, FiNavigation, FiEye, FiMousePointer, FiTrash2 } from 'react-icons/fi';

const ACCENT = '#EF4444';

const statusColors = {
  draft: '#6b7280', scheduled: '#3b82f6', sending: '#f97316',
  sent: '#10b981', paused: '#eab308', failed: '#ef4444', cancelled: '#9ca3af',
};

const BmCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [senders, setSenders] = useState([]);
  const [senderGroups, setSenderGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', senderId: '', senderGroupId: '', templateId: '', groupIds: [],
    subject: '', body: '', campaignType: 'immediate', scheduledAt: '',
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await api.get('/bulkmail/campaigns');
      setCampaigns(res.data.campaigns || []);
    } catch { alert.error('Failed to load campaigns'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  useEffect(() => {
    if (showCreate) {
      Promise.all([
        api.get('/bulkmail/senders'),
        api.get('/bulkmail/sender-groups'),
        api.get('/bulkmail/templates'),
        api.get('/bulkmail/contact-groups'),
      ]).then(([s, sg, t, g]) => {
        setSenders(s.data.senders || []);
        setSenderGroups(sg.data.senderGroups || []);
        setTemplates(t.data.templates || []);
        setGroups(g.data.groups || []);
      }).catch(() => {});
    }
  }, [showCreate]);

  const handleTemplateSelect = (id) => {
    setForm(f => ({ ...f, templateId: id }));
    if (id) {
      const tpl = templates.find(t => t.id === parseInt(id));
      if (tpl) setForm(f => ({ ...f, templateId: id, subject: tpl.subject || '', body: tpl.body || '' }));
    }
  };

  const toggleGroup = (id) => {
    setForm(f => ({
      ...f,
      groupIds: f.groupIds.includes(id) ? f.groupIds.filter(g => g !== id) : [...f.groupIds, id],
    }));
  };

  const createCampaign = async () => {
    if (!form.name.trim()) { alert.error('Campaign name is required'); return; }
    if (!form.subject.trim()) { alert.error('Subject is required'); return; }
    if (form.groupIds.length === 0) { alert.error('Select at least one contact group'); return; }
    try {
      await api.post('/bulkmail/campaigns', {
        name: form.name,
        senderId: form.senderId ? parseInt(form.senderId) : undefined,
        senderGroupId: form.senderGroupId ? parseInt(form.senderGroupId) : undefined,
        templateId: form.templateId ? parseInt(form.templateId) : undefined,
        groupIds: form.groupIds,
        subject: form.subject,
        body: form.body,
        campaignType: form.campaignType,
        scheduledAt: form.scheduledAt || undefined,
      });
      alert.success('Campaign created');
      setShowCreate(false);
      setForm({ name: '', senderId: '', senderGroupId: '', templateId: '', groupIds: [], subject: '', body: '', campaignType: 'immediate', scheduledAt: '' });
      fetchCampaigns();
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to create campaign');
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/bulkmail/campaigns/${id}`);
      alert.success('Campaign deleted');
      fetchCampaigns();
    } catch { alert.error('Failed to delete'); }
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Email Campaigns</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> New Campaign</button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>Create Campaign</h3>
            <button onClick={() => setShowCreate(false)} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Campaign Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="e.g. November Newsletter" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Sender</label>
              <select value={form.senderId} onChange={e => setForm({ ...form, senderId: e.target.value })} style={styles.input}>
                <option value="">Select sender</option>
                {senders.map(s => <option key={s.id} value={s.id}>{s.name} &lt;{s.email}&gt;</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Sender Group (rotation)</label>
              <select value={form.senderGroupId} onChange={e => setForm({ ...form, senderGroupId: e.target.value })} style={styles.input}>
                <option value="">None</option>
                {senderGroups.map(sg => <option key={sg.id} value={sg.id}>{sg.name}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Template</label>
              <select value={form.templateId} onChange={e => handleTemplateSelect(e.target.value)} style={styles.input}>
                <option value="">No template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Type</label>
              <select value={form.campaignType} onChange={e => setForm({ ...form, campaignType: e.target.value })} style={styles.input}>
                <option value="immediate">Send Now</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            {form.campaignType === 'scheduled' && (
              <div style={styles.field}>
                <label style={styles.label}>Schedule Date & Time</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} style={styles.input} />
              </div>
            )}
          </div>
          <div style={{ ...styles.field, marginBottom: 16 }}>
            <label style={styles.label}>Contact Groups *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {groups.map(g => (
                <button key={g.id} type="button" onClick={() => toggleGroup(g.id)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  border: form.groupIds.includes(g.id) ? `2px solid ${ACCENT}` : '2px solid #e5e7eb',
                  background: form.groupIds.includes(g.id) ? `${ACCENT}10` : 'white',
                  color: form.groupIds.includes(g.id) ? ACCENT : '#374151', cursor: 'pointer',
                }}>
                  {g.name} ({g.memberCount || 0})
                </button>
              ))}
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Subject *</label>
            <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={styles.input} placeholder="Email subject line" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Body (HTML)</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ ...styles.input, minHeight: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} placeholder="<h1>Hello</h1>" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={createCampaign} style={styles.primaryBtn}><FiSend size={16} /> Create & Send</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {campaigns.map(c => (
          <div key={c.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={styles.campaignIcon}><FiNavigation size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.subject}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                  background: (statusColors[c.status] || '#6b7280') + '15',
                  color: statusColors[c.status] || '#6b7280',
                }}>{c.status}</span>
                {(c.status === 'draft' || c.status === 'cancelled') && (
                  <button onClick={() => deleteCampaign(c.id)} style={styles.delBtn}><FiTrash2 size={14} /></button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Sent: <strong style={{ color: '#374151' }}>{c.totalSent || 0}</strong></span>
              <span style={{ color: '#6b7280' }}><FiEye size={12} style={{ marginRight: 2 }} /> Opens: <strong style={{ color: '#3b82f6' }}>{c.openCount || 0}</strong></span>
              <span style={{ color: '#6b7280' }}><FiMousePointer size={12} style={{ marginRight: 2 }} /> Clicks: <strong style={{ color: '#8b5cf6' }}>{c.clickCount || 0}</strong></span>
              <span style={{ color: '#6b7280' }}>Bounced: <strong style={{ color: ACCENT }}>{c.bounceCount || 0}</strong></span>
              <span style={{ color: '#9ca3af', fontSize: 12 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
            </div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiNavigation size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No campaigns yet</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Create your first email campaign to get started.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(239,68,68,0.25)',
  },
  secondaryBtn: {
    padding: '10px 20px', background: '#f3f4f6', color: '#374151',
    border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14,
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: {
    background: 'white', borderRadius: 14, padding: 24, marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16,
  },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb',
  },
  card: {
    background: 'white', borderRadius: 14, padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  campaignIcon: {
    width: 42, height: 42, borderRadius: 10, background: `${ACCENT}12`,
    color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  delBtn: {
    background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', color: '#ef4444',
    padding: '6px 8px', borderRadius: 8,
  },
};

export default BmCampaigns;
