"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { effects } from "../_data/effects";

const overviewHref = "/effects";

export function EffectsSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const syncCollapsedState = () => {
      setCollapsed(!mediaQuery.matches);
    };

    syncCollapsedState();
    mediaQuery.addEventListener("change", syncCollapsedState);

    return () => {
      mediaQuery.removeEventListener("change", syncCollapsedState);
    };
  }, []);

  const navigation = [
    {
      href: overviewHref,
      title: "Overview",
      description: "Browse all effects in one place.",
    },
    ...effects,
  ];

  return (
    <aside
      className={[
        "sticky top-0 z-20 flex h-screen shrink-0 flex-col border-r border-white/10",
        "bg-slate-950/80 backdrop-blur-xl transition-[width] duration-200",
        collapsed ? "w-[4.75rem]" : "w-[18rem]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div className={collapsed ? "sr-only" : "min-w-0"}>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            React Three
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Learning effects library
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-slate-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-2xl border px-3 py-3 transition",
                  active
                    ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                    : "border-white/10 bg-white/0 hover:border-white/20 hover:bg-white/5",
                ].join(" ")}
              >
                <span className="block text-sm font-medium text-slate-100">
                  {item.title}
                </span>
                {!collapsed ? (
                  <span className="mt-1 block text-sm leading-6 text-slate-400">
                    {item.description}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-4 text-xs text-slate-500">
        {!collapsed ? "Add new effects in app/effects/<slug>/" : null}
      </div>
    </aside>
  );
}
