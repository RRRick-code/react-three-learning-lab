"use client";

import { MathUtils, InstancedMesh} from 'three'
import { useRef } from 'react'
import { Canvas, useFrame} from '@react-three/fiber'
import { Instances, Instance, type PositionMesh, Environment,  } from '@react-three/drei'
import { EffectComposer, N8AO, ToneMapping, DepthOfField } from '@react-three/postprocessing'
import { ToneMappingMode } from "postprocessing"

// 每个泡泡各自携带的一组随机参数，用来控制运动轨迹和速度
type BubbleData = {
  factor: number;
  speed: number;
  xFactor: number;
  yFactor: number;
  zFactor: number;
}
type BubbleProps = BubbleData;

// 预先生成 60 个泡泡的数据，并在模块初始化时固定下来，避免每次渲染都重新随机
const particles: BubbleData[] = Array.from({ length: 60 }, () => ({
  factor: MathUtils.randInt(20, 100),
  speed: MathUtils.randFloat(0.1, 0.5),
  xFactor: MathUtils.randFloatSpread(20),
  yFactor: MathUtils.randFloatSpread(10),
  zFactor: MathUtils.randFloatSpread(6),
}))

// 单个泡泡实例：负责在每一帧里更新自己的位置和缩放
function Bubble({ factor, speed, xFactor, yFactor, zFactor }: BubbleProps) {
  const ref = useRef<PositionMesh | null>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = factor + state.clock.elapsedTime * (speed / 2); // 用时间、速度和随机因子算出当前动画进度
    ref.current.scale.setScalar(Math.max(2.5, Math.cos(t) * 5)); // 让泡泡随时间呼吸式缩放，但保持最小尺寸不低于 2.5
    
    // 用多组 sin/cos 叠加出不规则的漂浮轨迹，再加上随机偏移把泡泡分散到不同位置
    ref.current.position.set(
      Math.cos(t) + Math.sin(t * 1) / 10 + xFactor + Math.cos((t / 5) * factor) + (Math.sin(t * 1) * factor) / 10,
      Math.sin(t) + Math.cos(t * 2) / 10 + yFactor + Math.sin((t / 5) * factor) + (Math.cos(t * 2) * factor) / 10,
      Math.sin(t) + Math.cos(t * 2) / 10 + zFactor + Math.cos((t / 5) * factor) + (Math.sin(t * 3) * factor) / 6
    )
  });
  return (
    <Instance ref={ref} />
  )
}

// 泡泡群容器：统一声明共享的几何体和材质，并控制整组的旋转
function Bubbles() {
  const ref = useRef<InstancedMesh | null>(null);

  // 根据鼠标的横向位置，让整组泡泡缓慢平滑地左右转动
  useFrame((state, delta) => {  // state: 当前渲染状态，包含鼠标位置、时间等信息；delta：距离上一帧的时间差
    if (!ref.current) return;
    ref.current.rotation.y = MathUtils.damp ( // damp 函数让数值平滑过渡到目标值，适合做动画
      ref.current.rotation.y, // 当前的旋转角度
      (-state.pointer.x * Math.PI) / 3,  // 鼠标在画布上的横向位置，-1到1，乘 Math.PI/3 就是最大旋转角度的三分之一
      2.75, // 阻尼系数，数值越大转动越快，越小转动越慢
      delta // 时间差，确保动画在不同帧率下都能保持一致的速度
    );
  });

  return (
    <Instances limit={particles.length} ref={ref} castShadow receiveShadow position={[0, 2.5, 0]}>
      <sphereGeometry args={[0.5, 64, 64]} />
      <meshStandardMaterial roughness={1} color="#f0f0f0" />
      
      {/* 为每一份随机数据创建一个泡泡实例；它们共享球体和材质，只各自更新变换信息 */}
      {particles.map((data, i) => ( // map 遍历 particles 数组，为每个元素创建一个 Bubble 组件实例，并传入对应的数据作为 props
        <Bubble key={i} {...data} />
      ))}
    </Instances>
  )
}

export default function Page() {
  return (
    <div className="h-screen w-full">
      <Canvas shadows dpr={[1, 2]} 
      gl={{ antialias: false, toneMappingExposure: 1.2 }} 
      camera={{ position: [0, 0, 20], fov: 50 }}
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
            focusDistance={16}
            focusRange={16}
            bokehScale={8}
            resolutionScale={0.5}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
