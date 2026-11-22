import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { FiSearch, FiEdit2, FiPlus, FiX, FiPhone, FiUser, FiUpload, FiDownload, FiTrash2, FiCheckSquare, FiSquare } from 'react-icons/fi';

const emptyForm = {
  firstName: '', lastName: '', phone: '', countryCode: '91',
  alternateMobile: '', email: '', profession: '',
  contactType: '', dateOfBirth: '', anniversary: '',
  state: '', city: '', address: '',
};

const contactTypes = ['Customer', 'Lead', 'Vendor', 'Partner', 'Employee', 'Other'];

const countryCodes = [
  { code: '91', label: '+91 India' },
  { code: '1', label: '+1 US' },
  { code: '44', label: '+44 UK' },
  { code: '971', label: '+971 UAE' },
  { code: '966', label: '+966 SA' },
  { code: '61', label: '+61 AU' },
  { code: '86', label: '+86 CN' },
  { code: '81', label: '+81 JP' },
  { code: '92', label: '+92 PK' },
  { code: '880', label: '+880 BD' },
  { code: '977', label: '+977 NP' },
];

const SAMPLE_CSV = `First Name,Last Name,Mobile,Alternate Mobile,Email,Profession,Contact Type,Date of Birth,Anniversary,State,City,Address
Rahul,Sharma,919876543210,919876543211,rahul@email.com,Engineer,Customer,1990-05-15,2015-11-20,Maharashtra,Mumbai,123 MG Road
Priya,Patel,919876543212,,priya@email.com,Doctor,Lead,1985-08-22,,Gujarat,Ahmedabad,456 SG Highway`;

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const bulkInputRef = useRef(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts', { params: { search: search || undefined, page, limit: 50 } });
      setContacts(res.data.contacts);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load contacts', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { setSelected(new Set()); }, [contacts]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map(c => c.id)));
  };

  const deleteContact = async (id, name) => {
    const result = await Swal.fire({
      title: 'Delete Contact?',
      text: `Are you sure you want to delete "${name || 'this contact'}"?`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete', cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/contacts/${id}`);
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
      fetchContacts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete' });
    }
  };

  const bulkDelete = async () => {
    const count = selected.size;
    const result = await Swal.fire({
      title: `Delete ${count} Contacts?`,
      text: 'This action cannot be undone.',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
      confirmButtonText: `Delete ${count}`, cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await api.post('/contacts/bulk-delete', { ids: [...selected] });
      Swal.fire({ icon: 'success', title: `${count} contacts deleted`, timer: 1500, showConfirmButton: false });
      setSelected(new Set());
      fetchContacts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete' });
    }
  };

  const addContact = async () => {
    if (!addForm.phone.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Phone number is required' });
      return;
    }
    const rawPhone = addForm.phone.trim().replace(/\D/g, '');
    const fullPhone = rawPhone.startsWith(addForm.countryCode) ? rawPhone : addForm.countryCode + rawPhone;
    if (fullPhone.length < 10 || fullPhone.length > 15) {
      Swal.fire({ icon: 'warning', title: 'Invalid', text: 'Phone must be 10-15 digits with country code' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/contacts', {
        firstName: addForm.firstName, lastName: addForm.lastName, phone: fullPhone,
        alternateMobile: addForm.alternateMobile, email: addForm.email,
        profession: addForm.profession, contactType: addForm.contactType,
        dateOfBirth: addForm.dateOfBirth, anniversary: addForm.anniversary,
        state: addForm.state, city: addForm.city, address: addForm.address,
      });
      Swal.fire({ icon: 'success', title: 'Added!', timer: 1500, showConfirmButton: false });
      setShowAdd(false);
      setAddForm({ ...emptyForm });
      fetchContacts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to add contact' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c) => {
    setShowEdit(c);
    setEditForm({
      firstName: c.firstName || '', lastName: c.lastName || '', phone: c.phone || '', countryCode: '91',
      alternateMobile: c.alternateMobile || '', email: c.email || '', profession: c.profession || '',
      contactType: c.contactType || '', dateOfBirth: c.dateOfBirth || '', anniversary: c.anniversary || '',
      state: c.state || '', city: c.city || '', address: c.address || '',
    });
  };

  const saveEdit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/contacts/${showEdit.id}`, {
        firstName: editForm.firstName, lastName: editForm.lastName,
        alternateMobile: editForm.alternateMobile, email: editForm.email,
        profession: editForm.profession, contactType: editForm.contactType,
        dateOfBirth: editForm.dateOfBirth, anniversary: editForm.anniversary,
        state: editForm.state, city: editForm.city, address: editForm.address,
      });
      Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
      setShowEdit(null);
      fetchContacts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to update' });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setSubmitting(true);
    setBulkResult(null);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await api.post('/contacts/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBulkResult(res.data);
      fetchContacts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Upload failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormFields = (form, setForm, isEdit) => (
    <div style={styles.modalGrid}>
      <div style={styles.field}>
        <label style={styles.label}>First Name</label>
        <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} style={styles.input} placeholder="First name" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Last Name</label>
        <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} style={styles.input} placeholder="Last name" />
      </div>
      <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
        <label style={styles.label}><FiPhone size={13} style={{ marginRight: 4 }} /> Mobile *</label>
        {isEdit ? (
          <input value={form.phone} style={{ ...styles.input, background: '#f3f4f6', color: '#9ca3af' }} disabled />
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={form.countryCode} onChange={e => setForm(f => ({ ...f, countryCode: e.target.value }))} style={{ ...styles.input, width: 140, flexShrink: 0 }}>
              {countryCodes.map(cc => <option key={cc.code} value={cc.code}>{cc.label}</option>)}
            </select>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ ...styles.input, flex: 1 }} placeholder="9876543210" />
          </div>
        )}
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Alternate Mobile</label>
        <input value={form.alternateMobile} onChange={e => setForm(f => ({ ...f, alternateMobile: e.target.value }))} style={styles.input} placeholder="Alternate number" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Email</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={styles.input} placeholder="email@example.com" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Profession</label>
        <input value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} style={styles.input} placeholder="Profession" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Contact Type</label>
        <select value={form.contactType} onChange={e => setForm(f => ({ ...f, contactType: e.target.value }))} style={styles.input}>
          <option value="">Select</option>
          {contactTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Date of Birth</label>
        <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} style={styles.input} />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Anniversary</label>
        <input type="date" value={form.anniversary} onChange={e => setForm(f => ({ ...f, anniversary: e.target.value }))} style={styles.input} />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>State</label>
        <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} style={styles.input} placeholder="State" />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>City</label>
        <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={styles.input} placeholder="City" />
      </div>
      <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
        <label style={styles.label}>Address</label>
        <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={{ ...styles.input, minHeight: 60, resize: 'vertical' }} placeholder="Full address" />
      </div>
    </div>
  );

  const allSelected = contacts.length > 0 && selected.size === contacts.length;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Contacts</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{total} contacts total</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={styles.searchBox}>
            <FiSearch size={15} color="#9ca3af" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search contacts..." style={styles.searchInput} />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} style={styles.clearIcon}><FiX size={14} /></button>}
          </div>
          <button onClick={() => { setBulkFile(null); setBulkResult(null); setShowBulk(true); }} style={styles.outlineBtn}><FiUpload size={15} /> Bulk Upload</button>
          <button onClick={() => setShowAdd(true)} style={styles.primaryBtn}><FiPlus size={18} /> Add Contact</button>
        </div>
      </div>

      {/* Bulk selection toolbar */}
      {selected.size > 0 && (
        <div style={styles.selectionBar}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selected.size} selected</span>
          <button onClick={bulkDelete} style={styles.deleteBtn}><FiTrash2 size={14} /> Delete Selected</button>
          <button onClick={() => setSelected(new Set())} style={styles.outlineBtn}>Clear Selection</button>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAdd && (
        <div style={styles.modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Add New Contact</h3>
              <button onClick={() => setShowAdd(false)} style={styles.closeBtn}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              {renderFormFields(addForm, setAddForm, false)}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowAdd(false)} style={styles.outlineBtn}>Cancel</button>
              <button onClick={addContact} disabled={submitting} style={styles.primaryBtn}>{submitting ? 'Adding...' : 'Add Contact'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEdit && (
        <div style={styles.modalOverlay} onClick={() => setShowEdit(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Edit Contact</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{showEdit.name} &middot; {showEdit.phone}</p>
              </div>
              <button onClick={() => setShowEdit(null)} style={styles.closeBtn}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              {renderFormFields(editForm, setEditForm, true)}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowEdit(null)} style={styles.outlineBtn}>Cancel</button>
              <button onClick={saveEdit} disabled={submitting} style={styles.primaryBtn}>{submitting ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulk && (
        <div style={styles.modalOverlay} onClick={() => setShowBulk(false)}>
          <div style={{ ...styles.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Bulk Upload Contacts</h3>
              <button onClick={() => setShowBulk(false)} style={styles.closeBtn}><FiX size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#166534' }}>Step 1: Download Sample CSV</p>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#15803d' }}>Download the sample file, fill in your contacts, then upload it below.</p>
                <button onClick={downloadSample} style={{ ...styles.outlineBtn, background: 'white', border: '1px solid #bbf7d0' }}>
                  <FiDownload size={15} /> Download Sample CSV
                </button>
              </div>
              <div style={{ background: '#f9fafb', border: '2px dashed #d1d5db', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#374151' }}>Step 2: Upload Your CSV</p>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>Supported format: .csv (max 5MB)</p>
                <input ref={bulkInputRef} type="file" accept=".csv" onChange={e => { setBulkFile(e.target.files[0] || null); setBulkResult(null); }} style={{ display: 'none' }} />
                <button onClick={() => bulkInputRef.current?.click()} style={{ ...styles.outlineBtn, border: '1px solid #d1d5db' }}>Choose File</button>
                {bulkFile && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{bulkFile.name}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>({(bulkFile.size / 1024).toFixed(1)} KB)</span>
                    <button onClick={() => { setBulkFile(null); if (bulkInputRef.current) bulkInputRef.current.value = ''; }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><FiX size={14} /></button>
                  </div>
                )}
              </div>
              {bulkResult && (
                <div style={{ marginTop: 16, background: bulkResult.imported > 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${bulkResult.imported > 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: bulkResult.imported > 0 ? '#166534' : '#991b1b' }}>{bulkResult.message}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span style={{ color: '#166534' }}>Imported: <b>{bulkResult.imported}</b></span>
                    <span style={{ color: '#92400e' }}>Skipped: <b>{bulkResult.skipped}</b></span>
                    <span style={{ color: '#6b7280' }}>Total: <b>{bulkResult.total}</b></span>
                  </div>
                  {bulkResult.errors?.length > 0 && (
                    <div style={{ marginTop: 10, maxHeight: 120, overflow: 'auto', fontSize: 12, color: '#991b1b' }}>
                      {bulkResult.errors.map((e, i) => <div key={i}>Row {e.row}: {e.reason}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowBulk(false)} style={styles.outlineBtn}>Close</button>
              <button onClick={handleBulkUpload} disabled={!bulkFile || submitting} style={{ ...styles.primaryBtn, opacity: !bulkFile ? 0.5 : 1 }}>
                {submitting ? 'Uploading...' : <><FiUpload size={15} /> Upload & Import</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 40, textAlign: 'center' }}>
                <button onClick={toggleAll} style={styles.checkBtn}>
                  {allSelected ? <FiCheckSquare size={16} color="#e8b931" /> : <FiSquare size={16} color="#d1d5db" />}
                </button>
              </th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>City</th>
              <th style={styles.th}>Last Message</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(contact => (
              <tr key={contact.id} style={{ ...styles.tr, background: selected.has(contact.id) ? '#fefce8' : 'transparent' }}>
                <td style={{ ...styles.td, width: 40, textAlign: 'center' }}>
                  <button onClick={() => toggleSelect(contact.id)} style={styles.checkBtn}>
                    {selected.has(contact.id) ? <FiCheckSquare size={16} color="#e8b931" /> : <FiSquare size={16} color="#d1d5db" />}
                  </button>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={styles.avatar}>{(contact.name || contact.phone || '?')[0].toUpperCase()}</div>
                    <div>
                      <span style={{ fontWeight: 500, color: '#111827', display: 'block' }}>{contact.name || '-'}</span>
                      {contact.profession && <span style={{ fontSize: 11, color: '#9ca3af' }}>{contact.profession}</span>}
                    </div>
                  </div>
                </td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>{contact.phone}</td>
                <td style={{ ...styles.td, color: '#6b7280', fontSize: 13 }}>{contact.email || '-'}</td>
                <td style={styles.td}>
                  {contact.contactType ? (
                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#fef3c7', color: '#92400e' }}>{contact.contactType}</span>
                  ) : '-'}
                </td>
                <td style={{ ...styles.td, color: '#6b7280', fontSize: 13 }}>{contact.city || '-'}</td>
                <td style={{ ...styles.td, fontSize: 12, color: '#9ca3af' }}>
                  {contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(contact)} style={styles.editBtn} title="Edit">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => deleteContact(contact.id, contact.name)} style={styles.delRowBtn} title="Delete">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <FiUser size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: '0 0 4px', fontWeight: 500, color: '#6b7280' }}>No contacts found</p>
            <p style={{ margin: 0, fontSize: 13 }}>Contacts are auto-created from incoming messages, or add them manually.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>Prev</button>
          <span style={{ padding: '8px 16px', color: '#6b7280', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.pageBtn}>Next</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: '#e8b931', color: '#111827', border: 'none', borderRadius: 10,
    fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(232,185,49,0.25)',
  },
  outlineBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10,
    cursor: 'pointer', fontSize: 14,
  },
  deleteBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 10,
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  selectionBar: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
    background: '#fefce8', border: '1px solid #fde68a', borderRadius: 12, marginBottom: 16,
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
    background: 'white', borderRadius: 10, border: '1px solid #e5e7eb',
  },
  searchInput: { border: 'none', outline: 'none', fontSize: 13, width: 200, color: '#111827' },
  clearIcon: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 },
  label: { display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb',
  },
  field: { marginBottom: 0 },
  closeBtn: { background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 6, borderRadius: 8 },
  checkBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'white', borderRadius: 16, width: '100%', maxWidth: 640,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px', borderBottom: '1px solid #f3f4f6', flexShrink: 0,
  },
  modalBody: { padding: '20px 24px', overflow: 'auto', flex: 1 },
  modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 12,
    padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb', flexShrink: 0,
  },
  tableWrapper: {
    background: 'white', borderRadius: 14, overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f3f4f6',
    fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f9fafb',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: 14 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: '#374151',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: 14, flexShrink: 0,
  },
  editBtn: {
    background: '#f3f4f6', border: '1px solid #e5e7eb', cursor: 'pointer', color: '#6b7280',
    padding: '6px 8px', borderRadius: 8,
  },
  delRowBtn: {
    background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', color: '#ef4444',
    padding: '6px 8px', borderRadius: 8,
  },
  pageBtn: {
    padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb',
    borderRadius: 8, cursor: 'pointer', fontSize: 13,
  },
};

export default Contacts;
