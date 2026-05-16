"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function DashboardHeader() {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 w-full transition-all duration-300"
      style={
        hasScrolled
          ? {
              backgroundColor: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              borderBottom: "1px solid rgba(0,0,0,0.1)",
            }
          : { backgroundColor: "transparent" }
      }
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
              <path d="M3 3h18v2H3zM3 7h12v2H3zM3 11h18v2H3zM3 15h12v2H3zM3 19h18v2H3z" />
            </svg>
          </div>
          <span
            className="text-lg font-extrabold"
            style={{
              fontFamily: "var(--font-bitcount-single)",
              fontSize: "20px",
              color: "rgb(15,23,42)",
            }}
          >
            ArciFIN
          </span>
        </div>

        <div className="flex items-center gap-6">
          {["Overview", "Sales", "Marketing"].map((item) => (
            <span
              key={item}
              className="hidden cursor-pointer text-sm font-medium transition-colors hover:text-slate-900 sm:block"
              style={{ color: "rgba(0,0,0,0.55)" }}
            >
              {item}
            </span>
          ))}
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <span
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "white",
                boxShadow: "0 2px 12px rgba(99,102,241,0.35)",
              }}
            >
              Export Report
            </span>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
