"use client"

import * as THREE from 'three'
import { MathUtils } from 'three'
import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Physics, useBox, useSphere, type WorkerApi } from '@react-three/cannon'

const SPAWN_BUBBLE_COUNT = 10;
const SPAWN_BUBBLE_INTERVAL = 1; 
const SPAWN_BUBBLE_MAX_PER_TICK = 3;
const SPAWN_BUBBLE_FADE_DURATION = 1.2;
const BUBBLES_GROUP_Y_OFFSET = 2.5;
// 空闲的 spawn 泡泡会被移动到很远的位置，并关闭碰撞和显示。
const HIDDEN_POSITION: [number, number, number] = [9999, 9999, 9999];
const WALL_THICKNESS = 2;

// 所有泡泡共用一份几何体和材质，再由 instancedMesh 批量渲染。
const bubbleGeometry = new THREE.SphereGeometry(1, 64, 64);
const bubbleMaterial = new THREE.MeshStandardMaterial({
  roughness: 1,
  color: '#f0f0f0',
});

// 大泡泡上升慢一点，小泡泡上升快一点，并加少量随机差异。
function getBubbleSpeedFactor(scale: number) {
  return MathUtils.mapLinear(scale, 1, 3, 1.2, 0.6) * MathUtils.randFloat(1, 1.2);
}

type BubblePosition = [number, number, number];

type BubbleBodyData = {
  scale: number;
  z: number;
  speedFactor: number;
  exitLimit: number;
  position: BubblePosition;
}

type BaseBubbleData = BubbleBodyData & {
  resetY: number;
}

type SpawnBubbleData = BubbleBodyData & {
  active: boolean;
  birthTime: number;
}

// base 是一直循环上升的主泡泡；spawn 是临时冒出的泡泡池。
type BubbleData = {
  base: BaseBubbleData[];
  spawn: SpawnBubbleData[];
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
  // 让尺寸更多落在接近 1 或 3 的两端，避免全部泡泡大小太平均。
  return MathUtils.lerp(1, 3, Math.random() < 0.4 ? Math.pow(Math.random(), 3) * 0.5 : 1 - Math.pow(Math.random(), 3) * 0.5);
}

// 克隆数据对象，保持引用不变但内部值可变，方便后续动画直接改 ref 里的数据。
function cloneBaseBubbleData(bubble: BaseBubbleData): BaseBubbleData {
  return {
    ...bubble,
    position: [...bubble.position],
  };
}

// 克隆数据对象，保持引用不变但内部值可变，方便后续动画直接改 ref 里的数据。
function cloneSpawnBubbleData(bubble: SpawnBubbleData): SpawnBubbleData {
  return {
    ...bubble,
    position: [...bubble.position],
  };
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

// 物理模拟和动画逻辑都在这里实现，保持组件结构清晰。
function PhysicalBubbles({ speed = 1, count = 100, depth = 30 }: BubblesProps) {
  const { viewport, camera } = useThree();
  const groupRef = useRef<THREE.Group | null>(null);
  const spawnControlRef = useRef({ nextSpawnTime: 0 });

  // 初始化数据只生成一次；随机值固定后，后续动画只改 ref 里的运行时数据。
  const [initialBubbleData] = useState<BubbleData>(() => {
    const base: BaseBubbleData[] = [];
    const spawn: SpawnBubbleData[] = [];

    // 根据 count 和 depth，平均分布在不同深度的层里，每层随机散布一定范围内的位置。
    for (let index = 0; index < count; index += 1) {
      const z = MathUtils.lerp(0, depth, index / count);
      const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -z]);
      const scale = createBubbleScale();
      const yLimit = height * (index === 0 ? 4 : 1);
      const y = MathUtils.randFloatSpread(height * 2) + BUBBLES_GROUP_Y_OFFSET;
      base.push({
        scale,
        z,
        speedFactor: getBubbleSpeedFactor(scale),
        exitLimit: BUBBLES_GROUP_Y_OFFSET + yLimit,
        resetY: BUBBLES_GROUP_Y_OFFSET - yLimit,
        position: [index === 0 ? 0 : MathUtils.randFloatSpread(width * 1.2), y, -z],
      });
    }

    // spawn 泡泡初始时都放在池里，等生成时再激活并移动到合适位置。
    for (let index = 0; index < SPAWN_BUBBLE_COUNT; index += 1) {
      const scale = MathUtils.randFloat(1, 1.2);
      spawn.push({
        scale,
        z: 0,
        speedFactor: getBubbleSpeedFactor(scale),
        active: false,
        birthTime: 0,
        exitLimit: 0,
        position: [...HIDDEN_POSITION],
      });
    }
    return { base, spawn };
  });
  
  // cannon 初始化也会读取 initialBubbleData；运行时另拷贝一份，避免直接改初始化数据。
  const bubbleDataRef = useRef<BubbleData>({
    base: initialBubbleData.base.map(cloneBaseBubbleData),
    spawn: initialBubbleData.spawn.map(cloneSpawnBubbleData),
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

  // spawn 泡泡生成时的初始化设置，和飞出顶部后的回收设置。
  function activateSpawnBubble(bubble: SpawnBubbleData, body: WorkerApi, elapsedTime: number) {
    const z = MathUtils.randFloat(0, depth * 0.45);
    const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -z]);
    const x = MathUtils.randFloatSpread(width * 0.7);
    const y = MathUtils.randFloat(-height * 0.5, 0);

    bubble.active = true;
    bubble.birthTime = elapsedTime;
    bubble.z = z;
    bubble.exitLimit = height * 2;
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

  // spawn 泡泡飞出顶部后回收到池里，暂停物理并隐藏。
  function deactivateSpawnBubble(bubble: SpawnBubbleData, body: WorkerApi) {
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
  }

  // base 泡泡飞出顶部后回到底部继续循环，第一个泡泡始终保持在中线附近。
  function resetBaseBubble(bubble: BaseBubbleData, body: WorkerApi, index: number) {
    const { width } = viewport.getCurrentViewport(camera, [0, 0, -bubble.z]);
    const nextX = index === 0 ? 0 : MathUtils.randFloatSpread(width * 1.2);

    bubble.position[0] = nextX;
    bubble.position[1] = bubble.resetY;
    bubble.position[2] = -bubble.z;

    body.position.set(nextX, bubble.resetY, -bubble.z);
    body.velocity.set(MathUtils.randFloatSpread(0.45), speed * 0.2, MathUtils.randFloatSpread(0.25));
    body.angularVelocity.set(MathUtils.randFloatSpread(0.4), MathUtils.randFloatSpread(0.4), MathUtils.randFloatSpread(0.4));
    body.scaleOverride([bubble.scale, bubble.scale, bubble.scale]);
    body.wakeUp();
  }
  
  // 施加上升力的同时，稍微把泡泡拉回自己的 x/z 目标范围，避免越飘越散。
  function applyBubbleForce(
    bubble: BubbleBodyData,
    body: WorkerApi,
    forceMultiplier: number,
    x: number,
    z: number
  ) {
    body.applyForce(
      [
        -x * 0.01, // 横向位置越远，拉回的力越大，但整体力度很小，保持自然漂浮感。
        speed * bubble.speedFactor * forceMultiplier, 
        (-bubble.z - z) * 0.18, 
      ],
      [0, 0, 0]
    );
  }

  // spawn 泡泡从无到有的淡入动画，配合上升力一起营造更自然的生成效果。
  function updateSpawnScale(bubble: SpawnBubbleData, body: WorkerApi, elapsedTime: number) {
    const fade = MathUtils.clamp((elapsedTime - bubble.birthTime) / SPAWN_BUBBLE_FADE_DURATION, 0, 1);
    const visualScale = bubble.scale * fade;
    body.scaleOverride([visualScale, visualScale, visualScale]); // 物理碰撞体的实际尺寸不变，保持稳定的碰撞表现；
  }

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
      const openSpawnIndices: number[] = [];

      for (let index = 0; index < spawn.length; index += 1) {
        if (!spawn[index].active) {
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

        activateSpawnBubble(spawn[index], api.at(base.length + index), elapsedTime);
      }

      spawnControl.nextSpawnTime = elapsedTime + SPAWN_BUBBLE_INTERVAL;
    }

    // base 泡泡一直存在：越界就重置，否则继续施加上升力。
    for (let index = 0; index < base.length; index += 1) {
      const bubble = base[index];
      const body = api.at(index);
      const [x, y, z] = bubble.position;

      if (y > bubble.exitLimit) {
        resetBaseBubble(bubble, body, index);
        continue;
      }

      if (delta < 0.1) {
        applyBubbleForce(bubble, body, 3.1, x, z);
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
        applyBubbleForce(bubble, body, 3.6, x, z);
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
