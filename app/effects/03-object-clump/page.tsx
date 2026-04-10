"use client";

import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, GizmoHelper, GizmoViewport, OrbitControls, useTexture, Center } from '@react-three/drei'
import { Physics, useSphere } from '@react-three/cannon'
import { EffectComposer, N8AO, SMAA, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from "postprocessing"
import { useControls } from 'leva'

const rfs = THREE.MathUtils.randFloatSpread; // randFloatSpread(20) 会返回一个 -10 到 10 之间的随机数
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32); 
const baubleMaterial = new THREE.MeshStandardMaterial({ color: "white", roughness: 0.1, envMapIntensity: 1 });

function Clump({ mat = new THREE.Matrix4(), vec = new THREE.Vector3(), ...props }) {
  
  // useSphere 会在物理世界里创建球形刚体碰撞体；这里配合 instancedMesh，一次管理 40 个球。
  const [ref, api] = useSphere<THREE.InstancedMesh>(() => ({
    args: [1], 
    mass: 1, 
    angularDamping:0.1, 
    linearDamping: 0.65, 
    position: [rfs(20), rfs(20), rfs(20)]
  }));

  // useFrame 会在每一帧执行：读取每个实例球的位置，再给它一个朝向原点的力，让球群不断向中心聚拢。
  useFrame((state) => {
    for (let i = 0; i < 40; i++) {
      // Get current whereabouts of the instanced sphere
      ref.current.getMatrixAt(i, mat)
      // Normalize the position and multiply by a negative force.
      // This is enough to drive it towards the center-point.
      api.at(i).applyForce(vec.setFromMatrixPosition(mat).normalize().multiplyScalar(-10).toArray(), [0, 0, 0])
    }
  });

  return (
    <instancedMesh ref={ref} castShadow receiveShadow args={[sphereGeometry, baubleMaterial, 40]}>
    </instancedMesh>
  ); 
}

function Pointer() {
  // 获取当前视口尺寸，以便把鼠标坐标转换成 three.js 场景中的坐标
  const viewport = useThree((state) => state.viewport); 

  // 这里创建一个 Kinematic 刚体，它不会被别的物体推走，但可以通过主动移动去影响别的刚体。
  const [ref, api] = useSphere(() => ({ type: "Kinematic", args: [3], position: [0, 0, 0] })); 

  // 把鼠标的标准化坐标换算成当前视口中的世界坐标，并同步给这个刚体，让它跟着鼠标移动。
  useFrame((state) => api.position.set((state.mouse.x * viewport.width) / 2, (state.mouse.y * viewport.height) / 2, 0));
  
  return (
    <mesh ref={ref} scale={0.2}>
      <sphereGeometry />
      <meshBasicMaterial color={[4, 4, 4]} toneMapped={false} />
      <pointLight intensity={80} distance={10} />
    </mesh>
  )
}

export default function Page() {
  return (
    <div className="h-screen w-full">
      <Canvas shadows gl={{ antialias: false }} dpr={[1, 1.5]} camera={{ position: [0, 0, 20], fov: 35}}>
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
        <OrbitControls makeDefault />

        <ambientLight intensity={1.6} />
        <color attach="background" args={["#dfdfdf"]} />
        <spotLight intensity={3000} angle={0.2} penumbra={1} position={[30, 30, 30]} castShadow shadow-mapSize={[1024, 1024]} />
        
        <Physics gravity={[0, 3, 0]} iterations={10}>
          <Clump />
          <Pointer />
        </Physics>
        
        <Environment files="./assets/adamsbridge.hdr" />

        <EffectComposer enableNormalPass multisampling={0}>
          <N8AO color="black" aoRadius={2} intensity={1.8} aoSamples={6} denoiseSamples={4} />
          <Bloom luminanceThreshold={1} luminanceSmoothing={0.15} intensity={0.25} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
        </EffectComposer>

      </Canvas>
    </div>
  );
}
