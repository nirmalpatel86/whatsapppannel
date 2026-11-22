import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import alert from '../utils/alert';
import { FiArrowUpCircle, FiArrowDownCircle, FiFilter } from 'react-icons/fi';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ type: '', startDate: '', endDate: '' });
  const [viewUserId, setViewUserId] = useState('');
  const [users, setUsers] = useState([]);

  const isAdmin = ['super_admin', 'reseller'].includes(user?.role);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (filter.type) params.type = filter.type;
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;

      const url = viewUserId ? `/wallet/transactions/${viewUserId}` : '/wallet/transactions';
      const res = await api.get(url, { params });
      setTransactions(res.data.transactions);
      setWallet(res.data.wallet);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      alert.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, filter, viewUserId]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/wallet/rechargeable-users').then(res => setUsers(res.data.users)).catch(() => {});
    }
  }, [isAdmin]);

  const typeIcons = {
    recharge: { icon: FiArrowUpCircle, color: '#22c55e', label: 'Recharge' },
    deduction: { icon: FiArrowDownCircle, color: '#ef4444', label: 'Deduction' },
    refund: { icon: FiArrowUpCircle, color: '#3b82f6', label: 'Refund' },
  };

  const categoryLabels = {
    marketing: 'Marketing', utility: 'Utility', authentication: 'Auth',
    service: 'Service', text_only: 'Text',
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 22, fontWeight: 700 }}>Transaction History</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            {total} transactions | Balance: ₹{wallet?.balance?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <FiFilter size={16} color="#9ca3af" />
          <select value={filter.type} onChange={(e) => { setFilter({ ...filter, type: e.target.value }); setPage(1); }} style={styles.filterSelect}>
            <option value="">All Types</option>
            <option value="recharge">Recharge</option>
            <option value="deduction">Deduction</option>
            <option value="refund">Refund</option>
          </select>
          <input type="date" value={filter.startDate} onChange={(e) => { setFilter({ ...filter, startDate: e.target.value }); setPage(1); }} style={styles.filterSelect} />
          <input type="date" value={filter.endDate} onChange={(e) => { setFilter({ ...filter, endDate: e.target.value }); setPage(1); }} style={styles.filterSelect} />
          {isAdmin && (
            <select value={viewUserId} onChange={(e) => { setViewUserId(e.target.value); setPage(1); }} style={styles.filterSelect}>
              <option value="">My Transactions</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          )}
          {(filter.type || filter.startDate || filter.endDate || viewUserId) && (
            <button onClick={() => { setFilter({ type: '', startDate: '', endDate: '' }); setViewUserId(''); setPage(1); }} style={styles.clearBtn}>Clear</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <SummaryCard label="Balance" value={`₹${wallet?.balance?.toFixed(2) || '0.00'}`} color="#e8b931" />
        <SummaryCard label="Total Recharged" value={`₹${wallet?.totalRecharged?.toFixed(2) || '0.00'}`} color="#22c55e" />
        <SummaryCard label="Total Spent" value={`₹${wallet?.totalSpent?.toFixed(2) || '0.00'}`} color="#ef4444" />
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Balance After</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Recipient</th>
              <th style={styles.th}>By</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(txn => {
              const ti = typeIcons[txn.type] || typeIcons.deduction;
              const TIcon = ti.icon;
              return (
                <tr key={txn.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TIcon size={18} color={ti.color} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: ti.color }}>{ti.label}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700, color: txn.type === 'deduction' ? '#ef4444' : '#22c55e' }}>
                    {txn.type === 'deduction' ? '-' : '+'}₹{txn.amount?.toFixed(4)}
                  </td>
                  <td style={styles.td}>₹{txn.balanceAfter?.toFixed(4)}</td>
                  <td style={{ ...styles.td, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {txn.description}
                  </td>
                  <td style={styles.td}>
                    {txn.messageCategory && (
                      <span style={styles.categoryBadge}>{categoryLabels[txn.messageCategory] || txn.messageCategory}</span>
                    )}
                  </td>
                  <td style={styles.td}>{txn.recipientPhone || '-'}</td>
                  <td style={styles.td}>{txn.performer ? <span style={{ fontSize: 12 }}>{txn.performer.name}</span> : '-'}</td>
                  <td style={{ ...styles.td, fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(txn.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {transactions.length === 0 && !loading && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No transactions found</div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>Prev</button>
          <span style={{ padding: '8px 16px', color: '#6b7280', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.pageBtn}>Next</button>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div style={{
    background: 'white', borderRadius: 14, padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
  </div>
);

const styles = {
  filterBar: {
    background: 'white', borderRadius: 14, padding: '12px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16, border: '1px solid #e5e7eb',
  },
  filterSelect: {
    padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, outline: 'none', background: '#f9fafb',
  },
  clearBtn: {
    padding: '7px 14px', background: '#f9fafb', border: '1px solid #e5e7eb',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#ef4444', fontWeight: 600,
  },
  tableWrapper: {
    background: 'white', borderRadius: 14, overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
  },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 800 },
  th: {
    textAlign: 'left', padding: '10px 14px', borderBottom: '2px solid #f3f4f6',
    fontSize: 11, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', whiteSpace: 'nowrap',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '10px 14px', fontSize: 13, color: '#374151' },
  categoryBadge: {
    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
    background: '#3b82f615', color: '#3b82f6',
  },
  pageBtn: {
    padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb',
    borderRadius: 8, cursor: 'pointer', fontSize: 13,
  },
};

export default Transactions;
