import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import alert from '../utils/alert';
import { FiPlus, FiPlay, FiPause, FiTrash2, FiUsers, FiX, FiFileText } from 'react-icons/fi';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', whatsappAccountId: '', type: 'text',
    messageBody: '', recipients: '', scheduledAt: '', delayBetweenMessages: 3000,
    selectedGroupIds: [],
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      const [campRes, accRes, contRes, grpRes, tplRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/whatsapp/accounts'),
        api.get('/contacts?limit=1000'),
        api.get('/groups'),
        api.get('/templates'),
      ]);
      setCampaigns(campRes.data.campaigns);
      setAccounts(accRes.data.accounts.filter(a => a.status === 'connected'));
      setContacts(contRes.data.contacts);
      setGroups(grpRes.data.groups);
      setTemplates(tplRes.data.templates || []);
    } catch (err) {
      alert.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  useEffect(() => {
    if (accounts.length === 1 && !form.whatsappAccountId) {
      setForm(f => ({ ...f, whatsappAccountId: String(accounts[0].id) }));
    }
  }, [accounts, form.whatsappAccountId]);

  const createCampaign = async () => {
    if (!form.name || !form.whatsappAccountId || !form.messageBody) {
      alert.error('Fill required fields');
      return;
    }
    const recipients = form.recipients
      .split('\n')
      .map(r => r.trim())
      .filter(r => r);
    if (recipients.length === 0 && form.selectedGroupIds.length === 0) {
      alert.error('Add recipients or select a group');
      return;
    }
    try {
      await api.post('/campaigns', {
        name: form.name,
        whatsappAccountId: form.whatsappAccountId,
        type: form.type,
        messageBody: form.messageBody,
        recipients,
        groupIds: form.selectedGroupIds,
        scheduledAt: form.scheduledAt || undefined,
        delayBetweenMessages: parseInt(form.delayBetweenMessages),
      });
      alert.success('Campaign created');
      setShowCreate(false);
      setForm({ name: '', whatsappAccountId: '', type: 'text', messageBody: '', recipients: '', scheduledAt: '', delayBetweenMessages: 3000, selectedGroupIds: [] });
      fetchCampaigns();
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to create');
    }
  };

  const startCampaign = async (id) => {
    try {
      await api.post(`/campaigns/${id}/start`);
      alert.success('Campaign started');
      fetchCampaigns();
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to start');
    }
  };

  const pauseCampaign = async (id) => {
    try {
      await api.post(`/campaigns/${id}/pause`);
      alert.success('Campaign paused');
      fetchCampaigns();
    } catch (err) {
      alert.error('Failed to pause');
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      alert.success('Campaign deleted');
      fetchCampaigns();
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const statusColors = {
    draft: '#6b7280', scheduled: '#3b82f6', running: '#f59e0b',
    paused: '#8b5cf6', completed: '#22c55e', failed: '#ef4444',
  };

  const addAllContacts = () => {
    const phones = contacts.map(c => c.phone).join('\n');
    setForm(f => ({ ...f, recipients: phones }));
  };

  const toggleGroup = (groupId) => {
    setForm(f => ({
      ...f,
      selectedGroupIds: f.selectedGroupIds.includes(groupId)
        ? f.selectedGroupIds.filter(id => id !== groupId)
        : [...f.selectedGroupIds, groupId],
    }));
  };

  const selectedGroupCount = form.selectedGroupIds.reduce((acc, gid) => {
    const g = groups.find(gr => gr.id === gid);
    return acc + (g?.memberCount || 0);
  }, 0);

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Campaigns</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}>
          <FiPlus size={18} /> New Campaign
        </button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>Create Campaign</h3>
            <button onClick={() => setShowCreate(false)} style={styles.iconBtn}><FiX size={18} /></button>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Campaign Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="e.g. Diwali Sale" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>WhatsApp Account *</label>
              <select value={form.whatsappAccountId} onChange={(e) => setForm({ ...form, whatsappAccountId: e.target.value })} style={styles.input}>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.phone})</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Message Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={styles.input}>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="template">Template</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Delay (ms between messages)</label>
              <input type="number" value={form.delayBetweenMessages} onChange={(e) => setForm({ ...form, delayBetweenMessages: e.target.value })} style={styles.input} />
            </div>
          </div>

          {/* Template picker */}
          {templates.length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}><FiFileText size={14} style={{ marginRight: 4 }} /> Use Template</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      type: 'template',
                      messageBody: tpl.body,
                      templateName: tpl.name,
                    }))}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                      border: form.templateName === tpl.name ? '2px solid #e8b931' : '1px solid #e5e7eb',
                      background: form.templateName === tpl.name ? '#e8b93115' : '#f9fafb',
                      color: '#111827', fontWeight: form.templateName === tpl.name ? 600 : 400,
                    }}
                  >
                    {tpl.name}
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>{tpl.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Message Body *</label>
            <textarea value={form.messageBody} onChange={(e) => setForm({ ...form, messageBody: e.target.value })} style={{ ...styles.input, minHeight: 100, resize: 'vertical' }} placeholder="Type your message here or select a template above..." />
          </div>

          {groups.length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}>
                <FiUsers size={14} style={{ marginRight: 4 }} />
                Select Groups ({form.selectedGroupIds.length} selected, ~{selectedGroupCount} contacts)
              </label>
              <div style={styles.groupGrid}>
                {groups.map(g => (
                  <div
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    style={{
                      ...styles.groupChip,
                      borderColor: form.selectedGroupIds.includes(g.id) ? '#e8b931' : '#e5e7eb',
                      background: form.selectedGroupIds.includes(g.id) ? '#e8b93115' : 'white',
                    }}
                  >
                    <div style={styles.groupChipIcon}><FiUsers size={14} /></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{g.memberCount} contacts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>Additional Recipients (one phone per line)</label>
              {contacts.length > 0 && (
                <button onClick={addAllContacts} style={styles.linkBtn}>Add all contacts ({contacts.length})</button>
              )}
            </div>
            <textarea
              value={form.recipients}
              onChange={(e) => setForm({ ...form, recipients: e.target.value })}
              style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
              placeholder="919876543210&#10;919876543211"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Schedule (optional)</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} style={styles.input} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={createCampaign} style={styles.primaryBtn}>Create Campaign</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {campaigns.map(campaign => (
          <div key={campaign.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#111827' }}>{campaign.name}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                  {campaign.WhatsappAccount?.name || 'N/A'} · {campaign.type} · {campaign.totalRecipients} recipients
                </p>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: (statusColors[campaign.status] || '#6b7280') + '15',
                color: statusColors[campaign.status] || '#6b7280',
              }}>
                {campaign.status}
              </span>
            </div>

            {(campaign.status === 'running' || campaign.status === 'completed' || campaign.status === 'paused') && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#6b7280' }}>
                  <span>Sent: <strong style={{ color: '#22c55e' }}>{campaign.sentCount}</strong></span>
                  <span>Failed: <strong style={{ color: '#ef4444' }}>{campaign.failedCount}</strong></span>
                  <span>Remaining: <strong>{campaign.totalRecipients - campaign.sentCount - campaign.failedCount}</strong></span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    width: `${campaign.totalRecipients ? (campaign.sentCount / campaign.totalRecipients) * 100 : 0}%`,
                    height: '100%', background: 'linear-gradient(90deg, #e8b931, #d4a017)', borderRadius: 4,
                    transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {['draft', 'scheduled', 'paused'].includes(campaign.status) && (
                <button onClick={() => startCampaign(campaign.id)} style={{ ...styles.actionBtn, color: '#22c55e' }}>
                  <FiPlay size={14} /> Start
                </button>
              )}
              {campaign.status === 'running' && (
                <button onClick={() => pauseCampaign(campaign.id)} style={{ ...styles.actionBtn, color: '#f59e0b' }}>
                  <FiPause size={14} /> Pause
                </button>
              )}
              {campaign.status !== 'running' && (
                <button onClick={() => deleteCampaign(campaign.id)} style={{ ...styles.actionBtn, color: '#ef4444' }}>
                  <FiTrash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiPlus size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No campaigns yet</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Create a campaign to send bulk messages.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: '#e8b931', color: '#111827', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(232,185,49,0.25)',
  },
  secondaryBtn: {
    padding: '10px 20px', background: '#f3f4f6', color: '#374151',
    border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14,
  },
  linkBtn: {
    background: 'none', border: 'none', color: '#e8b931',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: {
    background: 'white', borderRadius: 14, padding: 24, marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 16,
  },
  field: { marginBottom: 14 },
  label: { display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb',
  },
  groupGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8,
  },
  groupChip: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    border: '2px solid #e5e7eb', borderRadius: 10, cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  groupChipIcon: {
    width: 32, height: 32, borderRadius: 8, background: '#e8b931',
    color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  card: {
    background: 'white', borderRadius: 14, padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, fontWeight: 500,
  },
  progressBar: {
    marginTop: 8, height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden',
  },
};

export default Campaigns;
