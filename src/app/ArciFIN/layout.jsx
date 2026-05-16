'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  {
    href: '/ArciFIN/overview',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/ArciFIN/sales',
    label: 'Sales Statistics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/ArciFIN/debtors',
    label: 'Debtors Commercial',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/ArciFIN/debtors-residential',
    label: 'Debtors Residential',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

function Navbar() {
  const pathname = usePathname();
  return (
    <nav style={{ width: 220, background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1e293b' }}>
        <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          Real Estate Group
        </p>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', lineHeight: 1.3, margin: 0 }}>
          Financial Report
        </h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>April 2026</p>
      </div>

      <div style={{ flex: 1, paddingTop: 12 }}>
        {links.map(l => {
          const isActive = pathname === l.href || pathname.startsWith(l.href + '/');
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 20px',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s',
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
              }}
            >
              {l.icon}
              {l.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', fontSize: 11, color: '#475569' }}>
        4 Active Projects
      </div>
    </nav>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />
      <main style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9' }}>
        {children}
      </main>
    </div>
  );
}
