import { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiSend, FiType, FiHash, FiPhone } from 'react-icons/fi';

function calculateSmsCount(text, isUnicode) {
  let len = text.length;
  const newlineCount = (text.match(/\n/g) || []).length;
  len -= newlineCount;
  if (isUnicode) {
    if (len < 71) return 1;
    if (len < 135) return 2;
    if (len < 202) return 3;
    if (len < 269) return 4;
    if (len < 336) return 5;
    return Math.ceil(len / 67);
  }
  if (len < 161) return 1;
  if (len < 307) return 2;
  if (len < 460) return 3;
  return Math.ceil(len / 153);
}

const SmsSendSms = () => {
  const [senderIds, setSenderIds] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    numbers: '', message: '', senderIdId: '', routeId: '', templateId: '',
    dltContentId: '', entityId: '', isUnicode: false, messageType: 'text',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/sms/sender-ids'),
      api.get('/sms/routes'),
      api.get('/sms/templates'),
    ]).then(([sidRes, routeRes, tplRes]) => {
      setSenderIds(sidRes.data.senderIds || []);
      setRoutes(routeRes.data.routes || []);
      setTemplates(tplRes.data.templates || []);
    }).catch(() => {});
  }, []);

  const smsCount = calculateSmsCount(form.message, form.isUnicode);
  const numbers = form.numbers.split(/[\n,;]+/).map(n => n.trim()).filter(Boolean);
  const totalSms = smsCount * numbers.length;

  const handleTemplateSelect = (id) => {
    const tpl = templates.find(t => t.id === parseInt(id));
    if (tpl) {
      setForm(f => ({
        ...f, templateId: id, message: tpl.body || '', senderIdId: tpl.senderIdId || '',
        routeId: tpl.routeId || '', dltContentId: tpl.dltContentId || '',
        entityId: tpl.entityId || '', isUnicode: tpl.isUnicode || false,
      }));
    } else {
      setForm(f => ({ ...f, templateId: '' }));
    }
  };

  const handleSend = async () => {
    if (!form.numbers.trim() || !form.message.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Enter numbers and message' });
      return;
    }
    if (!form.senderIdId) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Select a Sender ID' });
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/sms/campaigns', {
        name: `Quick Send ${new Date().toLocaleString('en-IN')}`,
        recipients: numbers,
        message: form.message,
        senderIdId: parseInt(form.senderIdId),
        routeId: form.routeId ? parseInt(form.routeId) : undefined,
        templateId: form.templateId ? parseInt(form.templateId) : undefined,
        dltContentId: form.dltContentId || undefined,
        entityId: form.entityId || undefined,
        messageType: form.isUnicode ? 'unicode' : form.messageType,
      });

      try {
        await api.post(`/sms/campaigns/${res.data.campaign.id}/start`);
        Swal.fire({ icon: 'success', title: 'Sending started', text: `${numbers.length} recipients, ${totalSms} total SMS`, timer: 2000, showConfirmButton: false });
      } catch (startErr) {
        Swal.fire({ icon: 'warning', title: 'Saved but not sent', text: startErr.response?.data?.error || 'Could not start sending' });
      }

      setForm({ numbers: '', message: '', senderIdId: '', routeId: '', templateId: '', dltContentId: '', entityId: '', isUnicode: false, messageType: 'text' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to send' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Send SMS</h2>
        <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>Send quick SMS to one or multiple numbers</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: '#111827' }}>Configuration</h3>

          <div style={styles.field}>
            <label style={styles.label}>Template (optional)</label>
            <select value={form.templateId} onChange={e => handleTemplateSelect(e.target.value)} style={styles.input}>
              <option value="">Select template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={styles.field}>
              <label style={styles.label}><FiHash size={12} style={{ marginRight: 4 }} />Sender ID *</label>
              <select value={form.senderIdId} onChange={e => setForm(f => ({ ...f, senderIdId: e.target.value }))} style={styles.input}>
                <option value="">Select...</option>
                {senderIds.filter(s => s.status === 'approved').map(s => <option key={s.id} value={s.id}>{s.senderId}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Route</label>
              <select value={form.routeId} onChange={e => setForm(f => ({ ...f, routeId: e.target.value }))} style={styles.input}>
                <option value="">Auto</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.routeType})</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={styles.field}>
              <label style={styles.label}>DLT Content ID</label>
              <input value={form.dltContentId} onChange={e => setForm(f => ({ ...f, dltContentId: e.target.value }))} style={styles.input} placeholder="DLT template ID" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Entity ID</label>
              <input value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))} style={styles.input} placeholder="Entity ID" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isUnicode} onChange={e => setForm(f => ({ ...f, isUnicode: e.target.checked }))} />
              Unicode (Hindi/Regional)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.messageType === 'flash'} onChange={e => setForm(f => ({ ...f, messageType: e.target.checked ? 'flash' : 'text' }))} />
              Flash SMS
            </label>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: '#111827' }}>Compose</h3>

          <div style={styles.field}>
            <label style={styles.label}><FiPhone size={12} style={{ marginRight: 4 }} />Numbers * (one per line or comma separated)</label>
            <textarea value={form.numbers} onChange={e => setForm(f => ({ ...f, numbers: e.target.value }))} style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} placeholder="919876543210&#10;919876543211" />
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{numbers.length} number(s)</div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}><FiType size={12} style={{ marginRight: 4 }} />Message *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ ...styles.input, minHeight: 120, resize: 'vertical' }} placeholder="Type your message..." />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              <span>{form.message.length} chars | {smsCount} SMS per number</span>
              <span>Total: {totalSms} SMS</span>
            </div>
          </div>

          <button onClick={handleSend} disabled={sending} style={styles.primaryBtn}>
            <FiSend size={16} />
            {sending ? 'Sending...' : `Send ${totalSms} SMS`}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: 'white', borderRadius: 14, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  field: { marginBottom: 14 },
  label: { display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb',
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px',
    background: '#3B82F6', color: '#ffffff', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 17, width: '100%',
    boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
  },
};

export default SmsSendSms;
