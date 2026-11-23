import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { FiSearch, FiEdit2, FiPlus, FiX, FiMail, FiUser, FiUpload, FiDownload, FiTrash2, FiCheckSquare, FiSquare } from 'react-icons/fi';

const ACCENT = '#EF4444';

const emptyForm = { email: '', firstName: '', lastName: '', col1: '', col2: '', col3: '', col4: '', col5: '' };

const BmContacts = () => {
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
      const res = await api.get('/bulkmail/contacts', { params: { search: search || undefined, page, limit: 50 } });
      setContacts(res.data.contacts || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load contacts', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { setSelected(new Set()); }, [contacts]);

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => { if (selected.size === contacts.length) setSelected(new Set()); else setSelected(new Set(contacts.map(c => c.id))); };

  const deleteContact = async (id) => {
    const result = await Swal.fire({ title: 'Delete Contact?', icon: 'warning', showCancelButton: true, confirmButtonColor: ACCENT, confirmButtonText: 'Delete' });
    if (!result.isConfirmed) return;
    try { await api.delete(`/bulkmail/contacts/${id}`); Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false }); fetchContacts(); }
    catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete' }); }
  };

  const bulkDelete = async () => {
    const count = selected.size;
    const result = await Swal.fire({ title: `Delete ${count} Contacts?`, text: 'This cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: ACCENT, confirmButtonText: `Delete ${count}` });
    if (!result.isConfirmed) return;
    try { await api.post('/bulkmail/contacts/bulk-delete', { ids: [...selected] }); Swal.fire({ icon: 'success', title: `${count} contacts deleted`, timer: 1500, showConfirmButton: false }); setSelected(new Set()); fetchContacts(); }
    catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to delete' }); }
  };

  const addContact = async () => {
    if (!addForm.email.trim()) { Swal.fire({ icon: 'warning', title: 'Required', text: 'Email is required' }); return; }
    setSubmitting(true);
    try {
      await api.post('/bulkmail/contacts', addForm);
      Swal.fire({ icon: 'success', title: 'Added!', timer: 1500, showConfirmButton: false });
      setShowAdd(false); setAddForm({ ...emptyForm }); fetchContacts();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to add' }); }
    finally { setSubmitting(false); }
  };

  const openEdit = (c) => {
    setShowEdit(c);
    setEditForm({ email: c.email || '', firstName: c.firstName || '', lastName: c.lastName || '', col1: c.col1 || '', col2: c.col2 || '', col3: c.col3 || '', col4: c.col4 || '', col5: c.col5 || '' });
  };

  const saveEdit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/bulkmail/contacts/${showEdit.id}`, editForm);
      Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
      setShowEdit(null); fetchContacts();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to update' }); }
    finally { setSubmitting(false); }
  };

  const downloadSample = () => {
    const csv = 'Email,First Name,Last Name,Col1,Col2,Col3,Col4,Col5\nuser@example.com,John,Doe,Value1,Value2,,,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bulkmail_contacts_sample.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setSubmitting(true); setBulkResult(null);
    try {
      const formData = new FormData(); formData.append('file', bulkFile);
      const res = await api.post('/bulkmail/contacts/bulk-import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkResult(res.data); fetchContacts();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Upload failed' }); }
    finally { setSubmitting(false); }
  };

  const renderFormFields = (f, setF) => (
    <div style={styles.modalGrid}>
      <div style={styles.field}><label style={styles.label}><FiMail size={13} style={{ marginRight: 4 }} /> Email *</label><input type="email" value={f.email} onChange={e => setF(prev => ({ ...prev, email: e.target.value }))} style={styles.input} placeholder="user@example.com" /></div>
      <div style={styles.field}><label style={styles.label}>First Name</label><input value={f.firstName} onChange={e => setF(prev => ({ ...prev, firstName: e.target.value }))} style={styles.input} /></div>
      <div style={styles.field}><label style={styles.label}>Last Name</label><input value={f.lastName} onChange={e => setF(prev => ({ ...prev, lastName: e.target.value }))} style={styles.input} /></div>
      <div style={styles.field}><label style={styles.label}>Custom Field 1</label><input value={f.col1} onChange={e => setF(prev => ({ ...prev, col1: e.target.value }))} style={styles.input} /></div>
      <div style={styles.field}><label style={styles.label}>Custom Field 2</label><input value={f.col2} onChange={e => setF(prev => ({ ...prev, col2: e.target.value }))} style={styles.input} /></div>
      <div style={styles.field}><label style={styles.label}>Custom Field 3</label><input value={f.col3} onChange={e => setF(prev => ({ ...prev, col3: e.target.value }))} style={styles.input} /></div>
    </div>
  );

  const allSelected = contacts.length > 0 && selected.size === contacts.length;

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Email Contacts</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{total} contacts total</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={styles.searchBox}>
            <FiSearch size={15} color="#9ca3af" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search contacts..." style={styles.searchInput} />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} style={styles.clearIcon}><FiX size={14} /></button>}
          </div>
          <button onClick={() => { setBulkFile(null); setBulkResult(null); setShowBulk(true); }} style={styles.outlineBtn}><FiUpload size={15} /> Bulk Upload</button>
          <button onClick={() => setShowAdd(true)} style={styles.primaryBtn}><FiPlus size={18} /> Add Contact</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div style={styles.selectionBar}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selected.size} selected</span>
          <button onClick={bulkDelete} style={styles.deleteBtn}><FiTrash2 size={14} /> Delete Selected</button>
          <button onClick={() => setSelected(new Set())} style={styles.outlineBtn}>Clear Selection</button>
        </div>
      )}

      {showAdd && (
        <div style={styles.modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Add New Contact</h3><button onClick={() => setShowAdd(false)} style={styles.closeBtn}><FiX size={18} /></button></div>
            <div style={styles.modalBody}>{renderFormFields(addForm, setAddForm)}</div>
            <div style={styles.modalFooter}><button onClick={() => setShowAdd(false)} style={styles.outlineBtn}>Cancel</button><button onClick={addContact} disabled={submitting} style={styles.primaryBtn}>{submitting ? 'Adding...' : 'Add Contact'}</button></div>
          </div>
        </div>
      )}

      {showEdit && (
        <div style={styles.modalOverlay} onClick={() => setShowEdit(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><div><h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Edit Contact</h3><p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{showEdit.email}</p></div><button onClick={() => setShowEdit(null)} style={styles.closeBtn}><FiX size={18} /></button></div>
            <div style={styles.modalBody}>{renderFormFields(editForm, setEditForm)}</div>
            <div style={styles.modalFooter}><button onClick={() => setShowEdit(null)} style={styles.outlineBtn}>Cancel</button><button onClick={saveEdit} disabled={submitting} style={styles.primaryBtn}>{submitting ? 'Saving...' : 'Save Changes'}</button></div>
          </div>
        </div>
      )}

      {showBulk && (
        <div style={styles.modalOverlay} onClick={() => setShowBulk(false)}>
          <div style={{ ...styles.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Bulk Upload Contacts</h3><button onClick={() => setShowBulk(false)} style={styles.closeBtn}><FiX size={18} /></button></div>
            <div style={styles.modalBody}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#991b1b' }}>Step 1: Download Sample CSV</p>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#b91c1c' }}>Download the sample, fill in contacts, then upload below.</p>
                <button onClick={downloadSample} style={{ ...styles.outlineBtn, background: 'white', border: '1px solid #fecaca' }}><FiDownload size={15} /> Download Sample CSV</button>
              </div>
              <div style={{ background: '#f9fafb', border: '2px dashed #d1d5db', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#374151' }}>Step 2: Upload Your CSV</p>
                <input ref={bulkInputRef} type="file" accept=".csv" onChange={e => { setBulkFile(e.target.files[0] || null); setBulkResult(null); }} style={{ display: 'none' }} />
                <button onClick={() => bulkInputRef.current?.click()} style={{ ...styles.outlineBtn, border: '1px solid #d1d5db', marginTop: 8 }}>Choose File</button>
                {bulkFile && (<div style={{ marginTop: 12, fontSize: 13, color: '#111827', fontWeight: 500 }}>{bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)</div>)}
              </div>
              {bulkResult && (
                <div style={{ marginTop: 16, background: bulkResult.imported > 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${bulkResult.imported > 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: bulkResult.imported > 0 ? '#166534' : '#991b1b' }}>{bulkResult.message}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span style={{ color: '#166534' }}>Imported: <b>{bulkResult.imported}</b></span>
                    <span style={{ color: '#92400e' }}>Skipped: <b>{bulkResult.skipped}</b></span>
                  </div>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowBulk(false)} style={styles.outlineBtn}>Close</button><button onClick={handleBulkUpload} disabled={!bulkFile || submitting} style={{ ...styles.primaryBtn, opacity: !bulkFile ? 0.5 : 1 }}>{submitting ? 'Uploading...' : <><FiUpload size={15} /> Upload & Import</>}</button></div>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 40, textAlign: 'center' }}><button onClick={toggleAll} style={styles.checkBtn}>{allSelected ? <FiCheckSquare size={16} color={ACCENT} /> : <FiSquare size={16} color="#d1d5db" />}</button></th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Subscribed</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id} style={{ ...styles.tr, background: selected.has(c.id) ? '#fef2f2' : 'transparent' }}>
                <td style={{ ...styles.td, width: 40, textAlign: 'center' }}><button onClick={() => toggleSelect(c.id)} style={styles.checkBtn}>{selected.has(c.id) ? <FiCheckSquare size={16} color={ACCENT} /> : <FiSquare size={16} color="#d1d5db" />}</button></td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={styles.avatar}>{(c.email || '?')[0].toUpperCase()}</div>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{c.email}</span>
                  </div>
                </td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{[c.firstName, c.lastName].filter(Boolean).join(' ') || '-'}</td>
                <td style={styles.td}>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: c.isSubscribed !== false ? '#22c55e20' : '#ef444420', color: c.isSubscribed !== false ? '#22c55e' : '#ef4444' }}>
                    {c.isSubscribed !== false ? 'Yes' : 'No'}
                  </span>
                </td>
                <td style={{ ...styles.td, fontSize: 12, color: '#9ca3af' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={styles.editBtn}><FiEdit2 size={14} /></button>
                    <button onClick={() => deleteContact(c.id)} style={styles.delRowBtn}><FiTrash2 size={14} /></button>
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
            <p style={{ margin: 0, fontSize: 13 }}>Add contacts manually or upload a CSV file.</p>
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
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: '#ffffff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 8px rgba(239,68,68,0.25)' },
  outlineBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  deleteBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  selectionBar: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 16 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'white', borderRadius: 10, border: '1px solid #e5e7eb' },
  searchInput: { border: 'none', outline: 'none', fontSize: 13, width: 200, color: '#111827' },
  clearIcon: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 },
  label: { display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 13 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  field: { marginBottom: 0 },
  closeBtn: { background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 6, borderRadius: 8 },
  checkBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 16, width: '100%', maxWidth: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 },
  modalBody: { padding: '20px 24px', overflow: 'auto', flex: 1 },
  modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#f9fafb', flexShrink: 0 },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: 14 },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 },
  editBtn: { background: '#f3f4f6', border: '1px solid #e5e7eb', cursor: 'pointer', color: '#6b7280', padding: '6px 8px', borderRadius: 8 },
  delRowBtn: { background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', color: '#ef4444', padding: '6px 8px', borderRadius: 8 },
  pageBtn: { padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
};

export default BmContacts;
