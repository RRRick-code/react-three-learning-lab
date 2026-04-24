"use client"

import * as THREE from 'three'
import { MathUtils } from 'three'
import { useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Instance, Instances, Environment, PositionMesh } from '@react-three/drei'
import { EffectComposer, N8AO, DepthOfField, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useControls } from "leva"

type BubbleProps = {
  index: number;
  z: number;
  speed: number;
}

function Bubble({ index, z, speed }: BubbleProps) {
  const ref = useRef<PositionMesh | null>(null);
  const { viewport, camera } = useThree();
  const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -z]);

  // const [data] = useState(() => ({
  //   x: MathUtils.randFloatSpread(width * 1.2),
  //   y: MathUtils.randFloatSpread(height * 2),
  //   scale: MathUtils.randFloat(1, 3.5),
  //   speedFactor: MathUtils.mapLinear(z, 0, 30, 1.4, 0.5) * MathUtils.randFloat(0.5, 2),
  // }));

  const [data] = useState(() => {
    const minScale = 1;
    const maxScale = 3;
    // const scale = MathUtils.randFloat(minScale, maxScale);
    const scale = MathUtils.lerp(minScale, maxScale, Math.random() < 0.5 ? Math.pow(Math.random(), 3) * 0.5 : 1 - Math.pow(Math.random(), 3) * 0.5);
    const scaleSpeedFactor = MathUtils.mapLinear(scale, minScale, maxScale, 1.6, 0.45);
    return {
      x: MathUtils.randFloatSpread(width * 1.2),
      y: MathUtils.randFloatSpread(height * 2),
      scale,
      speedFactor: scaleSpeedFactor * MathUtils.randFloat(1, 1.2),
    };
  });

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (delta < 0.1) {
      data.y += delta * speed * data.speedFactor;
      ref.current.position.set(index === 0 ? 0 : data.x, data.y, -z);
    }
    const limit = height * (index === 0 ? 4 : 1);
    if (data.y > limit) {
      data.y = -limit;
    }
  });

  return <Instance ref={ref} scale={data.scale} />;
}


function Bubbles({ speed = 2, count = 80, depth = 30, easing = (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2))}) {
  const ref = useRef<THREE.Group | null>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = MathUtils.damp(
      ref.current.rotation.y,
      (state.pointer.x * Math.PI) / 6,
      1,
      delta
    );
  });

  return (
    <group ref={ref}>
      <Instances limit={count} castShadow receiveShadow position={[0, 2.5, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial roughness={1} color="#f0f0f0" />
        {Array.from({ length: count }, (_, i) => (
          <Bubble key={i} index={i} z={MathUtils.lerp(0, depth, i / count)} speed={speed} />
        ))}
      </Instances>
    </group>
  );
}


export default function Page() {
  return (
    <div className="h-screen w-full">
      <Canvas shadows dpr={[1, 2]} 
      gl={{ antialias: false, toneMappingExposure: 1.2 }} 
      camera={{ position: [0, 0, 12], fov: 60 }}
      >
        <color attach="background" args={['#ffffff']} />
        <Environment preset="city" environmentIntensity={0.2} />
        <ambientLight intensity={3} />
        <pointLight position={[30, 30, 30]} intensity={120} castShadow decay={1} />
        <pointLight position={[-30, -50, 0]} color="white" intensity={80} decay={1} />
        <Bubbles />
        <EffectComposer>
          <N8AO color="black" intensity={2.4} aoRadius={16} />
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