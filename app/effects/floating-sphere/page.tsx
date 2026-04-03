import { SceneCanvas } from "../_components/scene-canvas";
import { FloatingSphereScene } from "./scene";

export default function FloatingSpherePage() {
  return (
    <section className="flex min-h-screen w-full">
      <SceneCanvas className="h-screen">
        <FloatingSphereScene />
      </SceneCanvas>
    </section>
  );
}
