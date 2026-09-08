import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AdminSystemStats } from "./AdminConstellation";

interface AdminConstellationCanvasProps {
  stats: AdminSystemStats;
}

function ConstellationScene({
  stats,
  paused,
}: AdminConstellationCanvasProps & { paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = Math.min(
      220,
      48 +
        Math.round(stats.activeUsers / 8) +
        Math.round(stats.totalTransactions / 40) +
        Math.round(stats.activeSubscriptions / 4)
    );

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const ink = new THREE.Color("#334155");
    const gold = new THREE.Color("#eab308");

    for (let i = 0; i < count; i += 1) {
      const radius = 1.1 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.72;
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const mix = i % 5 === 0 ? 0.85 : Math.random() * 0.45;
      const color = ink.clone().lerp(gold, mix);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    nextGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return nextGeometry;
  }, [stats]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((state) => {
    if (paused || !groupRef.current || !pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.08;
    groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.12;
    pointsRef.current.rotation.z = t * 0.03;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <torusGeometry args={[1.55, 0.012, 16, 120]} />
        <meshBasicMaterial color="#eab308" transparent opacity={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0.4, 0.2]}>
        <torusGeometry args={[1.95, 0.008, 16, 140]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.12} />
      </mesh>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
    </group>
  );
}

const AdminConstellationCanvas: React.FC<AdminConstellationCanvasProps> = ({
  stats,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="h-full w-full">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        frameloop={visible ? "always" : "never"}
      >
        <ConstellationScene stats={stats} paused={!visible} />
      </Canvas>
    </div>
  );
};

export default AdminConstellationCanvas;
