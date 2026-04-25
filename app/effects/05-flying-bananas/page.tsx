"use client"

import * as THREE from 'three'
import { MathUtils } from 'three'
import { Suspense, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, Detailed, Environment } from '@react-three/drei'
import { EffectComposer, DepthOfField, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useControls } from "leva"

type BananaProps = {
  index: number;
  z: number;
  speed: number;
}

type BananasProps = {
  speed?: number;
  count?: number;
  depth?: number;
  easing?: (x: number) => number;
}

type BananaGLTF = {
  nodes: {
    banana_high: THREE.Mesh;
    banana_mid: THREE.Mesh;
    banana_low: THREE.Mesh;
  };
  materials: { skin: THREE.MeshStandardMaterial };
}

type BananaData = {
  y: number;
  x: number;
  spin: number;
  rX: number;
  rZ: number;
}

function Banana({ index, z, speed }: BananaProps) {
  const ref = useRef<THREE.LOD | null>(null);

  // 取出当前 three.js 视口和相机，用来计算某个深度平面上可见区域的宽高
  const { viewport, camera } = useThree();
  const { width, height } = viewport.getCurrentViewport(camera, [0, 0, -z]);

  // 从 glTF 模型里取出不同精度的香蕉几何体和共享材质
  const { nodes, materials } = useGLTF('assets/banana.glb') as unknown as BananaGLTF;

  // 用 useRef 维护逐帧可变状态：lazy 初始化，仅在第一次渲染时生成随机值
  const dataRef = useRef<BananaData | null>(null);
  if (dataRef.current === null) {
    dataRef.current = {
      // 初始纵向位置随机分布，避免所有香蕉从同一条水平线开始
      y: THREE.MathUtils.randFloatSpread(height * 2),
      // 横向偏移先存成一个较小系数，真正渲染时再乘上当前可视宽度
      x: THREE.MathUtils.randFloatSpread(2),
      // 自转速度随机化，让每根香蕉转得不完全一样
      spin: THREE.MathUtils.randFloat(8, 12),
      // X/Z 轴的初始旋转角，避免模型朝向过于整齐
      rX: THREE.MathUtils.randFloat(0, Math.PI),
      rZ: THREE.MathUtils.randFloat(0, Math.PI),
    };
  }
  const data = dataRef.current;

  useFrame ((state, delta) => {
    if (!ref.current) return;
    // 防止切后台后 delta 过大导致香蕉瞬移；正常帧率下再更新位置
    if ( delta < 0.1) {
      ref.current.position.set(index === 0 ? 0 : data.x * width, (data.y += delta * speed), -z);
    }
    // 每帧更新旋转：X/Z 持续自转，Y 轴用正弦制造左右摇摆的感觉
    ref.current.rotation.set(
      (data.rX += delta / data.spin), 
      Math.sin(index * 1000 + state.clock.elapsedTime / 10) * Math.PI, 
      (data.rZ += delta / data.spin)
    );
    // 飞出顶部后重置到底部，形成循环上升的无限队列
    if (data.y > height * (index === 0 ? 4 : 1)) {
      data.y = -(height * (index === 0 ? 4 : 1));
    }
  });

  return (
    <Detailed ref={ref} distances={[0, 60, 80]}>
      <mesh geometry={nodes.banana_high.geometry} material={materials.skin} material-emissive="#ff9f00" />
      <mesh geometry={nodes.banana_mid.geometry} material={materials.skin} material-emissive="#ff9f00" />
      <mesh geometry={nodes.banana_low.geometry} material={materials.skin} material-emissive="#ff9f00" />
    </Detailed>
  )
}

function Bananas({ speed = 1, count = 100, depth = 100, easing = (x) => Math.sqrt(1 - Math.pow(x - 1, 2)) }: BananasProps) {
  const ref = useRef<THREE.Group | null>(null);
  
  useFrame((state, delta) => {  // state: 当前渲染状态，包含鼠标位置、时间等信息；delta：距离上一帧的时间差
    if (!ref.current) return;
    ref.current.rotation.y = MathUtils.damp ( // damp 函数让数值平滑过渡到目标值，适合做动画
      ref.current.rotation.y, // 当前的旋转角度
      (state.pointer.x * Math.PI) / 36,  // 鼠标在画布上的横向位置，-1到1，乘 Math.PI/3 就是最大旋转角度的三分之一
      1, // 阻尼系数，数值越大转动越快，越小转动越慢
      delta // 时间差，确保动画在不同帧率下都能保持一致的速度
    );
    ref.current.rotation.x = MathUtils.damp (
      ref.current.rotation.x, 
      (-state.pointer.y * Math.PI) / 36, 
      1, 
      delta
    );

  });

  return (
    <group ref={ref}>
    {/* 批量创建香蕉，并用 easing 把它们分散到不同景深层，避免线性排布太死板 */}
    {Array.from(
      { length: count },
      (_, i) => <Banana key={i} index={i} z={Math.round(easing(i / count) * depth)} speed={speed} />
    )}
    </group>
  )
}

export default function Page() {
  const { speed, count, focalLength, bokehScale } = useControls({
    speed: { value: 1, min: 0.1, max: 5, step: 0.1 },
    count: { value: 100, min: 10, max: 200, step: 1 },
    focalLength: { value: 20, min: 1, max: 100, step: 1 },
    bokehScale: { value: 16, min: 1, max: 100, step: 1 }
  });
  
  return (
    <div className="h-screen w-full">
      <Canvas flat gl={{ antialias: false, toneMappingExposure: 1.2 }} dpr={[1, 1.5]} camera={{ position: [0, 0, 10], fov: 20, near: 0.01, far: 120 }}>
        <color attach="background" args={['#ffbf40']} />
        <spotLight position={[20, 30, 20]} penumbra={1} decay={1} intensity={300} color="orange" />
        <Suspense fallback={null}>
          <Bananas speed={speed} count={count} />
        </Suspense>
        <Environment preset="sunset" />
        <EffectComposer>
          <DepthOfField target={[0, 0, 60]} focalLength={focalLength} bokehScale={bokehScale} height={720} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
