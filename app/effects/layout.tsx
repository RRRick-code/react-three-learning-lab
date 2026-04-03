import type { ReactNode } from "react";
import { EffectsSidebar } from "./_components/effects-sidebar";

export default function EffectsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.96),_#020617_55%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <EffectsSidebar />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
