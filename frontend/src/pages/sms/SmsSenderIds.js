import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiHash } from 'react-icons/fi';

const SmsSenderIds = () => {
  const [senderIds, setSenderIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ senderId: '', routeId: '', entityId: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sidRes, routeRes] = await Promise.all([api.get('/sms/sender-ids'), api.get('/sms/routes')]);
      setSenderIds(sidRes.data.senderIds || []);
      setRoutes(routeRes.data.routes || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm({ senderId: '', routeId: '', entityId: '' });
    setEditItem(null);
    setShowCreate(true);
  };

  const openEdit = (s) => {
    setForm({ senderId: s.senderId, routeId: s.routeId || '', entityId: s.entityId || '' });
    setEditItem(s);
    setShowCreate(true);
  };

  const save = async () => {
    if (!form.senderId.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Sender ID is required' });
      return;
    }
    if (form.senderId.length > 11) {
      Swal.fire({ icon: 'warning', title: 'Invalid', text: 'Sender ID max 11 characters' });
      return;
    }
    try {
      const payload = { senderId: form.senderId, routeId: form.routeId || null, entityId: form.entityId || null };
      if (editItem) {
        await api.put(`/sms/sender-ids/${editItem.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1200, showConfirmButton: false });
      } else {
        await api.post('/sms/sender-ids', payload);
        Swal.fire({ icon: 'success', title: 'Created!', timer: 1200, showConfirmButton: false });
      }
      setShowCreate(false);
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' });
    }
  };

  const remove = async (id, name) => {
    const result = await Swal.fire({ title: 'Delete Sender ID?', text: `Delete "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/sms/sender-ids/${id}`);
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' });
    }
  };

  const statusColors = { pending: { bg: '#fef3c7', color: '#92400e' }, approved: { bg: '#d1fae5', color: '#065f46' }, rejected: { bg: '#fee2e2', color: '#991b1b' } };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Sender IDs</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{senderIds.length} sender IDs</p>
        </div>
        <button onClick={openCreate} style={styles.primaryBtn}><FiPlus size={18} /> Add Sender ID</button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{editItem ? 'Edit Sender ID' : 'Add Sender ID'}</h3>
              <button onClick={() => setShowCreate(false)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Sender ID * (max 11 chars)</label>
                  <input value={form.senderId} onChange={e => setForm(f => ({ ...f, senderId: e.target.value.toUpperCase() }))} style={styles.input} placeholder="MYSMSID" maxLength={11} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Route</label>
                  <select value={form.routeId} onChange={e => setForm(f => ({ ...f, routeId: e.target.value }))} style={styles.input}>
                    <option value="">All Routes</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.routeType})</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Entity ID</label>
                  <input value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))} style={styles.input} placeholder="DLT Entity ID" />
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={save} style={styles.primaryBtn}>{editItem ? 'Update' : 'Add Sender ID'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Sender ID</th>
              <th style={styles.th}>Route</th>
              <th style={styles.th}>Entity ID</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Active</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {senderIds.map(s => {
              const sc = statusColors[s.status] || statusColors.pending;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={styles.td}><span style={{ fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>{s.senderId}</span></td>
                  <td style={styles.td}>{s.SmsRoute?.name || 'All'}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 14, color: '#6b7280' }}>{s.entityId || '-'}</td>
                  <td style={styles.td}>
                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: sc.bg, color: sc.color }}>{s.status}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: s.isActive ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 14 }}>{s.isActive ? 'Yes' : 'No'}</span>
                  </td>
                  <td style={{ ...styles.td, fontSize: 14, color: '#9ca3af' }}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(s)} style={styles.actionBtn}><FiEdit2 size={14} color="#3B82F6" /></button>
                      <button onClick={() => remove(s.id, s.senderId)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {senderIds.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <FiHash size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>No sender IDs yet</p>
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
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  modalBody: { padding: '20px 24px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' },
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

export default SmsSenderIds;
