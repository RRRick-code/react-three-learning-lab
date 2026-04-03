import { SceneCanvas } from "../_components/scene-canvas";
import { RotatingCubeScene } from "./scene";

export default function RotatingCubePage() {
  return (
    <section className="flex min-h-screen w-full">
      <SceneCanvas className="h-screen">
        <RotatingCubeScene />
      </SceneCanvas>
    </section>
  );
}
