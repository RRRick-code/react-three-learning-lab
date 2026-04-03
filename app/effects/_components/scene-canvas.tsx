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
        "overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.35)]",
        className ?? "",
      ].join(" ")}
    >
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.75]}
        camera={{ position: [3.2, 2.4, 5.2], fov: 45 }}
      >
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[4, 6, 4]}
          intensity={2.3}
          color="#f8fafc"
        />
        <directionalLight position={[-3, -1, -2]} intensity={0.6} color="#38bdf8" />
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
