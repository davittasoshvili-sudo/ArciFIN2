'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = {
  Jikia: '#f59e0b',
  Samgori: '#3b82f6',
  University: '#8b5cf6',
  Lisi: '#10b981',
  Kikvidze: '#ef4444',
};

function fmt(n) {
  if (n == null) return 'N/A';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function MetricCard({ label, value, sub, color = '#3b82f6' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: `3px solid ${color}` }}>
      <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginTop: 6 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/financial.json').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, color: '#ef4444' }}>Failed to load data. Run extract-data.cjs first.</div>;

  const { projects, salesByProject, reportDate } = data;

  const totalRevenue = projects.reduce((s, p) => s + (p.revenues?.total || 0), 0);
  const totalEBT = projects.reduce((s, p) => s + (p.ebt?.total || 0), 0);
  const totalNetIncome = projects.reduce((s, p) => s + (p.netIncome?.total || 0), 0);
  const totalUnits = Object.values(salesByProject).reduce((s, v) => s + v.units, 0);
  const totalUnits2026 = Object.values(salesByProject).reduce((s, v) => s + v.units2026, 0);

  const revenueChart = projects.map(p => ({
    name: p.name,
    Revenue: p.revenues?.total || 0,
    EBT: p.ebt?.total || 0,
    'Net Income': p.netIncome?.total || 0,
  }));

  const unitsChart = Object.entries(salesByProject).map(([name, v]) => ({
    name, 'Total Units': v.units, '2026 Units': v.units2026,
  }));

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Financial Overview</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Report as of {reportDate}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <MetricCard label="Total Revenue" value={fmt(totalRevenue)} sub="All projects, all time" color="#3b82f6" />
        <MetricCard label="Total EBT" value={fmt(totalEBT)} sub="Earnings before tax" color="#8b5cf6" />
        <MetricCard label="Net Income" value={fmt(totalNetIncome)} sub="After tax" color="#10b981" />
        <MetricCard label="Units Sold" value={totalUnits.toLocaleString()} sub={`${totalUnits2026} in 2026`} color="#f59e0b" />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 14 }}>Per-Project Summary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
        {projects.map(p => {
          const sp = salesByProject[p.name] || {};
          const color = COLORS[p.name] || '#6366f1';
          return (
            <div key={p.name} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>{p.name}</h4>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{(sp.units || 0).toLocaleString()} units sold</p>
                </div>
                <span style={{ background: p.grossMarginPct >= 0 ? '#dcfce7' : '#fee2e2', color: p.grossMarginPct >= 0 ? '#16a34a' : '#dc2626', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                  {p.grossMarginPct != null ? `${p.grossMarginPct.toFixed(1)}%` : 'N/A'} margin
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
                {[
                  { l: 'Revenue', v: fmt(p.revenues?.total) },
                  { l: 'EBT', v: fmt(p.ebt?.total) },
                  { l: 'Net Income', v: fmt(p.netIncome?.total) },
                  { l: 'OpEx', v: fmt(p.opex?.total) },
                  { l: '2026 Units', v: String(sp.units2026 || 0) },
                  { l: '2026 Value', v: fmt(sp.value2026 || 0) },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{l}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Revenue vs EBT vs Net Income</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueChart} barCategoryGap="30%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="EBT" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Units Sold by Project</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={unitsChart} barCategoryGap="30%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Total Units" radius={[4, 4, 0, 0]}>
                {unitsChart.map(entry => <Cell key={entry.name} fill={COLORS[entry.name] || '#6366f1'} />)}
              </Bar>
              <Bar dataKey="2026 Units" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
