import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiMail } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const BmSenders = () => {
  const [senders, setSenders] = useState([]);
  const [smtps, setSmtps] = useState([]);
  const [senderGroups, setSenderGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editSender, setEditSender] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', replyName: '', replyEmail: '', smtpId: '', senderGroupId: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', replyName: '', replyEmail: '', smtpId: '', senderGroupId: '' });

  const fetchData = useCallback(async () => {
    try {
      const [sRes, smtpRes, sgRes] = await Promise.all([
        api.get('/bulkmail/senders'),
        api.get('/bulkmail/smtp'),
        api.get('/bulkmail/sender-groups'),
      ]);
      setSenders(sRes.data.senders || []);
      setSmtps(smtpRes.data.servers || []);
      setSenderGroups(sgRes.data.groups || []);
    } catch { alert.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createSender = async () => {
    if (!form.name.trim() || !form.email.trim()) { alert.error('Name and email are required'); return; }
    try {
      await api.post('/bulkmail/senders', {
        ...form,
        smtpId: form.smtpId ? parseInt(form.smtpId) : undefined,
        senderGroupId: form.senderGroupId ? parseInt(form.senderGroupId) : undefined,
      });
      alert.success('Sender created');
      setShowCreate(false);
      setForm({ name: '', email: '', replyName: '', replyEmail: '', smtpId: '', senderGroupId: '' });
      fetchData();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to create'); }
  };

  const openEdit = (s) => {
    setEditSender(s);
    setEditForm({
      name: s.name, email: s.email, replyName: s.replyName || '', replyEmail: s.replyEmail || '',
      smtpId: s.smtpId || '', senderGroupId: s.senderGroupId || '',
    });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) { alert.error('Name and email are required'); return; }
    try {
      await api.put(`/bulkmail/senders/${editSender.id}`, {
        ...editForm,
        smtpId: editForm.smtpId ? parseInt(editForm.smtpId) : null,
        senderGroupId: editForm.senderGroupId ? parseInt(editForm.senderGroupId) : null,
      });
      alert.success('Sender updated');
      setEditSender(null);
      fetchData();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to update'); }
  };

  const deleteSender = async (id) => {
    if (!window.confirm('Delete this sender?')) return;
    try { await api.delete(`/bulkmail/senders/${id}`); alert.success('Deleted'); fetchData(); }
    catch { alert.error('Failed to delete'); }
  };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  const renderForm = (f, setF, isEdit) => (
    <div style={styles.formGrid}>
      <div style={styles.field}>
        <label style={styles.label}>Sender Name *</label>
        <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} style={styles.input} placeholder="John Doe" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Sender Email *</label>
        <input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} style={styles.input} placeholder="john@company.com" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Reply Name</label>
        <input value={f.replyName} onChange={e => setF({ ...f, replyName: e.target.value })} style={styles.input} placeholder="Optional" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Reply Email</label>
        <input type="email" value={f.replyEmail} onChange={e => setF({ ...f, replyEmail: e.target.value })} style={styles.input} placeholder="Optional" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>SMTP Server</label>
        <select value={f.smtpId} onChange={e => setF({ ...f, smtpId: e.target.value })} style={styles.input}>
          <option value="">Default</option>
          {smtps.map(s => <option key={s.id} value={s.id}>{s.host}:{s.port}</option>)}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Sender Group</label>
        <select value={f.senderGroupId} onChange={e => setF({ ...f, senderGroupId: e.target.value })} style={styles.input}>
          <option value="">None</option>
          {senderGroups.map(sg => <option key={sg.id} value={sg.id}>{sg.name}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Email Senders</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{senders.length} senders</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> Add Sender</button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Add Sender</h3>
              <button onClick={() => setShowCreate(false)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>{renderForm(form, setForm, false)}</div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={createSender} style={styles.primaryBtn}>Add Sender</button>
            </div>
          </div>
        </div>
      )}

      {editSender && (
        <div style={styles.modalOverlay} onClick={() => setEditSender(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Edit Sender</h3>
              <button onClick={() => setEditSender(null)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>{renderForm(editForm, setEditForm, true)}</div>
            <div style={styles.modalFooter}>
              <button onClick={() => setEditSender(null)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={saveEdit} style={styles.primaryBtn}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Sender</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Reply To</th>
              <th style={styles.th}>SMTP</th>
              <th style={styles.th}>Group</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {senders.map(s => (
              <tr key={s.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={styles.avatar}><FiMail size={14} /></div>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{s.email}</td>
                <td style={{ ...styles.td, color: '#6b7280', fontSize: 15 }}>{s.replyEmail || '-'}</td>
                <td style={{ ...styles.td, color: '#6b7280', fontSize: 15 }}>{s.Smtp ? `${s.Smtp.host}:${s.Smtp.port}` : 'Default'}</td>
                <td style={{ ...styles.td, color: '#6b7280', fontSize: 15 }}>{s.SenderGroup?.name || '-'}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(s)} style={styles.actionBtn}><FiEdit2 size={14} color="#2563eb" /></button>
                    <button onClick={() => deleteSender(s.id)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {senders.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <FiMail size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>No senders configured</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f3f4f6', fontSize: 13, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: 16 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: `${ACCENT}15`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  modalBody: { padding: '20px 24px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' },
};

export default BmSenders;
