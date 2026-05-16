'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
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

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function Debtors() {
  const [debtors, setDebtors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/data/debtors.json')
      .then(r => r.json())
      .then(d => setDebtors(d.debtors))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allProjects = useMemo(() => {
    if (!debtors) return [];
    return [...new Set(debtors.map(d => d.project))].sort();
  }, [debtors]);

  const filtered = useMemo(() => {
    if (!debtors) return [];
    return debtors.filter(d => {
      if (filterProject !== 'all' && d.project !== filterProject) return false;
      if (filterStatus === 'outstanding' && d.status !== 'Outstanding') return false;
      if (filterStatus === 'paid' && d.status !== 'Paid') return false;
      if (search && !d.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [debtors, filterProject, filterStatus, search]);

  const summary = useMemo(() => {
    if (!debtors) return {};
    const all = filterProject === 'all' ? debtors : debtors.filter(d => d.project === filterProject);
    return {
      totalDue: all.reduce((s, d) => s + d.amountDue, 0),
      totalPaid: all.reduce((s, d) => s + d.amountPaid, 0),
      totalOverdue: all.filter(d => d.status === 'Outstanding').reduce((s, d) => s + Math.abs(d.overdue), 0),
      countOutstanding: all.filter(d => d.status === 'Outstanding').length,
      countTotal: all.length,
    };
  }, [debtors, filterProject]);

  const projectChart = useMemo(() => {
    if (!debtors) return [];
    const map = {};
    for (const d of debtors) {
      if (!map[d.project]) map[d.project] = { project: d.project, outstanding: 0, paid: 0 };
      if (d.status === 'Outstanding') map[d.project].outstanding += Math.abs(d.overdue);
      else map[d.project].paid++;
    }
    return Object.values(map);
  }, [debtors]);

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading...</div>;
  if (!debtors) return <div style={{ padding: 40, color: '#ef4444' }}>Failed to load. Run extract-data.js first.</div>;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Debtors</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          Customer payment status and outstanding balances
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Due" value={fmt(summary.totalDue)} sub="Contracted amount" color="#3b82f6" />
        <MetricCard label="Total Collected" value={fmt(summary.totalPaid)} sub="Payments received" color="#10b981" />
        <MetricCard label="Outstanding Balance" value={fmt(summary.totalOverdue)} sub={`${summary.countOutstanding} units`} color="#ef4444" />
        <MetricCard label="Collection Rate" value={summary.totalDue ? `${((summary.totalPaid / summary.totalDue) * 100).toFixed(1)}%` : '—'} sub={`${summary.countTotal} total properties`} color="#f59e0b" />
      </div>

      {/* Charts + filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Outstanding by project chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Outstanding Balance by Project</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectChart} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="project" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `$${(v / 1e3).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="outstanding" radius={[4, 4, 0, 0]} name="Outstanding">
                {projectChart.map(entry => (
                  <Cell key={entry.project} fill={COLORS[entry.project] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project summary table */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Status by Project</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Project', 'Total', 'Outstanding', 'Paid'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Project' ? 'left' : 'right', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projectChart.map(p => {
                const total = debtors.filter(d => d.project === p.project).length;
                const outstanding = debtors.filter(d => d.project === p.project && d.status === 'Outstanding').length;
                return (
                  <tr key={p.project} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[p.project] || '#6366f1', display: 'inline-block' }} />
                        {p.project}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{total}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span style={{ color: outstanding > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{outstanding}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{total - outstanding}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ marginTop: 16, fontSize: 11, color: '#94a3b8' }}>
            Note: Jikia debitor data not available in standard format.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#374151' }}
        >
          <option value="all">All Projects</option>
          {allProjects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#374151' }}
        >
          <option value="all">All Statuses</option>
          <option value="outstanding">Outstanding only</option>
          <option value="paid">Paid only</option>
        </select>

        <input
          placeholder="Search by unit code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#374151', minWidth: 200 }}
        />

        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>{filtered.length.toLocaleString()} records</span>
      </div>

      {/* Debtors table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
              <tr>
                {['Project', 'Unit Code', 'Amount Due', 'Amount Paid', 'Outstanding', 'Status'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: ['Amount Due', 'Amount Paid', 'Outstanding'].includes(h) ? 'right' : 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={i}
                  style={{ borderBottom: '1px solid #f8fafc', background: d.status === 'Outstanding' ? '#fff7ed' : '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = d.status === 'Outstanding' ? '#fff7ed' : '#fff'}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: `${COLORS[d.project] || '#6366f1'}18`, color: COLORS[d.project] || '#6366f1' }}>
                      {d.project}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#374151', fontWeight: 500 }}>{d.code}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0f172a' }}>{fmt(d.amountDue)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>{fmt(d.amountPaid)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: d.status === 'Outstanding' ? '#ef4444' : '#10b981' }}>
                    {d.status === 'Outstanding' ? fmt(Math.abs(d.overdue)) : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: d.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                      color: d.status === 'Paid' ? '#16a34a' : '#dc2626',
                    }}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
