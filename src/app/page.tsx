import { DashboardHeader } from "@/components/dashboard-header";
import { FinanceKPIs } from "@/components/finance-kpis";
import { MonthlyChart } from "@/components/monthly-chart";
import { ProjectBreakdown } from "@/components/project-breakdown";
import { MarketingPanel } from "@/components/marketing-panel";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, #818cf8 0%, #a5b4fc 30%, #c7d2fe 60%, #e0e7ff 100%)",
        }}
      />

      <DashboardHeader />

      <div className="relative z-10">
        <FinanceKPIs />
      </div>

      <div className="relative z-10">
        <MonthlyChart />
        <ProjectBreakdown />
        <MarketingPanel />

        <footer
          className="bg-white py-8 text-center text-sm font-medium"
          style={{ color: "rgba(0,0,0,0.35)" }}
        >
          ArciFIN Finance Dashboard · Data as of April 30, 2026
        </footer>
      </div>
    </div>
  );
}
