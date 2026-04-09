"use client";

import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, useTexture } from '@react-three/drei'
import { Physics, useSphere } from '@react-three/cannon'
import { EffectComposer, N8AO, SMAA, Bloom } from '@react-three/postprocessing'
import { useControls } from 'leva'

const rfs = THREE.MathUtils.randFloatSpread;
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const baubleMaterial = new THREE.MeshStandardMaterial({ color: "white", roughness: 0, envMapIntensity: 1 });

function Clump() {
  
}

export default function Page() {
  return (
    <div className="h-screen w-full">
      <Canvas shadows gl={{ antialias: false }} dpr={[1, 1.5]} camera={{ position: [0, 0, 20], fov: 35, near: 1, far: 40 }}>
        <ambientLight intensity={0.5} />
        <color attach="background" args={["#dfdfdf"]} />
        <Environment />
      </Canvas>
    </div>
  );
}