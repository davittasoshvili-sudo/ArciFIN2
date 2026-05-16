export default function MetricCard({ label, value, sub, color = '#3b82f6', trend }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderTop: `3px solid ${color}`,
    }}>
      <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginTop: 6 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</p>
      )}
      {trend != null && (
        <p style={{ fontSize: 12, marginTop: 6, color: trend >= 0 ? '#10b981' : '#ef4444', fontWeight: 500 }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </p>
      )}
    </div>
  );
}
