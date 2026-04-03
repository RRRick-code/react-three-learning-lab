import Link from "next/link";
import { effects } from "./_data/effects";

export default function EffectsIndexPage() {
  return (
    <section className="flex flex-1 flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/80">
          Effects
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Choose a learning effect.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Each effect lives in its own route directory so demos, notes, and
          future variants can grow without flattening the structure.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {effects.map((effect) => (
          <Link
            key={effect.href}
            href={effect.href}
            className="group rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">
              {effect.slug}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {effect.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              {effect.description}
            </p>
            <div className="mt-6 text-sm font-medium text-cyan-300 transition group-hover:text-cyan-200">
              Open effect
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
