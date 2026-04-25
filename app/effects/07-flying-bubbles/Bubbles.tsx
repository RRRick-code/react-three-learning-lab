"use client"

import * as THREE from 'three'
import { MathUtils } from 'three'
import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Physics, useBox, useSphere } from '@react-three/cannon'
import { createBaseBubbles, resetBaseBubble } from './base-bubbles'
import {
  activateSpawnBubble,
  createSpawnBubbles,
  deactivateSpawnBubble,
  pickOpenSpawnIndices,
  updateSpawnScale,
} from './spawn-bubbles'
import {
  applyBubbleForce,
  BUBBLES_GROUP_Y_OFFSET,
  cloneBubbleData,
  SPAWN_BUBBLE_INTERVAL,
  SPAWN_BUBBLE_MAX_PER_TICK,
  type BubbleData,
  type BubblesProps,
  type SpawnBubbleData,
} from './bubble-types'

const WALL_THICKNESS = 2;

// 所有泡泡共用一份几何体和材质，再由 instancedMesh 批量渲染。
const bubbleGeometry = new THREE.SphereGeometry(1, 64, 64);
const bubbleMaterial = new THREE.MeshStandardMaterial({
  roughness: 1,
  color: '#f0f0f0',
});

type BoundaryProps = {
  args: [number, number, number];
  position: [number, number, number];
}

// 场景边界的碰撞体，泡泡碰到后会弹回，避免飞出视野太远。
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
  // 在场景中间深度取视口宽高，用来放置透明碰撞墙。
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

// 物理环境和每帧调度留在这里，具体生命周期规则放在同目录 helper 中。
function PhysicalBubbles({ speed = 1, count = 100, depth = 30 }: BubblesProps) {
  const { viewport, camera } = useThree();
  const groupRef = useRef<THREE.Group | null>(null);
  const spawnControlRef = useRef({ nextSpawnTime: 0 });
  const getViewport = (z: number) => viewport.getCurrentViewport(camera, [0, 0, -z]);

  // 初始化数据只生成一次；随机值固定后，后续动画只改 ref 里的运行时数据。
  const [initialBubbleData] = useState<BubbleData>(() => ({
    base: createBaseBubbles({ count, depth, getViewport }),
    spawn: createSpawnBubbles(),
  }));
  
  // cannon 初始化也会读取 initialBubbleData；运行时另拷贝一份，避免直接改初始化数据。
  const bubbleDataRef = useRef<BubbleData>({
    base: initialBubbleData.base.map(cloneBubbleData),
    spawn: initialBubbleData.spawn.map(cloneBubbleData),
  });
  const initialBubbleCount = initialBubbleData.base.length + initialBubbleData.spawn.length;

  // 根据初始数据生成物理碰撞体，cannon 内部会维护实际位置等数据，动画逻辑通过订阅这些数据来驱动。
  const [ref, api] = useSphere<THREE.InstancedMesh>(
    (index) => {
      // instancedMesh 的前半段是 base，后半段是 spawn，索引要映射回各自数组。
      const isBaseBubble = index < initialBubbleData.base.length;
      const bubble = isBaseBubble
        ? initialBubbleData.base[index]
        : initialBubbleData.spawn[index - initialBubbleData.base.length];
      const active = isBaseBubble ? true : (bubble as SpawnBubbleData).active;

      return {
        args: [bubble.scale],
        mass: bubble.scale * (isBaseBubble ? 0.55 : 0.45),
        position: bubble.position,
        angularDamping: 0.85,
        linearDamping: isBaseBubble ? 0.72 : 0.66,
        collisionResponse: active,
        collisionFilterMask: active ? -1 : 0,
      };
    },
    undefined,
    [initialBubbleData]
  );

  // 订阅 cannon 里每个泡泡的物理位置变化，同步回 ref 里的数据，供每帧动画逻辑使用。
  useEffect(() => {
    const bubbleData = bubbleDataRef.current;
    const unsubscribers = [
      ...bubbleData.base.map((bubble, index) =>
        api.at(index).position.subscribe(([x, y, z]) => {
          bubble.position[0] = x;
          bubble.position[1] = y;
          bubble.position[2] = z;
        })
      ),
      ...bubbleData.spawn.map((bubble, index) =>
        api.at(bubbleData.base.length + index).position.subscribe(([x, y, z]) => {
          bubble.position[0] = x;
          bubble.position[1] = y;
          bubble.position[2] = z;
        })
      ),
    ];

    // 初始同步显示尺寸；spawn 泡泡默认隐藏并睡眠，等下一次生成时再唤醒。
    bubbleData.base.forEach((bubble, index) => {
      api.at(index).scaleOverride([bubble.scale, bubble.scale, bubble.scale]);
    });

    bubbleData.spawn.forEach((bubble, index) => {
      const body = api.at(bubbleData.base.length + index);
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
      // 鼠标横向移动时，让整组泡泡轻微转向，增加景深和视差感。
      groupRef.current.rotation.y = MathUtils.damp(
        groupRef.current.rotation.y,
        (state.pointer.x * Math.PI) / 6,
        1,
        delta
      );
    }

    const { base, spawn } = bubbleDataRef.current;
    const elapsedTime = state.clock.elapsedTime;
    const spawnControl = spawnControlRef.current;

    if (elapsedTime >= spawnControl.nextSpawnTime) {
      // 每隔固定时间，从空闲 spawn 池里随机挑几个重新激活。
      for (const index of pickOpenSpawnIndices(spawn, SPAWN_BUBBLE_MAX_PER_TICK)) {
        activateSpawnBubble({
          bubble: spawn[index],
          body: api.at(base.length + index),
          elapsedTime,
          depth,
          speed,
          getViewport,
        });
      }

      spawnControl.nextSpawnTime = elapsedTime + SPAWN_BUBBLE_INTERVAL;
    }

    // base 泡泡一直存在：越界就重置，否则继续施加上升力。
    for (let index = 0; index < base.length; index += 1) {
      const bubble = base[index];
      const body = api.at(index);
      const [x, y, z] = bubble.position;

      if (y > bubble.exitLimit) {
        resetBaseBubble({ bubble, body, index, speed, getViewport });
        continue;
      }

      if (delta < 0.1) {
        applyBubbleForce({ bubble, body, forceMultiplier: 3.1, speed, x, z });
      }
    }

    // spawn 泡泡只处理 active 的实例：淡入、越界回收、继续上升。
    for (let index = 0; index < spawn.length; index += 1) {
      const bubble = spawn[index];

      if (!bubble.active) {
        continue;
      }

      const body = api.at(base.length + index);
      const [x, y, z] = bubble.position;

      updateSpawnScale(bubble, body, elapsedTime);

      if (y > bubble.exitLimit) {
        deactivateSpawnBubble(bubble, body);
        continue;
      }

      if (delta < 0.1) {
        applyBubbleForce({ bubble, body, forceMultiplier: 3.6, speed, x, z });
      }
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={ref}
        args={[bubbleGeometry, bubbleMaterial, initialBubbleCount]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

export function Bubbles(props: BubblesProps) {
  const depth = props.depth ?? 30;

  return (
    // gravity 设为 0，泡泡的上升完全由每帧 applyForce 控制。
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
