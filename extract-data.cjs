'use strict';
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(__dirname, 'public/data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const BASE = '/mnt/c/Users/user/Downloads/all_report/2026/4. აპრილი/reports';
const STATS_PATH = path.join(os.homedir(), 'Statistics.xlsx');

const PROJECT_FILES = [
  {
    name: 'Jikia',
    path: path.join(BASE, 'Jikia Report (04.30.2026).xlsx'),
    sheet: 'General Figures',
    labelCol: 1,
    totalCol: 8,
    completedCol: 6,
    debitorSheet: null,
  },
  {
    name: 'Samgori',
    path: path.join(BASE, '04.30.2026 - Samgori Report.xlsb'),
    sheet: 'General',
    labelCol: 3,
    totalCol: 26,
    completedCol: 4,
    debitorSheet: 'Debitors Control',
  },
  {
    name: 'University',
    path: path.join(BASE, '04.30.2026 - Uni Report.xlsb'),
    sheet: 'General',
    labelCol: 3,
    totalCol: 4,
    completedCol: 4,
    debitorSheet: 'Debitors Control',
  },
  {
    name: 'Lisi',
    path: path.join(BASE, '04.30.2026- Lisi Report.xlsb'),
    sheet: 'General',
    labelCol: 3,
    totalCol: 4,
    completedCol: 4,
    debitorSheet: 'Debitor Control',
  },
];

const LABEL_MAP = {
  'revenues': 'revenues',
  'residential': 'residential',
  'commercial': 'commercial',
  'parking': 'parking',
  'storerooms': 'storerooms',
  'storeroom': 'storerooms',
  'mansarda': 'mansarda',
  '1st floor': 'firstFloor',
  'office': 'office',
  'other revenues': 'otherRevenues',
  'operating expenses': 'opex',
  'land': 'land',
  'construction': 'construction',
  'marketing': 'marketing',
  'management': 'management',
  'interest expenses': 'interestExpenses',
  'vat': 'vat',
  'ebt': 'ebt',
  'net income': 'netIncome',
};

const PROJECT_NAME_MAP = {
  'სამგორი': 'Samgori',
  'ლისი': 'Lisi',
  'უნივერსიტეტი': 'University',
  'კიკვიძე': 'Kikvidze',
  'ჯიქია': 'Jikia',
};

const UNIT_TYPE_MAP = {
  'საცხოვრებელი': 'Residential',
  'ღია ავტოსადგომი': 'Open Parking',
  'დახურული ავტოსადგომი': 'Covered Parking',
  'სარდაფი': 'Storage',
  'კომერციალი': 'Commercial',
};

function xlDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const d = new Date(Math.round((serial - 25569) * 86400000));
  return d.toISOString().split('T')[0];
}

function num(v) {
  return typeof v === 'number' && isFinite(v) ? v : null;
}

// ── Financial summary from General sheets ─────────────────────────────────────
function extractFinancials() {
  const results = [];
  for (const cfg of PROJECT_FILES) {
    try {
      const wb = XLSX.readFile(cfg.path, { cellFormula: false, cellStyles: false });
      const ws = wb.Sheets[cfg.sheet];
      if (!ws) { console.warn(`  ${cfg.name}: sheet "${cfg.sheet}" not found`); continue; }

      const range = XLSX.utils.decode_range(ws['!ref']);
      const data = {};
      const seen = new Set();

      for (let r = range.s.r; r <= range.e.r; r++) {
        const lc = ws[XLSX.utils.encode_cell({ r, c: cfg.labelCol })];
        if (!lc || lc.v == null) continue;
        const key = LABEL_MAP[String(lc.v).trim().toLowerCase()];
        if (!key || seen.has(key)) continue;

        const tc = ws[XLSX.utils.encode_cell({ r, c: cfg.totalCol })];
        const cc = ws[XLSX.utils.encode_cell({ r, c: cfg.completedCol })];
        data[key] = { total: num(tc?.v), completed: num(cc?.v) };
        seen.add(key);
      }

      const rev = data.revenues?.total || 0;
      const opex = data.opex?.total || 0;
      const margin = rev > 0 ? ((rev - opex) / rev) * 100 : null;

      results.push({ name: cfg.name, ...data, grossMarginPct: margin });
      console.log(`  ${cfg.name}: revenue $${(rev / 1e6).toFixed(1)}M, EBT $${((data.ebt?.total || 0) / 1e6).toFixed(1)}M`);
    } catch (e) {
      console.error(`  ${cfg.name} error:`, e.message);
    }
  }
  return results;
}

// ── Sales from Statistics.xlsx SALES sheet ───────────────────────────────────
function extractSales() {
  const wb = XLSX.readFile(STATS_PATH, { cellFormula: false, cellStyles: false });
  const ws = wb.Sheets['SALES'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const sales = [];
  for (const row of rows.slice(1)) {
    const projectRaw = row[0];
    if (!projectRaw) continue;
    const project = PROJECT_NAME_MAP[projectRaw] || String(projectRaw);

    const saleDate = xlDate(row[16]) || xlDate(row[1]);
    const year = typeof row[2] === 'number' ? row[2] : (saleDate ? parseInt(saleDate) : null);
    const month = saleDate ? parseInt(saleDate.split('-')[1]) : null;

    sales.push({
      project,
      year,
      month,
      saleDate,
      block: String(row[3] || ''),
      unitCode: String(row[4] || ''),
      type: UNIT_TYPE_MAP[row[5]] || String(row[5] || ''),
      innerArea: num(row[8]),
      totalArea: num(row[11]),
      pricePerM2: num(row[12]),
      totalValue: num(row[13]),
      client: String(row[14] || ''),
      country: String(row[15] || ''),
      saleType: String(row[17] || ''),
    });
  }
  return sales;
}

// ── Debtors from project Debitors sheets ─────────────────────────────────────
function extractDebtors() {
  const all = [];

  for (const cfg of PROJECT_FILES) {
    if (!cfg.debitorSheet) continue;
    try {
      const wb = XLSX.readFile(cfg.path, { cellFormula: false, cellStyles: false });
      const ws = wb.Sheets[cfg.debitorSheet];
      if (!ws) { console.warn(`  ${cfg.name}: debitor sheet "${cfg.debitorSheet}" not found`); continue; }

      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const seen = new Set();
      const SKIP = new Set(['Code', 'HOUSE', 'House', 'code', '', 'CODE']);

      for (const row of rows.slice(2)) {
        const code = row[7];
        if (!code || typeof code !== 'string' || SKIP.has(code) || code.length < 3) continue;
        const key = code.toUpperCase();
        if (seen.has(key)) continue;

        const due = num(row[8]);
        if (!due) continue;

        const paid = num(row[9]) || 0;
        const overdueRaw = num(row[10]) || 0;
        const statusRaw = row[11];
        const isPaid = statusRaw === 'Paid' || Math.abs(overdueRaw) <= 1;

        seen.add(key);
        all.push({
          project: cfg.name,
          code: key,
          amountDue: due,
          amountPaid: paid,
          overdue: isPaid ? 0 : overdueRaw,
          status: isPaid ? 'Paid' : 'Outstanding',
        });
      }

      const outstanding = all.filter(d => d.project === cfg.name && d.status === 'Outstanding');
      console.log(`  ${cfg.name}: ${seen.size} properties, ${outstanding.length} outstanding`);
    } catch (e) {
      console.error(`  ${cfg.name} debitors error:`, e.message);
    }
  }
  return all;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\nExtracting financials...');
const financials = extractFinancials();

console.log('\nExtracting sales...');
const sales = extractSales();

console.log('\nExtracting debtors...');
const debtors = extractDebtors();

// Build per-project sales summary
const salesByProject = {};
for (const s of sales) {
  if (!salesByProject[s.project]) salesByProject[s.project] = { units: 0, value: 0, units2026: 0, value2026: 0 };
  salesByProject[s.project].units++;
  salesByProject[s.project].value += s.totalValue || 0;
  if (s.year === 2026) {
    salesByProject[s.project].units2026++;
    salesByProject[s.project].value2026 += s.totalValue || 0;
  }
}

fs.writeFileSync(
  path.join(DATA_DIR, 'financial.json'),
  JSON.stringify({ reportDate: 'April 30, 2026', projects: financials, salesByProject }, null, 2)
);
fs.writeFileSync(
  path.join(DATA_DIR, 'sales.json'),
  JSON.stringify({ sales }, null, 2)
);
fs.writeFileSync(
  path.join(DATA_DIR, 'debtors.json'),
  JSON.stringify({ debtors }, null, 2)
);

console.log(`\n✓ financial.json — ${financials.length} projects`);
console.log(`✓ sales.json     — ${sales.length} records`);
console.log(`✓ debtors.json   — ${debtors.length} records`);
