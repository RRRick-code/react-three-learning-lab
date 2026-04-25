"use client"

import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, N8AO, DepthOfField, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Bubbles } from './Bubbles'

export default function Page() {
  return (
    <div className="h-screen w-full">
      <Canvas shadows dpr={[1, 1.5]} 
      gl={{ antialias: false, toneMappingExposure: 1.2 }} 
      camera={{ position: [0, 0, 15], fov: 45 }}
      >
        <color attach="background" args={['#ffffff']} />
        <Environment preset="city" environmentIntensity={0.2} />
        <ambientLight intensity={3} />
        <pointLight position={[30, 30, 30]} intensity={120} castShadow color="white"decay={1} />
        <pointLight position={[-30, -50, 0]} color="white" intensity={80} decay={1} />
        <Bubbles />
        <EffectComposer>
          <N8AO color="black" intensity={2.8} aoRadius={18} />
          <DepthOfField
            focusDistance={12}
            focusRange={48}
            bokehScale={6}
            resolutionScale={0.5}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
