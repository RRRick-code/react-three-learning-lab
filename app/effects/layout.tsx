import type { ReactNode } from "react";
import { EffectsSidebar } from "./_components/effects-sidebar";
import { effects } from "./_data/effects";

export default function EffectsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EffectsSidebar effects={effects} />
      <main className="min-h-screen w-full bg-[#f1f1f1] pl-14">{children}</main>
    </div>
  );
}
