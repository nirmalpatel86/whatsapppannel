import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import alert from '../../utils/alert';
import { FiPlus, FiUserCheck, FiUserX, FiUsers, FiX, FiEdit2, FiLogIn } from 'react-icons/fi';

const ACCENT = '#3B82F6';
const PHONE_REGEX = /^\d{12}$/;
const ROLE_RANK = { super_admin: 4, admin: 3, reseller: 2, user: 1 };

const BmUsers = () => {
  const { user: currentUser, impersonate } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'user' });
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', role: 'user', perHrLimit: 100, password: '' });

  const fetchUsers = useCallback(async () => {
    try { const res = await api.get('/bulkmail/users'); setUsers(res.data.users || []); }
    catch { alert.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async () => {
    if (!form.name || !form.phone || !form.password) { alert.error('Name, phone and password are required'); return; }
    if (!PHONE_REGEX.test(form.phone)) { alert.error('Mobile number must be exactly 12 digits (country code + number), e.g. 919876543210'); return; }
    try {
      await api.post('/bulkmail/users', form);
      alert.success('User created'); setShowCreate(false); setForm({ name: '', phone: '', email: '', password: '', role: 'user' }); fetchUsers();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to create'); }
  };

  const toggleActive = async (id, isActive) => {
    try { await api.put(`/bulkmail/users/${id}`, { isActive: !isActive }); alert.success(isActive ? 'User deactivated' : 'User activated'); fetchUsers(); }
    catch { alert.error('Failed to update'); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, phone: u.phone || '', email: u.email || '', role: u.role, perHrLimit: u.perHrLimit || 100, password: '' });
    setShowCreate(false);
  };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.email) { alert.error('Name and email are required'); return; }
    if (!PHONE_REGEX.test(editForm.phone)) { alert.error('Mobile number must be exactly 12 digits (country code + number), e.g. 919876543210'); return; }
    try {
      const data = { name: editForm.name, phone: editForm.phone, email: editForm.email, role: editForm.role, perHrLimit: parseInt(editForm.perHrLimit) || 100 };
      if (editForm.password) data.password = editForm.password;
      await api.put(`/bulkmail/users/${editUser.id}`, data);
      alert.success('User updated'); setEditUser(null); fetchUsers();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to update'); }
  };

  const loginAsUser = async (u) => {
    if (!window.confirm(`Login as ${u.name}? You can return to your own account anytime.`)) return;
    try {
      const res = await api.post(`/bulkmail/users/${u.id}/impersonate`);
      impersonate(res.data.token, res.data.user, 'bulkmail');
      navigate('/bulkmail/dashboard');
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to login as user');
    }
  };

  const roleColors = { super_admin: '#7c3aed', admin: '#db2777', reseller: '#2563eb', user: '#059669' };

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Users</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{users.length} users</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}><FiPlus size={18} /> Add User</button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Add User</h3>
              <button onClick={() => setShowCreate(false)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.field}><label style={styles.label}>Name *</label><input autoComplete="off" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="Full name" /></div>
                <div style={styles.field}><label style={styles.label}>Phone * (12 digits)</label><input autoComplete="off" inputMode="numeric" maxLength={12} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 12) })} style={styles.input} placeholder="919876543210" /></div>
                <div style={styles.field}><label style={styles.label}>Email</label><input type="email" autoComplete="off" name="new-user-email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={styles.input} placeholder="user@example.com" /></div>
                <div style={styles.field}><label style={styles.label}>Password *</label><input type="password" autoComplete="new-password" name="new-user-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={styles.input} placeholder="Min 6 characters" /></div>
                {['super_admin', 'admin'].includes(currentUser?.role) && (
                  <div style={styles.field}><label style={styles.label}>Role</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={styles.input}><option value="user">User</option><option value="reseller">Reseller</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></div>
                )}
              </div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button><button onClick={createUser} style={styles.primaryBtn}>Create User</button></div>
          </div>
        </div>
      )}

      {editUser && (
        <div style={styles.modalOverlay} onClick={() => setEditUser(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div><h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Edit User</h3><p style={{ margin: '4px 0 0', fontSize: 15, color: '#6b7280' }}>{editUser.name} &middot; {editUser.phone}</p></div>
              <button onClick={() => setEditUser(null)} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.field}><label style={styles.label}>Name *</label><input autoComplete="off" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={styles.input} /></div>
                <div style={styles.field}><label style={styles.label}>Phone (12 digits)</label><input autoComplete="off" inputMode="numeric" maxLength={12} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 12) })} style={styles.input} /></div>
                <div style={styles.field}><label style={styles.label}>Email</label><input type="email" autoComplete="off" name="edit-user-email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={styles.input} /></div>
                <div style={styles.field}><label style={styles.label}>New Password</label><input type="password" autoComplete="new-password" name="edit-user-password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} style={styles.input} placeholder="Leave blank to keep" /></div>
                {['super_admin', 'admin'].includes(currentUser?.role) && (
                  <div style={styles.field}><label style={styles.label}>Role</label><select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={styles.input}><option value="user">User</option><option value="reseller">Reseller</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></div>
                )}
                <div style={styles.field}><label style={styles.label}>Per Hour Limit</label><input type="number" min="1" value={editForm.perHrLimit} onChange={e => setEditForm({ ...editForm, perHrLimit: e.target.value })} style={styles.input} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 0', borderTop: '1px solid #f3f4f6', marginTop: 8 }}>
                <span style={{ fontSize: 14, color: '#9ca3af' }}>Status:</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: editUser.isActive ? '#22c55e' : '#ef4444' }}>{editUser.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setEditUser(null)} style={styles.secondaryBtn}>Cancel</button><button onClick={saveEdit} style={styles.primaryBtn}>Save Changes</button></div>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Phone</th><th style={styles.th}>Email</th><th style={styles.th}>Role</th><th style={styles.th}>Company</th><th style={styles.th}>Limit/hr</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={styles.tr}>
                <td style={styles.td}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={styles.avatar}>{u.name?.[0]?.toUpperCase()}</div><span style={{ fontWeight: 500, color: '#111827' }}>{u.name}</span></div></td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{u.phone || '-'}</td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{u.email || '-'}</td>
                <td style={styles.td}><span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: (roleColors[u.role] || '#6b7280') + '15', color: roleColors[u.role] || '#6b7280' }}>{u.role?.replace('_', ' ')}</span></td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{u.Company?.name || '-'}</td>
                <td style={{ ...styles.td, color: '#6b7280', textAlign: 'center' }}>{u.perHrLimit || 100}</td>
                <td style={styles.td}><span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: u.isActive ? '#22c55e20' : '#ef444420', color: u.isActive ? '#22c55e' : '#ef4444' }}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.id !== currentUser?.id && (
                      <>
                        <button onClick={() => openEdit(u)} style={styles.actionBtn} title="Edit"><FiEdit2 size={14} color="#2563eb" /></button>
                        <button onClick={() => toggleActive(u.id, u.isActive)} style={styles.actionBtn} title={u.isActive ? 'Deactivate' : 'Activate'}>{u.isActive ? <FiUserX size={14} color="#ef4444" /> : <FiUserCheck size={14} color="#22c55e" />}</button>
                        {u.isActive && (ROLE_RANK[u.role] || 0) < (ROLE_RANK[currentUser?.role] || 0) && (
                          <button onClick={() => loginAsUser(u)} style={styles.actionBtn} title="Login as this user"><FiLogIn size={14} color={ACCENT} /></button>
                        )}
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
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f3f4f6', fontSize: 13, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: 16 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16, flexShrink: 0 },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  modalBody: { padding: '20px 24px' },
  modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' },
};

export default BmUsers;
