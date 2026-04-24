"use client"

import * as THREE from 'three'
import { MathUtils } from 'three'
import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Physics, useBox, useSphere } from '@react-three/cannon'

const SPAWN_BUBBLE_COUNT = 10;
const SPAWN_BUBBLE_INTERVAL = 1;
const SPAWN_BUBBLE_MAX_PER_TICK = 3;
const SPAWN_BUBBLE_FADE_DURATION = 1.2;
const BUBBLES_GROUP_Y_OFFSET = 2.5;
const HIDDEN_POSITION: [number, number, number] = [9999, 9999, 9999];
const WALL_THICKNESS = 2;

const bubbleGeometry = new THREE.SphereGeometry(1, 64, 64);
const bubbleMaterial = new THREE.MeshStandardMaterial({
  roughness: 1,
  color: '#f0f0f0',
});

function getBubbleSpeedFactor(scale: number) {
  return MathUtils.mapLinear(scale, 1, 3, 1.2, 0.6) * MathUtils.randFloat(1, 1.2);
}

type BubbleKind = 'base' | 'spawn';

type BubbleBodyData = {
  kind: BubbleKind;
  index: number;
  scale: number;
  radius: number;
  z: number;
  speedFactor: number;
  active: boolean;
  birthTime: number;
  exitLimit: number;
  resetY: number;
  position: [number, number, number];
}

type BubblesProps = {
  speed?: number;
  count?: number;
  depth?: number;
}

type BoundaryProps = {
  args: [number, number, number];
  position: [number, number, number];
}

function createBubbleScale() {
  return MathUtils.lerp(
    1,
    3,
    Math.random() < 0.5
      ? Math.pow(Math.random(), 3) * 0.5
      : 1 - Math.pow(Math.random(), 3) * 0.5
  );
}

function cloneBubbleData(bubble: BubbleBodyData): BubbleBodyData {
  return {
    ...bubble,
    position: [...bubble.position],
  };
}

function Boundary({ args, position }: BoundaryProps) {
  const [ref] = useBox<THREE.Mesh>(() => ({
    args,
    position,
    type: 'Static',
  }));

  return (
    <mesh ref={ref} visible={false}>
      <boxGeometry args={args} />
      <meshBasicMaterial />
    </mesh>
  );
}

function BubbleBounds({ depth }: { depth: number }) {
  const { viewport, camera } = useThree();
  const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -depth * 0.5]);
  const xLimit = width * 0.68;
  const ySize = height * 7;
  const zSize = depth + WALL_THICKNESS * 2;
  const zCenter = -depth * 0.5;
  const yCenter = BUBBLES_GROUP_Y_OFFSET;

  return (
    <>
      <Boundary
        args={[WALL_THICKNESS, ySize, zSize]}
        position={[-xLimit - WALL_THICKNESS * 0.5, yCenter, zCenter]}
      />
      <Boundary
        args={[WALL_THICKNESS, ySize, zSize]}
        position={[xLimit + WALL_THICKNESS * 0.5, yCenter, zCenter]}
      />
      <Boundary
        args={[width * 1.5, ySize, WALL_THICKNESS]}
        position={[0, yCenter, WALL_THICKNESS * 0.5]}
      />
      <Boundary
        args={[width * 1.5, ySize, WALL_THICKNESS]}
        position={[0, yCenter, -depth - WALL_THICKNESS * 0.5]}
      />
    </>
  );
}

function PhysicalBubbles({ speed = 3, count = 80, depth = 30 }: BubblesProps) {
  const { viewport, camera } = useThree();
  const groupRef = useRef<THREE.Group | null>(null);
  const spawnControlRef = useRef({ nextSpawnTime: 0 });

  const [initialBubbleData] = useState<BubbleBodyData[]>(() => {
    const data: BubbleBodyData[] = [];

    for (let index = 0; index < count; index += 1) {
      const z = MathUtils.lerp(0, depth, index / count);
      const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -z]);
      const scale = createBubbleScale();
      const yLimit = height * (index === 0 ? 4 : 1);
      const y = MathUtils.randFloatSpread(height * 2) + BUBBLES_GROUP_Y_OFFSET;

      data.push({
        kind: 'base',
        index,
        scale,
        radius: scale,
        z,
        speedFactor: getBubbleSpeedFactor(scale),
        active: true,
        birthTime: 0,
        exitLimit: BUBBLES_GROUP_Y_OFFSET + yLimit,
        resetY: BUBBLES_GROUP_Y_OFFSET - yLimit,
        position: [index === 0 ? 0 : MathUtils.randFloatSpread(width * 1.2), y, -z],
      });
    }

    for (let index = 0; index < SPAWN_BUBBLE_COUNT; index += 1) {
      const scale = MathUtils.randFloat(1, 1.2);

      data.push({
        kind: 'spawn',
        index: count + index,
        scale,
        radius: scale,
        z: 0,
        speedFactor: getBubbleSpeedFactor(scale),
        active: false,
        birthTime: 0,
        exitLimit: 0,
        resetY: 0,
        position: [...HIDDEN_POSITION],
      });
    }

    return data;
  });
  const bubbleDataRef = useRef<BubbleBodyData[]>(initialBubbleData.map(cloneBubbleData));

  const [ref, api] = useSphere<THREE.InstancedMesh>(
    (index) => {
      const bubble = initialBubbleData[index];

      return {
        args: [bubble.radius],
        mass: bubble.radius * (bubble.kind === 'base' ? 0.55 : 0.45),
        position: bubble.position,
        angularDamping: 0.85,
        linearDamping: bubble.kind === 'base' ? 0.72 : 0.66,
        collisionResponse: bubble.active,
        collisionFilterMask: bubble.active ? -1 : 0,
      };
    },
    undefined,
    [initialBubbleData]
  );

  useEffect(() => {
    const bubbleData = bubbleDataRef.current;
    const unsubscribers = bubbleData.map((bubble, index) =>
      api.at(index).position.subscribe(([x, y, z]) => {
        bubble.position[0] = x;
        bubble.position[1] = y;
        bubble.position[2] = z;
      })
    );

    bubbleData.forEach((bubble, index) => {
      const body = api.at(index);
      if (bubble.active) {
        body.scaleOverride([bubble.scale, bubble.scale, bubble.scale]);
      } else {
        body.scaleOverride([0, 0, 0]);
        body.sleep();
      }
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [api]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = MathUtils.damp(
        groupRef.current.rotation.y,
        (state.pointer.x * Math.PI) / 12,
        1,
        delta
      );
    }

    const bubbleData = bubbleDataRef.current;
    const elapsedTime = state.clock.elapsedTime;
    const spawnControl = spawnControlRef.current;

    if (elapsedTime >= spawnControl.nextSpawnTime) {
      const openSpawnIndices: number[] = [];

      for (let index = count; index < bubbleData.length; index += 1) {
        if (!bubbleData[index].active) {
          openSpawnIndices.push(index);
        }
      }

      const spawnCount = MathUtils.randInt(
        0,
        Math.min(SPAWN_BUBBLE_MAX_PER_TICK, openSpawnIndices.length)
      );

      for (let i = 0; i < spawnCount; i += 1) {
        const openSlotIndex = MathUtils.randInt(0, openSpawnIndices.length - 1);
        const [index] = openSpawnIndices.splice(openSlotIndex, 1);
        const bubble = bubbleData[index];
        const z = MathUtils.randFloat(0, depth * 0.45);
        const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -z]);
        const x = MathUtils.randFloatSpread(width * 0.7);
        const y = MathUtils.randFloat(-height * 0.5, 0);
        const body = api.at(index);

        bubble.active = true;
        bubble.birthTime = elapsedTime;
        bubble.z = z;
        bubble.exitLimit = height * 2;
        bubble.resetY = y;
        bubble.speedFactor = getBubbleSpeedFactor(bubble.scale);
        bubble.position[0] = x;
        bubble.position[1] = y;
        bubble.position[2] = -z;

        body.position.set(x, y, -z);
        body.velocity.set(MathUtils.randFloatSpread(0.35), speed * 0.25, MathUtils.randFloatSpread(0.2));
        body.angularVelocity.set(MathUtils.randFloatSpread(0.3), MathUtils.randFloatSpread(0.3), MathUtils.randFloatSpread(0.3));
        body.collisionResponse.set(true);
        body.collisionFilterMask.set(-1);
        body.scaleOverride([0, 0, 0]);
        body.wakeUp();
      }

      spawnControl.nextSpawnTime = elapsedTime + SPAWN_BUBBLE_INTERVAL;
    }

    for (let index = 0; index < bubbleData.length; index += 1) {
      const bubble = bubbleData[index];
      const body = api.at(index);

      if (!bubble.active) {
        continue;
      }

      const [x, y, z] = bubble.position;

      if (bubble.kind === 'spawn') {
        const fade = MathUtils.clamp(
          (elapsedTime - bubble.birthTime) / SPAWN_BUBBLE_FADE_DURATION,
          0,
          1
        );
        const visualScale = bubble.scale * fade;

        body.scaleOverride([visualScale, visualScale, visualScale]);
      }

      if (y > bubble.exitLimit) {
        if (bubble.kind === 'spawn') {
          bubble.active = false;
          bubble.position[0] = HIDDEN_POSITION[0];
          bubble.position[1] = HIDDEN_POSITION[1];
          bubble.position[2] = HIDDEN_POSITION[2];

          body.position.set(...HIDDEN_POSITION);
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
          body.collisionResponse.set(false);
          body.collisionFilterMask.set(0);
          body.scaleOverride([0, 0, 0]);
          body.sleep();
        } else {
          const { width } = viewport.getCurrentViewport(camera, [0, 0, -bubble.z]);
          const nextX = bubble.index === 0 ? 0 : MathUtils.randFloatSpread(width * 1.2);

          bubble.position[0] = nextX;
          bubble.position[1] = bubble.resetY;
          bubble.position[2] = -bubble.z;

          body.position.set(nextX, bubble.resetY, -bubble.z);
          body.velocity.set(MathUtils.randFloatSpread(0.45), speed * 0.2, MathUtils.randFloatSpread(0.25));
          body.angularVelocity.set(MathUtils.randFloatSpread(0.4), MathUtils.randFloatSpread(0.4), MathUtils.randFloatSpread(0.4));
          body.scaleOverride([bubble.scale, bubble.scale, bubble.scale]);
          body.wakeUp();
        }

        continue;
      }

      if (delta < 0.1) {
        body.applyForce(
          [
            -x * 0.22,
            speed * bubble.speedFactor * (bubble.kind === 'spawn' ? 3.6 : 3.1),
            (-bubble.z - z) * 0.18,
          ],
          [0, 0, 0]
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={ref}
        args={[bubbleGeometry, bubbleMaterial, initialBubbleData.length]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

export function Bubbles(props: BubblesProps) {
  const depth = props.depth ?? 30;

  return (
    <Physics
      gravity={[0, 0, 0]}
      iterations={12}
      defaultContactMaterial={{
        friction: 0,
        restitution: 0.65,
        contactEquationStiffness: 1e6,
      }}
    >
      <PhysicalBubbles {...props} />
      <BubbleBounds depth={depth} />
    </Physics>
  );
}
