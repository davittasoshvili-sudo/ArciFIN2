"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, defaultViewport } from "@/lib/motion";

const projects = [
  { label: "Residential", units: 133, revenue: "$14,060,701", pct: 81, color: "#6366f1" },
  { label: "Parking",     units: 21,  revenue: "$180,000",    pct: 13, color: "#8b5cf6" },
  { label: "Commercial",  units: 6,   revenue: "$844,915",    pct: 4,  color: "#a78bfa" },
  { label: "Other",       units: 4,   revenue: "$21,895",     pct: 2,  color: "#c4b5fd" },
];

const yearlyBreakdown = [
  { year: "2020", residential: 419, commercial: 2, parking: 151, other: 39 },
  { year: "2021", residential: 443, commercial: 2, parking: 153, other: 19 },
  { year: "2022", residential: 438, commercial: 2, parking: 158, other: 19 },
  { year: "2023", residential: 437, commercial: 3, parking: 144, other: 17 },
  { year: "2024", residential: 345, commercial: 21, parking: 84, other: 15 },
  { year: "2025", residential: 312, commercial: 24, parking: 172, other: 16 },
  { year: "2026", residential: 133, commercial: 6,  parking: 21,  other: 4  },
];

export function ProjectBreakdown() {
  return (
    <section
      className="px-4 py-16 md:py-24"
      style={{
        background:
          "radial-gradient(ellipse at 30% 40%, #818cf8 0%, #a5b4fc 30%, #c7d2fe 60%, #e0e7ff 100%)",
      }}
    >
      <motion.div
        className="mx-auto max-w-6xl"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
      >
        <motion.div className="mb-10 text-center" variants={staggerItem}>
          <span
            className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{ background: "rgba(255,255,255,0.5)", color: "rgb(15,23,42)" }}
          >
            2026 YTD Breakdown
          </span>
          <h2
            className="text-4xl font-extrabold md:text-5xl"
            style={{
              fontFamily: "var(--font-bitcount-single)",
              letterSpacing: "-2px",
              color: "rgb(15,23,42)",
            }}
          >
            164 Units · $15.1M Revenue
          </h2>
          <p className="mt-3 text-base font-medium md:text-lg" style={{ color: "rgba(0,0,0,0.65)" }}>
            Sales performance by property type as of April 30, 2026
          </p>
        </motion.div>

        {/* Type cards */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {projects.map((p) => (
            <motion.div
              key={p.label}
              variants={staggerItem}
              className="rounded-2xl p-5 md:rounded-3xl"
              style={{
                background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.7)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="text-sm font-bold" style={{ color: "rgb(15,23,42)" }}>
                  {p.label}
                </span>
              </div>
              <p
                className="text-3xl font-extrabold"
                style={{ fontFamily: "var(--font-bitcount-single)", color: "rgb(15,23,42)" }}
              >
                {p.units}
              </p>
              <p className="mt-0.5 text-xs font-semibold" style={{ color: p.color }}>
                {p.revenue}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/40">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: p.color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${p.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="mt-1 text-xs font-medium" style={{ color: "rgba(0,0,0,0.45)" }}>
                {p.pct}% of total
              </p>
            </motion.div>
          ))}
        </div>

        {/* Year-over-year table */}
        <motion.div
          variants={staggerItem}
          className="overflow-hidden rounded-2xl md:rounded-3xl"
          style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                {["Year", "Residential", "Commercial", "Parking", "Other", "Total"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider md:px-6 md:py-4"
                    style={{ color: "rgba(0,0,0,0.45)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yearlyBreakdown.map((row, i) => {
                const total = row.residential + row.commercial + row.parking + row.other;
                const isCurrent = row.year === "2026";
                return (
                  <tr
                    key={row.year}
                    style={{
                      borderBottom: i < yearlyBreakdown.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                      background: isCurrent ? "rgba(99,102,241,0.06)" : "transparent",
                    }}
                  >
                    <td className="px-4 py-3 font-bold md:px-6 md:py-4" style={{ color: isCurrent ? "#6366f1" : "rgb(15,23,42)" }}>
                      {row.year}{isCurrent && " *"}
                    </td>
                    <td className="px-4 py-3 font-medium md:px-6" style={{ color: "rgb(71,85,105)" }}>{row.residential.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium md:px-6" style={{ color: "rgb(71,85,105)" }}>{row.commercial.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium md:px-6" style={{ color: "rgb(71,85,105)" }}>{row.parking.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium md:px-6" style={{ color: "rgb(71,85,105)" }}>{row.other.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold md:px-6" style={{ color: "rgb(15,23,42)" }}>{total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 pb-4 text-xs md:px-6" style={{ color: "rgba(0,0,0,0.4)" }}>
            * 2026 data as of April 30, 2026
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
