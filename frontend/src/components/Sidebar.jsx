import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Building2,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Sparkles,
  Search,
  Activity,
  Settings,
  X,
} from "lucide-react";
import axiosClient from "../api/axiosClient";

// Navigation is split into groups so the sidebar stays easy to scan.
const navGroups = [
  {
    heading: "Records",
    items: [
      { to: "/", label: "Overview", icon: LayoutGrid, end: true, accent: "#8B95A3" },
      { to: "/departments", label: "Departments", icon: Building2, accent: "#C9A227" },
      { to: "/students", label: "Students", icon: GraduationCap, accent: "#3E7BA6" },
      { to: "/courses", label: "Courses", icon: BookOpen, accent: "#4F8767" },
      { to: "/enrollments", label: "Enrollments", icon: ClipboardList, accent: "#A6314A" },
    ],
  },
  {
    heading: "Assistant",
    items: [{ to: "/uni-assist", label: "UniAssist AI", icon: Sparkles, accent: "#E4C34E" }],
  },
  {
    heading: "Tools",
    items: [
      { to: "/search", label: "Global search", icon: Search, accent: "#8B95A3" },
      { to: "/system-health", label: "System health", icon: Activity, accent: "#8B95A3" },
      { to: "/settings", label: "Settings", icon: Settings, accent: "#8B95A3" },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Dark overlay behind the menu on small screens. Tapping it closes the menu. */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 flex flex-col border-r border-line bg-ink-soft/95 backdrop-blur transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-20 border-b border-line">
          <div className="w-10 h-10 rounded-full border-[1.5px] border-gold/70 flex items-center justify-center shrink-0">
            <span className="font-display text-gold text-base font-semibold">AU</span>
          </div>
          <div className="leading-tight flex-1">
            <p className="font-display text-parchment font-semibold text-[15px]">AIUB UniAssist</p>
            <p className="eyebrow">Records and AI assistant</p>
          </div>
          <button
            className="icon-btn lg:hidden"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {navGroups.map((group) => (
            <div key={group.heading} className="space-y-1">
              <p className="eyebrow px-3 mb-2">{group.heading}</p>
              {group.items.map(({ to, label, icon: Icon, end, accent }) => (
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
            </div>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-line">
          <p className="eyebrow mb-1">Backend API</p>
          <p className="text-xs text-parchment/80 font-mono break-all">
            {axiosClient.defaults.baseURL}
          </p>
        </div>
      </aside>
    </>
  );
}
