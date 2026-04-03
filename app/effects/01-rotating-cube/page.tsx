"use client";

import { useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

function RotatingCube() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.rotation.x += delta * 0.7;
    meshRef.current.rotation.y += delta * 1.05;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#67e8f9" metalness={0.25} roughness={0.2} />
    </mesh>
  );
}

export default function RotatingCubePage() {
  return (
    <div className="h-screen w-full bg-background">
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.75]}
        camera={{ position: [3.2, 2.4, 5.2], fov: 45 }}
      >
        <color attach="background" args={["#fafaf9"]} />
        <ambientLight intensity={1} />
        <directionalLight position={[4, 6, 4]} intensity={1.4} color="#ffffff" />
        <directionalLight position={[-3, -1, -2]} intensity={0.45} color="#cbd5e1" />
        <OrbitControls enablePan={false} enableZoom minDistance={3} maxDistance={10} />
        <RotatingCube />
      </Canvas>
    </div>
  );
}
