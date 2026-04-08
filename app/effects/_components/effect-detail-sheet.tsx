"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getEffectSlug, withBasePath } from "@/lib/with-base-path";

type NotePayload = {
  slug: string;
  title?: string;
  html: string;
};

type SourceFileMeta = {
  id: string;
  path: string;
  label?: string;
  language?: string;
};

type SourcesIndexPayload = {
  slug: string;
  primarySource?: string;
  files: SourceFileMeta[];
};

type SourcePayload = {
  id: string;
  path: string;
  language?: string;
  html: string;
};

type EffectDetailMode = "notes" | "source";

const noteCache = new Map<string, Promise<NotePayload>>();
const sourcesIndexCache = new Map<string, Promise<SourcesIndexPayload>>();
const sourceCache = new Map<string, Promise<SourcePayload>>();

async function readJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return (await response.json()) as T;
}

function loadNote(slug: string) {
  const url = withBasePath(`/effects-content/${slug}/note.json`);
  const cached = noteCache.get(url);

  if (cached) {
    return cached;
  }

  const request = readJson<NotePayload>(url);
  noteCache.set(url, request);

  return request;
}

function loadSourcesIndex(slug: string) {
  const url = withBasePath(`/effects-content/${slug}/sources/index.json`);
  const cached = sourcesIndexCache.get(url);

  if (cached) {
    return cached;
  }

  const request = readJson<SourcesIndexPayload>(url);
  sourcesIndexCache.set(url, request);

  return request;
}

function loadSource(slug: string, sourceId: string) {
  const url = withBasePath(`/effects-content/${slug}/sources/${sourceId}.json`);
  const cached = sourceCache.get(url);

  if (cached) {
    return cached;
  }

  const request = readJson<SourcePayload>(url);
  sourceCache.set(url, request);

  return request;
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center px-6 text-sm text-muted-foreground">
      Loading {label}...
    </div>
  );
}

type EffectDetailSheetProps = {
  mode: EffectDetailMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EffectDetailSheet({
  mode,
  open,
  onOpenChange,
}: EffectDetailSheetProps) {
  const pathname = usePathname();
  const slug = useMemo(() => getEffectSlug(pathname), [pathname]);
  const [noteResults, setNoteResults] = useState<
    Record<string, { payload?: NotePayload; error?: string }>
  >({});
  const [sourcesIndexResults, setSourcesIndexResults] = useState<
    Record<string, { payload?: SourcesIndexPayload; error?: string }>
  >({});
  const [selectedSourceIds, setSelectedSourceIds] = useState<Record<string, string>>({});
  const [sourceResults, setSourceResults] = useState<
    Record<string, { payload?: SourcePayload; error?: string }>
  >({});
  const requestedNotes = useRef(new Set<string>());
  const requestedSourceIndexes = useRef(new Set<string>());
  const requestedSources = useRef(new Set<string>());

  const noteEntry = slug ? noteResults[slug] : undefined;
  const note = noteEntry?.payload ?? null;
  const noteError = noteEntry?.error ?? null;
  const noteLoading = open && Boolean(slug) && !note && !noteError;

  const sourcesIndexEntry = slug ? sourcesIndexResults[slug] : undefined;
  const sourcesIndex = sourcesIndexEntry?.payload ?? null;
  const sourcesIndexError = sourcesIndexEntry?.error ?? null;
  const sourcesIndexLoading =
    open && mode === "source" && Boolean(slug) && !sourcesIndex && !sourcesIndexError;
  const primarySourceId =
    sourcesIndex?.files.find(
      (file) => file.id === sourcesIndex.primarySource || file.path === sourcesIndex.primarySource
    )?.id ?? null;

  const selectedSourceId =
    (slug ? selectedSourceIds[slug] : null) ??
    primarySourceId ??
    sourcesIndex?.files[0]?.id ??
    null;
  const sourceKey = slug && selectedSourceId ? `${slug}:${selectedSourceId}` : null;
  const sourceEntry = sourceKey ? sourceResults[sourceKey] : undefined;
  const source = sourceEntry?.payload ?? null;
  const sourceError = sourceEntry?.error ?? null;
  const sourceLoading =
    open && mode === "source" && Boolean(sourceKey) && !source && !sourceError;

  useEffect(() => {
    if (!open || !slug || note || noteError || requestedNotes.current.has(slug)) {
      return;
    }

    let cancelled = false;
    requestedNotes.current.add(slug);

    loadNote(slug)
      .then((payload) => {
        if (!cancelled) {
          setNoteResults((current) => ({
            ...current,
            [slug]: { payload },
          }));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setNoteResults((current) => ({
            ...current,
            [slug]: {
              error: error instanceof Error ? error.message : "Unable to load notes.",
            },
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [note, noteError, open, slug]);

  useEffect(() => {
    if (
      !open ||
      mode !== "source" ||
      !slug ||
      sourcesIndex ||
      sourcesIndexError ||
      requestedSourceIndexes.current.has(slug)
    ) {
      return;
    }

    let cancelled = false;
    requestedSourceIndexes.current.add(slug);

    loadSourcesIndex(slug)
      .then((payload) => {
        if (!cancelled) {
          setSourcesIndexResults((current) => ({
            ...current,
            [slug]: { payload },
          }));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSourcesIndexResults((current) => ({
            ...current,
            [slug]: {
              error: error instanceof Error ? error.message : "Unable to load source files.",
            },
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, open, slug, sourcesIndex, sourcesIndexError]);

  useEffect(() => {
    if (
      !open ||
      mode !== "source" ||
      !slug ||
      !selectedSourceId ||
      !sourceKey ||
      source ||
      sourceError ||
      requestedSources.current.has(sourceKey)
    ) {
      return;
    }

    let cancelled = false;
    requestedSources.current.add(sourceKey);

    loadSource(slug, selectedSourceId)
      .then((payload) => {
        if (!cancelled) {
          setSourceResults((current) => ({
            ...current,
            [sourceKey]: { payload },
          }));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSourceResults((current) => ({
            ...current,
            [sourceKey]: {
              error: error instanceof Error ? error.message : "Unable to load source file.",
            },
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, open, selectedSourceId, slug, source, sourceError, sourceKey]);

  const title = mode === "notes" ? "Notes" : "Code";
  const description = slug ?? "No active effect";
  const sheetWidthClass =
    mode === "source"
      ? "data-[side=left]:left-14 w-full gap-0 rounded-none border-r bg-background p-0 data-[side=left]:sm:w-[56rem] data-[side=left]:sm:max-w-[calc(100vw-3.5rem)]"
      : "data-[side=left]:left-14 w-full gap-0 rounded-none border-r bg-background p-0 data-[side=left]:sm:w-96 data-[side=left]:sm:max-w-[calc(100vw-3.5rem)]";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        aria-describedby={undefined}
        className={sheetWidthClass}
      >
        <SheetHeader className="gap-0.5 border-b px-5 py-4">
          <SheetTitle className="pr-10 text-base font-semibold">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {!slug ? (
          <EmptyState
            title="No active effect"
            description="Open a concrete /effects/<slug> route to inspect its notes and source."
          />
        ) : (
          <>
            {mode === "notes" ? (
              noteLoading ? (
                <LoadingState label="notes" />
              ) : noteError ? (
                <EmptyState
                  title="Notes unavailable"
                  description={noteError}
                />
              ) : note ? (
                <ScrollArea className="h-full">
                  <article
                    className="effect-doc px-5 py-5"
                    dangerouslySetInnerHTML={{ __html: note.html }}
                  />
                </ScrollArea>
              ) : (
                <EmptyState
                  title="No note payload yet"
                  description="Open the panel on a generated effect route to load notes."
                />
              )
            ) : sourcesIndexLoading ? (
              <LoadingState label="source index" />
            ) : sourcesIndexError ? (
              <EmptyState
                title="Source index unavailable"
                description={sourcesIndexError}
              />
            ) : sourcesIndex ? (
              <div className="flex h-full min-h-0 flex-col">
                <ScrollArea className="border-b">
                  <div className="flex w-max min-w-full gap-2 px-4 py-3">
                    {sourcesIndex.files.map((file) => (
                      <Button
                        key={file.id}
                        variant={selectedSourceId === file.id ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          if (!slug || selectedSourceId === file.id) {
                            return;
                          }

                          setSelectedSourceIds((current) => ({
                            ...current,
                            [slug]: file.id,
                          }));
                        }}
                      >
                        {file.label ?? file.path}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>

                {sourceLoading ? (
                  <LoadingState label="source file" />
                ) : sourceError ? (
                  <EmptyState
                    title="Source unavailable"
                    description={sourceError}
                  />
                ) : source ? (
                  <ScrollArea className="h-full">
                    <div
                      className="effect-code"
                      dangerouslySetInnerHTML={{ __html: source.html }}
                    />
                  </ScrollArea>
                ) : (
                  <EmptyState
                    title="No source selected"
                    description="Choose a source file to view its generated read-only preview."
                  />
                )}
              </div>
            ) : (
              <EmptyState
                title="Source index missing"
                description="No generated source metadata was found for the current effect."
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
