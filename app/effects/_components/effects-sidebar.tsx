"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpenIcon, Code2Icon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
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

export function EffectsSidebar({ effects }: EffectsSidebarProps) {
  const pathname = stripBasePath(usePathname());
  const [openPanel, setOpenPanel] = useState<SidebarPanel>(null);

  function handlePanelChange(panel: Exclude<SidebarPanel, null>, nextOpen: boolean) {
    setOpenPanel((current) => {
      if (nextOpen) {
        return panel;
      }

      return current === panel ? null : current;
    });
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-[60] flex w-14 flex-col items-center justify-between border-r bg-background/95 px-2 py-3 supports-backdrop-filter:backdrop-blur-sm">
        <div className="flex w-full justify-center">
          <Button
            variant={openPanel === "navigation" ? "secondary" : "ghost"}
            size="icon"
            aria-label={
              openPanel === "navigation" ? "Close effects navigation" : "Open effects navigation"
            }
            onClick={() =>
              setOpenPanel((current) => (current === "navigation" ? null : "navigation"))
            }
          >
            <ListIcon />
          </Button>
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <Button
            variant={openPanel === "notes" ? "secondary" : "ghost"}
            size="icon"
            aria-label={openPanel === "notes" ? "Close notes panel" : "Open notes panel"}
            onClick={() => setOpenPanel((current) => (current === "notes" ? null : "notes"))}
          >
            <BookOpenIcon />
          </Button>

          <Button
            variant={openPanel === "source" ? "secondary" : "ghost"}
            size="icon"
            aria-label={openPanel === "source" ? "Close source panel" : "Open source panel"}
            onClick={() => setOpenPanel((current) => (current === "source" ? null : "source"))}
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
          showCloseButton={false}
          aria-describedby={undefined}
          className="data-[side=left]:left-14 w-64 gap-0 rounded-none border-r bg-background p-0 sm:max-w-64"
        >
          <SheetTitle className="sr-only">Effects navigation</SheetTitle>
          <ScrollArea className="h-full">
            <nav className="flex flex-col py-3">
              {effects.map((effect, index) => {
                const active = pathname === effect.href;

                return (
                  <div key={effect.href}>
                    {index > 0 ? <Separator /> : null}
                    <SheetClose asChild>
                      <Button
                        asChild
                        variant={active ? "secondary" : "ghost"}
                        className="h-12 w-full justify-start rounded-none px-4 text-sm font-medium"
                      >
                        <Link href={effect.href}>{effect.slug}</Link>
                      </Button>
                    </SheetClose>
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
