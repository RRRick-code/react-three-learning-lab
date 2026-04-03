import type { ReactNode } from "react";
import { EffectsSidebar } from "./_components/effects-sidebar";

export default function EffectsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EffectsSidebar />
      <main className="min-h-screen w-full pl-14">{children}</main>
    </div>
  );
}
