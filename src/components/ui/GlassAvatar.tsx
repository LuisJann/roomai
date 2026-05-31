import React from 'react';
import { Box, Palette, PenTool, Compass, Layers, Sparkles } from "lucide-react";

export const AVATARS_DATA = [
  { id: 1, icon: Box, color: "from-blue-500/50 to-cyan-500/20", glow: "rgba(59,130,246,0.8)", text: "text-blue-200" },
  { id: 2, icon: Palette, color: "from-purple-500/50 to-fuchsia-500/20", glow: "rgba(168,85,247,0.8)", text: "text-fuchsia-200" },
  { id: 3, icon: PenTool, color: "from-amber-500/50 to-orange-500/20", glow: "rgba(245,158,11,0.8)", text: "text-orange-200" },
  { id: 4, icon: Compass, color: "from-emerald-500/50 to-teal-500/20", glow: "rgba(16,185,129,0.8)", text: "text-emerald-200" },
  { id: 5, icon: Layers, color: "from-indigo-500/50 to-blue-500/20", glow: "rgba(99,102,241,0.8)", text: "text-indigo-200" },
  { id: 6, icon: Sparkles, color: "from-rose-500/50 to-pink-500/20", glow: "rgba(244,63,94,0.8)", text: "text-pink-200" },
];

interface GlassAvatarProps {
  id: number;
  className?: string;
  iconClassName?: string;
  isSelected?: boolean;
}

export function GlassAvatar({ id, className = "w-10 h-10", iconClassName = "w-5 h-5", isSelected = false }: GlassAvatarProps) {
  // If id is invalid, fallback to 1 (or random if needed, but 1 is safe)
  const safeId = (id >= 1 && id <= 6) ? id : Math.floor(Math.random() * 6) + 1;
  const avatar = AVATARS_DATA.find(a => a.id === safeId) || AVATARS_DATA[0];
  const Icon = avatar.icon;

  return (
    <div 
      className={`relative shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br ${avatar.color} backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3),0_4px_10px_rgba(0,0,0,0.4)] transition-all duration-500 ${className} ${isSelected ? 'scale-110 ring-2 ring-white/60 ring-offset-1 ring-offset-transparent' : ''}`}
      style={isSelected ? { boxShadow: `0 0 20px ${avatar.glow}, inset 0 1px 1px rgba(255,255,255,0.6)` } : {}}
    >
      <Icon 
        className={`${iconClassName} transition-all duration-500 ${isSelected ? avatar.text : 'text-white/80'}`} 
        strokeWidth={1.5}
        style={isSelected ? { filter: `drop-shadow(0px 0px 8px ${avatar.glow})` } : {}}
      />
    </div>
  );
}
