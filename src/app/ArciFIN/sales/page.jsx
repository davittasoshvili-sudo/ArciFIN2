'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import MetricCard from '@/components/dashboard/MetricCard';

const COLORS = {
  Jikia: '#f59e0b',
  Samgori: '#3b82f6',
  University: '#8b5cf6',
  Lisi: '#10b981',
  Kikvidze: '#ef4444',
};

const TYPE_COLORS = {
  Residential: '#3b82f6',
  'Open Parking': '#94a3b8',
  'Covered Parking': '#64748b',
  Storage: '#a1a1aa',
  Commercial: '#f97316',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(n, prefix = '$') {
  if (n == null) return 'N/A';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${prefix}${(n / 1e3).toFixed(1)}K`;
  return `${prefix}${n.toFixed(0)}`;
}

const PAGE_SIZE = 50;

export default function Sales() {
  const [rawSales, setRawSales] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filterProjects, setFilterProjects] = useState([]);
  const [filterYear, setFilterYear] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch('/data/sales.json')
      .then(r => r.json())
      .then(d => {
        setRawSales(d.sales);
        const projects = [...new Set(d.sales.map(s => s.project))].sort();
        setFilterProjects(projects);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allProjects = useMemo(() => rawSales ? [...new Set(rawSales.map(s => s.project))].sort() : [], [rawSales]);
  const allYears = useMemo(() => rawSales ? [...new Set(rawSales.map(s => s.year).filter(Boolean))].sort((a, b) => b - a) : [], [rawSales]);
  const allTypes = useMemo(() => rawSales ? [...new Set(rawSales.map(s => s.type).filter(Boolean))].sort() : [], [rawSales]);

  const filtered = useMemo(() => {
    if (!rawSales) return [];
    return rawSales.filter(s => {
      if (filterProjects.length && !filterProjects.includes(s.project)) return false;
      if (filterYear !== 'all' && s.year !== parseInt(filterYear)) return false;
      if (filterType !== 'all' && s.type !== filterType) return false;
      return true;
    });
  }, [rawSales, filterProjects, filterYear, filterType]);

  const metrics = useMemo(() => {
    const units = filtered.length;
    const value = filtered.reduce((s, r) => s + (r.totalValue || 0), 0);
    const area = filtered.reduce((s, r) => s + (r.totalArea || 0), 0);
    const pricesSample = filtered.filter(r => r.pricePerM2 > 0).map(r => r.pricePerM2);
    const avgPrice = pricesSample.length ? pricesSample.reduce((a, b) => a + b, 0) / pricesSample.length : 0;
    return { units, value, area, avgPrice };
  }, [filtered]);

  // Monthly trend
  const monthlyData = useMemo(() => {
    const map = {};
    for (const s of filtered) {
      if (!s.month) continue;
      const key = s.month;
      if (!map[key]) map[key] = { month: MONTHS[key - 1], units: 0, value: 0 };
      map[key].units++;
      map[key].value += s.totalValue || 0;
    }
    return Array.from({ length: 12 }, (_, i) => map[i + 1] || { month: MONTHS[i], units: 0, value: 0 });
  }, [filtered]);

  // Project breakdown
  const projectBreakdown = useMemo(() => {
    const map = {};
    for (const s of filtered) {
      if (!map[s.project]) map[s.project] = { project: s.project, units: 0, value: 0 };
      map[s.project].units++;
      map[s.project].value += s.totalValue || 0;
    }
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleProject(p) {
    setFilterProjects(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
    setPage(0);
  }

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading...</div>;
  if (!rawSales) return <div style={{ padding: 40, color: '#ef4444' }}>Failed to load. Run extract-data.js first.</div>;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Sales Statistics</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          Detailed breakdown of all sold units across projects
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Projects</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allProjects.map(p => (
              <button
                key={p}
                onClick={() => toggleProject(p)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  border: `2px solid ${filterProjects.includes(p) ? COLORS[p] || '#6366f1' : '#e2e8f0'}`,
                  background: filterProjects.includes(p) ? `${COLORS[p]}18` : '#fff',
                  color: filterProjects.includes(p) ? COLORS[p] || '#6366f1' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Year</p>
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setPage(0); }}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#374151' }}
          >
            <option value="all">All years</option>
            {allYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Unit Type</p>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(0); }}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#374151' }}
          >
            <option value="all">All types</option>
            {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>
          {filtered.length.toLocaleString()} records
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Units Sold" value={metrics.units.toLocaleString()} color="#3b82f6" />
        <MetricCard label="Total Value" value={fmt(metrics.value)} color="#8b5cf6" />
        <MetricCard label="Total Area" value={`${(metrics.area / 1000).toFixed(1)}K m²`} color="#10b981" />
        <MetricCard label="Avg Price / m²" value={fmt(metrics.avgPrice)} color="#f59e0b" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Monthly trend */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Units Sold by Month</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="units" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Units" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-project breakdown */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>By Project</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {projectBreakdown.map(p => {
              const maxValue = projectBreakdown[0]?.value || 1;
              const pct = (p.value / maxValue) * 100;
              return (
                <div key={p.project}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{p.project}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{p.units} units · {fmt(p.value)}</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: COLORS[p.project] || '#6366f1', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Sales Records</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#64748b' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, cursor: page === 0 ? 'not-allowed' : 'pointer', background: '#fff' }}>
              ‹ Prev
            </button>
            <span>Page {page + 1} of {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', background: '#fff' }}>
              Next ›
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Project', 'Unit', 'Type', 'Sale Date', 'Total Area (m²)', 'Price/m²', 'Total Value', 'Client'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: `${COLORS[s.project] || '#6366f1'}18`, color: COLORS[s.project] || '#6366f1' }}>
                      {s.project}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#374151' }}>{s.unitCode}</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, background: `${TYPE_COLORS[s.type] || '#94a3b8'}18`, color: TYPE_COLORS[s.type] || '#94a3b8' }}>
                      {s.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b' }}>{s.saleDate || '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#374151', textAlign: 'right' }}>{s.totalArea?.toFixed(1) || '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#374151', textAlign: 'right' }}>{s.pricePerM2 ? `$${s.pricePerM2.toFixed(0)}` : '—'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{s.totalValue ? `$${s.totalValue.toLocaleString()}` : '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.client || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
