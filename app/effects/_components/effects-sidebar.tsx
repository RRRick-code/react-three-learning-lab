"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SidebarEffect = {
  slug: string;
  href: string;
};

type EffectsSidebarProps = {
  effects: SidebarEffect[];
};

export function EffectsSidebar({ effects }: EffectsSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <aside className="fixed inset-y-0 left-0 z-[60] flex w-14 flex-col items-center border-r bg-background">
        <div className="flex w-full justify-center px-2 py-3">
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={open ? "Close effects navigation" : "Open effects navigation"}
            >
              <PanelLeftIcon />
            </Button>
          </SheetTrigger>
        </div>
      </aside>

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
  );
}
