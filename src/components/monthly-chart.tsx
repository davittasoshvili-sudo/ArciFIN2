"use client";

import { motion } from "framer-motion";
import { defaultViewport, staggerContainer, staggerItem } from "@/lib/motion";

const months = [
  "Apr-25","May-25","Jun-25","Jul-25","Aug-25","Sep-25",
  "Oct-25","Nov-25","Dec-25","Jan-26","Feb-26","Mar-26","Apr-26",
];

const sales = [50, 80, 38, 46, 38, 54, 64, 46, 50, 48, 74, 70, 74];
const maxSales = Math.max(...sales);

export function MonthlyChart() {
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
            Monthly Sales
          </span>
          <h2
            className="text-4xl font-extrabold md:text-5xl"
            style={{
              fontFamily: "var(--font-bitcount-single)",
              letterSpacing: "-2px",
              color: "rgb(15,23,42)",
            }}
          >
            Apr 2025 — Apr 2026
          </h2>
          <p className="mt-3 text-base font-medium md:text-lg" style={{ color: "rgb(71,85,105)" }}>
            Total units sold across all projects per month
          </p>
        </motion.div>

        <motion.div
          className="rounded-2xl p-6 md:rounded-3xl md:p-10"
          style={{
            boxShadow: "rgba(0,0,0,0.05) 0px 4px 24px, rgba(0,0,0,0.08) 0px 2px 8px",
          }}
          variants={staggerItem}
        >
          <div className="flex items-end justify-between gap-2 md:gap-3" style={{ height: 220 }}>
            {sales.map((val, i) => {
              const heightPct = (val / maxSales) * 100;
              const isHighest = val === maxSales;
              return (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                  <span
                    className="text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: "#6366f1" }}
                  >
                    {val}
                  </span>
                  <motion.div
                    className="w-full rounded-t-lg"
                    style={{
                      background: isHighest
                        ? "linear-gradient(180deg,#6366f1 0%,#4f46e5 100%)"
                        : "linear-gradient(180deg,#a5b4fc 0%,#818cf8 100%)",
                      boxShadow: isHighest ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
                    }}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${heightPct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between gap-2 md:gap-3">
            {months.map((m, i) => (
              <div key={i} className="flex flex-1 justify-center">
                <span
                  className="text-center text-[9px] font-medium leading-tight md:text-xs"
                  style={{ color: "rgb(148,163,184)" }}
                >
                  {m.split("-").map((p, j) => (
                    <span key={j} className="block">
                      {p}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
