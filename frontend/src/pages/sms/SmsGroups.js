import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiFolder, FiUserPlus, FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const SmsGroups = () => {
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);

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
  useEffect(() => { api.get('/sms/contacts?limit=1000').then(res => setContacts(res.data.contacts || [])).catch(() => {}); }, []);

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
    try {
      await api.delete(`/sms/groups/${id}`);
      if (expandedGroup === id) setExpandedGroup(null);
      fetchGroups();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error' }); }
  };

  const toggleExpand = async (groupId) => {
    if (expandedGroup === groupId) { setExpandedGroup(null); setGroupMembers([]); return; }
    try {
      const res = await api.get(`/sms/groups/${groupId}/members`);
      setGroupMembers(res.data.contacts || []);
      setExpandedGroup(groupId);
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load members' }); }
  };

  const toggleContact = (id) => setSelectedContacts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const addMembersToGroup = async (groupId) => {
    if (selectedContacts.length === 0) { Swal.fire({ icon: 'warning', title: 'Select contacts first' }); return; }
    try {
      await api.post(`/sms/groups/${groupId}/members`, { contactIds: selectedContacts });
      setShowAddMembers(null); setSelectedContacts([]); setMemberSearch('');
      const res = await api.get(`/sms/groups/${groupId}/members`);
      setGroupMembers(res.data.contacts || []);
      fetchGroups();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to add members' }); }
  };

  const removeMember = async (groupId, contactId) => {
    try {
      await api.delete(`/sms/groups/${groupId}/members`, { data: { contactIds: [contactId] } });
      setGroupMembers(prev => prev.filter(c => c.id !== contactId));
      fetchGroups();
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to remove' }); }
  };

  const filteredContacts = contacts.filter(c => {
    const q = memberSearch.toLowerCase();
    return !q || c.phone?.includes(q) || c.name?.toLowerCase().includes(q);
  });
  const existingIds = groupMembers.map(m => m.id);
  const availableContacts = filteredContacts.filter(c => !existingIds.includes(c.id));

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>Contact Groups</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{groups.length} groups</p>
        </div>
        <button onClick={() => { setForm({ name: '', description: '' }); setEditItem(null); setShowCreate(true); }} style={styles.primaryBtn}><FiPlus size={18} /> New Group</button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => { setShowCreate(false); setEditItem(null); }}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{editItem ? 'Edit Group' : 'Create Group'}</h3>
              <button onClick={() => { setShowCreate(false); setEditItem(null); }} style={{ ...styles.iconBtn, padding: 6, borderRadius: 8, background: '#f3f4f6' }}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
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
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => { setShowCreate(false); setEditItem(null); }} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={save} style={styles.primaryBtn}>{editItem ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(g => (
          <div key={g.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 600, color: '#111827' }}>{g.name}</h4>
                {g.description && <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{g.description}</p>}
                <div style={{ marginTop: 8, fontSize: 14, color: '#9ca3af' }}>{g.memberCount || 0} members</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => { setShowAddMembers(showAddMembers === g.id ? null : g.id); setSelectedContacts([]); setMemberSearch(''); toggleExpand(g.id); }} style={styles.actionBtn} title="Add contacts"><FiUserPlus size={14} /></button>
                <button onClick={() => toggleExpand(g.id)} style={styles.actionBtn} title="View members">{expandedGroup === g.id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}</button>
                <button onClick={() => { setForm({ name: g.name, description: g.description || '' }); setEditItem(g); setShowCreate(true); }} style={styles.actionBtn}><FiEdit2 size={14} color="#3B82F6" /></button>
                <button onClick={() => remove(g.id, g.name)} style={styles.actionBtn}><FiTrash2 size={14} color="#ef4444" /></button>
              </div>
            </div>

            {expandedGroup === g.id && (
              <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                {showAddMembers === g.id && (
                  <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#111827' }}>Add Contacts</div>
                    <div style={styles.pickerSearch}><FiSearch size={14} color="#9ca3af" /><input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search by name or phone..." style={styles.pickerInput} /></div>
                    <div style={{ ...styles.contactList, maxHeight: 180 }}>
                      {availableContacts.slice(0, 100).map(c => (
                        <label key={c.id} style={styles.contactOption}>
                          <input type="checkbox" checked={selectedContacts.includes(c.id)} onChange={() => toggleContact(c.id)} style={{ accentColor: ACCENT }} />
                          <span style={{ fontSize: 15, color: '#111827' }}>{c.phone}</span>
                          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto' }}>{c.name}</span>
                        </label>
                      ))}
                      {availableContacts.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 15 }}>No contacts found</div>}
                    </div>
                    <button onClick={() => addMembersToGroup(g.id)} style={{ ...styles.primaryBtn, marginTop: 8, padding: '6px 16px', fontSize: 15 }}>Add {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}</button>
                  </div>
                )}
                {groupMembers.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {groupMembers.map(m => (
                      <div key={m.id} style={styles.memberChip}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{m.phone}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{m.name}</div>
                        </div>
                        <button onClick={() => removeMember(g.id, m.id)} style={{ ...styles.iconBtn, padding: 2 }}><FiX size={12} color="#ef4444" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 15 }}>No members yet.</div>
                )}
              </div>
            )}
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
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#3B82F6', color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px rgba(59,130,246,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  modalBody: { padding: '20px 24px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 },
  field: { marginBottom: 0 },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 15 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  actionBtn: { background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 },
  pickerSearch: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f3f4f6', background: 'white', borderRadius: '8px 8px 0 0', border: '1px solid #e5e7eb' },
  pickerInput: { flex: 1, border: 'none', outline: 'none', fontSize: 15, background: 'transparent', color: '#111827' },
  contactList: { maxHeight: 220, overflow: 'auto', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', background: 'white' },
  contactOption: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', fontSize: 15 },
  memberChip: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' },
};

export default SmsGroups;
