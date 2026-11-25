import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiPlus, FiX, FiPlay, FiPause, FiTrash2, FiNavigation, FiClock } from 'react-icons/fi';

const SmsCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [senderIds, setSenderIds] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    name: '', templateId: '', senderIdId: '', routeId: '', message: '',
    numbers: '', groupId: '', dltContentId: '', entityId: '',
    isUnicode: false, messageType: 'text', scheduledAt: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sms/campaigns');
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load campaigns', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const loadFormData = async () => {
    try {
      const [tplRes, sidRes, routeRes, grpRes] = await Promise.all([
        api.get('/sms/templates'),
        api.get('/sms/sender-ids'),
        api.get('/sms/routes'),
        api.get('/sms/groups'),
      ]);
      setTemplates(tplRes.data.templates || []);
      setSenderIds(sidRes.data.senderIds || []);
      setRoutes(routeRes.data.routes || []);
      setGroups(grpRes.data.groups || []);
    } catch (err) {}
  };

  const openCreate = () => {
    loadFormData();
    setForm({ name: '', templateId: '', senderIdId: '', routeId: '', message: '', numbers: '', groupId: '', dltContentId: '', entityId: '', isUnicode: false, messageType: 'text', scheduledAt: '' });
    setShowCreate(true);
  };

  const handleTemplateSelect = (id) => {
    const tpl = templates.find(t => t.id === parseInt(id));
    if (tpl) {
      setForm(f => ({ ...f, templateId: id, message: tpl.body || '', senderIdId: tpl.senderIdId || '', routeId: tpl.routeId || '', dltContentId: tpl.dltContentId || '', entityId: tpl.entityId || '', isUnicode: tpl.isUnicode || false }));
    } else {
      setForm(f => ({ ...f, templateId: '' }));
    }
  };

  const createCampaign = async () => {
    if (!form.name || !form.message || !form.senderIdId) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Name, message and sender ID are required' });
      return;
    }
    const recipients = form.numbers.split(/[\n,;]+/).map(n => n.trim()).filter(Boolean);
    if (recipients.length === 0 && !form.groupId) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Enter numbers or select a group' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/sms/campaigns', {
        name: form.name,
        message: form.message,
        senderIdId: parseInt(form.senderIdId),
        routeId: form.routeId ? parseInt(form.routeId) : undefined,
        templateId: form.templateId ? parseInt(form.templateId) : undefined,
        recipients: recipients.length > 0 ? recipients : undefined,
        groupId: form.groupId ? parseInt(form.groupId) : undefined,
        dltContentId: form.dltContentId || undefined,
        entityId: form.entityId || undefined,
        messageType: form.isUnicode ? 'unicode' : form.messageType,
        scheduledAt: form.scheduledAt || undefined,
      });
      Swal.fire({ icon: 'success', title: 'Campaign Created!', timer: 1500, showConfirmButton: false });
      setShowCreate(false);
      fetchCampaigns();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to create' });
    } finally {
      setSubmitting(false);
    }
  };

  const startCampaign = async (id) => {
    try {
      await api.post(`/sms/campaigns/${id}/start`);
      Swal.fire({ icon: 'success', title: 'Campaign Started', timer: 1200, showConfirmButton: false });
      fetchCampaigns();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to start' });
    }
  };

  const pauseCampaign = async (id) => {
    try {
      await api.post(`/sms/campaigns/${id}/pause`);
      Swal.fire({ icon: 'info', title: 'Campaign Paused', timer: 1200, showConfirmButton: false });
      fetchCampaigns();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to pause' });
    }
  };

  const deleteCampaign = async (id, name) => {
    const result = await Swal.fire({ title: 'Delete Campaign?', text: `Delete "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/sms/campaigns/${id}`);
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
      fetchCampaigns();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete' });
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>SMS Campaigns</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{campaigns.length} campaigns</p>
        </div>
        <button onClick={openCreate} style={styles.primaryBtn}><FiPlus size={18} /> New Campaign</button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Create Campaign</h3>
            <button onClick={() => setShowCreate(false)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
          </div>
          <div style={styles.modalBody}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Campaign Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={styles.input} placeholder="Campaign name" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Template</label>
              <select value={form.templateId} onChange={e => handleTemplateSelect(e.target.value)} style={styles.input}>
                <option value="">Select template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Sender ID *</label>
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
            <div style={styles.field}>
              <label style={styles.label}>Contact Group</label>
              <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} style={styles.input}>
                <option value="">None (use numbers below)</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Schedule (optional)</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>DLT Content ID</label>
              <input value={form.dltContentId} onChange={e => setForm(f => ({ ...f, dltContentId: e.target.value }))} style={styles.input} placeholder="DLT template ID" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Entity ID</label>
              <input value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))} style={styles.input} placeholder="Entity ID" />
            </div>
          </div>
          {!form.groupId && (
            <div style={{ ...styles.field, marginBottom: 14 }}>
              <label style={styles.label}>Numbers (one per line or comma separated)</label>
              <textarea value={form.numbers} onChange={e => setForm(f => ({ ...f, numbers: e.target.value }))} style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} placeholder="919876543210&#10;919876543211" />
            </div>
          )}
          <div style={{ ...styles.field, marginBottom: 14 }}>
            <label style={styles.label}>Message *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ ...styles.input, minHeight: 100, resize: 'vertical' }} placeholder="Type your message..." />
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{form.message.length} chars</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isUnicode} onChange={e => setForm(f => ({ ...f, isUnicode: e.target.checked }))} /> Unicode
            </label>
          </div>
          </div>
          <div style={styles.modalFooter}>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
            <button onClick={createCampaign} disabled={submitting} style={styles.primaryBtn}>{submitting ? 'Creating...' : 'Create Campaign'}</button>
          </div>
        </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Recipients</th>
              <th style={styles.th}>Sent</th>
              <th style={styles.th}>Delivered</th>
              <th style={styles.th}>Failed</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => {
              const sc = statusColors[c.status] || statusColors.draft;
              const progress = c.totalRecipients > 0 ? Math.round((c.sentCount / c.totalRecipients) * 100) : 0;
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={styles.td}>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{c.name}</span>
                    {c.scheduledAt && <div style={{ fontSize: 13, color: '#9ca3af' }}><FiClock size={10} /> Scheduled</div>}
                  </td>
                  <td style={styles.td}>
                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: sc.bg, color: sc.color }}>{c.status}</span>
                  </td>
                  <td style={styles.td}>{c.totalRecipients || 0}</td>
                  <td style={styles.td}>
                    {c.sentCount || 0}
                    {c.totalRecipients > 0 && <div style={{ width: 60, height: 4, background: '#f3f4f6', borderRadius: 2, marginTop: 4 }}><div style={{ width: `${progress}%`, height: '100%', background: '#3B82F6', borderRadius: 2 }} /></div>}
                  </td>
                  <td style={{ ...styles.td, color: '#059669' }}>{c.deliveredCount || 0}</td>
                  <td style={{ ...styles.td, color: '#ef4444' }}>{c.failedCount || 0}</td>
                  <td style={{ ...styles.td, fontSize: 14, color: '#9ca3af' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(c.status === 'draft' || c.status === 'paused') && (
                        <button onClick={() => startCampaign(c.id)} style={styles.actionBtn} title="Start"><FiPlay size={14} color="#3B82F6" /></button>
                      )}
                      {c.status === 'running' && (
                        <button onClick={() => pauseCampaign(c.id)} style={styles.actionBtn} title="Pause"><FiPause size={14} color="#f59e0b" /></button>
                      )}
                      {c.status !== 'running' && (
                        <button onClick={() => deleteCampaign(c.id, c.name)} style={styles.actionBtn} title="Delete"><FiTrash2 size={14} color="#ef4444" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {campaigns.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <FiNavigation size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: '0 0 4px', fontWeight: 500, color: '#6b7280' }}>No campaigns yet</p>
            <p style={{ margin: 0, fontSize: 15 }}>Create your first SMS campaign</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#3B82F6', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 680, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 },
  modalBody: { padding: '20px 24px', overflow: 'auto', flex: 1 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb', flexShrink: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #f3f4f6', fontSize: 13, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '12px 14px', fontSize: 15, color: '#374151' },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
};

export default SmsCampaigns;
