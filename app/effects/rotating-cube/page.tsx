import { SceneCanvas } from "../_components/scene-canvas";
import { RotatingCubeScene } from "./scene";

export default function RotatingCubePage() {
  return (
    <section className="flex flex-1 flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/80">
          Effect
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Rotating Cube
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          A basic animation route that uses React Three Fiber state and frame
          updates instead of a manual three.js app bootstrap.
        </p>
      </header>

      <SceneCanvas className="min-h-[22rem] sm:min-h-[28rem] lg:min-h-[32rem]">
        <RotatingCubeScene />
      </SceneCanvas>
    </section>
  );
}
