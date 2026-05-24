"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { Ruler, RefreshCw, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface FurnitureItem {
  id: string;
  name: string;
  type: string;
  x: number; // in meters (from center of room)
  y: number; // in meters (on floor)
  z: number; // in meters
  w: number; // width in meters
  h: number; // height in meters
  d: number; // depth in meters
  status: "keep" | "evaluate" | "replace" | "proposed";
}

interface RoomViewer3DProps {
  length: number; // in cm
  width: number;  // in cm
  height: number; // in cm
  doorsCount: number;
  windowsCount: number;
  furniture: FurnitureItem[];
}

export function RoomViewer3D({
  length = 450,
  width = 350,
  height = 270,
  doorsCount = 1,
  windowsCount = 2,
  furniture = []
}: RoomViewer3DProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-900 rounded-2xl flex flex-col items-center justify-center text-white/50 text-xs gap-3 border border-gray-800">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span>Inizializzazione vista 3D...</span>
      </div>
    );
  }

  // Convert dimensions from cm to meters for Three.js scaling
  const lenM = length / 100;
  const widM = width / 100;
  const heiM = height / 100;

  return (
    <div className="relative w-full aspect-[4/3] bg-gray-950 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md">
      
      {/* 3D R3F Canvas */}
      <Canvas camera={{ position: [lenM * 1.5, heiM * 1.8, widM * 1.5], fov: 50 }}>
        <color attach="background" args={["#0a0a0c"]} />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 15, 10]} intensity={1.5} />
        <directionalLight position={[-10, 10, -10]} intensity={0.5} />

        {/* Orbit Controls to navigate */}
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          minDistance={1.5} 
          maxDistance={25}
          maxPolarAngle={Math.PI / 2 - 0.05} // prevent going below floor
        />

        {/* Floor Grid */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[lenM * 1.8, widM * 1.8]} />
          <meshStandardMaterial color="#141418" roughness={0.9} />
        </mesh>
        
        {/* Metric grid markings */}
        <gridHelper args={[Math.max(lenM, widM) * 2, 20, "#334155", "#1e293b"]} position={[0, 0.005, 0]} />

        {/* Room Wireframe/Box bounds (Ceiling open to look inside) */}
        <mesh position={[0, heiM / 2, 0]}>
          <boxGeometry args={[lenM, heiM, widM]} />
          <meshBasicMaterial 
            color="#3b82f6" 
            wireframe 
            transparent 
            opacity={0.35} 
          />
        </mesh>

        {/* Floor panel representation inside room */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[lenM, widM]} />
          <meshStandardMaterial color="#27272a" roughness={0.7} />
        </mesh>

        {/* Door indicators on North Wall (Z = -widM/2) */}
        {doorsCount > 0 && Array.from({ length: doorsCount }).map((_, i) => {
          const spacing = lenM / (doorsCount + 1);
          const posX = -lenM / 2 + spacing * (i + 1);
          return (
            <mesh key={`door-${i}`} position={[posX, 1.05, -widM / 2]}>
              <boxGeometry args={[0.9, 2.1, 0.1]} />
              <meshStandardMaterial color="#854d0e" roughness={0.8} />
              <Html distanceFactor={4} position={[0, 1.2, 0]}>
                <span className="bg-amber-800 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest pointer-events-none">
                  Porta {i + 1}
                </span>
              </Html>
            </mesh>
          );
        })}

        {/* Window indicators on South Wall (Z = widM/2) */}
        {windowsCount > 0 && Array.from({ length: windowsCount }).map((_, i) => {
          const spacing = lenM / (windowsCount + 1);
          const posX = -lenM / 2 + spacing * (i + 1);
          return (
            <mesh key={`window-${i}`} position={[posX, 1.4, widM / 2]}>
              <boxGeometry args={[1.2, 1.0, 0.1]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} roughness={0.1} />
              <Html distanceFactor={4} position={[0, 0.7, 0]}>
                <span className="bg-sky-500 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest pointer-events-none">
                  Finestra {i + 1}
                </span>
              </Html>
            </mesh>
          );
        })}

        {/* Furniture Layout representation */}
        {furniture.map((item) => {
          // Color based on status
          let meshColor = "#3b82f6"; // Proposed: blue
          if (item.status === "keep") meshColor = "#22c55e"; // Keep: green
          if (item.status === "evaluate") meshColor = "#eab308"; // Evaluate: orange
          if (item.status === "replace") meshColor = "#ef4444"; // Replace: red

          // If status is replace, we render it semi-transparent or with warning wireframe
          const isReplaced = item.status === "replace";

          return (
            <mesh 
              key={item.id} 
              position={[item.x, item.y + item.h / 2, item.z]}
            >
              <boxGeometry args={[item.w, item.h, item.d]} />
              <meshStandardMaterial 
                color={meshColor} 
                roughness={0.6}
                transparent={isReplaced}
                opacity={isReplaced ? 0.25 : 0.85}
              />
              
              {/* Outer line outlines for highlight */}
              <lineSegments>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(item.w, item.h, item.d)]} />
                <lineBasicMaterial color={isReplaced ? "#7f1d1d" : "#ffffff"} linewidth={1} />
              </lineSegments>

              {/* HTML Floating text label */}
              <Html distanceFactor={5.5} position={[0, item.h / 2 + 0.25, 0]} center>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shadow-md pointer-events-none border text-white",
                  item.status === "keep" ? "bg-green-600 border-green-500" :
                  item.status === "evaluate" ? "bg-amber-600 border-amber-500" :
                  item.status === "replace" ? "bg-red-700/60 border-red-600/30 line-through" :
                  "bg-blue-600 border-blue-500"
                )}>
                  {item.name}
                </div>
              </Html>
            </mesh>
          );
        })}

      </Canvas>

      {/* Floating Instructions/Legend */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/85 backdrop-blur border border-white/10 rounded-xl p-3 flex flex-wrap justify-between items-center gap-3 text-xs text-white">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-blue-400" />
          <span>Dimensioni Stanza: <strong>{length}x{width}x{height} cm</strong></span>
        </div>
        
        {/* Colors Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-green-500 block" />
            <span>MANTIENI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 block" />
            <span>VALUTA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500 block" />
            <span>DA SOSTITUIRE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500 block animate-pulse" />
            <span>AI PROPOSTO</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur border border-white/10 px-2.5 py-1 rounded-lg text-[10px] text-white/80 font-bold flex items-center gap-1.5 pointer-events-none">
        <Layers className="w-3.5 h-3.5 text-blue-400" />
        RICOSTRUZIONE METRICA AI
      </div>
    </div>
  );
}

// Inline fallback since we can't import THREE globally without side-effects in Next.js Server Components
import * as THREE from "three";
