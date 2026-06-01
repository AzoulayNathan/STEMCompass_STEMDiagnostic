import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Plus, FileText, Settings, Compass, ChevronLeft, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/learners", label: "Apprenants", icon: Users },
  { to: "/diagnostics/new", label: "Nouveau diagnostic", icon: Plus },
  { to: "/reports", label: "Rapports", icon: FileText },
  { to: "/settings", label: "Paramètres", icon: Settings },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 h-screen z-50 flex flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
          <Compass className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="font-serif font-semibold text-lg tracking-tight">STEM Compass</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto hidden lg:block text-muted-foreground hover:text-foreground">
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 lg:hidden bg-card shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-serif font-semibold">STEM Compass</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}