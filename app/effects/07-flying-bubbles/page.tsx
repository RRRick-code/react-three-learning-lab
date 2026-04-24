"use client"

import * as THREE from 'three'
import { MathUtils } from 'three'
import { useMemo, useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Instance, Instances, Environment, PositionMesh } from '@react-three/drei'
import { EffectComposer, N8AO, DepthOfField, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

const SPAWN_BUBBLE_COUNT = 10;
const SPAWN_BUBBLE_FADE_DURATION = 1.6;
const SPAWN_BUBBLE_INTERVAL = 1;
const SPAWN_BUBBLE_MAX_PER_TICK = 3;
const BUBBLES_Y_OFFSET = 2.5;

type BubbleProps = {
  index: number;
  z: number;
  speed: number;
}

type SpawnBubbleProps = {
  slot: number;
  depth: number;
  speed: number;
  controlRef: {
    current: SpawnBubbleControl;
  };
}

type SpawnBubbleControl = {
  activeSlots: boolean[];
  requests: number[];
  nextSpawnTime: number;
}

function Bubble({ index, z, speed }: BubbleProps) {
  const ref = useRef<PositionMesh | null>(null);
  const { viewport, camera } = useThree();
  const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -z]);

  const [initialData] = useState(() => {
    const minScale = 1;
    const maxScale = 3;
    // const scale = MathUtils.randFloat(minScale, maxScale);
    const scale = MathUtils.lerp(minScale, maxScale, Math.random() < 0.6 ? Math.pow(Math.random(), 3) * 0.5 : 1 - Math.pow(Math.random(), 3) * 0.5);
    const scaleSpeedFactor = MathUtils.mapLinear(scale, minScale, maxScale, 1.6, 0.45);
    return {
      x: MathUtils.randFloatSpread(width * 1.2),
      y: MathUtils.randFloatSpread(height * 2),
      scale,
      speedFactor: scaleSpeedFactor * MathUtils.randFloat(1, 1.2),
    };
  });
  const dataRef = useRef(initialData);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const data = dataRef.current;

    if (delta < 0.1) {
      data.y += delta * speed * data.speedFactor;
      ref.current.position.set(index === 0 ? 0 : data.x, data.y, -z);
    }
    const limit = height * (index === 0 ? 4 : 1);
    if (data.y > limit) {
      data.y = -limit;
    }
  });

  return <Instance ref={ref} scale={initialData.scale} />;
}

function SpawnBubble({ slot, depth, speed, controlRef }: SpawnBubbleProps) {
  const ref = useRef<PositionMesh | null>(null);
  const { viewport, camera } = useThree();

  const [initialData] = useState(() => {
    const minScale = 1;
    const maxScale = 1.3;
    const scale = MathUtils.randFloat(minScale, maxScale);

    return {
      active: false,
      birthTime: 0,
      x: 0,
      y: 0,
      z: 0,
      scale,
      exitLimit: 0,
      speedFactor: MathUtils.mapLinear(scale, 1, 3, 1.6, 0.45) * MathUtils.randFloat(1, 1.2),
    };
  });
  const dataRef = useRef(initialData);

  const reset = (elapsedTime: number) => {
    const data = dataRef.current;
    const minScale = 1;
    const maxScale = 1.3;
    const scale = MathUtils.randFloat(minScale, maxScale);
    const z = MathUtils.randFloat(0, depth * 0.45);
    const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -z]);

    data.active = true;
    data.birthTime = elapsedTime;
    data.x = MathUtils.randFloatSpread(width * 0.7);
    data.y = MathUtils.randFloat(-height * 0.5, height * 0.05) - BUBBLES_Y_OFFSET;
    data.z = z;
    data.scale = scale;
    data.exitLimit = height * 2;
    data.speedFactor = MathUtils.mapLinear(scale, 1, 3, 1.6, 0.45) * MathUtils.randFloat(1, 1.2);
    controlRef.current.activeSlots[slot] = true;
  };

  useFrame((state, delta) => {
    if (!ref.current) return;

    const data = dataRef.current;
    const elapsedTime = state.clock.elapsedTime;

    if (!data.active) {
      ref.current.scale.setScalar(0);

      const requestIndex = controlRef.current.requests.indexOf(slot);
      if (requestIndex !== -1) {
        controlRef.current.requests.splice(requestIndex, 1);
        reset(elapsedTime);
      }

      return;
    }

    if (delta < 0.1) {
      data.y += delta * speed * data.speedFactor;
    }

    const fade = MathUtils.clamp((elapsedTime - data.birthTime) / SPAWN_BUBBLE_FADE_DURATION, 0, 1);

    ref.current.position.set(data.x, data.y, -data.z);
    ref.current.scale.setScalar(data.scale * fade);

    if (data.y > data.exitLimit) {
      data.active = false;
      controlRef.current.activeSlots[slot] = false;
      ref.current.scale.setScalar(0);
    }
  });

  return <Instance ref={ref} scale={0} />;
}


function Bubbles({ speed = 3, count = 80, depth = 30 }) {
  const ref = useRef<THREE.Group | null>(null);
  const spawnSlots = useMemo(
    () => Array.from({ length: SPAWN_BUBBLE_COUNT }, (_, i) => i),
    []
  );
  const spawnControlRef = useRef<SpawnBubbleControl>({
    activeSlots: Array.from({ length: SPAWN_BUBBLE_COUNT }, () => false),
    requests: [],
    nextSpawnTime: 0,
  });

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = MathUtils.damp(
      ref.current.rotation.y,
      (state.pointer.x * Math.PI) / 6,
      1,
      delta
    );

    const control = spawnControlRef.current;
    const elapsedTime = state.clock.elapsedTime;

    if (elapsedTime >= control.nextSpawnTime) {
      const requestedSlots = new Set(control.requests);
      const openSlots = control.activeSlots
        .map((isActive, slot) => (!isActive && !requestedSlots.has(slot) ? slot : -1))
        .filter((slot) => slot !== -1);
      const spawnCount = MathUtils.randInt(0, Math.min(SPAWN_BUBBLE_MAX_PER_TICK, openSlots.length));

      for (let i = 0; i < spawnCount; i += 1) {
        const openSlotIndex = MathUtils.randInt(0, openSlots.length - 1);
        const [slot] = openSlots.splice(openSlotIndex, 1);
        control.requests.push(slot);
      }

      control.nextSpawnTime = elapsedTime + SPAWN_BUBBLE_INTERVAL;
    }
  });

  return (
    <group ref={ref}>
      <Instances limit={count + SPAWN_BUBBLE_COUNT} castShadow receiveShadow position={[0, BUBBLES_Y_OFFSET, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial roughness={1} color="#f0f0f0" />
        {Array.from({ length: count }, (_, i) => (
          <Bubble key={i} index={i} z={MathUtils.lerp(0, depth, i / count)} speed={speed} />
        ))}
        {spawnSlots.map((slot) => (
          <SpawnBubble
            key={`spawn-${slot}`}
            slot={slot}
            depth={depth}
            speed={speed}
            controlRef={spawnControlRef}
          />
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
      camera={{ position: [0, 0, 15], fov: 45 }}
      >
        <color attach="background" args={['#ffffff']} />
        <Environment preset="city" environmentIntensity={0.2} />
        <ambientLight intensity={3} />
        <pointLight position={[30, 30, 30]} intensity={120} castShadow decay={1} />
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
