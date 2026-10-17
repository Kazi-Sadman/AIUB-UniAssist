import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Building2, GraduationCap, BookOpen, ClipboardList, Sparkles } from "lucide-react";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true, accent: "#8B95A3" },
  { to: "/departments", label: "Departments", icon: Building2, accent: "#C9A227" },
  { to: "/students", label: "Students", icon: GraduationCap, accent: "#3E7BA6" },
  { to: "/courses", label: "Courses", icon: BookOpen, accent: "#4F8767" },
  { to: "/enrollments", label: "Enrollments", icon: ClipboardList, accent: "#A6314A" },
  { to: "/uni-assist", label: "UniAssist AI", icon: Sparkles, accent: "#E4C34E" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-line bg-ink-soft">
      <div className="flex items-center gap-3 px-6 h-20 border-b border-line">
        <div className="w-10 h-10 rounded-full border-[1.5px] border-gold/70 flex items-center justify-center shrink-0">
          <span className="font-display text-gold text-base font-semibold">UR</span>
        </div>
        <div className="leading-tight">
          <p className="font-display text-parchment font-semibold text-[15px]">Registrar</p>
          <p className="eyebrow">Records Console</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="eyebrow px-3 mb-2">Directory</p>
        {navItems.map(({ to, label, icon: Icon, end, accent }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-surface-raised text-parchment"
                  : "text-muted hover:text-parchment hover:bg-surface"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-opacity"
                  style={{ backgroundColor: accent, opacity: isActive ? 1 : 0.35 }}
                />
                <Icon size={16} strokeWidth={2} className="shrink-0" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 border-t border-line">
        <p className="eyebrow mb-1">System</p>
        <p className="text-xs text-muted leading-relaxed">
          FastAPI · SQLite
          <br />
          Connected via REST
        </p>
      </div>
    </aside>
  );
}
