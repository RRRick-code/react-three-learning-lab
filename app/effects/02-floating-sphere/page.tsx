"use client";

import { Float, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function FloatingSphere() {
  return (
    <>
      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={1.6}>
        <mesh>
          <sphereGeometry args={[0.95, 48, 48]} />
          <meshStandardMaterial color="#fb7185" metalness={0.2} roughness={0.18} />
        </mesh>
      </Float>
    </>
  );
}

export default function FloatingSpherePage() {
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
        <FloatingSphere />
      </Canvas>
    </div>
  );
}
