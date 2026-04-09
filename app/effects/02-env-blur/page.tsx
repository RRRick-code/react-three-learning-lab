"use client";

import { useState, useTransition } from 'react'
import { Leva, useControls } from 'leva'
import { Canvas } from '@react-three/fiber'
import { AccumulativeShadows, RandomizedLight, Center, GizmoHelper, GizmoViewport, Environment, OrbitControls } from '@react-three/drei'

const PRESETS = ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'] as const;
type Preset = typeof PRESETS[number];

function Sphere() {
  const { metalness, roughness } = useControls({
    metalness: { value: 1, min: 0, max: 1 },
    roughness: { value: 1, min: 0, max: 1 },
  })
  return (
    <Center top>
      <mesh castShadow>
        <sphereGeometry args={[0.75, 64, 64]} />
        <meshStandardMaterial metalness={metalness} roughness={roughness} />
      </mesh>
    </Center>
  );
}

function Env() {
  const [preset, setPreset] = useState<Preset>('sunset');
  const [, startTransition] = useTransition()
  const { blur, environmentIntensity, backgroundIntensity } = useControls({
    preset: {
      value: preset,
      options: PRESETS,
      onChange: (value) => startTransition(() => setPreset(value))
    },
    blur: { value: 1, min: 0, max: 1, step: 0.05 },
    environmentIntensity: { value: 1, min: 0, max: 3, step: 0.05 },
    backgroundIntensity: { value: 1, min: 0, max: 3, step: 0.05 },
  });
  return (
    <Environment
      preset={preset}
      background
      blur={blur}
      environmentIntensity={environmentIntensity}
      backgroundIntensity={backgroundIntensity}
    />
  );
}

export default function Page() {
  return (
    <div className="h-screen w-full">
      <Leva theme={{ sizes: { rootWidth: '360px' } }} />
      <Canvas shadows camera={{ position: [0, 1, 5], fov: 50}}>
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
        <axesHelper args={[3]} />
        <OrbitControls makeDefault autoRotate autoRotateSpeed={1} />

        <group position={[0, -0.65, 0]}>
          <Sphere />
          <AccumulativeShadows temporal frames={100} color="purple" colorBlend={0.5} opacity={0.8} scale={10} alphaTest={0.75}>
            <RandomizedLight amount={8} radius={3.6} ambient={0.5} position={[5, 3, 2]} bias={0.001} />
          </AccumulativeShadows>
        </group>
        <Env />
      </Canvas>
    </div>
  );
}
