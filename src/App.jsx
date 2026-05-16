import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_REMINDERS = 'debtor_reminder_history'
const LS_PLANS     = 'debtor_payment_plans'
const LS_TEMPLATE  = 'debtor_email_template'
const LS_NOTES     = 'debtor_notes'
const LS_DARK      = 'debtor_dark_mode'

const DEFAULT_TEMPLATE =
`Subject: Payment Reminder – [Unit] – Amount Due: $[Amount]

Dear [TenantName],

This is a formal reminder that your payment of $[Amount] for unit [Unit] was due on [DueDate] and remains outstanding ([DaysOverdue] days past due).

Please arrange payment at your earliest convenience. If you have already settled this balance, please disregard this notice.

For payment arrangements or queries, please contact us directly.

Best regards,
Property Management Team`

const COL_SIGNATURES = {
  tenant:         ['ტენანტი', 'tenant', 'name', 'client', 'debtor'],
  unit:           ['ფართის კოდი', 'unit', 'space code', 'property code', 'apartment'],
  leaseAmount:    ['იჯარის თანხა', 'lease', 'rent', 'monthly amount'],
  paymentDate:    ['გადახდის დღე', 'payment day', 'due date', 'due'],
  debt:           ['დავალიანება მიმდინარე', 'debt', 'outstanding', 'balance', 'overdue amount', 'owed'],
  contractExpiry: ['ხელშეკრულების', 'contract', 'expiry', 'end date', 'lease end'],
  advance:        ['ავანსი', 'advance', 'deposit'],
  phone:          ['მობილური', 'phone', 'mobile', 'telephone', 'tel'],
  email:          ['მეილი', 'email', 'e-mail', 'mail'],
}

const RISK_COLORS = { Green: '#10b981', Yellow: '#f59e0b', Red: '#f43f5e' }
const RISK_BG     = {
  Green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  Yellow: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-400',
  Red:    'bg-rose-100   text-rose-700   dark:bg-rose-900/40   dark:text-rose-400',
}
const RISK_DOT = { Green: 'bg-emerald-500', Yellow: 'bg-amber-500', Red: 'bg-rose-500' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) => {
  if (!d) return '—'
  if (d instanceof Date) return d.toLocaleDateString('en-GB')
  if (typeof d === 'string') return d.slice(0, 10)
  return String(d)
}

function generateId(tenant, unit) {
  return `${unit || ''}_${(tenant || '').slice(0, 20)}`.replace(/[\s"'«»„"]/g, '_')
}

function detectColumns(headerRow) {
  const result = {}
  headerRow.forEach((cell, idx) => {
    if (!cell) return
    const val = String(cell).toLowerCase().trim()
    for (const [key, sigs] of Object.entries(COL_SIGNATURES)) {
      if (result[key] !== undefined) continue
      if (sigs.some(sig => val.startsWith(sig.toLowerCase()) || val.includes(sig.toLowerCase())))
        result[key] = idx
    }
  })
  return result
}

function parseExcelFile(buffer) {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true })
  const sheetName =
    ['Overdues', 'Overdue', 'overdues(calc)'].find(n => wb.SheetNames.includes(n)) ||
    wb.SheetNames[0]
  const ws    = wb.Sheets[sheetName]
  const rows  = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })

  let headerIdx = -1
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const sc = rows[i].filter(c => c !== null && typeof c === 'string' && c.trim().length > 1)
    if (sc.length >= 3) { headerIdx = i; break }
  }
  if (headerIdx === -1) throw new Error('Could not find header row.')

  const colMap = detectColumns(rows[headerIdx])
  if (colMap.tenant === undefined) throw new Error('Could not detect tenant column.')
  if (colMap.debt   === undefined) throw new Error('Could not detect debt column.')

  return rows.slice(headerIdx + 1).reduce((acc, row) => {
    const tenantRaw = row[colMap.tenant]
    if (!tenantRaw || tenantRaw === 0) return acc
    const tenant = String(tenantRaw).trim()
    if (!tenant || tenant === '0') return acc

    const unit         = colMap.unit         != null ? String(row[colMap.unit] ?? '').trim() : ''
    const leaseAmount  = colMap.leaseAmount  != null ? Math.abs(parseFloat(row[colMap.leaseAmount]) || 0) : 0
    const rawDebt      = colMap.debt         != null ? parseFloat(row[colMap.debt]) || 0 : 0
    const debt         = Math.abs(rawDebt)
    const contractExpiry = colMap.contractExpiry != null ? row[colMap.contractExpiry] : null
    const advance      = colMap.advance      != null ? parseFloat(row[colMap.advance]) || 0 : 0
    const phoneRaw     = colMap.phone        != null ? String(row[colMap.phone] ?? '').trim() : ''
    const emailRaw     = colMap.email        != null ? String(row[colMap.email] ?? '').trim() : ''
    const paymentDate  = colMap.paymentDate  != null ? row[colMap.paymentDate] : null

    if (debt < 0.01) return acc

    const daysOverdue = leaseAmount > 0 ? Math.round(debt / leaseAmount * 30) : 30
    const risk        = daysOverdue < 30 ? 'Green' : daysOverdue < 60 ? 'Yellow' : 'Red'

    acc.push({
      id: generateId(tenant, unit),
      tenant, unit, leaseAmount, debt, daysOverdue, risk,
      contractExpiry, advance,
      phone: phoneRaw !== '0' ? phoneRaw : '',
      email: emailRaw.includes('@') ? emailRaw : '',
      paymentDate,
    })
    return acc
  }, [])
}

function fillTemplate(template, debtor) {
  const lines = template.split('\n')
  const subjLine = lines[0].startsWith('Subject:') ? lines[0].replace('Subject:', '').trim() : lines[0]
  const subject  = subjLine
    .replace(/\[Unit\]/g, debtor.unit)
    .replace(/\[Amount\]/g, Math.round(debtor.debt).toString())
    .replace(/\[TenantName\]/g, debtor.tenant)
  const bodyLines = lines[0].startsWith('Subject:') ? lines.slice(2) : lines.slice(1)
  const body = bodyLines.join('\n')
    .replace(/\[TenantName\]/g, debtor.tenant)
    .replace(/\[Unit\]/g, debtor.unit)
    .replace(/\[Amount\]/g, Math.round(debtor.debt).toString())
    .replace(/\[DueDate\]/g, fmtDate(debtor.paymentDate))
    .replace(/\[DaysOverdue\]/g, String(debtor.daysOverdue))
  return { subject, body }
}

function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function doExport(rows, reminders) {
  const data = rows.map(d => ({
    'Tenant Name':          d.tenant,
    'Unit':                 d.unit,
    'Overdue Amount ($)':   Math.round(d.debt),
    'Monthly Rent ($)':     Math.round(d.leaseAmount),
    'Days Overdue':         d.daysOverdue,
    'Risk Level':           d.risk,
    'Contract Expiry':      fmtDate(d.contractExpiry),
    'Phone':                d.phone,
    'Email':                d.email,
    'Last Reminded':        reminders[d.id]?.lastSent
                              ? new Date(reminders[d.id].lastSent).toLocaleDateString('en-GB') : '',
    'Total Reminders Sent': reminders[d.id]?.totalSent || 0,
  }))
  const ws    = XLSX.utils.json_to_sheet(data)
  const wbOut = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wbOut, ws, 'Overdue Debtors')
  XLSX.writeFile(wbOut, `overdue_debtors_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// generates synthetic 12-month payment history based on debt level
function generatePaymentHistory(debtor) {
  const now          = new Date()
  const monthsMissed = Math.min(Math.ceil(debtor.daysOverdue / 30), 11)
  return Array.from({ length: 12 }, (_, i) => {
    const date  = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const ago   = 11 - i
    let status, daysLate
    if (ago < monthsMissed)  { status = 'Missed'; daysLate = null }
    else if (ago === monthsMissed) { status = 'Late'; daysLate = debtor.daysOverdue % 30 || 5 }
    else                     { status = 'Paid';   daysLate = 0 }
    return { label, status, amount: debtor.leaseAmount, daysLate }
  })
}

function getReliabilityScore(history) {
  const paid   = history.filter(h => h.status === 'Paid').length
  const late   = history.filter(h => h.status === 'Late').length
  const missed = history.filter(h => h.status === 'Missed').length
  const score  = (paid + late * 0.5) / history.length
  if (score >= 0.92) return { grade: 'A', label: 'Excellent', cls: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' }
  if (score >= 0.75) return { grade: 'B', label: 'Good',      cls: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/30' }
  if (score >= 0.5)  return { grade: 'C', label: 'Fair',      cls: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30' }
  return                    { grade: 'D', label: 'Poor',      cls: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/30' }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ isDark, setIsDark }) {
  const navItems = [
    {
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      label: 'Dashboard',
    },
    {
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
      label: 'Debtors',
    },
    {
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      label: 'Reports',
    },
  ]

  return (
    <aside className="fixed top-0 left-0 h-full w-16 z-20 flex flex-col items-center py-4 gap-1"
      style={{ background: '#0F172A' }}>
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)' }}>
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Nav items */}
      {navItems.map((item, i) => (
        <button key={item.label} title={item.label}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative
            ${i === 0
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
          <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {item.label}
          </span>
        </button>
      ))}

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <button onClick={() => setIsDark(d => !d)} title={isDark ? 'Light mode' : 'Dark mode'}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-all">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isDark
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />}
        </svg>
      </button>
    </aside>
  )
}

// ─── FileUploadZone ───────────────────────────────────────────────────────────

function FileUploadZone({ onLoad, error, isDark }) {
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const inputRef = useRef()

  const processFile = useCallback(async (file) => {
    if (!file) return
    setLoading(true)
    try { const buf = await file.arrayBuffer(); onLoad(buf, file.name) }
    finally { setLoading(false) }
  }, [onLoad])

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-8 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)' }}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Debtor Management Dashboard
        </h1>
        <p className="text-slate-500 text-sm">Upload your Excel report to get started</p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current?.click()}
        className={`w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${dragging
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : isDark
              ? 'border-slate-700 bg-slate-800 hover:border-indigo-500'
              : 'border-slate-300 bg-white hover:border-indigo-300'}`}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xlsm,.xls" className="hidden"
          onChange={e => processFile(e.target.files[0])} />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Parsing Excel file…</p>
          </div>
        ) : (
          <>
            <svg className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Drop your Excel file here
            </p>
            <p className="text-xs text-slate-400 mt-1">.xlsx · .xlsm — or click to browse</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 w-full max-w-md bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}
      <p className="mt-6 text-xs text-slate-400">Reads the "Overdues" sheet · data stays in your browser</p>
    </div>
  )
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KPICards({ debtors, reminders }) {
  const totalDebt = debtors.reduce((s, d) => s + d.debt, 0)
  const redDebt   = debtors.filter(d => d.risk === 'Red').reduce((s, d) => s + d.debt, 0)
  const now       = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const remCount  = Object.values(reminders).filter(r => r.lastSent?.startsWith(thisMonth)).length

  const cards = [
    { label: 'Total Debtors', value: debtors.length, sub: 'active accounts',
      grad: 'from-indigo-500 to-violet-600', light: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30',
      path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Total Outstanding', value: fmt(totalDebt), sub: 'all debtors combined',
      grad: 'from-rose-500 to-pink-600', light: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30',
      path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Overdue >60 Days', value: fmt(redDebt),
      sub: `${debtors.filter(d => d.risk === 'Red').length} high-risk tenants`,
      grad: 'from-orange-500 to-rose-500', light: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30',
      path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { label: 'Reminders This Month', value: remCount, sub: 'via email client',
      grad: 'from-violet-500 to-purple-600', light: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30',
      path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.label}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-md p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{c.label}</p>
            <span className={`p-1.5 rounded-xl ${c.light}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.path} />
              </svg>
            </span>
          </div>
          <p className={`text-2xl font-bold mb-1 bg-gradient-to-r ${c.grad} bg-clip-text text-transparent`}>
            {c.value}
          </p>
          <p className="text-xs text-slate-400">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Debt Chart ───────────────────────────────────────────────────────────────

function DebtChart({ debtors }) {
  const data = ['Green', 'Yellow', 'Red'].map(risk => ({
    name:   risk === 'Green' ? '<30 days' : risk === 'Yellow' ? '30–60 days' : '>60 days',
    risk,
    amount: Math.round(debtors.filter(d => d.risk === risk).reduce((s, d) => s + d.debt, 0)),
    count:  debtors.filter(d => d.risk === risk).length,
  }))

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-md p-5 mb-6">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
        Outstanding Debt by Risk Category
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="40%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            tickFormatter={v => v === 0 ? '0' : `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-3 text-sm">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{d.name}</p>
                  <p className="text-slate-400 text-xs">{d.count} tenant{d.count !== 1 ? 's' : ''}</p>
                  <p className="font-semibold" style={{ color: RISK_COLORS[d.risk] }}>{fmt(d.amount)}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
            {data.map(d => <Cell key={d.risk} fill={RISK_COLORS[d.risk]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Debtors Table ────────────────────────────────────────────────────────────

function RiskBadge({ risk, days }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${RISK_BG[risk]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${RISK_DOT[risk]}`} />
      {days}d
    </span>
  )
}

function SortIcon({ col, sortBy }) {
  if (sortBy.col !== col) return <span className="text-slate-300 ml-0.5">↕</span>
  return <span className="text-indigo-500 ml-0.5">{sortBy.dir === 'asc' ? '↑' : '↓'}</span>
}

const TABLE_COLS = [
  { key: 'tenant',      label: 'Tenant Name' },
  { key: 'unit',        label: 'Unit' },
  { key: 'debt',        label: 'Overdue ($)' },
  { key: 'leaseAmount', label: 'Monthly Rent' },
  { key: 'daysOverdue', label: 'Days Overdue' },
  { key: 'risk',        label: 'Risk' },
]

function DebtorsTable({ debtors, reminders, plans, search, setSearch, sortBy, onSort,
  onSelectPlan, onSendReminder, onSendAll, onExport, onSelectTenant }) {

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return debtors
      .filter(d => !q || d.tenant.toLowerCase().includes(q) || d.unit.toLowerCase().includes(q))
      .sort((a, b) => {
        let va = a[sortBy.col], vb = b[sortBy.col]
        if (typeof va === 'string') va = va.toLowerCase()
        if (typeof vb === 'string') vb = vb.toLowerCase()
        if (va < vb) return sortBy.dir === 'asc' ? -1 : 1
        if (va > vb) return sortBy.dir === 'asc' ?  1 : -1
        return 0
      })
  }, [debtors, search, sortBy])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex-1 min-w-48 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or unit…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
        </div>
        <span className="text-xs text-slate-400">{filtered.length} / {debtors.length}</span>

        <button onClick={onSendAll}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Send All
        </button>
        <button onClick={() => onExport(filtered)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              {TABLE_COLS.map(c => (
                <th key={c.key} onClick={() => onSort(c.key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 select-none whitespace-nowrap transition-colors">
                  {c.label}<SortIcon col={c.key} sortBy={sortBy} />
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Contract Ends</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Last Reminded</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">
                  No debtors match your search
                </td>
              </tr>
            ) : filtered.map((d, i) => {
              const rem  = reminders[d.id]
              const plan = plans[d.id]
              const paid = plan?.payments?.filter(p => p.status === 'Paid').length ?? 0
              return (
                <tr key={d.id}
                  className={`border-b border-slate-50 dark:border-slate-700/50 transition-colors cursor-pointer
                    ${i % 2 !== 0
                      ? 'bg-slate-50/60 dark:bg-slate-700/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
                      : 'bg-white dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'}`}
                  onClick={() => onSelectTenant(d)}>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-52 truncate" title={d.tenant}>
                    {d.tenant}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{d.unit}</td>
                  <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{fmt(d.debt)}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmt(d.leaseAmount)}</td>
                  <td className="px-4 py-3"><RiskBadge risk={d.risk} days={d.daysOverdue} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${RISK_BG[d.risk]}`}>
                      {d.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(d.contractExpiry)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {rem?.lastSent
                      ? <span>{new Date(rem.lastSent).toLocaleDateString('en-GB')} <span className="text-slate-300 dark:text-slate-600">×{rem.totalSent}</span></span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {plan ? (
                      <button onClick={() => onSelectPlan(d)}
                        className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-semibold">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {paid}/{plan.payments.length}
                      </button>
                    ) : (
                      <button onClick={() => onSelectPlan(d)}
                        className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        + Plan
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onSendReminder(d)} title="Send Reminder"
                      className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Payment Schedule Modal ───────────────────────────────────────────────────

const S_CYCLE  = ['Pending', 'Paid', 'Missed']
const S_STYLES = {
  Paid:    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  Pending: 'bg-amber-100  dark:bg-amber-900/40  text-amber-700  dark:text-amber-400',
  Missed:  'bg-rose-100   dark:bg-rose-900/40   text-rose-700   dark:text-rose-400',
}

function PaymentScheduleModal({ debtor, existing, onClose, onSave }) {
  const [installments, setInstallments] = useState(existing?.installments ?? 3)
  const [payments,     setPayments]     = useState([])

  useEffect(() => {
    if (existing?.installments === installments && existing?.payments?.length) {
      setPayments(existing.payments)
    } else {
      const monthly = debtor.debt / installments
      const base    = new Date()
      setPayments(Array.from({ length: installments }, (_, i) => ({
        dueDate: addMonths(base, i + 1).toISOString().slice(0, 10),
        amount:  monthly,
        status:  'Pending',
      })))
    }
  }, [installments, debtor.debt, existing])

  const cycleStatus = idx =>
    setPayments(p => p.map((x, i) =>
      i === idx ? { ...x, status: S_CYCLE[(S_CYCLE.indexOf(x.status) + 1) % 3] } : x))

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Payment Schedule</h2>
            <p className="text-xs text-slate-400 mt-0.5">{debtor.tenant} · {debtor.unit}</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Total Outstanding</p>
              <p className="text-2xl font-bold text-rose-500">{fmt(debtor.debt)}</p>
            </div>
            <div className="flex gap-2">
              {[3, 6].map(n => (
                <button key={n} onClick={() => setInstallments(n)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors
                    ${installments === n
                      ? 'text-white border-transparent'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-400'}`}
                  style={installments === n ? { background: 'linear-gradient(135deg, #6366F1, #7C3AED)', borderColor: 'transparent' } : {}}>
                  {n} months
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Monthly: <span className="font-bold text-slate-700 dark:text-slate-200">{fmt(debtor.debt / installments)}</span>
          </p>
          <div className="space-y-2">
            {payments.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                <div className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 text-indigo-700"
                  style={{ background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{fmt(p.amount)}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(p.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => cycleStatus(i)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${S_STYLES[p.status]}`}>
                  {p.status}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button onClick={() => onSave({ installments, payments })}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
              style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)' }}>
              Save Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Reminder Modal ───────────────────────────────────────────────────────────

function ReminderModal({ debtor, template, onClose, onSend, onTemplateChange }) {
  const { subject, body } = useMemo(() => fillTemplate(template, debtor), [template, debtor])
  const [editing, setEditing] = useState(false)
  const [copied,  setCopied]  = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMailto = () => {
    const emails = debtor.email.split(';').map(e => e.trim()).filter(Boolean)
    if (!emails.length) { alert('No email address on file for this tenant.'); return }
    window.open(`mailto:${emails[0]}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    onSend()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Send Payment Reminder</h2>
            <p className="text-xs text-slate-400 mt-0.5">{debtor.tenant} · {debtor.unit}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(e => !e)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors
                ${editing
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300'}`}>
              {editing ? 'Preview' : 'Edit Template'}
            </button>
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl text-sm">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-400">To: </span>
              {debtor.email
                ? <span className="text-slate-700 dark:text-slate-300">{debtor.email}</span>
                : <em className="text-slate-400">No email on file</em>}
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs text-slate-400">Amount: </span>
              <span className="font-bold text-rose-500">{fmt(debtor.debt)}</span>
            </div>
          </div>

          {editing ? (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Placeholders: [TenantName] [Unit] [Amount] [DueDate] [DaysOverdue]
              </p>
              <textarea value={template} onChange={e => onTemplateChange(e.target.value)} rows={12}
                className="w-full text-sm font-mono border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                <p className="text-xs text-slate-400 mb-0.5">Subject</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{subject}</p>
              </div>
              <div className="px-4 py-4">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{body}</pre>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Close
            </button>
            <button onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border rounded-xl transition-colors
                ${copied
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={copied ? 'M5 13l4 4L19 7' : 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3'} />
              </svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleMailto}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Open in Email Client
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tenant Detail Modal ──────────────────────────────────────────────────────

const STATUS_COLOR = { Paid: '#10b981', Late: '#f59e0b', Missed: '#f43f5e' }
const STATUS_BG    = {
  Paid:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  Late:   'bg-amber-100  dark:bg-amber-900/40  text-amber-700  dark:text-amber-400',
  Missed: 'bg-rose-100   dark:bg-rose-900/40   text-rose-700   dark:text-rose-400',
}

function TenantDetailModal({ debtor, notes, onClose, onSaveNote }) {
  const [note, setNote] = useState(notes[debtor.id] || '')
  const history = useMemo(() => generatePaymentHistory(debtor), [debtor])
  const score   = useMemo(() => getReliabilityScore(history), [history])

  const paid   = history.filter(h => h.status === 'Paid').length
  const late   = history.filter(h => h.status === 'Late').length
  const missed = history.filter(h => h.status === 'Missed').length
  const avgDaysLate = history.filter(h => h.daysLate > 0).reduce((s, h) => s + h.daysLate, 0) /
                      Math.max(1, history.filter(h => h.daysLate > 0).length)
  const totalPaid   = paid * debtor.leaseAmount

  const trendData   = history.slice(-6).map(h => ({
    month: h.label,
    paid:  h.status === 'Paid' ? Math.round(debtor.leaseAmount) : h.status === 'Late' ? Math.round(debtor.leaseAmount * 0.7) : 0,
    expected: Math.round(debtor.leaseAmount),
  }))

  const donutData = [
    { name: 'On Time', value: paid,   color: '#10b981' },
    { name: 'Late',    value: late,   color: '#f59e0b' },
    { name: 'Missed',  value: missed, color: '#f43f5e' },
  ].filter(d => d.value > 0)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-800 w-full sm:rounded-2xl shadow-2xl sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)' }}>
              {debtor.tenant.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{debtor.tenant}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{debtor.unit} · {fmt(debtor.leaseAmount)}/mo</p>
            </div>
            <div className={`ml-2 px-3 py-1.5 rounded-xl text-center ${score.bg}`}>
              <p className={`text-2xl font-black ${score.cls}`}>{score.grade}</p>
              <p className={`text-xs font-semibold ${score.cls} opacity-80`}>{score.label}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Paid (est.)', value: fmt(totalPaid), cls: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Currently Owed',    value: fmt(debtor.debt), cls: 'text-rose-600 dark:text-rose-400' },
              { label: 'Avg Days Late',     value: avgDaysLate > 0 ? `${Math.round(avgDaysLate)}d` : '0d', cls: 'text-amber-600 dark:text-amber-400' },
              { label: 'On-Time Rate',      value: `${Math.round((paid / history.length) * 100)}%`, cls: 'text-indigo-600 dark:text-indigo-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Line chart - payment trend */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">6-Month Payment Trend</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, n) => [fmt(v), n === 'paid' ? 'Paid' : 'Expected']} />
                  <Line type="monotone" dataKey="expected" stroke="#e2e8f0" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="paid"     stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366F1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Donut chart - payment ratio */}
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Payment Distribution</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                      dataKey="value" paddingAngle={3}>
                      {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} month${v !== 1 ? 's' : ''}`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 text-xs">
                  {donutData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 ml-auto pl-2">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment history timeline */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Payment History (Last 12 Months)</p>
            <div className="flex gap-1.5 flex-wrap">
              {history.map((h, i) => (
                <div key={i} title={`${h.label}: ${h.status}${h.daysLate ? ` (${h.daysLate}d late)` : ''}`}
                  className="group relative flex flex-col items-center gap-1 cursor-default">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110"
                    style={{ background: STATUS_COLOR[h.status] + '20', color: STATUS_COLOR[h.status] }}>
                    {h.status === 'Paid' ? '✓' : h.status === 'Late' ? '!' : '✗'}
                  </div>
                  <span className="text-slate-400" style={{ fontSize: '9px' }}>{h.label.split(' ')[0]}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2">
              {[['Paid','#10b981'],['Late','#f59e0b'],['Missed','#f43f5e']].map(([l,c]) => (
                <div key={l} className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-sm" style={{ background: c }} />{l}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Notes</p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add private notes about this tenant…"
              rows={3}
              className="w-full text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-500 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all" />
            <div className="flex justify-end mt-2">
              <button onClick={() => onSaveNote(debtor.id, note)}
                className="px-4 py-2 text-xs font-semibold text-white rounded-xl transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)' }}>
                Save Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [debtors,        setDebtors]        = useState([])
  const [fileName,       setFileName]       = useState(null)
  const [parseError,     setParseError]     = useState(null)
  const [isDark,         setIsDark]         = useState(() => localStorage.getItem(LS_DARK) === 'true')
  const [reminders,      setReminders]      = useState(() => JSON.parse(localStorage.getItem(LS_REMINDERS) || '{}'))
  const [plans,          setPlans]          = useState(() => JSON.parse(localStorage.getItem(LS_PLANS) || '{}'))
  const [notes,          setNotes]          = useState(() => JSON.parse(localStorage.getItem(LS_NOTES) || '{}'))
  const [template,       setTemplate]       = useState(() => localStorage.getItem(LS_TEMPLATE) || DEFAULT_TEMPLATE)
  const [search,         setSearch]         = useState('')
  const [sortBy,         setSortBy]         = useState({ col: 'debt', dir: 'desc' })
  const [planDebtor,     setPlanDebtor]     = useState(null)
  const [reminderDebtor, setReminderDebtor] = useState(null)
  const [tenantDebtor,   setTenantDebtor]   = useState(null)
  const [bulkQueue,      setBulkQueue]      = useState(null)

  // sync dark mode to document class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try { localStorage.setItem(LS_DARK, isDark) } catch (_) {}
  }, [isDark])

  const persist = useCallback((key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch (_) {}
  }, [])

  const handleFileLoad = useCallback((buffer, name) => {
    try {
      const rows = parseExcelFile(buffer)
      if (!rows.length) throw new Error('No debtor rows found. Ensure the file has data in the "Overdues" sheet.')
      setDebtors(rows); setFileName(name); setParseError(null)
    } catch (e) { setParseError(e.message) }
  }, [])

  const handleSort = useCallback(col => {
    setSortBy(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }, [])

  const handleSavePlan = useCallback(plan => {
    if (!planDebtor) return
    const updated = { ...plans, [planDebtor.id]: plan }
    setPlans(updated); persist(LS_PLANS, updated); setPlanDebtor(null)
  }, [planDebtor, plans, persist])

  const recordReminder = useCallback(debtor => {
    const updated = { ...reminders, [debtor.id]: { lastSent: new Date().toISOString(), totalSent: (reminders[debtor.id]?.totalSent || 0) + 1 } }
    setReminders(updated); persist(LS_REMINDERS, updated)
  }, [reminders, persist])

  const handleReminderSent = useCallback(() => {
    if (!reminderDebtor) return
    recordReminder(reminderDebtor)
    if (bulkQueue?.length > 0) {
      const [next, ...rest] = bulkQueue
      setBulkQueue(rest); setReminderDebtor(next)
    } else { setReminderDebtor(null); setBulkQueue(null) }
  }, [reminderDebtor, bulkQueue, recordReminder])

  const handleSendAll = useCallback(() => {
    const withEmail = debtors.filter(d => d.email)
    if (!withEmail.length) { alert('No debtors have email addresses on file.'); return }
    const [first, ...rest] = withEmail
    setBulkQueue(rest); setReminderDebtor(first)
  }, [debtors])

  const handleSaveNote = useCallback((id, text) => {
    const updated = { ...notes, [id]: text }
    setNotes(updated); persist(LS_NOTES, updated)
  }, [notes, persist])

  if (!debtors.length) {
    return <FileUploadZone onLoad={handleFileLoad} error={parseError} isDark={isDark} />
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'dark' : ''}`}>
      <Sidebar isDark={isDark} setIsDark={setIsDark} />

      {/* Main content area, offset by sidebar */}
      <div className="flex-1 ml-16 min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Debtor Management</h1>
              <p className="text-xs text-slate-400 truncate">{fileName}</p>
            </div>
            <button onClick={() => { setDebtors([]); setFileName(null); setParseError(null) }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Load New File
            </button>
          </div>
        </header>

        <main className="px-6 py-6">
          <KPICards  debtors={debtors} reminders={reminders} />
          <DebtChart debtors={debtors} />
          <DebtorsTable
            debtors={debtors} reminders={reminders} plans={plans}
            search={search} setSearch={setSearch} sortBy={sortBy} onSort={handleSort}
            onSelectPlan={setPlanDebtor} onSendReminder={setReminderDebtor}
            onSendAll={handleSendAll} onExport={rows => doExport(rows, reminders)}
            onSelectTenant={setTenantDebtor}
          />
        </main>
      </div>

      {planDebtor && (
        <PaymentScheduleModal debtor={planDebtor} existing={plans[planDebtor.id]}
          onClose={() => setPlanDebtor(null)} onSave={handleSavePlan} />
      )}
      {reminderDebtor && (
        <ReminderModal debtor={reminderDebtor} template={template}
          onClose={() => { setReminderDebtor(null); setBulkQueue(null) }}
          onSend={handleReminderSent} onTemplateChange={t => { setTemplate(t); try { localStorage.setItem(LS_TEMPLATE, t) } catch (_) {} }} />
      )}
      {tenantDebtor && (
        <TenantDetailModal debtor={tenantDebtor} notes={notes}
          onClose={() => setTenantDebtor(null)} onSaveNote={handleSaveNote} />
      )}
    </div>
  )
}
