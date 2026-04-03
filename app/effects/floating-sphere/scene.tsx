"use client";

import { Float } from "@react-three/drei";

export function FloatingSphereScene() {
  return (
    <>
      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={1.6}>
        <mesh>
          <sphereGeometry args={[0.95, 48, 48]} />
          <meshStandardMaterial color="#fb7185" metalness={0.2} roughness={0.18} />
        </mesh>
      </Float>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshStandardMaterial color="#0f172a" roughness={1} />
      </mesh>
    </>
  );
}
