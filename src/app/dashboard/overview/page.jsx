'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LineChart, Line, ComposedChart,
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

function Section({ title }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '32px 0 14px', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
      {title}
    </h3>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', ...style }}>
      {children}
    </div>
  );
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
        <p key={p.name} style={{ color: p.color || p.fill }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}{p.unit || ''}</p>
      ))}
    </div>
  );
};

// ── PPT Data ────────────────────────────────────────────────────────────────

const annualRevenueGEL = [
  { year: '2017', revenue: 54.3 },
  { year: '2018', revenue: 67.6 },
  { year: '2019', revenue: 69.9 },
  { year: '2020', revenue: 39.3 },
  { year: '2021', revenue: 41.6 },
  { year: '2022', revenue: 86.6 },
  { year: '2023', revenue: 129.5 },
  { year: '2024', revenue: 144.1 },
  { year: '2025', revenue: 160.9 },
];

const monthlySales = [
  { month: 'Jan-24', sales: 16, stock: 173, convRate: 9, revenue: 1911629 },
  { month: 'Feb-24', sales: 21, stock: 238, convRate: 9, revenue: 1694557 },
  { month: 'Mar-24', sales: 20, stock: 222, convRate: 9, revenue: 1210666 },
  { month: 'Apr-24', sales: 33, stock: 364, convRate: 9, revenue: 2380963 },
  { month: 'May-24', sales: 18, stock: 387, convRate: 5, revenue: 2231890 },
  { month: 'Jun-24', sales: 20, stock: 369, convRate: 5, revenue: 1795061 },
  { month: 'Jul-24', sales: 40, stock: 349, convRate: 11, revenue: 3571696 },
  { month: 'Aug-24', sales: 37, stock: 365, convRate: 10, revenue: 3044908 },
  { month: 'Sep-24', sales: 39, stock: 328, convRate: 12, revenue: 4043277 },
  { month: 'Oct-24', sales: 42, stock: 289, convRate: 15, revenue: 3222307 },
  { month: 'Nov-24', sales: 39, stock: 269, convRate: 14, revenue: 3155147 },
  { month: 'Dec-24', sales: 21, stock: 230, convRate: 9, revenue: 2734696 },
  { month: 'Jan-25', sales: 18, stock: null, convRate: 6,  revenue: null },
  { month: 'Feb-25', sales: 35, stock: null, convRate: 12, revenue: null },
  { month: 'Mar-25', sales: 26, stock: null, convRate: 9,  revenue: null },
  { month: 'Apr-25', sales: 25, stock: null, convRate: 10, revenue: null },
  { month: 'May-25', sales: 40, stock: null, convRate: 17, revenue: null },
  { month: 'Jun-25', sales: 19, stock: null, convRate: 6,  revenue: null },
  { month: 'Jul-25', sales: 23, stock: null, convRate: 8,  revenue: null },
  { month: 'Aug-25', sales: 19, stock: null, convRate: 6,  revenue: null },
  { month: 'Sep-25', sales: 27, stock: null, convRate: 8,  revenue: null },
  { month: 'Oct-25', sales: 32, stock: null, convRate: 11, revenue: null },
  { month: 'Nov-25', sales: 23, stock: null, convRate: 9,  revenue: null },
  { month: 'Dec-25', sales: 25, stock: null, convRate: 10, revenue: null },
];

const avgPricePerM2 = [
  { month: 'Jan-24', Samgori: 1037, Lisi: 1389, University: 1496 },
  { month: 'Feb-24', Samgori: 1067, Lisi: 1408, University: 1509 },
  { month: 'Mar-24', Samgori: 1076, Lisi: 1306, University: 1626 },
  { month: 'Apr-24', Samgori: 1082, Lisi: 1406, University: 1606 },
  { month: 'May-24', Samgori: 1079, Lisi: 1265, University: 1551 },
  { month: 'Jun-24', Samgori: 1089, Lisi: 1378, University: 1589 },
  { month: 'Jul-24', Samgori: 1080, Lisi: 1357, University: 1527 },
  { month: 'Aug-24', Samgori: 1113, Lisi: 1412, University: 1550 },
  { month: 'Sep-24', Samgori: 1088, Lisi: 1374, University: 1569 },
  { month: 'Oct-24', Samgori: 1105, Lisi: 1374, University: 1559 },
  { month: 'Nov-24', Samgori: 1099, Lisi: 1489, University: 1592 },
  { month: 'Dec-24', Samgori: 1125, Lisi: 1434, University: 1621 },
  { month: 'Jan-25', Samgori: 1183, Lisi: 1434, University: 1580 },
  { month: 'Feb-25', Samgori: 1212, Lisi: 1457, University: 1608 },
  { month: 'Mar-25', Samgori: 1089, Lisi: 1431, University: 1664 },
  { month: 'Apr-25', Samgori: 1165, Lisi: 1474, University: 1645 },
  { month: 'May-25', Samgori: 1183, Lisi: 1454, University: 1675 },
  { month: 'Jun-25', Samgori: 1161, Lisi: 1491, University: 1752 },
  { month: 'Jul-25', Samgori: 1200, Lisi: 1518, University: 1792 },
  { month: 'Aug-25', Samgori: 1295, Lisi: 1541, University: 1782 },
  { month: 'Sep-25', Samgori: 1215, Lisi: 1514, University: 1812 },
  { month: 'Oct-25', Samgori: 1203, Lisi: 1510, University: 1792 },
  { month: 'Nov-25', Samgori: 1489, Lisi: 1473, University: 1792 },
  { month: 'Dec-25', Samgori: 1230, Lisi: 1514, University: 1811 },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/financial.json').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, color: '#ef4444' }}>Failed to load data.</div>;

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

  const revenueData2024 = monthlySales.filter(m => m.revenue != null);

  return (
    <div style={{ padding: 32 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Financial Overview</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Report as of {reportDate}</p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <MetricCard label="Total Revenue" value={fmt(totalRevenue)} sub="All projects, all time" color="#3b82f6" />
        <MetricCard label="Total EBT" value={fmt(totalEBT)} sub="Earnings before tax" color="#8b5cf6" />
        <MetricCard label="Net Income" value={fmt(totalNetIncome)} sub="After tax" color="#10b981" />
        <MetricCard label="Units Sold" value={totalUnits.toLocaleString()} sub={`${totalUnits2026} in 2026`} color="#f59e0b" />
      </div>

      {/* ── Per-Project Cards ── */}
      <Section title="Per-Project Summary" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 8 }}>
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

      {/* ── Charts: Revenue vs EBT + Units ── */}
      <Section title="Project Financial Breakdown" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 8 }}>
        <Card>
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
        </Card>
        <Card>
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
        </Card>
      </div>

      {/* ── Annual Revenue Trend (from PPT) ── */}
      <Section title="Annual Revenue Trend (2017–2025)" />
      <Card style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>Revenue in GEL (millions) — All Projects Combined</h4>
          <span style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', padding: '3px 10px', borderRadius: 20 }}>Source: Staff Meeting Jan 2026</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={annualRevenueGEL} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `₾${v}M`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`₾${v}M`, 'Revenue (GEL)']} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {annualRevenueGEL.map((entry, i) => (
                <Cell key={entry.year} fill={i >= 7 ? '#3b82f6' : '#93c5fd'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 16, padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
          {[
            { label: '2025 Revenue', value: '₾160.9M', color: '#3b82f6' },
            { label: 'YoY Growth', value: '+11.6%', color: '#10b981' },
            { label: 'vs 2020 (low)', value: '+309%', color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: 12, borderRadius: 8, background: '#f8fafc' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Monthly Sales & Conversion Rate (from PPT) ── */}
      <Section title="Monthly Sales & Lead Conversion Rate (Jan 2024 – Dec 2025)" />
      <Card style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>Units Sold per Month + Conversion Rate (%)</h4>
          <span style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', padding: '3px 10px', borderRadius: 20 }}>Source: Staff Meetings 2025–2026</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlySales} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} angle={-35} textAnchor="end" height={50} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="sales" name="Units Sold" fill="#3b82f6" radius={[3, 3, 0, 0]}>
              {monthlySales.map((e, i) => (
                <Cell key={e.month} fill={i < 12 ? '#93c5fd' : '#3b82f6'} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="convRate" name="Conv. Rate %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} unit="%" />
          </ComposedChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Light bars = 2024, Dark bars = 2025 · Right axis = Conversion Rate (%)</p>
      </Card>

      {/* ── Monthly Revenue 2024 (from PPT) ── */}
      <Section title="Monthly Revenue – 2024 (USD)" />
      <Card style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>Monthly Revenue per Quarterly Meeting Report</h4>
          <span style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', padding: '3px 10px', borderRadius: 20 }}>Source: Staff Meeting Jan 2025</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenueData2024} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
            <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
              {revenueData2024.map((e) => (
                <Cell key={e.month} fill={e.revenue >= 3000000 ? '#3b82f6' : '#93c5fd'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
          {[
            { label: 'Total 2024', value: fmt(revenueData2024.reduce((s, m) => s + m.revenue, 0)) },
            { label: 'Best Month', value: 'Sep-24 ($4.0M)' },
            { label: 'Avg/Month', value: fmt(revenueData2024.reduce((s, m) => s + m.revenue, 0) / 12) },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: 12, borderRadius: 8, background: '#f8fafc' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Avg Price per m² (from PPT) ── */}
      <Section title="Average Price per m² by Project (Jan 2024 – Dec 2025, USD)" />
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>Samgori · Lisi · University — 24-month price trend</h4>
          <span style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', padding: '3px 10px', borderRadius: 20 }}>Source: All Staff Meetings</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={avgPricePerM2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} angle={-30} textAnchor="end" height={45} />
            <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} domain={[900, 2000]} />
            <Tooltip formatter={(v) => [`$${v}/m²`]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Samgori" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Lisi" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="University" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16, padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
          {[
            { project: 'Samgori', jan24: 1037, dec25: 1230, color: '#3b82f6' },
            { project: 'Lisi', jan24: 1389, dec25: 1514, color: '#10b981' },
            { project: 'University', jan24: 1496, dec25: 1811, color: '#8b5cf6' },
          ].map(p => {
            const growth = (((p.dec25 - p.jan24) / p.jan24) * 100).toFixed(1);
            return (
              <div key={p.project} style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: '#f8fafc' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: p.color, marginBottom: 6 }}>{p.project}</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>Jan-24: <strong>${p.jan24}</strong> → Dec-25: <strong>${p.dec25}</strong></p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginTop: 4 }}>+{growth}% in 24 months</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
