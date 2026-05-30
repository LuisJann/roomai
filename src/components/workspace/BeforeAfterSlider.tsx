"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

export interface ProposedChange {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  status: "replace" | "proposed" | "keep" | "evaluate";
}

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  afterFilter?: string;
  overlayImage?: string;
  proposedChanges?: ProposedChange[];
}

export function BeforeAfterSlider({ beforeImage, afterImage, afterFilter, overlayImage, proposedChanges = [] }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  return (
    <div 
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-ew-resize select-none shadow-md"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Immagine Dopo (Sfondo) e Layer Realtà Aumentata */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={afterImage}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ filter: afterFilter || "none" }}
        />
        {overlayImage && (
          <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40">
            <img
              src={overlayImage}
              alt="Contours overlay"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* AR Overlays per i mobili */}
        {proposedChanges.filter(c => c.status === "replace" || c.status === "proposed").map((change) => (
          <div 
            key={change.id}
            className="absolute border-2 border-blue-400 bg-blue-500/10 pointer-events-none"
            style={{ 
              left: `${change.x}%`, 
              top: `${change.y}%`, 
              width: `${change.w}%`, 
              height: `${change.h}%`,
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.5) inset"
            }}
          >
            <div className="absolute -top-6 left-0 bg-blue-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
              {change.status === "proposed" ? "[+] " : "[Sostituisci] "}{change.name}
            </div>
            {/* Ologramma Grid Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
          </div>
        ))}
      </div>
      
      {/* Immagine Prima (In Primo Piano) con clip-path per un taglio perfetto */}
      <img
        src={beforeImage}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      />

      {/* Maniglia Slider */}
      <motion.div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
        animate={{ scale: isDragging ? 1.05 : 1 }}
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-800">
          <GripVertical className="w-5 h-5" />
        </div>
      </motion.div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">Prima</div>
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">Dopo</div>
    </div>
  );
}