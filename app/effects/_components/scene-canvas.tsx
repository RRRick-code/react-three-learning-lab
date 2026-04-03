"use client";

import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type SceneCanvasProps = {
  children: ReactNode;
  className?: string;
};

export function SceneCanvas({ children, className }: SceneCanvasProps) {
  return (
    <div
      className={[
        "min-h-screen w-full bg-background",
        className ?? "",
      ].join(" ")}
    >
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.75]}
        camera={{ position: [3.2, 2.4, 5.2], fov: 45 }}
      >
        <color attach="background" args={["#fafaf9"]} />
        <ambientLight intensity={1} />
        <directionalLight
          position={[4, 6, 4]}
          intensity={1.4}
          color="#ffffff"
        />
        <directionalLight position={[-3, -1, -2]} intensity={0.45} color="#cbd5e1" />
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={3}
          maxDistance={10}
        />
        {children}
      </Canvas>
    </div>
  );
}
