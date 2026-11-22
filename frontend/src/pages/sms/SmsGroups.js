import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';

const SmsGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sms/groups');
      setGroups(res.data.groups || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const save = async () => {
    if (!form.name.trim()) { Swal.fire({ icon: 'warning', title: 'Required', text: 'Group name is required' }); return; }
    try {
      if (editItem) {
        await api.put(`/sms/groups/${editItem.id}`, form);
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1200, showConfirmButton: false });
      } else {
        await api.post('/sms/groups', form);
        Swal.fire({ icon: 'success', title: 'Created!', timer: 1200, showConfirmButton: false });
      }
      setShowCreate(false); setEditItem(null); fetchGroups();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' });
    }
  };

  const remove = async (id, name) => {
    const r = await Swal.fire({ title: 'Delete Group?', text: `Delete "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
    if (!r.isConfirmed) return;
    try { await api.delete(`/sms/groups/${id}`); fetchGroups(); } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }); }
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Contact Groups</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{groups.length} groups</p>
        </div>
        <button onClick={() => { setForm({ name: '', description: '' }); setEditItem(null); setShowCreate(true); }} style={styles.primaryBtn}><FiPlus size={18} /> New Group</button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{editItem ? 'Edit Group' : 'Create Group'}</h3>
            <button onClick={() => { setShowCreate(false); setEditItem(null); }} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={styles.input} placeholder="Group name" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={styles.input} placeholder="Optional description" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={save} style={styles.primaryBtn}>{editItem ? 'Update' : 'Create'}</button>
            <button onClick={() => { setShowCreate(false); setEditItem(null); }} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {groups.map(g => (
          <div key={g.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#111827' }}>{g.name}</h4>
                {g.description && <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{g.description}</p>}
                <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>{g.memberCount || 0} members</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => { setForm({ name: g.name, description: g.description || '' }); setEditItem(g); setShowCreate(true); }} style={styles.actionBtn}><FiEdit2 size={14} color="#3B82F6" /></button>
                <button onClick={() => remove(g.id, g.name)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && !loading && (
        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <FiFolder size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>No groups yet</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#3B82F6', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  createPanel: { background: 'white', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
};

export default SmsGroups;
