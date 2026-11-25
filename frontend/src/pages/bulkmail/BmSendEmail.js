import { useState, useEffect } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiSend, FiUsers, FiMail, FiFileText } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const BmSendEmail = () => {
  const [senders, setSenders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    senderId: '', templateId: '', groupIds: [], emails: '', subject: '', body: '',
  });
  const [sending, setSending] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/bulkmail/senders'),
      api.get('/bulkmail/templates'),
      api.get('/bulkmail/contact-groups'),
    ]).then(([s, t, g]) => {
      setSenders(s.data.senders || []);
      setTemplates(t.data.templates || []);
      setGroups(g.data.groups || []);
    }).catch(() => alert.error('Failed to load data'));
  }, []);

  const handleTemplateSelect = (id) => {
    setForm({ ...form, templateId: id });
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

  const handleSend = async () => {
    if (!form.senderId) { alert.error('Select a sender'); return; }
    if (!form.subject.trim()) { alert.error('Subject is required'); return; }
    if (!form.body.trim()) { alert.error('Email body is required'); return; }
    if (form.groupIds.length === 0 && !form.emails.trim()) {
      alert.error('Select groups or enter email addresses'); return;
    }
    setSending(true);
    try {
      await api.post('/bulkmail/send', {
        senderId: parseInt(form.senderId),
        templateId: form.templateId ? parseInt(form.templateId) : undefined,
        groupIds: form.groupIds,
        emails: form.emails ? form.emails.split(',').map(e => e.trim()).filter(Boolean) : [],
        subject: form.subject,
        body: form.body,
      });
      alert.success('Emails queued for sending');
      setForm({ senderId: '', templateId: '', groupIds: [], emails: '', subject: '', body: '' });
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Send Email</h2>
        <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>Compose and send emails to your contacts</p>
      </div>

      <div style={styles.panel}>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}><FiMail size={13} style={{ marginRight: 4 }} /> From (Sender) *</label>
            <select value={form.senderId} onChange={e => setForm({ ...form, senderId: e.target.value })} style={styles.input}>
              <option value="">Select sender</option>
              {senders.map(s => <option key={s.id} value={s.id}>{s.name} &lt;{s.email}&gt;</option>)}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              <input type="checkbox" checked={useTemplate} onChange={e => setUseTemplate(e.target.checked)} style={{ marginRight: 6, accentColor: ACCENT }} />
              Use Template
            </label>
            {useTemplate && (
              <select value={form.templateId} onChange={e => handleTemplateSelect(e.target.value)} style={styles.input}>
                <option value="">Select template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}><FiUsers size={13} style={{ marginRight: 4 }} /> Contact Groups</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {groups.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGroup(g.id)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 15, fontWeight: 500,
                  border: form.groupIds.includes(g.id) ? `2px solid ${ACCENT}` : '2px solid #e5e7eb',
                  background: form.groupIds.includes(g.id) ? `${ACCENT}10` : 'white',
                  color: form.groupIds.includes(g.id) ? ACCENT : '#374151',
                  cursor: 'pointer',
                }}
              >
                {g.name} ({g.memberCount || 0})
              </button>
            ))}
            {groups.length === 0 && <span style={{ color: '#9ca3af', fontSize: 15 }}>No groups available</span>}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Additional Email Addresses (comma separated)</label>
          <input value={form.emails} onChange={e => setForm({ ...form, emails: e.target.value })} style={styles.input} placeholder="user1@example.com, user2@example.com" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}><FiFileText size={13} style={{ marginRight: 4 }} /> Subject *</label>
          <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={styles.input} placeholder="Email subject line" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email Body (HTML supported) *</label>
          <textarea
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            style={{ ...styles.input, minHeight: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 15 }}
            placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
          />
        </div>

        <button onClick={handleSend} disabled={sending} style={styles.primaryBtn}>
          <FiSend size={18} /> {sending ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  panel: {
    background: 'white', borderRadius: 14, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: { display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb',
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
    background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 17,
    boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
  },
};

export default BmSendEmail;
