"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, defaultViewport } from "@/lib/motion";
import { TrendingUp, Users, DollarSign, Repeat2 } from "lucide-react";

const stats = [
  { icon: DollarSign, label: "Total Marketing Spend",   value: "$88,547",  sub: "Last 12 months" },
  { icon: Users,      label: "Avg Monthly Leads (FB)",  value: "41.9",     sub: "Facebook campaigns" },
  { icon: TrendingUp, label: "Cost per Lead",            value: "$25.47",   sub: "Average" },
  { icon: Repeat2,    label: "Cost per Sale",            value: "$859.05",  sub: "From paid ads" },
];

const monthlyMarketing = [
  { month: "Apr-25", leads: 25, cost: 8200 },
  { month: "May-25", leads: 40, cost: 9100 },
  { month: "Jun-25", leads: 19, cost: 6300 },
  { month: "Jul-25", leads: 23, cost: 7400 },
  { month: "Aug-25", leads: 19, cost: 6100 },
  { month: "Sep-25", leads: 27, cost: 7800 },
  { month: "Oct-25", leads: 32, cost: 8600 },
  { month: "Nov-25", leads: 23, cost: 7100 },
  { month: "Dec-25", leads: 25, cost: 7500 },
  { month: "Jan-26", leads: 24, cost: 6900 },
  { month: "Feb-26", leads: 37, cost: 8900 },
  { month: "Mar-26", leads: 35, cost: 8400 },
  { month: "Apr-26", leads: 37, cost: 8300 },
];

export function MarketingPanel() {
  return (
    <section className="bg-white px-4 py-16 md:py-24">
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
            style={{ background: "#ede9fe", color: "#6366f1" }}
          >
            Marketing Performance
          </span>
          <h2
            className="text-4xl font-extrabold md:text-5xl"
            style={{
              fontFamily: "var(--font-bitcount-single)",
              letterSpacing: "-2px",
              color: "rgb(15,23,42)",
            }}
          >
            Paid Acquisition Stats
          </h2>
          <p className="mt-3 text-base font-medium md:text-lg" style={{ color: "rgb(71,85,105)" }}>
            Facebook & digital marketing — last 13 months
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={staggerItem}
              className="rounded-2xl p-5 md:rounded-3xl"
              style={{
                boxShadow: "rgba(0,0,0,0.05) 0px 4px 24px, rgba(0,0,0,0.08) 0px 2px 8px",
              }}
            >
              <s.icon className="mb-3 h-5 w-5" style={{ color: "#6366f1" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.4)" }}>
                {s.label}
              </p>
              <p
                className="mt-1 text-3xl font-extrabold"
                style={{ fontFamily: "var(--font-bitcount-single)", color: "rgb(15,23,42)" }}
              >
                {s.value}
              </p>
              <p className="mt-0.5 text-xs font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>
                {s.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Monthly table */}
        <motion.div
          variants={staggerItem}
          className="overflow-hidden rounded-2xl md:rounded-3xl"
          style={{
            boxShadow: "rgba(0,0,0,0.05) 0px 4px 24px, rgba(0,0,0,0.08) 0px 2px 8px",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", background: "#f8fafc" }}>
                {["Month", "FB Leads", "Est. Cost", "Cost/Lead"].map((h) => (
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
              {monthlyMarketing.map((row, i) => (
                <tr
                  key={row.month}
                  style={{ borderBottom: i < monthlyMarketing.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}
                >
                  <td className="px-4 py-3 font-semibold md:px-6" style={{ color: "rgb(15,23,42)" }}>
                    {row.month}
                  </td>
                  <td className="px-4 py-3 font-medium md:px-6" style={{ color: "rgb(71,85,105)" }}>
                    {row.leads}
                  </td>
                  <td className="px-4 py-3 font-medium md:px-6" style={{ color: "rgb(71,85,105)" }}>
                    ${row.cost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold md:px-6" style={{ color: "#6366f1" }}>
                    ${(row.cost / row.leads).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    </section>
  );
}
