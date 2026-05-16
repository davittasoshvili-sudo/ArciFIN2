"use client"

import { useState } from 'react'

// ─── Data (from debitors-lisi-and-samgori branch, May 2026) ──────────────────

const SUMMARY = {
  totalUnits: 1719,
  vanillaDreamUnits: 448,
  chocoFudgeUnits: 1352,
  totalOverdueUsd: 8833.56,
  totalDueThisMonthUsd: 22590.83,
}

const OVERDUE = [
  { code: 'S-13-OP19', project: 'Choco Fudge', buyer: 'Eleanor Taylor',  priceUsd: 6109.35  totalPaidGel: 2903.78,   totalPaidUsd: 1039.14, overdueUsd: 7327.73, hasPlan: true,  comment: '' },
  { code: 'L-9-OP2',   project: 'Vanilla Dream',    buyer: 'Natalie Mitchell',       priceUsd: 7912.74 totalPaidGel: 12001.87,  totalPaidUsd: 4057.82, overdueUsd: 1023.55, hasPlan: true,  comment: '' },
  { code: 'L-6-OP16',  project: 'Vanilla Dream',    buyer: 'Hannah Moore',           priceUsd: 11176.36 totalPaidGel: 13435.78,  totalPaidUsd: 5528.86, overdueUsd: 14.71,   hasPlan: true,  comment: '' },
]

const THIS_MONTH = [
  { code: 'L-12-1',   project: 'Vanilla Dream',    buyer: 'Sophia Turner',      amountDueUsd: 16549.35, paidThisMonthGel: 58440.95, paidThisMonthUsd: 21051.26, paymentDate: '2026-05-31', status: 'Paid',   overdueUsd: 0},
  { code: 'L-11-15',  project: 'Vanilla Dream',    buyer: 'Vincent Clarke',  amountDueUsd: 3914.35,  paidThisMonthGel: 14040.34, paidThisMonthUsd: 5178.91,  paymentDate: '2026-05-31', status: 'Paid',   overdueUsd: 0},
  { code: 'L-6-OP1',  project: 'Vanilla Dream',    buyer: 'Eric Green',          amountDueUsd: 2626.38,  paidThisMonthGel: 0         paidThisMonthUsd: 0         paymentDate: '2026-05-25', status: 'Unpaid', overdueUsd: 0},
  { code: 'L-9-OP2',  project: 'Vanilla Dream',    buyer: 'Harrison Clarke',        amountDueUsd: 2188.08,  paidThisMonthGel: 0         paidThisMonthUsd: 0         paymentDate: '2026-05-25', status: 'Unpaid', overdueUsd: 993.21},
  { code: 'L-6-OP16', project: 'Vanilla Dream',    buyer: 'Isabella Edwards',            amountDueUsd: 2447.43,  paidThisMonthGel: 0         paidThisMonthUsd: 0         paymentDate: '2026-05-25', status: 'Unpaid', overdueUsd: 11.96 },
  { code: 'L-9-OP8',  project: 'Vanilla Dream',    buyer: 'Donna Owens',         amountDueUsd: 1335.95,  paidThisMonthGel: 0         paidThisMonthUsd: 0         paymentDate: '2026-05-25', status: 'Unpaid', overdueUsd: 0},
  { code: 'L-6-OP17', project: 'Vanilla Dream',    buyer: 'Eric Johnson',     amountDueUsd: 1686.31,  paidThisMonthGel: 0         paidThisMonthUsd: 0         paymentDate: '2026-05-25', status: 'Unpaid', overdueUsd: 0},
  { code: 'L-9-OP5',  project: 'Vanilla Dream',    buyer: 'Sophia Walker',        amountDueUsd: 1961.19,  paidThisMonthGel: 0         paidThisMonthUsd: 0         paymentDate: '2026-05-25', status: 'Unpaid', overdueUsd: 0},
  { code: 'L-9-S13',  project: 'Vanilla Dream',    buyer: 'Benjamin Walker',        amountDueUsd: 999.81,  paidThisMonthGel: 0         paidThisMonthUsd: 0         paymentDate: '2026-05-25', status: 'Unpaid', overdueUsd: 0.44 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const usd = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const gel = (n) => '₾' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProjectBadge({ project }) {
  const styles = {
    'Vanilla Dream':    { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    'Choco Fudge': { background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' },
  }
  return (
    <span style={{
      ...styles[project],
      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {project}
    </span>
  )
}

function StatusChip({ status }) {
  const map = {
    Paid:    { bg: '#dcfce7', color: '#15803d' },
    Partial: { bg: '#fef9c3', color: '#854d0e' },
    Unpaid:  { bg: '#fee2e2', color: '#b91c1c' },
  }
  const s = map[status] || map.Unpaid
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    }}>
      {status}
    </span>
  )
}

function KPICards() {
  const overdueCount = OVERDUE.length
  const paidCount = THIS_MONTH.filter(r => r.status === 'Paid').length
  const unpaidCount = THIS_MONTH.filter(r => r.status === 'Unpaid').length

  const cards = [
    {
      label: 'Total Units',
      value: SUMMARY.totalUnits.toLocaleString(),
      sub: `Vanilla Dream ${SUMMARY.vanillaDreamUnits} · Choco Fudge ${SUMMARY.chocoFudgeUnits}`,
      color: '#6366f1',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: 'Overdue Units',
      value: overdueCount,
      sub: usd(SUMMARY.totalOverdueUsd) + ' total overdue',
      color: '#ef4444',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      label: 'Due This Month',
      value: THIS_MONTH.length,
      sub: usd(SUMMARY.totalDueThisMonthUsd) + ' total due',
      color: '#f59e0b',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: 'May Collections',
      value: paidCount + ' / ' + THIS_MONTH.length,
      sub: unpaidCount + ' payments still outstanding',
      color: '#10b981',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: '#fff', borderRadius: 14, padding: '20px 22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {c.label}
            </span>
            <div style={{
              width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: c.color + '18', color: c.color,
            }}>
              {c.icon}
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{c.value}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

function OverdueTable({ search }) {
  const rows = OVERDUE.filter(r =>
    !search || r.buyer.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())
  )

  if (!rows.length) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8' }}>
        No overdue records match your search.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            {['Code', 'Project', 'Buyer', 'Property Price', 'Total Paid (GEL)', 'Total Paid (USD)', 'Overdue (USD)', 'Plan'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.code} style={{ borderBottom: '1px solid #f1f5f9', borderLeft: '3px solid #ef4444' }}>
              <td style={{ padding: '13px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{r.code}</td>
              <td style={{ padding: '13px 14px' }}><ProjectBadge project={r.project} /></td>
              <td style={{ padding: '13px 14px', fontWeight: 500, color: '#0f172a' }}>{r.buyer}</td>
              <td style={{ padding: '13px 14px', color: '#6366f1', fontWeight: 600 }}>{usd(r.priceUsd)}</td>
              <td style={{ padding: '13px 14px', color: '#7c3aed', fontWeight: 600 }}>{gel(r.totalPaidGel)}</td>
              <td style={{ padding: '13px 14px', color: '#2563eb', fontWeight: 600 }}>{usd(r.totalPaidUsd)}</td>
              <td style={{ padding: '13px 14px', color: '#ef4444', fontWeight: 700 }}>{usd(r.overdueUsd)}</td>
              <td style={{ padding: '13px 14px' }}>
                {r.hasPlan
                  ? <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Has Plan</span>
                  : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ThisMonthTable({ search }) {
  const rows = THIS_MONTH.filter(r =>
    !search || r.buyer.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())
  )

  if (!rows.length) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8' }}>
        No records match your search.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            {['Code', 'Project', 'Buyer', 'Due Date', 'Amount Due (USD)', 'Paid (GEL)', 'Paid (USD)', 'Status'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const borderColor = r.status === 'Paid' ? '#10b981' : r.status === 'Partial' ? '#f59e0b' : '#e2e8f0'
            return (
              <tr key={r.code + r.buyer} style={{ borderBottom: '1px solid #f1f5f9', borderLeft: `3px solid ${borderColor}` }}>
                <td style={{ padding: '13px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{r.code}</td>
                <td style={{ padding: '13px 14px' }}><ProjectBadge project={r.project} /></td>
                <td style={{ padding: '13px 14px', fontWeight: 500, color: '#0f172a' }}>{r.buyer}</td>
                <td style={{ padding: '13px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.paymentDate}</td>
                <td style={{ padding: '13px 14px', color: '#2563eb', fontWeight: 600 }}>{usd(r.amountDueUsd)}</td>
                <td style={{ padding: '13px 14px', color: '#7c3aed', fontWeight: 600 }}>
                  {r.paidThisMonthGel > 0 ? gel(r.paidThisMonthGel) : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
                <td style={{ padding: '13px 14px', color: '#2563eb', fontWeight: 600 }}>
                  {r.paidThisMonthUsd > 0 ? usd(r.paidThisMonthUsd) : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
                <td style={{ padding: '13px 14px' }}><StatusChip status={r.status} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebtorsResidentialPage() {
  const [tab, setTab] = useState('overdue')
  const [search, setSearch] = useState('')

  const overdueCount = OVERDUE.length
  const thisMonthCount = THIS_MONTH.length
  const unpaidCount = THIS_MONTH.filter(r => r.status === 'Unpaid').length

  return (
    <div style={{ padding: 28, minHeight: '100vh', background: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Debtors Residential</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Vanilla Dream &amp; Choco Fudge · May 2026</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Table Card */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* Card Header: tabs + search */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setTab('overdue')}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: tab === 'overdue' ? '#fee2e2' : 'transparent',
                color: tab === 'overdue' ? '#b91c1c' : '#64748b',
              }}
            >
              Overdue
              <span style={{
                marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: 11,
                background: '#fecaca', color: '#b91c1c', fontWeight: 700,
              }}>{overdueCount}</span>
            </button>
            <button
              onClick={() => setTab('thisMonth')}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: tab === 'thisMonth' ? '#fef3c7' : 'transparent',
                color: tab === 'thisMonth' ? '#92400e' : '#64748b',
              }}
            >
              This Month
              <span style={{
                marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: 11,
                background: '#fde68a', color: '#92400e', fontWeight: 700,
              }}>{unpaidCount} unpaid</span>
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search buyer or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '7px 12px 7px 32px', borderRadius: 8, border: '1px solid #e2e8f0',
                fontSize: 13, color: '#0f172a', background: '#f8fafc', outline: 'none', width: 220,
              }}
            />
          </div>
        </div>

        {/* Note */}
        <div style={{ margin: '14px 20px 0', padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12, color: '#0369a1' }}>
          {tab === 'overdue'
            ? 'Units with outstanding balance > $5 from before this month. Fully paid units are excluded.'
            : 'Units with a scheduled payment in May 2026. Green border = payment already received this month.'}
        </div>

        {/* Table */}
        <div style={{ padding: '8px 0 4px' }}>
          {tab === 'overdue'
            ? <OverdueTable search={search} />
            : <ThisMonthTable search={search} />
          }
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8' }}>
          Data source: debitors-lisi-and-samgori branch · 1,730 total units (Vanilla Dream 384, Choco Fudge 1,346)
        </div>
      </div>
    </div>
  )
}
