"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* ─── Floating Pixel Cars ─── */
function PixelCars() {
  const texture = useLoader(THREE.TextureLoader, "/pixel-car.png");
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const carsRef = useRef<THREE.Group>(null);

  const cars = useMemo(
    () => [
      { y: -8, z: -5, speed: 0.6, dir: 1, scale: 0.8 },
      { y: 2, z: -7, speed: 0.4, dir: -1, scale: 0.6 },
      { y: 10, z: -6, speed: 0.5, dir: 1, scale: 0.7 },
      { y: -3, z: -8, speed: 0.35, dir: -1, scale: 0.5 },
    ],
    []
  );

  useFrame((state) => {
    if (!carsRef.current) return;
    const time = state.clock.elapsedTime;

    carsRef.current.children.forEach((carMesh, i) => {
      const car = cars[i];
      const x = ((time * car.speed * car.dir + i * 8) % 28) - 14;
      carMesh.position.x = x;
      carMesh.rotation.z = car.dir < 0 ? Math.PI : 0;
    });
  });

  return (
    <group ref={carsRef}>
      {cars.map((car, i) => (
        <mesh key={i} position={[0, car.y, car.z]} scale={car.scale}>
          <planeGeometry args={[1.2, 2]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Floating Pixel Trees ─── */
function PixelTrees() {
  const texture = useLoader(THREE.TextureLoader, "/pixel-tree.png");
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const trees = useMemo(
    () => [
      { pos: [-9, -10, -6] as [number, number, number], scale: 1.0 },
      { pos: [8, -5, -8] as [number, number, number], scale: 0.8 },
      { pos: [-7, 6, -7] as [number, number, number], scale: 0.9 },
      { pos: [10, 12, -9] as [number, number, number], scale: 0.7 },
      { pos: [-10, 14, -8] as [number, number, number], scale: 0.85 },
      { pos: [6, -14, -7] as [number, number, number], scale: 0.75 },
    ],
    []
  );

  return (
    <>
      {trees.map((tree, i) => (
        <Float
          key={i}
          speed={0.3 + (i * 0.1) % 0.3}
          floatIntensity={0.6}
          rotationIntensity={0.02}
        >
          <mesh position={tree.pos} scale={tree.scale}>
            <planeGeometry args={[1.8, 2.2]} />
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

/* ─── Ambient gold particles ─── */
function GoldDust({ count = 50 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const colors = ["#C4A265", "#FFD700", "#4ADE80", "#A78BFA"];
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 36,
        (Math.random() - 0.5) * 6 - 4,
      ] as [number, number, number],
      scale: Math.random() * 0.04 + 0.01,
      speed: Math.random() * 0.2 + 0.05,
      offset: Math.random() * Math.PI * 2,
      color: new THREE.Color(colors[i % colors.length]),
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();

    particles.forEach((p, i) => {
      const twinkle = Math.sin(time * 1.5 + p.offset) * 0.5 + 0.5;
      dummy.position.set(
        p.position[0] + Math.sin(time * p.speed + i) * 0.4,
        p.position[1] + Math.cos(time * p.speed * 0.6 + i * 0.5) * 0.3,
        p.position[2]
      );
      dummy.scale.setScalar(p.scale * (0.3 + twinkle * 0.7));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#C4A265" transparent opacity={0.5} />
    </instancedMesh>
  );
}

/* ─── Road lines in background ─── */
function RoadLines() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.08) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {[...Array(5)].map((_, i) => (
        <Float key={i} speed={0.2} floatIntensity={0.5}>
          <mesh
            position={[
              (i % 2 === 0 ? -1 : 1) * (5 + i),
              -12 + i * 6,
              -14,
            ]}
            rotation={[0, 0, Math.PI * 0.1 * (i % 2 === 0 ? 1 : -1)]}
          >
            <boxGeometry args={[0.08, 4, 0.01]} />
            <meshBasicMaterial color="#C4A265" transparent opacity={0.08} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/* ─── Main Leaderboard Background ─── */
export default function LeaderboardBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ alpha: true, antialias: false }}
        style={{ background: "transparent" }}
      >
        <GoldDust count={50} />
        <PixelTrees />
        <PixelCars />
        <RoadLines />
      </Canvas>
    </div>
  );
}
