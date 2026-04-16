"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpenIcon, Code2Icon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { stripBasePath } from "@/lib/with-base-path";
import { EffectDetailSheet } from "./effect-detail-sheet";

type SidebarEffect = {
  slug: string;
  href: string;
};

type EffectsSidebarProps = {
  effects: SidebarEffect[];
};

type SidebarPanel = "navigation" | "notes" | "source" | null;
type PendingNavigation = {
  href: string;
  originPathname: string;
};

export function EffectsSidebar({ effects }: EffectsSidebarProps) {
  const router = useRouter();
  const pathname = stripBasePath(usePathname());
  const [openPanel, setOpenPanel] = useState<SidebarPanel>(null);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

  function handlePanelChange(panel: Exclude<SidebarPanel, null>, nextOpen: boolean) {
    setPendingNavigation((currentPending) =>
      panel === "navigation" && !nextOpen ? currentPending : null,
    );

    setOpenPanel((current) => {
      if (nextOpen) {
        return panel;
      }

      return current === panel ? null : current;
    });
  }

  function togglePanel(panel: Exclude<SidebarPanel, null>) {
    setPendingNavigation(null);
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  function closeNavigationPanel(nextHref: string | null = null) {
    setPendingNavigation(
      nextHref === null ? null : { href: nextHref, originPathname: pathname },
    );
    setOpenPanel((current) => (current === "navigation" ? null : current));
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-60 flex w-14 flex-col items-center justify-between border-r bg-background/95 px-2 py-3 supports-backdrop-filter:backdrop-blur-sm">
        <div className="flex w-full justify-center">
          <Button
            variant={openPanel === "navigation" ? "secondary" : "ghost"}
            size="icon"
            aria-label={
              openPanel === "navigation" ? "Close effects navigation" : "Open effects navigation"
            }
            onClick={() => togglePanel("navigation")}
          >
            <ListIcon />
          </Button>
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <Button
            variant={openPanel === "notes" ? "secondary" : "ghost"}
            size="icon"
            aria-label={openPanel === "notes" ? "Close notes panel" : "Open notes panel"}
            onClick={() => togglePanel("notes")}
          >
            <BookOpenIcon />
          </Button>

          <Button
            variant={openPanel === "source" ? "secondary" : "ghost"}
            size="icon"
            aria-label={openPanel === "source" ? "Close source panel" : "Open source panel"}
            onClick={() => togglePanel("source")}
          >
            <Code2Icon />
          </Button>
        </div>
      </aside>

      <Sheet
        open={openPanel === "navigation"}
        onOpenChange={(open) => handlePanelChange("navigation", open)}
      >
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="data-[side=left]:left-14 w-64 gap-0 rounded-none border-r bg-background p-0 sm:max-w-64"
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) {
              return;
            }

            if (
              event.currentTarget.getAttribute("data-state") !== "closed" ||
              pendingNavigation === null
            ) {
              return;
            }

            if (pendingNavigation.originPathname !== pathname) {
              setPendingNavigation(null);
              return;
            }

            const { href } = pendingNavigation;
            setPendingNavigation(null);
            router.push(href);
          }}
        >
          <SheetHeader className="gap-0.5 border-b px-5 py-4">
            <SheetTitle className="pr-10 text-base font-semibold">Effects</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full">
            <nav className="flex flex-col py-3">
              {effects.map((effect) => {
                const active = pathname === effect.href;

                return (
                  <div key={effect.href}>
                    <Button
                      asChild
                      variant={active ? "secondary" : "ghost"}
                      className="h-12 w-full justify-start rounded-none px-4 text-sm font-medium"
                    >
                      <Link
                        href={effect.href}
                        onNavigate={(event) => {
                          event.preventDefault();
                          closeNavigationPanel(active ? null : effect.href);
                        }}
                      >
                        {effect.slug}
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <EffectDetailSheet
        mode="notes"
        open={openPanel === "notes"}
        onOpenChange={(open) => handlePanelChange("notes", open)}
      />
      <EffectDetailSheet
        mode="source"
        open={openPanel === "source"}
        onOpenChange={(open) => handlePanelChange("source", open)}
      />
    </>
  );
}
