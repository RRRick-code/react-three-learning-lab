"use client"

import { Canvas } from '@react-three/fiber'
import { useGLTF, AccumulativeShadows, RandomizedLight, Caustics, MeshTransmissionMaterial, Center, Environment } from '@react-three/drei'
import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei'
import { Leva, useControls } from "leva"
import { useState, useTransition } from 'react'

const PRESETS = ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'] as const;
type Preset = typeof PRESETS[number];

function Env() {
  const [preset, setPreset] = useState<Preset>('city');
  const [, startTransition] = useTransition()
  const { blur, environmentIntensity, backgroundIntensity } = useControls("Env", {
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


function Bunny() {
  const { thickness, roughness, ior, distortion, distortionScale } = useControls("Bunny",{
    thickness: { value: 0.3, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
    ior: { value: 1.8, min: 1, max: 2, step: 0.1 },
    distortion: { value: 1, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.1, min: 0, max: 1, step: 0.01 },
  });

  const { nodes } = useGLTF("assets/bunny.glb") as any;

  return (
    <Caustics 
      causticsOnly={false}
      backside={false}
      color="#ffffff" 
      position={[0, 0, 0]} 
      lightSource={[6, 8, -6]}
      worldRadius={0.3}
      ior={1.8}
      intensity={0.01}
    >
      <mesh receiveShadow castShadow geometry={nodes.bunny.geometry} >
        <MeshTransmissionMaterial 
          backside 
          samples={10} 
          resolution={512} 
          thickness={thickness} 
          roughness={roughness} 
          anisotropy={1} 
          chromaticAberration={0.2} 
          ior={ior}
          distortion={distortion}
          distortionScale={distortionScale}
        />
      </mesh>
    </Caustics>
  )
}

export default function Page() {
  
  return (
    <div className="h-screen w-full">
      <Leva theme={{ sizes: { rootWidth: '320px' } }} />
      <Canvas shadows camera={{ position: [-2, 1, 10], fov: 20 }}>
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={1} />
        {/* <axesHelper args={[3]} /> */}

        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={5} />
        <spotLight decay={1} intensity={600} position={[5, 6, -5]} angle={0.15} penumbra={1} />
        <pointLight position={[6, 6, 6]} intensity={120} castShadow decay={1} />
        <pointLight position={[-6, -6, -6]} color="white" intensity={80} decay={1} />
        <group position={[0, -1, 0]}>
          <Center top>
            <Bunny />
          </Center>
          <AccumulativeShadows temporal frames={100} toneMapped={true} alphaTest={0.85} opacity={0.6} scale={12}>
            <RandomizedLight amount={8} radius={5} ambient={0.5} intensity={5} position={[5, 5, -5]} bias={0.001} />
          </AccumulativeShadows>
        </group>
        <Env />
      </Canvas>
    </div>
  )
}