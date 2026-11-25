import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import alert from '../../utils/alert';
import { FiCreditCard, FiArrowUp, FiArrowDown, FiFilter } from 'react-icons/fi';

const ACCENT = '#3B82F6';

const SmsTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/sms/transactions', { params });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      alert.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const typeColors = { recharge: '#22c55e', deduction: '#ef4444', refund: '#f59e0b', adjustment: '#8b5cf6' };

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#111827', fontSize: 24, fontWeight: 700 }}>SMS Transactions</h2>
          <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>Wallet transaction history</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiFilter size={14} color="#6b7280" />
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} style={styles.filterSelect}>
            <option value="">All Types</option>
            <option value="recharge">Recharge</option>
            <option value="deduction">Deduction</option>
            <option value="refund">Refund</option>
          </select>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Balance After</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: (typeColors[t.type] || '#6b7280') + '15',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {t.type === 'recharge' || t.type === 'refund'
                        ? <FiArrowDown size={14} color={typeColors[t.type]} />
                        : <FiArrowUp size={14} color={typeColors[t.type]} />}
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                      background: (typeColors[t.type] || '#6b7280') + '15',
                      color: typeColors[t.type] || '#6b7280', textTransform: 'capitalize',
                    }}>{t.type}</span>
                  </div>
                </td>
                <td style={{ ...styles.td, fontWeight: 700, color: t.type === 'recharge' || t.type === 'refund' ? '#22c55e' : '#ef4444' }}>
                  {t.type === 'recharge' || t.type === 'refund' ? '+' : '-'}{t.amount} SMS
                </td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{t.balanceAfter} SMS</td>
                <td style={{ ...styles.td, color: '#374151', fontSize: 15, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.description || '-'}
                </td>
                <td style={{ ...styles.td, color: '#9ca3af', fontSize: 15 }}>{t.reference || '-'}</td>
                <td style={{ ...styles.td, color: '#6b7280', fontSize: 15 }}>
                  {new Date(t.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
            <FiCreditCard size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: '0 0 4px', fontWeight: 500, color: '#6b7280' }}>No transactions found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>Prev</button>
          <span style={{ padding: '8px 16px', color: '#6b7280', fontSize: 15 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.pageBtn}>Next</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  filterSelect: { padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 15, background: 'white', color: '#374151', outline: 'none' },
  tableWrapper: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f3f4f6', fontSize: 13, fontWeight: 600, color: '#9ca3af', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: 16 },
  pageBtn: { padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 15 },
};

export default SmsTransactions;
