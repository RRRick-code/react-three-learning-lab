"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { GizmoHelper, GizmoViewport, OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import * as THREE from "three";

type Vec3 = [number, number, number];
type SphereProps = ThreeElements["mesh"] & { position?: Vec3 };
type SpheresProps = { number?: number };

// 把 0~1 的线性变化改成更柔和的缓动曲线。
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

function Sphere({ position = [0, 0, 0], ...props }: SphereProps) {
  // ref 用来拿到这个 mesh 的 three.js 实例，方便在每一帧里直接修改它。
  const ref = useRef<Mesh | null>(null);

  // 给每个球一个固定的随机速度系数，避免组件重渲染时重新随机
  const factor = useMemo(() => (0.5 + Math.random()) * 1, []);

  useFrame((state) => {
    if (!ref.current) return;

    // elapsedTime 是场景运行到现在的秒数
    // 先用 sin 做周期运动，再用缓动函数把节奏变得更有“起伏感”
    const t = easeInOutCubic((1 + Math.sin(state.clock.getElapsedTime() * factor)) / 2);
    // 在初始位置基础上，让球上下移动
    ref.current.position.y = position[1] + t * 4;
    // 这里预留了缩放逻辑；当前乘以 0，所以视觉上不会拉伸
    ref.current.scale.y = 1 + t * 0;
  });

  return (
    <mesh ref={ref} position={position} {...props} castShadow receiveShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshLambertMaterial color="#ffffff" />
    </mesh>
  );
}

function Spheres({ number = 20 }: SpheresProps) {
  // 这个 ref 指向整组球的父级 group
  const ref = useRef<Group | null>(null);
  // 只在首次渲染时生成一批随机坐标，避免重渲染后球的位置跳来跳去
  const positions = useMemo<Vec3[]>(
    () =>
      Array.from({ length: number }, () => [
        3 - Math.random() * 6,
        Math.random() * 4,
        3 - Math.random() * 6,
      ]),
    [number]
  );

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.getElapsedTime() / 2) * Math.PI;
  });

  return (
    <group ref={ref}>
      {positions.map((pos, index) => (
        <Sphere key={index} position={pos} />
      ))}
    </group>
  );
}

export default function Page() {
  return (
    <div className="h-screen w-full">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [-5, 2, 10], fov: 60 }}>
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
        <axesHelper args={[3]} />
        <OrbitControls />
        {/* 远处加一点雾，让画面层次更柔和。 */}
        <fog attach="fog" args={["white", 0, 40]} />

        {/* 环境光：整体提亮，避免背光面完全变黑。 */}
        <ambientLight intensity={1} />

        {/* 主方向光：负责照明。 */}
        <directionalLight castShadow position={[3, 8, 6]} intensity={6} shadow-mapSize={1024} shadow-radius={10}>
          <orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10, 0.1, 50]} />
        </directionalLight>

        {/* 补光，让阴影区域保留一些细节。 */}
        <pointLight position={[-10, 0, -20]} color="white" intensity={100} decay={1} />
        <pointLight position={[0, -10, 0]} color="white" intensity={50} decay={1}/>

        {/* 把盒子、地面和球群整体往下移动。 */}
        <group position={[0, -3.5, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[4, 1, 1]} />
            <meshLambertMaterial />
          </mesh>

          {/* 这个平面本身几乎不可见，主要用来接收阴影。 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={0.3} />
          </mesh>
          <Spheres />
        </group>
      </Canvas>
    </div>
  );
}
