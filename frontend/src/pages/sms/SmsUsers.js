import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { FiPlus, FiX, FiEdit2, FiUserCheck, FiUserX, FiUsers } from 'react-icons/fi';

const SmsUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'user' });
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', role: 'user', password: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/sms/users');
      setUsers(res.data.users || []);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load users', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async () => {
    if (!form.name || !form.phone || !form.password) { Swal.fire({ icon: 'warning', title: 'Required', text: 'Name, phone and password are required' }); return; }
    try {
      await api.post('/sms/users', form);
      Swal.fire({ icon: 'success', title: 'User Created', timer: 1200, showConfirmButton: false });
      setShowCreate(false); setForm({ name: '', phone: '', email: '', password: '', role: 'user' }); fetchUsers();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' }); }
  };

  const toggleActive = async (id, isActive) => {
    try { await api.put(`/sms/users/${id}`, { isActive: !isActive }); fetchUsers(); } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }); }
  };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.email) { Swal.fire({ icon: 'warning', title: 'Required', text: 'Name and email required' }); return; }
    try {
      const data = { name: editForm.name, phone: editForm.phone, email: editForm.email, role: editForm.role };
      if (editForm.password) data.password = editForm.password;
      await api.put(`/sms/users/${editUser.id}`, data);
      Swal.fire({ icon: 'success', title: 'Updated', timer: 1200, showConfirmButton: false });
      setEditUser(null); fetchUsers();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed' }); }
  };

  const roleColors = { super_admin: '#7c3aed', admin: '#db2777', reseller: '#2563eb', user: '#059669' };
  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>SMS Users</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{users.length} users</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> Add User</button>
      </div>

      {showCreate && (
        <div style={styles.createPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>Add User</h3>
            <button onClick={() => setShowCreate(false)} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.field}><label style={styles.label}>Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={styles.input} placeholder="Full name" /></div>
            <div style={styles.field}><label style={styles.label}>Phone *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={styles.input} placeholder="919876543210" /></div>
            <div style={styles.field}><label style={styles.label}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}>Password *</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={styles.input} /></div>
            {['super_admin', 'admin'].includes(currentUser?.role) && (
              <div style={styles.field}><label style={styles.label}>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={styles.input}>
                  <option value="user">User</option><option value="reseller">Reseller</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={createUser} style={styles.primaryBtn}>Create User</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      {editUser && (
        <div style={styles.modalOverlay} onClick={() => setEditUser(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Edit User</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{editUser.name}</p>
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 6, borderRadius: 8 }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={styles.field}><label style={styles.label}>Name *</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={styles.input} /></div>
                <div style={styles.field}><label style={styles.label}>Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} style={styles.input} /></div>
                <div style={styles.field}><label style={styles.label}>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} style={styles.input} /></div>
                <div style={styles.field}><label style={styles.label}>New Password</label><input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} style={styles.input} placeholder="Leave blank to keep" /></div>
                {['super_admin', 'admin'].includes(currentUser?.role) && (
                  <div style={styles.field}><label style={styles.label}>Role</label>
                    <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={styles.input}>
                      <option value="user">User</option><option value="reseller">Reseller</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
              <button onClick={() => setEditUser(null)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={saveEdit} style={styles.primaryBtn}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Phone</th><th style={styles.th}>Email</th><th style={styles.th}>Role</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={styles.td}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={styles.avatar}>{u.name[0].toUpperCase()}</div><span style={{ fontWeight: 500, color: '#111827' }}>{u.name}</span></div></td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{u.phone || '-'}</td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{u.email || '-'}</td>
                <td style={styles.td}><span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: (roleColors[u.role] || '#6b7280') + '15', color: roleColors[u.role] || '#6b7280' }}>{u.role?.replace('_', ' ')}</span></td>
                <td style={styles.td}><span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: u.isActive ? '#22c55e20' : '#ef444420', color: u.isActive ? '#22c55e' : '#ef4444' }}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.id !== currentUser?.id && (
                      <>
                        <button onClick={() => { setEditUser(u); setEditForm({ name: u.name, phone: u.phone || '', email: u.email || '', role: u.role, password: '' }); }} style={styles.actionBtn}><FiEdit2 size={14} color="#2563eb" /></button>
                        <button onClick={() => toggleActive(u.id, u.isActive)} style={styles.actionBtn}>{u.isActive ? <FiUserX size={14} color="#ef4444" /> : <FiUserCheck size={14} color="#22c55e" />}</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}><FiUsers size={36} style={{ opacity: 0.3, marginBottom: 8 }} /><p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>No users found</p></div>
        )}
      </div>
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
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '12px 16px', fontSize: 14 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
};

export default SmsUsers;
