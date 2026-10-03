"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Compass,
  Sparkles,
  BarChart2,
  Settings,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

export default function Sidebar({
  activeTab,
  onTabChange,
  onOpenSettings,
  unreadCount = 0,
}) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Detect initial theme from documentElement class
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag, hasArrow: true },
    { id: "shipments", label: "Shipments", icon: Truck },
    { id: "map", label: "Map Overview", icon: Compass },
    { id: "prediction", label: "AI Prediction", icon: Sparkles, badge: "AI" },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <aside
      className="w-full md:w-56 lg:w-60 shrink-0 flex flex-col justify-between py-2 md:py-4 px-2 md:px-3 text-zinc-700 dark:text-zinc-300"
      aria-label="Sidebar Navigation"
    >
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-3 py-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7C69EF] to-[#9B88FC] text-white shadow-md shadow-purple-500/25">
            <svg
              className="h-6 w-6 fill-current"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.477 2 2 6.477 2 12c0 3.19 1.5 6.03 3.824 7.87.355.281.865.132.998-.309l1.106-3.687a1 1 0 01.957-.713h6.23a1 1 0 01.957.713l1.106 3.687c.133.441.643.59.998.309C20.5 18.03 22 15.19 22 12c0-5.523-4.477-10-10-10z"
                fill="currentColor"
                opacity="0.9"
              />
              <circle cx="12" cy="10" r="3" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Dropify
            </span>
            <span className="block text-[10px] font-medium tracking-wider uppercase text-purple-600 dark:text-purple-400">
              Superstore
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" role="navigation" aria-label="Main menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group ${
                  isSelected
                    ? "bg-[#7C69EF] text-white shadow-md shadow-purple-500/25"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-purple-50/60 dark:hover:bg-purple-950/20"
                }`}
                aria-current={isSelected ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isSelected
                        ? "text-white"
                        : "text-zinc-500 dark:text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isSelected && item.hasArrow && (
                    <ChevronRight className="h-4 w-4 text-white opacity-80" />
                  )}
                </div>
              </button>
            );
          })}

          {/* Settings / Filters Trigger */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-purple-50/60 dark:hover:bg-purple-950/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              <span>Settings</span>
            </div>
          </button>
        </nav>
      </div>

      {/* User Profile & Theme Toggle */}
      <div className="pt-6 border-t border-purple-100/80 dark:border-purple-950/40 space-y-4">
        {/* User Card */}
        <div className="flex items-center gap-3 px-2">
          <div className="relative">
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-500 overflow-hidden ring-2 ring-white dark:ring-zinc-800 shadow-sm flex items-center justify-center text-white font-semibold text-xs">
              <span className="select-none">AG</span>
              <img
                src="/assets/Foto%20Formal_Ardi.jpeg"
                alt="Ardi Gunawan Pratama"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"
              title="Online"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
              Ardi Gunawan Pratama
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              AI Engineer
            </div>
          </div>
        </div>

        {/* Theme Switcher Pill (Light / Dark) */}
        <div
          role="radiogroup"
          aria-label="Theme selection"
          className="flex items-center justify-between p-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/50"
        >
          <button
            type="button"
            role="radio"
            aria-checked={theme === "light"}
            onClick={() => toggleTheme("light")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
              theme === "light"
                ? "bg-zinc-900 text-white shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Sun className="h-3 w-3" />
            <span>Light</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={theme === "dark"}
            onClick={() => toggleTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
              theme === "dark"
                ? "bg-[#7C69EF] text-white shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-white"
            }`}
          >
            <Moon className="h-3 w-3" />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
