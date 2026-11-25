import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const ApiDocCard = ({ title, endpoint, headers = [], parameters = [], curlCode, accent = '#3B82F6' }) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const copy = (text, setFlag) => {
    navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 1500);
  };

  return (
    <div style={styles.wrapper}>
      <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#111827' }}>{title}</h3>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Endpoint</div>
        <div style={styles.endpointRow}>
          <code style={styles.endpointCode}>{endpoint}</code>
          <button style={{ ...styles.copyBtn, borderColor: accent, color: accent }} onClick={() => copy(endpoint, setCopiedEndpoint)}>
            {copiedEndpoint ? <FiCheck size={13} /> : <FiCopy size={13} />} {copiedEndpoint ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Headers</div>
        <table style={styles.table}>
          <tbody>
            {headers.map((h) => (
              <tr key={h.key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ ...styles.td, color: '#dc2626', fontFamily: 'monospace', width: 180 }}>{h.key}</td>
                <td style={styles.td}>{h.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Parameters</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Field</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Description</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((p) => (
              <tr key={p.field} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ ...styles.td, color: '#dc2626', fontFamily: 'monospace' }}>{p.field}</td>
                <td style={{ ...styles.td, color: '#6b7280' }}>{p.type}</td>
                <td style={styles.td}>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>cURL Example</div>
        <pre style={styles.pre}>{curlCode}</pre>
        <button style={{ ...styles.copyBtn, borderColor: accent, color: accent, marginTop: 10 }} onClick={() => copy(curlCode, setCopiedCurl)}>
          {copiedCurl ? <FiCheck size={13} /> : <FiCopy size={13} />} {copiedCurl ? 'Copied' : 'Copy cURL'}
        </button>
      </div>

      <div style={{ ...styles.tip, borderColor: `${accent}30`, background: `${accent}08` }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 8 }}>How to import in Postman?</div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 15, color: '#4b5563', lineHeight: 1.8 }}>
          <li>Click Copy cURL button above</li>
          <li>Open Postman → Click Import button (top-left)</li>
          <li>Paste the copied cURL in the "Paste cURL to import..." text box</li>
          <li>Request will load automatically — just hit Send</li>
        </ol>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  endpointRow: { display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' },
  endpointCode: { flex: 1, fontSize: 15, color: '#111827', wordBreak: 'break-all', fontFamily: 'monospace' },
  copyBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid', borderRadius: 8, padding: '6px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #f3f4f6', fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '8px 10px', fontSize: 15, color: '#374151', verticalAlign: 'top' },
  pre: { background: '#0f172a', color: '#e2e8f0', borderRadius: 10, padding: 16, fontSize: 14.5, lineHeight: 1.7, overflowX: 'auto', margin: 0, fontFamily: 'monospace' },
  tip: { border: '1px solid', borderRadius: 10, padding: 16 },
};

export default ApiDocCard;
