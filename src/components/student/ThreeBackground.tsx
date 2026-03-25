"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* ─── Floating Code Particles (data stream effect) ─── */
function FloatingCode({ count = 80 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const techColors = ["#C4A265", "#4ADE80", "#A78BFA", "#60A5FA", "#34D399"];
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 8 - 3,
      ] as [number, number, number],
      scale: Math.random() * 0.06 + 0.015,
      speed: Math.random() * 0.3 + 0.05,
      driftOffset: Math.random() * Math.PI * 2,
      color: new THREE.Color(techColors[i % techColors.length]),
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();

    particles.forEach((p, i) => {
      const twinkle = Math.sin(time * 1.5 + p.driftOffset) * 0.5 + 0.5;
      dummy.position.set(
        p.position[0] + Math.sin(time * p.speed * 0.5 + i) * 0.5,
        p.position[1] + ((time * p.speed * 0.8 + i * 3) % 40) - 20,
        p.position[2] + Math.sin(time * 0.2 + i) * 0.2
      );
      dummy.scale.setScalar(p.scale * (0.4 + twinkle * 0.6));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#C4A265" transparent opacity={0.6} />
    </instancedMesh>
  );
}

/* ─── Circuit Board Lines ─── */
function CircuitLines() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.05) * 0.02;
    }
  });

  const lines = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        y: -16 + i * 5,
        x: (i % 2 === 0 ? -1 : 1) * (4 + (i * 1.3) % 3),
        length: 1.5 + (i * 0.7) % 2.5,
        color: i % 2 === 0 ? "#C4A265" : "#4ADE80",
        angle: ((i * 0.4) % 1) * Math.PI * 0.3 * (i % 2 === 0 ? 1 : -1),
      })),
    []
  );

  return (
    <group ref={groupRef}>
      {lines.map((l, i) => (
        <Float key={i} speed={0.3} floatIntensity={0.8}>
          <mesh position={[l.x, l.y, -12]} rotation={[0, 0, l.angle]}>
            <cylinderGeometry args={[0.015, 0.015, l.length, 4]} />
            <meshBasicMaterial color={l.color} transparent opacity={0.15} />
          </mesh>
          {/* Node dot at end of circuit line */}
          <mesh position={[l.x, l.y + l.length * 0.5, -12]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color={l.color} transparent opacity={0.3} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/* ─── Low-Poly Trees ─── */
function Trees() {
  const trees = useMemo(
    () => [
      { pos: [-8, -12, -8] as [number, number, number], scale: 0.7 },
      { pos: [9, -8, -9] as [number, number, number], scale: 0.5 },
      { pos: [-10, 4, -10] as [number, number, number], scale: 0.8 },
      { pos: [7, 10, -7] as [number, number, number], scale: 0.6 },
      { pos: [-6, 16, -9] as [number, number, number], scale: 0.55 },
    ],
    []
  );

  return (
    <>
      {trees.map((tree, i) => (
        <Float key={i} speed={0.2} floatIntensity={0.4} rotationIntensity={0.05}>
          <group position={tree.pos} scale={tree.scale}>
            {/* Trunk */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.12, 0.8, 6]} />
              <meshBasicMaterial color="#5C3D2E" transparent opacity={0.4} />
            </mesh>
            {/* Foliage - bottom cone */}
            <mesh position={[0, 0.7, 0]}>
              <coneGeometry args={[0.5, 0.9, 6]} />
              <meshBasicMaterial color="#1B5E20" transparent opacity={0.3} />
            </mesh>
            {/* Foliage - top cone */}
            <mesh position={[0, 1.2, 0]}>
              <coneGeometry args={[0.35, 0.7, 6]} />
              <meshBasicMaterial color="#2E7D32" transparent opacity={0.3} />
            </mesh>
          </group>
        </Float>
      ))}
    </>
  );
}

/* ─── Moving Cars ─── */
function MovingCars() {
  const carsRef = useRef<THREE.Group>(null);

  const cars = useMemo(
    () => [
      { y: -6, z: -6, speed: 0.8, color: "#C4A265", dir: 1 },
      { y: 3, z: -8, speed: 0.5, color: "#60A5FA", dir: -1 },
      { y: 12, z: -7, speed: 0.65, color: "#F87171", dir: 1 },
    ],
    []
  );

  useFrame((state) => {
    if (!carsRef.current) return;
    const time = state.clock.elapsedTime;

    carsRef.current.children.forEach((carGroup, i) => {
      const car = cars[i];
      // Loop car across viewport (-14 to 14)
      const x = ((time * car.speed * car.dir + i * 9) % 28) - 14;
      carGroup.position.x = x;
    });
  });

  return (
    <group ref={carsRef}>
      {cars.map((car, i) => (
        <group key={i} position={[0, car.y, car.z]}>
          {/* Car body */}
          <mesh>
            <boxGeometry args={[0.6, 0.2, 0.3]} />
            <meshBasicMaterial color={car.color} transparent opacity={0.35} />
          </mesh>
          {/* Car cabin */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.3, 0.15, 0.25]} />
            <meshBasicMaterial color={car.color} transparent opacity={0.25} />
          </mesh>
          {/* Headlight */}
          <mesh position={[0.35 * car.dir, 0, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#FBBF24" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── AI Brain (wireframe icosahedron) ─── */
function AIBrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -15]}>
      <icosahedronGeometry args={[3, 1]} />
      <meshBasicMaterial
        color="#C4A265"
        wireframe
        transparent
        opacity={0.06}
      />
    </mesh>
  );
}

/* ─── Main Background Canvas ─── */
export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ alpha: true, antialias: false }}
        style={{ background: "transparent" }}
      >
        <FloatingCode count={80} />
        <CircuitLines />
        <Trees />
        <MovingCars />
        <AIBrain />
      </Canvas>
    </div>
  );
}
