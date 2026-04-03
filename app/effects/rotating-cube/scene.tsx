"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

export function RotatingCubeScene() {
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
      <boxGeometry args={[1.3, 1.3, 1.3]} />
      <meshStandardMaterial color="#67e8f9" metalness={0.25} roughness={0.2} />
    </mesh>
  );
}
