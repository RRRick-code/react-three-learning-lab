"use client";

import { useState, useTransition } from 'react'
import { useControls } from 'leva'
import { Canvas } from '@react-three/fiber'
import { AccumulativeShadows, RandomizedLight, Center, GizmoHelper, GizmoViewport, Environment, OrbitControls } from '@react-three/drei'

function Sphere() {
  return (
    <Center top>
      <mesh castShadow>
        <sphereGeometry args={[0.75, 64, 64]} />
        <meshStandardMaterial metalness={1} roughness={1} />
      </mesh>
    </Center>
  );
}

function Env() {
  return <Environment preset={"sunset"} background blur={0.65} />;
}


export default function Page() {
  return (
    <div className="h-screen w-full">
      <Canvas shadows camera={{ position: [0, 0, 4.5], fov: 50}}>
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
        <axesHelper args={[3]} />
        <OrbitControls makeDefault />

        <group position={[0, -0.65, 0]}>
          <Sphere />
          <AccumulativeShadows temporal frames={200} color="purple" colorBlend={0.5} opacity={1} scale={10} alphaTest={0.05}>
            <RandomizedLight amount={8} radius={5} ambient={0.5} position={[5, 3, 2]} bias={0.001} />
          </AccumulativeShadows>
        </group>
        <Env />
      </Canvas>
    </div>
  );
}