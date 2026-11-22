import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import alert from '../utils/alert';
import { FiPlus, FiTrash2, FiUsers, FiUserPlus, FiChevronDown, FiChevronUp, FiSearch, FiX } from 'react-icons/fi';

const ContactGroups = () => {
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, contactsRes] = await Promise.all([api.get('/groups'), api.get('/contacts?limit=1000')]);
      setGroups(groupsRes.data.groups);
      setContacts(contactsRes.data.contacts);
    } catch (err) { alert.error('Failed to load data'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createGroup = async () => {
    if (!form.name.trim()) { alert.error('Group name is required'); return; }
    try {
      await api.post('/groups', { name: form.name, description: form.description, contactIds: selectedContacts });
      alert.success('Group created'); setShowCreate(false); setForm({ name: '', description: '' }); setSelectedContacts([]); fetchData();
    } catch (err) { alert.error(err.response?.data?.error || 'Failed to create group'); }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    try { await api.delete(`/groups/${id}`); alert.success('Group deleted'); if (expandedGroup === id) setExpandedGroup(null); fetchData(); }
    catch (err) { alert.error('Failed to delete group'); }
  };

  const toggleExpand = async (groupId) => {
    if (expandedGroup === groupId) { setExpandedGroup(null); setGroupMembers([]); return; }
    try { const res = await api.get(`/groups/${groupId}/members`); setGroupMembers(res.data.contacts); setExpandedGroup(groupId); }
    catch (err) { alert.error('Failed to load members'); }
  };

  const addMembersToGroup = async (groupId) => {
    if (selectedContacts.length === 0) { alert.error('Select contacts first'); return; }
    try {
      await api.post(`/groups/${groupId}/members`, { contactIds: selectedContacts });
      alert.success('Members added'); setShowAddMembers(null); setSelectedContacts([]); setMemberSearch('');
      const res = await api.get(`/groups/${groupId}/members`); setGroupMembers(res.data.contacts); fetchData();
    } catch (err) { alert.error('Failed to add members'); }
  };

  const removeMember = async (groupId, contactId) => {
    try { await api.delete(`/groups/${groupId}/members`, { data: { contactIds: [contactId] } }); alert.success('Member removed'); setGroupMembers(prev => prev.filter(c => c.id !== contactId)); fetchData(); }
    catch (err) { alert.error('Failed to remove member'); }
  };

  const toggleContact = (id) => { setSelectedContacts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]); };
  const filteredContacts = contacts.filter(c => { const q = memberSearch.toLowerCase(); return (c.name?.toLowerCase().includes(q) || c.phone?.includes(q)); });
  const existingMemberIds = groupMembers.map(m => m.id);
  const availableContacts = filteredContacts.filter(c => !existingMemberIds.includes(c.id));

  if (loading) return <div style={{ padding: 28, color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Contact Groups</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{groups.length} groups</p>
        </div>
        <button onClick={() => { setShowCreate(true); setSelectedContacts([]); }} style={styles.primaryBtn}><FiPlus size={18} /> New Group</button>
      </div>

      {showCreate && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Create Group</h3>
            <button onClick={() => setShowCreate(false)} style={styles.iconBtn}><FiX size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={styles.label}>Group Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="e.g. VIP Customers" /></div>
            <div><label style={styles.label}>Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={styles.input} placeholder="Optional" /></div>
          </div>
          <label style={styles.label}>Add Contacts ({selectedContacts.length} selected)</label>
          <div style={styles.contactPicker}>
            <div style={styles.pickerSearch}><FiSearch size={14} color="#9ca3af" /><input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search contacts..." style={styles.pickerInput} /></div>
            <div style={styles.contactList}>
              {filteredContacts.map(c => (
                <label key={c.id} style={styles.contactOption}>
                  <input type="checkbox" checked={selectedContacts.includes(c.id)} onChange={() => toggleContact(c.id)} style={{ accentColor: '#e8b931' }} />
                  <div style={styles.miniAvatar}>{(c.name || c.phone)[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{c.name || c.phone}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{c.phone}</div></div>
                </label>
              ))}
              {filteredContacts.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No contacts found</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={createGroup} style={styles.primaryBtn}>Create Group</button>
            <button onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(group => (
          <div key={group.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={styles.groupIcon}><FiUsers size={18} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{group.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{group.memberCount} contacts{group.description ? ` · ${group.description}` : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setShowAddMembers(showAddMembers === group.id ? null : group.id); setSelectedContacts([]); setMemberSearch(''); toggleExpand(group.id); }} style={styles.actionBtn}><FiUserPlus size={15} /></button>
                <button onClick={() => toggleExpand(group.id)} style={styles.actionBtn}>{expandedGroup === group.id ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}</button>
                <button onClick={() => deleteGroup(group.id)} style={{ ...styles.actionBtn, color: '#ef4444' }}><FiTrash2 size={15} /></button>
              </div>
            </div>
            {expandedGroup === group.id && (
              <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                {showAddMembers === group.id && (
                  <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#111827' }}>Add Contacts</div>
                    <div style={styles.pickerSearch}><FiSearch size={14} color="#9ca3af" /><input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search..." style={styles.pickerInput} /></div>
                    <div style={{ ...styles.contactList, maxHeight: 160 }}>
                      {availableContacts.map(c => (
                        <label key={c.id} style={styles.contactOption}>
                          <input type="checkbox" checked={selectedContacts.includes(c.id)} onChange={() => toggleContact(c.id)} style={{ accentColor: '#e8b931' }} />
                          <span style={{ fontSize: 13, color: '#111827' }}>{c.name || c.phone}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{c.phone}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => addMembersToGroup(group.id)} style={{ ...styles.primaryBtn, marginTop: 8, padding: '6px 16px', fontSize: 13 }}>Add {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}</button>
                  </div>
                )}
                {groupMembers.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {groupMembers.map(m => (
                      <div key={m.id} style={styles.memberChip}>
                        <div style={styles.miniAvatar}>{(m.name || m.phone)[0].toUpperCase()}</div>
                        <div><div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{m.name || m.phone}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>{m.phone}</div></div>
                        <button onClick={() => removeMember(group.id, m.id)} style={{ ...styles.iconBtn, padding: 2 }}><FiX size={12} color="#ef4444" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No members yet.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {groups.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <FiUsers size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px' }}>No groups yet</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Create a group to organize contacts for campaigns.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#e8b931', color: '#111827', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(232,185,49,0.25)' },
  secondaryBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  card: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  groupIcon: { width: 42, height: 42, borderRadius: 10, background: '#e8b931', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionBtn: { display: 'flex', alignItems: 'center', padding: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', color: '#374151' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  contactPicker: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  pickerSearch: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' },
  pickerInput: { flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#111827' },
  contactList: { maxHeight: 220, overflow: 'auto' },
  contactOption: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', fontSize: 13 },
  miniAvatar: { width: 28, height: 28, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 },
  memberChip: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f9fafb', borderRadius: 20, border: '1px solid #e5e7eb' },
};

export default ContactGroups;
