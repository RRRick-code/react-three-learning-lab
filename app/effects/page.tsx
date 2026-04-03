import { redirect } from "next/navigation";
import { firstEffectHref } from "./_data/effects";

export default function EffectsIndexPage() {
  if (firstEffectHref) {
    redirect(firstEffectHref);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-14 text-sm text-muted-foreground">
      No effects yet.
    </main>
  );
}
