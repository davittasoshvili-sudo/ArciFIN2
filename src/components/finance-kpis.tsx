"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";

const kpis = [
  {
    label: "Total Units Sold",
    value: "1,595",
    sub: "All projects • 2020–2026",
    color: "#6366f1",
  },
  {
    label: "Total Revenue",
    value: "$98.1M",
    sub: "Cumulative gross sales",
    color: "#8b5cf6",
  },
  {
    label: "Avg Price / m²",
    value: "$3,951",
    sub: "Residential average",
    color: "#6366f1",
  },
  {
    label: "2026 YTD Revenue",
    value: "$15.1M",
    sub: "164 units • Apr 30, 2026",
    color: "#8b5cf6",
  },
];

export function FinanceKPIs() {
  return (
    <motion.div
      className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 pt-28 pb-12 sm:pt-36 md:grid-cols-4 md:gap-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {kpis.map((k) => (
        <motion.div
          key={k.label}
          variants={staggerItem}
          className="rounded-2xl p-5 md:rounded-3xl md:p-6"
          style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-widest"
            style={{ color: k.color }}
          >
            {k.label}
          </p>
          <p
            className="text-3xl font-extrabold md:text-4xl"
            style={{
              fontFamily: "var(--font-bitcount-single)",
              color: "rgb(15,23,42)",
              letterSpacing: "-1px",
            }}
          >
            {k.value}
          </p>
          <p className="mt-1 text-xs font-medium" style={{ color: "rgba(0,0,0,0.5)" }}>
            {k.sub}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
