"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

const RoomViewer3D = dynamic(
  () => import("@/components/workspace/RoomViewer3D").then((mod) => mod.RoomViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest animate-pulse">Caricamento Motore 3D...</span>
      </div>
    )
  }
);
import { cn } from "@/lib/utils";
import { Layers, Upload, ArrowLeft, Maximize, Save, Plus, Menu, X, Smartphone, Boxes, Eye, EyeOff, HelpCircle, Move, RotateCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useProjectsStore } from "@/store/projectsStore";
import { set as idbSet } from "idb-keyval";
import { createClient } from "@/utils/supabase/client";
import { Cloud, AlertTriangle, Globe, Lightbulb, User } from "lucide-react";

const ObjectsMenuContent = () => {
  const nodeDimensions = useWorkspaceStore(state => state.nodeDimensions);
  const update3DObject = useWorkspaceStore(state => state.update3DObject);
  const roomNodes = useWorkspaceStore(state => state.roomNodes);
  const addedObjects = useWorkspaceStore(state => state.addedObjects);
  const nodeTransformations = useWorkspaceStore(state => state.nodeTransformations);
  const selectedObjectId = useWorkspaceStore(state => state.selectedObjectId);
  const setSelectedObjectId = useWorkspaceStore(state => state.setSelectedObjectId);
  const updateNodeTransformation = useWorkspaceStore(state => state.updateNodeTransformation);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  const allObjects = [
    ...roomNodes.map(n => ({ id: n.id, name: n.name, type: 'Stanza', isRoomNode: true, scale: [1, 1, 1] as number[] })),
    ...addedObjects.map(o => ({ id: o.id, name: o.id.split('_')[0], type: o.type, isRoomNode: false, scale: [...o.scale] as number[] }))
  ];

  // Priority Helper
  const getPriority = (obj: any) => {
    if (obj.id === 'floor' || obj.name.toLowerCase().includes('pavimento')) return 1;
    if (obj.isRoomNode) return 2; // Pareti
    return 3; // Mobili e altro
  };

  // Sort: visible first, hidden last, then by priority
  const sortedObjects = [...allObjects].sort((a, b) => {
    const aHidden = nodeTransformations[a.id]?.visible === false;
    const bHidden = nodeTransformations[b.id]?.visible === false;
    
    // 1. Visibilità (i visibili prima)
    if (aHidden && !bHidden) return 1;
    if (!aHidden && bHidden) return -1;
    
    // 2. Priorità logica (Pavimento -> Pareti -> Mobili)
    const prioA = getPriority(a);
    const prioB = getPriority(b);
    if (prioA !== prioB) return prioA - prioB;
    
    // 3. Ordine alfabetico
    return a.name.localeCompare(b.name);
  });

  const filteredObjects = sortedObjects.filter(obj => {
    const isHidden = nodeTransformations[obj.id]?.visible === false;
    if (filter === 'visible') return !isHidden;
    if (filter === 'hidden') return isHidden;
    return true;
  });

  const visibleCount = allObjects.filter(o => nodeTransformations[o.id]?.visible !== false).length;
  const hiddenCount = allObjects.length - visibleCount;

  const toggleVisibility = (e: React.MouseEvent, objId: string, currentlyHidden: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    updateNodeTransformation(objId, { visible: currentlyHidden ? true : false });
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Filter Tabs */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex gap-1 bg-black/20 rounded-2xl p-1">
          {([
            { key: 'all' as const, label: 'Tutti', count: allObjects.length },
            { key: 'visible' as const, label: 'Visibili', count: visibleCount },
            { key: 'hidden' as const, label: 'Nascosti', count: hiddenCount },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
                filter === tab.key
                  ? "bg-purple-500/30 text-purple-300 shadow-sm shadow-purple-500/20"
                  : "text-foreground/40 hover:text-foreground/70"
              )}
            >
              {tab.label}
              <span className={cn(
                "ml-1 text-[9px] font-mono",
                filter === tab.key ? "text-purple-400" : "opacity-50"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Object List */}
      <div className="px-4 pb-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
        <AnimatePresence>
          {filteredObjects.map((obj) => {
            const transform = nodeTransformations[obj.id];
            const isHidden = transform?.visible === false;
            const isSelected = selectedObjectId === obj.id;

            const currentScale = transform?.scale || obj.scale || [1, 1, 1];
            const baseDim = nodeDimensions[obj.id] || [1, 1, 1];
            const realDim = [
              baseDim[0] * currentScale[0] * 100,
              baseDim[1] * currentScale[1] * 100,
              baseDim[2] * currentScale[2] * 100
            ];

            const handleDimensionChange = (axis: number, valStr: string) => {
              const val = parseFloat(valStr);
              if (isNaN(val) || val <= 0) return;
              const newScale = [...currentScale] as [number, number, number];
              if (baseDim[axis] > 0) {
                newScale[axis] = (val / 100) / baseDim[axis];
              }
              if (obj.isRoomNode) {
                updateNodeTransformation(obj.id, { scale: newScale });
              } else {
                update3DObject(obj.id, { scale: newScale });
              }
            };

            return (
              <motion.div
                key={obj.id}
                layout="position"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {isHidden ? (
                  // ── Hidden: compact collapsed row ──
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.04] group hover:bg-white/[0.06] transition-all cursor-pointer"
                    onClick={() => setSelectedObjectId(obj.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <EyeOff className="w-3.5 h-3.5 text-red-400/70 shrink-0" />
                      <span className="text-[11px] text-foreground/30 truncate font-medium line-through decoration-red-400/40 max-w-[160px]">
                        {obj.name}
                      </span>
                      <span className="text-[9px] text-foreground/15 font-mono shrink-0">({obj.type})</span>
                    </div>
                    <button
                      onClick={(e) => toggleVisibility(e, obj.id, true)}
                      className="px-2.5 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/25 text-green-400 text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                      Mostra
                    </button>
                  </div>
                ) : (
                  // ── Visible: full expanded card ──
                <div
                  onClick={() => setSelectedObjectId(obj.id)}
                  className={cn(
                    "rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer select-none",
                    isSelected
                      ? "border-purple-500/50 shadow-lg shadow-purple-500/10 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent"
                      : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.1]"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-3.5 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        isSelected ? "bg-purple-400 shadow-sm shadow-purple-400/50" : "bg-blue-400/50"
                      )} />
                      <span className={cn(
                        "text-[13px] font-semibold truncate max-w-[160px]",
                        isSelected ? "text-purple-300" : "text-foreground/90"
                      )}>
                        {obj.name}
                      </span>
                      <span className="text-[9px] text-foreground/25 font-mono bg-white/[0.05] px-1.5 py-0.5 rounded-md shrink-0">
                        {obj.type}
                      </span>
                    </div>
                    <button
                      onClick={(e) => toggleVisibility(e, obj.id, false)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 shrink-0",
                        isSelected
                          ? "text-purple-400/70 hover:text-red-400 hover:bg-red-500/10"
                          : "text-foreground/25 hover:text-red-400 hover:bg-red-500/10"
                      )}
                      title="Nascondi oggetto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dimensions & Color */}
                  <div className="px-3.5 pb-3.5 flex flex-col gap-2">
                    <div className="flex gap-1.5">
                      {[
                        { label: 'L', axis: 0, color: 'text-red-400' },
                        { label: 'A', axis: 1, color: 'text-green-400' },
                        { label: 'P', axis: 2, color: 'text-blue-400' },
                      ].map((dim) => (
                        <div
                          key={dim.label}
                          className={cn(
                            "flex-1 rounded-xl p-2 flex flex-col items-center gap-0.5 border transition-colors",
                            isSelected
                              ? "bg-purple-500/[0.06] border-purple-500/15"
                              : "bg-white/[0.02] border-white/[0.04]"
                          )}
                        >
                          <span className={cn("text-[8px] font-bold uppercase tracking-[0.15em]", dim.color)}>
                            {dim.label}
                          </span>
                          <div className="flex items-baseline gap-0.5">
                            <input
                              type="number"
                              className="w-full bg-transparent text-center font-mono text-[12px] font-semibold outline-none text-foreground/80 focus:text-foreground transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={Math.round(realDim[dim.axis])}
                              min={1}
                              onChange={(e) => handleDimensionChange(dim.axis, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <span className="text-[7px] text-foreground/20 font-medium">cm</span>
                        </div>
                      ))}
                    </div>

                    {/* Colore (Stanze, Porte, Finestre, Luci) */}
                    {(obj.isRoomNode || ['door', 'window', 'light_point'].includes(obj.type)) && (
                      <div className="flex flex-col gap-2">
                        <div 
                          className={cn(
                            "rounded-xl p-2 flex items-center justify-between border transition-colors",
                            isSelected
                              ? "bg-purple-500/[0.06] border-purple-500/15"
                              : "bg-white/[0.02] border-white/[0.04]"
                          )}
                        >
                          <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-[0.1em]">
                            {obj.type === 'light_point' ? 'Colore Luce' : 'Colore'}
                          </span>
                        <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-lg">
                          <input 
                            type="color" 
                            value={transform?.color || "#f1f5f9"} 
                            onChange={(e) => updateNodeTransformation(obj.id, { color: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 p-0 border-0 rounded cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={transform?.color || "#f1f5f9"}
                            onChange={(e) => updateNodeTransformation(obj.id, { color: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-[55px] bg-transparent text-[10px] font-mono text-foreground/70 uppercase outline-none focus:text-foreground transition-colors"
                            maxLength={7}
                          />
                          </div>
                        </div>

                        {/* Presets Luce */}
                        {obj.type === 'light_point' && (
                          <div className="flex gap-1 mt-0.5">
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateNodeTransformation(obj.id, { color: '#ffb04f' }); }}
                              className="flex-1 bg-[#ffb04f]/20 hover:bg-[#ffb04f]/30 text-[#ffb04f] border border-[#ffb04f]/30 py-1.5 rounded-lg text-[9px] font-bold transition-colors"
                              title="< 3000 K: Toni accoglienti e rilassanti, ideali per la camera da letto o il soggiorno."
                            >
                              Calda
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateNodeTransformation(obj.id, { color: '#ffffff' }); }}
                              className="flex-1 bg-[#ffffff]/20 hover:bg-[#ffffff]/30 text-[#ffffff] border border-[#ffffff]/30 py-1.5 rounded-lg text-[9px] font-bold transition-colors"
                              title="3300 K - 5300 K: Luce neutra e brillante, perfetta per lo studio, la cucina o il bagno."
                            >
                              Naturale
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateNodeTransformation(obj.id, { color: '#b0d7ff' }); }}
                              className="flex-1 bg-[#b0d7ff]/20 hover:bg-[#b0d7ff]/30 text-[#b0d7ff] border border-[#b0d7ff]/30 py-1.5 rounded-lg text-[9px] font-bold transition-colors"
                              title="> 5300 K: Più vicina alle tonalità del blu, stimolante ma poco indicata per gli ambienti domestici."
                            >
                              Fredda
                            </button>
                          </div>
                        )}

                        {/* Intensità Luce */}
                        {obj.type === 'light_point' && (
                          <div 
                            className={cn(
                              "rounded-xl p-2 flex flex-col gap-2 border transition-colors",
                              isSelected
                                ? "bg-purple-500/[0.06] border-purple-500/15"
                                : "bg-white/[0.02] border-white/[0.04]"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-[0.1em]">Intensità Luce</span>
                              <span className="text-[10px] font-mono text-foreground/70 uppercase">{transform?.intensity ?? 1.5}</span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="5"
                              step="0.1"
                              value={transform?.intensity ?? 1.5}
                              onChange={(e) => updateNodeTransformation(obj.id, { intensity: parseFloat(e.target.value) })}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredObjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Boxes className="w-5 h-5 text-foreground/15" />
            </div>
            <div>
              <p className="text-[11px] text-foreground/30 font-medium">
                {filter === 'hidden' ? 'Nessun oggetto nascosto.' : filter === 'visible' ? 'Nessun oggetto visibile.' : 'Nessun oggetto nella scena.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};


const SidebarContent = ({ onClose }: { onClose: () => void }) => {
  const furnitureCatalog = useWorkspaceStore(state => state.furnitureCatalog);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="px-4 pt-3 pb-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">

        {/* ── Furniture Grid ── */}
        <div className="shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">Aggiungi alla scena</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {furnitureCatalog.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => {
                  useWorkspaceStore.getState().add3DObject({
                    id: Date.now().toString(),
                    type: item.type,
                    modelUrl: item.modelUrl,
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1]
                  });
                  onClose();
                }}
                className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] hover:border-blue-500/30 transition-all duration-200 aspect-[4/3] flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                  <span className="text-[10px] font-semibold text-white/90 block leading-tight">{item.name}</span>
                </div>
                <div className="absolute top-2 right-2 bg-blue-500 text-white w-6 h-6 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm font-bold shadow-lg shadow-blue-500/30 scale-75 group-hover:scale-100">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Upload GLB */}
        <div className="shrink-0">
          <label className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/20 transition-all cursor-pointer group">
            <Upload className="w-4 h-4 text-foreground/25 group-hover:text-blue-400 transition-colors" />
            <span className="text-[11px] font-medium text-foreground/30 group-hover:text-foreground/60 transition-colors">
              Carica modello .glb
            </span>
            <input
              type="file"
              accept=".glb,.gltf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const event = new CustomEvent('external-glb-upload', { detail: file });
                  window.dispatchEvent(event);
                  onClose();
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {/* ── Convertitore iPhone ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 25 }}
          className="shrink-0 rounded-2xl overflow-hidden border border-blue-500/15 bg-gradient-to-br from-blue-500/[0.08] via-purple-500/[0.04] to-transparent relative group"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/15 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-150 duration-500" />
          <div className="relative z-10 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[11px] font-bold text-blue-400 mb-0.5">Scansione iPhone?</h3>
                <p className="text-[9px] text-foreground/35 leading-relaxed">Converti il file .usdz in .glb per caricarlo qui.</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <a
              href="https://products.aspose.app/3d/conversion/usdz-to-glb"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] font-bold py-2 rounded-xl text-center transition-all hover:scale-[1.02] active:scale-95 border border-blue-500/20"
            >
              Converti Gratis ↗
            </a>
          </div>
        </motion.div>

        {/* ── Librerie Esterne ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 25 }}
          className="shrink-0"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 shrink-0" />
            <h2 className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em]">Risorse Esterne</h2>
          </div>
          <p className="text-[9px] text-foreground/25 mb-3 leading-relaxed">
            Scarica modelli 3D gratuiti. Per i file <strong className="text-foreground/40">.zip</strong>, convertili in <strong className="text-foreground/40">.glb</strong> con MakeGLB.
          </p>
          <div className="flex flex-col gap-1.5">
            <a
              href="https://polyhaven.com/models"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
            >
              <span className="text-[11px] font-semibold text-foreground/70 group-hover:text-foreground/90 transition-colors">Poly Haven</span>
              <span className="text-[9px] text-foreground/25 group-hover:text-blue-400 transition-colors">Modelli HD ↗</span>
            </a>
            <a
              href="https://sbtron.github.io/makeglb/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/10 hover:bg-blue-500/[0.08] hover:border-blue-500/20 transition-all group"
            >
              <span className="text-[11px] font-semibold text-blue-400/70 group-hover:text-blue-300 transition-colors">Converti .zip → .glb</span>
              <span className="text-[9px] text-blue-400/30 group-hover:text-blue-400 transition-colors">MakeGLB ↗</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};


// Aggiungiamo un piccolo componente per la preview 2D
function RoomPreview2D({ config }: { config: any }) {
  const { shape = 'rectangular', width, length, wingWidth, wingLength, chamferSize } = config;
  const w = parseFloat(width) || 4;
  const l = parseFloat(length) || 5;
  const ww = parseFloat(wingWidth) || w/2;
  const wl = parseFloat(wingLength) || l/2;
  const c = parseFloat(chamferSize) || Math.min(w, l)/3;

  let points: {x: number, y: number}[] = [];
  if (shape === 'rectangular' || shape === 'attic') {
    points = [ {x: 0, y: 0}, {x: w, y: 0}, {x: w, y: l}, {x: 0, y: l} ];
  } else if (shape === 'l-shape') {
    points = [ {x: 0, y: 0}, {x: w, y: 0}, {x: w, y: l - wl}, {x: ww, y: l - wl}, {x: ww, y: l}, {x: 0, y: l} ];
  } else if (shape === 'chamfered') {
    points = [ {x: 0, y: 0}, {x: w - c, y: 0}, {x: w, y: c}, {x: w, y: l}, {x: 0, y: l} ];
  } else if (shape === 't-shape') {
    points = [ {x: 0, y: 0}, {x: w, y: 0}, {x: w, y: wl}, {x: w/2 + ww/2, y: wl}, {x: w/2 + ww/2, y: l}, {x: w/2 - ww/2, y: l}, {x: w/2 - ww/2, y: wl}, {x: 0, y: wl} ];
  } else if (shape === 'u-shape') {
    const cw = parseFloat(config.cutoutWidth) || w/3;
    const cl = parseFloat(config.cutoutLength) || l/3;
    points = [ {x: 0, y: 0}, {x: w, y: 0}, {x: w, y: l}, {x: w/2 + cw/2, y: l}, {x: w/2 + cw/2, y: l - cl}, {x: w/2 - cw/2, y: l - cl}, {x: w/2 - cw/2, y: l}, {x: 0, y: l} ];
  } else if (shape === 'alcove') {
    const aw = parseFloat(config.alcoveWidth) || w/3;
    const ad = parseFloat(config.alcoveDepth) || l/4;
    const ao = parseFloat(config.alcoveOffset) || 0;
    points = [ {x: 0, y: 0}, {x: w/2 + ao - aw/2, y: 0}, {x: w/2 + ao - aw/2, y: -ad}, {x: w/2 + ao + aw/2, y: -ad}, {x: w/2 + ao + aw/2, y: 0}, {x: w, y: 0}, {x: w, y: l}, {x: 0, y: l} ];
  } else if (shape === 'double-pitch') {
    points = [ {x: 0, y: 0}, {x: w/2, y: 0}, {x: w, y: 0}, {x: w, y: l}, {x: w/2, y: l}, {x: 0, y: l} ];
  } else if (shape === 'bow-window') {
    const bw = parseFloat(config.bowWidth) || w/3;
    const bd = parseFloat(config.bowDepth) || l/4;
    points = [ {x: 0, y: 0}, {x: w, y: 0}, {x: w, y: l}, {x: w/2 + bw/2 + bd, y: l}, {x: w/2 + bw/2, y: l + bd}, {x: w/2 - bw/2, y: l + bd}, {x: w/2 - bw/2 - bd, y: l}, {x: 0, y: l} ];
  }

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const maxSpan = Math.max(spanX, spanY);
  const margin = maxSpan * 0.25; // increased margin for text
  const vbMinX = minX - margin;
  const vbMinY = minY - margin;
  const vbWidth = spanX + margin * 2;
  const vbHeight = spanY + margin * 2;
  
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const offset = maxSpan * 0.08;
  const fontSize = maxSpan * 0.06;
  const tColor = "#60a5fa"; // blue-400

  return (
    <div className="w-full aspect-video sm:aspect-[2/1] bg-black/20 rounded-xl border border-white/5 flex items-center justify-center p-2 mb-2">
      <svg 
        viewBox={`${vbMinX} ${vbMinY} ${vbWidth} ${vbHeight}`} 
        className="w-full h-full drop-shadow-md"
        style={{ overflow: 'visible' }}
      >
        <polygon 
          points={polygonPoints} 
          fill="#3b82f6" fillOpacity="0.2" 
          stroke="#3b82f6" strokeWidth={maxSpan * 0.015} strokeLinejoin="round" 
        />
        
        {/* Etichette Base */}
        <text x={w/2} y={-offset} fill={tColor} fontSize={fontSize} fontWeight="bold" textAnchor="middle">X (Largh.)</text>
        <text x={-offset} y={l/2} fill={tColor} fontSize={fontSize} fontWeight="bold" textAnchor="middle" transform={`rotate(-90, ${-offset}, ${l/2})`}>Z (Prof.)</text>

        {shape === 'attic' && (
          <>
            {/* Visual hint for the attic roof slope */}
            <line x1={0} y1={l/2} x2={w} y2={l/2} stroke="#3b82f6" strokeWidth={maxSpan * 0.01} strokeDasharray="0.1,0.1" opacity="0.5" />
            <text x={w/2} y={l/4} fill="#3b82f6" fontSize={fontSize} textAnchor="middle" opacity="0.8">Tetto Alto (Y)</text>
            <text x={w/2} y={l*0.75} fill="#3b82f6" fontSize={fontSize} textAnchor="middle" opacity="0.8">Ginocchiello</text>
          </>
        )}

        {shape === 'l-shape' && (
          <>
            <text x={ww/2} y={l + offset*1.2} fill={tColor} fontSize={fontSize} fontWeight="bold" textAnchor="middle">Largh. Nicchia</text>
            <text x={ww + offset*0.8} y={l - wl/2} fill={tColor} fontSize={fontSize} fontWeight="bold" textAnchor="middle" transform={`rotate(-90, ${ww + offset*0.8}, ${l - wl/2})`}>Prof. Nicchia</text>
          </>
        )}

        {shape === 'chamfered' && (
          <text x={w - c/2 + offset*1.5} y={c/2 - offset*0.5} fill={tColor} fontSize={fontSize} fontWeight="bold" textAnchor="middle">Taglio</text>
        )}
        {shape === 'double-pitch' && (
          <>
            <line x1={w/2} y1={0} x2={w/2} y2={l} stroke="#3b82f6" strokeWidth={maxSpan * 0.015} strokeDasharray="0.1,0.1" opacity="0.8" />
            <text x={w/2 + offset} y={l/2} fill={tColor} fontSize={fontSize} fontWeight="bold" textAnchor="start">Colmo</text>
          </>
        )}
      </svg>
    </div>
  );
}

export default function Editor3DPage() {
  // Config states
  const [length, setLength] = useState(450);
  const [width, setWidth] = useState(350);
  const [height, setHeight] = useState(270);
  const [doors, setDoors] = useState(1);
  const [windows, setWindows] = useState(2);
  
  const [fixRotation, setFixRotation] = useState(false);
  const [floorOffset, setFloorOffset] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isObjectsMenuOpen, setIsObjectsMenuOpen] = useState(false);
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState(false);
  const [menuHeight, setMenuHeight] = useState(560);
  
  const resetWorkspace = useWorkspaceStore(state => state.resetWorkspace);
  const undo = useWorkspaceStore(state => state.undo);
  const historyLength = useWorkspaceStore(state => state.history.length);
  const add3DObject = useWorkspaceStore(state => state.add3DObject);
  const update3DObject = useWorkspaceStore(state => state.update3DObject);
  const remove3DObject = useWorkspaceStore(state => state.remove3DObject);
  const transformMode = useWorkspaceStore(state => state.transformMode);
  const setTransformMode = useWorkspaceStore(state => state.setTransformMode);
  
  const nodeTransformations = useWorkspaceStore(state => state.nodeTransformations);
  const addedObjects = useWorkspaceStore(state => state.addedObjects);
  const roomNodes = useWorkspaceStore(state => state.roomNodes);
  const selectedObjectId = useWorkspaceStore(state => state.selectedObjectId);
  const setSelectedObjectId = useWorkspaceStore(state => state.setSelectedObjectId);
  const furnitureCatalog = useWorkspaceStore(state => state.furnitureCatalog);
  const updateNodeTransformation = useWorkspaceStore(state => state.updateNodeTransformation);
  const custom3DModelUrl = useWorkspaceStore(state => state.custom3DModelUrl);
  const setCustom3DModelUrl = useWorkspaceStore(state => state.setCustom3DModelUrl);
  const customRoomConfig = useWorkspaceStore(state => state.customRoomConfig);
  
  const saveProject = useProjectsStore(state => state.saveProject);
  const loadedProjectOwner = useWorkspaceStore(state => state.loadedProjectOwner);
  const setLoadedProjectOwner = useWorkspaceStore(state => state.setLoadedProjectOwner);

  const hiddenNodes = Object.keys(nodeTransformations).filter(key => nodeTransformations[key]?.visible === false);
  const selectedObject = addedObjects.find(o => o.id === selectedObjectId);
  const selectedRoomNode = roomNodes.find(n => n.id === selectedObjectId);
  const isAnythingSelected = !!(selectedObject || selectedRoomNode);

  useEffect(() => {
    if (selectedObjectId) {
      setIsMobileMenuExpanded(true);
    } else {
      setIsMobileMenuExpanded(false);
    }
  }, [selectedObjectId]);

  useEffect(() => {
    const updateHeight = () => setMenuHeight(Math.min(window.innerHeight - 140, 760));
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    // Load physical dimensions from local storage if available
    const savedConfig = localStorage.getItem('roomai-room-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.length) setLength(parsed.length);
      if (parsed.width) setWidth(parsed.width);
      if (parsed.height) setHeight(parsed.height);
      if (parsed.doors) setDoors(parsed.doors);
      if (parsed.windows) setWindows(parsed.windows);
    }
  }, []);

  useEffect(() => {
    // Gestione scorciatoie da tastiera (Undo)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const addNotification = useWorkspaceStore(state => state.addNotification);

  useEffect(() => {
    // Listener for global mobile menu
    const handleMobileMenuOpen = () => {
      setSelectedObjectId(null);
    };
    window.addEventListener('mobile-menu-opened', handleMobileMenuOpen);
    return () => window.removeEventListener('mobile-menu-opened', handleMobileMenuOpen);
  }, [setSelectedObjectId]);

  // Custom Dialog State
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'prompt' | 'confirm' | 'alert' | 'custom_room' | 'tutorial';
    title: string;
    message: React.ReactNode;
    inputValue?: string;
    showPublicToggle?: boolean;
    isPublic?: boolean;
    customRoomConfig?: { shape?: string; width: string; length: string; height: string; doorsCount: string; windowsCount: string; wingWidth?: string; wingLength?: string; chamferSize?: string; kneeHeight?: string; };
    onConfirm?: (val?: any, isPublic?: boolean) => void;
    onCancel?: () => void;
  }>({ isOpen: false, type: 'alert', title: '', message: '', inputValue: '', customRoomConfig: { shape: 'rectangular', width: '4', length: '5', height: '2.8', doorsCount: '1', windowsCount: '1', wingWidth: '2', wingLength: '2', chamferSize: '1.5', kneeHeight: '1.2' } });

  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const handleGLBUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
        setDialog({
          isOpen: true,
          type: 'alert',
          title: 'Formato non supportato',
          message: 'Puoi caricare solo file 3D in formato .glb o .gltf. Se hai un .zip, estrailo o convertilo prima!',
          onConfirm: closeDialog
        });
        e.target.value = '';
        return;
      }
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await idbSet(fileId, file);
      setCustom3DModelUrl(`idb://${fileId}`);
    }
    e.target.value = '';
  };

  const handleExternal3DUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
        setDialog({
          isOpen: true,
          type: 'alert',
          title: 'Formato non supportato',
          message: 'Puoi caricare solo file 3D in formato .glb o .gltf. Se hai un file diverso (es. .zip), convertilo prima.',
          onConfirm: closeDialog
        });
        e.target.value = '';
        return;
      }
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await idbSet(fileId, file);
      
      const objectId = Date.now().toString();
      add3DObject({
        id: objectId,
        type: 'custom_glb',
        modelUrl: `idb://${fileId}`,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      });
    }
    e.target.value = '';
  };

  const handleSaveProject = async () => {
    const defaultName = loadedProjectOwner ? `Copia da ${loadedProjectOwner}` : "Nuovo Progetto";
    
    let statsMessage = null;
    let warningMessage = null;

    // Fetch quota stats always
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let maxScans = 5;
      let isAdmin = false;
      let publicScansCount = 0;
      try {
        const { data: settingsData } = await supabase.from('app_settings').select('value').eq('key', 'max_public_scans').single();
        if (settingsData && settingsData.value) maxScans = parseInt(settingsData.value);
        const { data: roleData } = await supabase.from('users_roles').select('role').eq('id', user.id).single();
        if (roleData && roleData.role === 'admin') isAdmin = true;
        
        const { data: userProjects } = await supabase.from('projects').select('data').eq('user_id', user.id);
        publicScansCount = (userProjects || []).filter((p:any) => p.data?.social?.is_public === true && p.data?.workspaceData?.cloudModelUrl).length;
      } catch(e) {}

      const isProcedural = !custom3DModelUrl;

      statsMessage = (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-left">
          <Cloud className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-blue-300">Quota Scanner:</span> Hai pubblicato {publicScansCount} modelli 3D su {maxScans} disponibili.
            {isAdmin && <span className="block mt-1 text-xs text-blue-400/80">(Sei Admin, la quota per te non si applica)</span>}
            {isProcedural && <span className="block mt-1 text-xs text-blue-300/80 border-t border-blue-500/20 pt-1">(Questo è un modello matematico/procedurale, il salvataggio è illimitato e non consuma la quota dei file 3D)</span>}
          </div>
        </div>
      );

      // Warning only if it's a local scanner file
      if (custom3DModelUrl?.startsWith('idb://')) {
        warningMessage = (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-100">
              <span className="font-bold text-yellow-400">NOTA PER MODELLI SCANSIONATI:</span> Se scegli di salvarlo come "Privato", il file 3D rimarrà accessibile esclusivamente da questo dispositivo fisico per risparmiare spazio in cloud.
            </div>
          </div>
        );
      }
    }

    setDialog({
      isOpen: true,
      type: 'prompt',
      title: 'Salva Progetto',
      message: (
        <div className="flex flex-col gap-2">
          <p>Inserisci il nome del progetto da salvare (verrà creata una copia nel tuo account):</p>
          {warningMessage}
          {statsMessage}
        </div>
      ),
      inputValue: defaultName,
      showPublicToggle: true,
      isPublic: false,
      onConfirm: (val, isPublic) => {
        if (val) {
          let thumbnailDataUrl: string | undefined = undefined;
          try {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.5);
            }
          } catch (e) {
            console.error('Error capturing thumbnail:', e);
          }

          saveProject(val, {
            addedObjects,
            nodeTransformations,
            custom3DModelUrl,
            customRoomConfig
          }, isPublic, thumbnailDataUrl);
          addNotification({ message: 'Progetto salvato con successo nello Storico!', type: 'success' });
        }
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  const handleNewProject = () => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Nuovo Progetto',
      message: 'Vuoi davvero iniziare un nuovo progetto? Le modifiche non salvate andranno perse.',
      onConfirm: () => {
        resetWorkspace();
        setLoadedProjectOwner(null);
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  const getFurniture3DList = () => {
    return []; 
  };

  return (
    <div className="w-full h-full relative bg-background text-foreground flex flex-col overflow-hidden">
      
      {loadedProjectOwner && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 py-2 px-4 rounded-full flex items-center justify-center gap-2 mb-4 mx-4 shadow-lg backdrop-blur-sm text-sm">
          <User className="w-4 h-4 shrink-0" />
          <span className="text-center">Stai visualizzando il progetto di: <span className="underline">{loadedProjectOwner}</span>. Se salvi, verrà creata una COPIA.</span>
        </div>
      )}

      {/* Top Navigation / Toolbar */}
      <div className="glass-panel border-b-0 border-white/10 flex items-center justify-between px-4 py-2.5 z-40 shrink-0 gap-3">
        
        {/* Header Left */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-foreground">
            <Maximize className="w-4 h-4 text-blue-400" />
            <h1 className="text-xs font-bold tracking-widest uppercase text-foreground/90">Editor 3D</h1>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <button 
            onClick={() => {
              setSelectedObjectId(null);
              setDialog({ isOpen: true, type: 'tutorial', title: 'Guida all\'Editor 3D', message: 'Scopri come utilizzare tutti gli strumenti a tua disposizione per creare la tua stanza perfetta.' });
            }}
            className="flex items-center justify-center gap-1.5 w-7 h-7 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20 shrink-0"
          >
            <HelpCircle className="w-3 h-3" /> <span className="hidden sm:inline">Tutorial</span>
          </button>
        </div>
        
        {/* Right actions */}
        <div className="flex items-center gap-2 md:pr-0">
          <button 
            onClick={() => {
              setSelectedObjectId(null);
              handleNewProject();
            }} 
            className="hidden md:flex items-center gap-2 px-4 py-2 glass-button hover:bg-white/10 text-[11px] font-bold text-white transition-all rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" /> Nuovo
          </button>
          <button 
            onClick={undo} 
            disabled={historyLength === 0} 
            className="flex items-center justify-center gap-1.5 sm:gap-2 w-9 sm:w-auto px-0 sm:px-4 py-2 glass-button hover:bg-white/10 text-[11px] font-bold text-white disabled:opacity-30 disabled:pointer-events-none transition-all rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Annulla</span>
          </button>
          <button 
            onClick={handleSaveProject} 
            className="flex items-center justify-center gap-1.5 sm:gap-2 w-9 sm:w-auto px-0 sm:px-5 py-2 bg-white text-black hover:bg-gray-100 shadow-glow transition-all active:scale-95 anim-spring rounded-xl text-[11px] font-bold"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{loadedProjectOwner ? 'Duplica' : 'Salva'}</span>
          </button>
          {/* Placeholder to reserve space for the fixed hamburger menu on mobile */}
          <div className="w-[34px] md:hidden shrink-0" />
        </div>
      </div>

      {/* Main Layout Split */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Scene Graph Objects Menu */}
        <div className={cn("absolute top-6 left-6 flex justify-start", isObjectsMenuOpen ? "z-[60]" : "z-50")}>
          <motion.div
            animate={{
              width: isObjectsMenuOpen ? (typeof window !== 'undefined' ? Math.min(340, window.innerWidth - 48) : 340) : 56,
              height: isObjectsMenuOpen ? menuHeight : 56,
              borderRadius: isObjectsMenuOpen ? 24 : 28,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 26,
              mass: 0.8,
            }}
            className="glass-panel !bg-[#0A0A0B]/90 backdrop-blur-3xl border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.8)] overflow-hidden cursor-pointer"
            style={{ originX: 0, originY: 0 }}
            onClick={() => { 
              if (!isObjectsMenuOpen) { 
                setSelectedObjectId(null);
                setIsObjectsMenuOpen(true); 
                setIsMobileMenuOpen(false); 
              } 
            }}
          >
            {/* FAB Icon */}
            <AnimatePresence>
              {!isObjectsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Boxes className="w-6 h-6 text-purple-500" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Menu Content */}
            <AnimatePresence>
              {isObjectsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-purple-500" />
                      Oggetti Scena
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsObjectsMenuOpen(false); }} 
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors bg-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ObjectsMenuContent />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Universal Floating Catalog Button & Expanded Menu */}
        <div className={cn("absolute top-6 right-6 flex justify-end", isMobileMenuOpen ? "z-[60]" : "z-50")}>
          <motion.div
            animate={{
              width: isMobileMenuOpen ? (typeof window !== 'undefined' ? Math.min(340, window.innerWidth - 48) : 340) : 56,
              height: isMobileMenuOpen ? menuHeight : 56,
              borderRadius: isMobileMenuOpen ? 24 : 28,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 26,
              mass: 0.8,
            }}
            className="glass-panel !bg-[#0A0A0B]/90 backdrop-blur-3xl border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.8)] overflow-hidden cursor-pointer"
            style={{ originX: 1, originY: 0 }}
            onClick={() => { 
              if (!isMobileMenuOpen) { 
                setSelectedObjectId(null);
                setIsMobileMenuOpen(true); 
                setIsObjectsMenuOpen(false); 
              } 
            }}
          >
            {/* FAB Icon — visible when collapsed */}
            <AnimatePresence>
              {!isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Layers className="w-6 h-6 text-blue-500" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Menu Content — visible when expanded */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      Libreria Arredi
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} 
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors bg-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* 3D Canvas Area (Full screen on mobile) */}
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-950">
          <RoomViewer3D 
            length={length}
            width={width}
            height={height}
            doorsCount={doors}
            windowsCount={windows}
            furniture={getFurniture3DList()}
            customModelUrl={custom3DModelUrl}
            fixRotation={fixRotation}
            floorOffset={floorOffset}
          />

          {/* FLOATING BOTTOM BAR (UNIVERSAL) */}
          <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[700px] z-50">
            <div className="glass-panel rounded-[32px] p-4 flex flex-col gap-3">
              
              {/* Row 0: Legenda Assi */}
              <div className="flex items-center justify-between px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_5px_rgba(239,68,68,0.6)]" />
                  <span className="text-[9px] font-bold text-foreground/80 uppercase tracking-widest">Larg (X)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_5px_rgba(34,197,94,0.6)]" />
                  <span className="text-[9px] font-bold text-foreground/80 uppercase tracking-widest">Alt (Y)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_5px_rgba(59,130,246,0.6)]" />
                  <span className="text-[9px] font-bold text-foreground/80 uppercase tracking-widest">Prof (Z)</span>
                </div>
              </div>
              
              {/* Row 1: Floor Height */}
              <div className="flex items-center gap-2 bg-black/20 px-4 py-2.5 rounded-full border border-white/5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pavim:</label>
                <input 
                  type="range" min="-2" max="2" step="0.01" value={floorOffset} 
                  onChange={(e) => setFloorOffset(Number(e.target.value))}
                  className="flex-1 accent-blue-500 h-1.5 bg-secondary rounded-full appearance-none"
                />
                <span className="text-[10px] font-mono text-blue-500 font-bold w-6 text-right">{(floorOffset * 100).toFixed(0)}</span>
              </div>

              <div className="flex items-center gap-2 w-full overflow-x-auto pb-1 -mb-1 custom-scrollbar">

                {/* Toolbar Buttons */}
                <button 
                  onClick={() => {
                    setSelectedObjectId(null);
                    handleNewProject();
                  }} 
                  className="flex md:hidden shrink-0 min-w-[80px] glass-button py-2.5 text-[10px] font-bold items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuovo</span>
                </button>

                {/* 1. Carica Stanza */}
                <label className="flex-1 shrink-0 min-w-[90px] bg-white text-black py-2.5 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-glow whitespace-nowrap anim-spring" onClick={() => setSelectedObjectId(null)}>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carica</span>
                  <input type="file" accept=".glb,.gltf,.obj" className="hidden" onChange={handleGLBUpload} />
                </label>

                {/* 2. Crea Stanza */}
                <button 
                  onClick={() => {
                    setSelectedObjectId(null);
                    setDialog({ 
                      isOpen: true, 
                      type: 'custom_room', 
                      title: 'Crea Stanza Manuale', 
                      message: 'Inserisci le dimensioni in metri per generare una stanza procedurale (pavimento + 4 pareti).',
                      customRoomConfig: { shape: 'rectangular', width: '4', length: '5', height: '2.8', doorsCount: '1', windowsCount: '1', wingWidth: '2', wingLength: '2', chamferSize: '1.5', kneeHeight: '1.2' },
                      onConfirm: (config) => {
                        const w = parseFloat(config.width) || 4;
                        const l = parseFloat(config.length) || 5;
                        const h = parseFloat(config.height) || 2.8;
                        const d = parseInt(config.doorsCount) || 0;
                        const wind = parseInt(config.windowsCount) || 0;
                        
                        const shape = config.shape || 'rectangular';
                        const wingWidth = parseFloat(config.wingWidth) || w/2;
                        const wingLength = parseFloat(config.wingLength) || l/2;
                        const chamferSize = parseFloat(config.chamferSize) || Math.min(w, l)/3;
                        const kneeHeight = parseFloat(config.kneeHeight) || 1.2;
                        
                        const store = useWorkspaceStore.getState();
                        store.setCustomRoomConfig({ shape: shape as any, width: w, length: l, height: h, doorsCount: d, windowsCount: wind, wingWidth, wingLength, chamferSize, kneeHeight });
                        
                        for(let i=0; i<d; i++) {
                          store.add3DObject({
                            id: `door_${Date.now()}_${i}`,
                            type: 'door',
                            position: [-w/2 + 0.1, 0, 0],
                            rotation: [0, Math.PI / 2, 0],
                            scale: [1, 1, 1]
                          });
                        }
                        for(let i=0; i<wind; i++) {
                          store.add3DObject({
                            id: `window_${Date.now()}_${i}`,
                            type: 'window',
                            position: [-w/2 + 0.1, 1.0, 0],
                            rotation: [0, Math.PI / 2, 0],
                            scale: [1, 1, 1]
                          });
                        }

                        setDialog(prev => ({...prev, isOpen: false}));
                      },
                      onCancel: () => setDialog(prev => ({...prev, isOpen: false}))
                    })
                  }}
                  className="flex-1 shrink-0 min-w-[90px] glass-button py-2.5 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap hover:text-emerald-400"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Stanza</span>
                </button>

                {/* 3. Mobili */}
                <label className="flex-1 shrink-0 min-w-[80px] glass-button py-2.5 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap hover:text-blue-400" onClick={() => setSelectedObjectId(null)}>
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mobili</span>
                  <input type="file" accept=".glb,.gltf,.obj" className="hidden" onChange={handleExternal3DUpload} />
                </label>

                {/* 4. Luce */}
                <button 
                  onClick={() => {
                    setSelectedObjectId(null);
                    const objectId = `light_${Date.now()}`;
                    add3DObject({
                      id: objectId,
                      type: 'light_point',
                      position: [0, 2, 0],
                      rotation: [0, 0, 0],
                      scale: [1, 1, 1]
                    });
                  }}
                  className="flex-1 shrink-0 min-w-[80px] glass-button py-2.5 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap hover:text-amber-400"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Luce</span>
                </button>


                {/* 6. App Scanner */}
                <button 
                  onClick={() => {
                    setSelectedObjectId(null);
                    setDialog({ isOpen: true, type: 'alert', title: 'Scanner 3D Gratuito 📱', message: 'Per creare un modello 3D perfetto della tua stanza (gratis), ti consigliamo di usare l\'app "Polycam" o "RealityScan" sul tuo telefono. \n\n1. Scansiona la stanza con l\'app.\n2. Esporta il modello in formato .GLB.\n3. Caricalo qui cliccando il tasto blu "Carica".', onConfirm: () => setDialog(prev => ({...prev, isOpen: false})), onCancel: () => setDialog(prev => ({...prev, isOpen: false})) });
                  }}
                  className="flex-1 shrink-0 min-w-[90px] glass-button py-2.5 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap hover:text-purple-400 rounded-full anim-spring hover:scale-105 active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Scanner</span>
                </button>

              </div>

            </div>
          </div>
        </div>
        
      </div>

      {/* Custom Dialog Overlay */}
      <AnimatePresence>
        {dialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dialog.onCancel}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-[92vw] max-w-[360px] sm:max-w-sm bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold tracking-tight mb-4">{dialog.title}</h3>
                <div className="text-foreground/80 text-sm mb-6 leading-relaxed">
                  {dialog.message}
                </div>
                
                {dialog.type === 'prompt' && (
                  <div className="mb-6">
                    <input 
                      type="text" 
                      value={dialog.inputValue}
                      onChange={(e) => setDialog(prev => ({ ...prev, inputValue: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
                      placeholder="Scrivi qui..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') dialog.onConfirm?.(dialog.inputValue, dialog.isPublic);
                        if (e.key === 'Escape') dialog.onCancel?.();
                      }}
                    />
                    {dialog.showPublicToggle && (
                      <label className="mb-6 p-4 rounded-xl bg-foreground/5 border border-white/5 flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="flex items-center text-sm font-bold text-foreground">
                            Rendi Pubblico <Globe className="w-4 h-4 ml-1.5 text-blue-400" />
                          </span>
                          <p className="text-xs text-foreground/50 mt-1 pr-4">Permetti ad altri designer di esplorare questo progetto.</p>
                        </div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={!!dialog.isPublic}
                            onChange={(e) => setDialog(prev => ({ ...prev, isPublic: e.target.checked }))}
                          />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${dialog.isPublic ? 'bg-blue-500' : 'bg-foreground/20'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${dialog.isPublic ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {dialog.type === 'tutorial' && (
                  <div className="space-y-6 text-sm text-foreground/80 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-4 text-left">
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-base">Creare o Caricare una Stanza</h4>
                      <p>Usa i pulsanti in basso a sinistra per iniziare:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><Boxes className="w-3 h-3 inline mr-1 text-emerald-500" /><b>Crea Stanza:</b> Genera una stanza vuota definendo la forma (Rettangolare, a L, Smussata o Mansarda) e le dimensioni tramite i campi e la comoda <b>Preview 2D</b>. Inserisci anche il numero di porte o finestre.</li>
                        <li><Upload className="w-3 h-3 inline mr-1 text-blue-500" /><b>Carica Stanza:</b> Importa un modello 3D completo della tua stanza in formato <code>.glb</code> o <code>.gltf</code> (es. creato con un'app scanner 3D sul telefono).</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-base">Aggiungere Mobili e Luci</h4>
                      <p>Usa il menu in basso al centro:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><Plus className="w-3 h-3 inline mr-1 text-blue-500" /><b>Mobili:</b> Apri il catalogo per aggiungere arredi o elementi strutturali.</li>
                        <li className="flex gap-2 items-start"><Lightbulb className="w-4 h-4 mt-0.5 text-yellow-400 shrink-0" /> <span><b>Luce:</b> Aggiungi punti luce alla scena. Puoi regolarne l'intensità e il colore (calda, naturale, fredda) dalla barra laterale.</span></li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-base">Interagire con gli Oggetti</h4>
                      <p>Seleziona un oggetto per far apparire il <b>menu fluttuante in basso a destra</b>, che contiene questi controlli:</p>
                      <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><Move className="w-3.5 h-3.5 inline mr-1 text-blue-500" /><b>Sposta:</b> Attiva le frecce direzionali per muovere l'oggetto nello spazio 3D.</li>
                        <li><RotateCw className="w-3.5 h-3.5 inline mr-1 text-blue-500" /><b>Ruota:</b> Appaiono le sfere di rotazione. Troverai anche i tastini extra ↺ e ↻ per ruotare di precisione a scatti di 15°.</li>
                        <li><Maximize className="w-3.5 h-3.5 inline mr-1 text-blue-500" /><b>Scala:</b> Permette di ingrandire o rimpicciolire l'oggetto.</li>
                        <li><Trash2 className="w-3.5 h-3.5 inline mr-1 text-red-500" /><b>Elimina:</b> Rimuove definitivamente l'oggetto selezionato.</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-base">Menu in Alto a Destra</h4>
                      <p>In alto a destra troverai un menu con due sezioni fondamentali:</p>
                      <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><Layers className="w-3.5 h-3.5 inline mr-1 text-blue-500" /><b>Libreria Arredi:</b> Apre il catalogo completo con mobili, decorazioni ed elementi architettonici divisi per categoria. Puoi cliccare sugli elementi per aggiungerli alla stanza.</li>
                        <li><Boxes className="w-3.5 h-3.5 inline mr-1 text-purple-500" /><b>Oggetti Scena:</b> Mostra l'elenco di tutti gli oggetti e pareti attualmente presenti. Da qui puoi selezionare rapidamente un elemento nascosto, bloccarlo, nasconderlo, oppure regolarne il colore e i materiali in tempo reale.</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground text-base">Salvare il Progetto</h4>
                      <p>Quando hai finito, clicca su <b>Salva</b> in alto a destra per memorizzare la scena nel tuo database. Potrai ricaricarla in qualsiasi momento dalla schermata principale!</p>
                    </div>
                  </div>
                )}

                {dialog.type === 'custom_room' && dialog.customRoomConfig && (
                  <div className="flex flex-col gap-4 mb-6 max-h-[60vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
                    {/* Template Selector */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground/70">Forma della stanza</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['rectangular', 'l-shape', 'chamfered', 'attic', 't-shape', 'u-shape', 'alcove', 'double-pitch', 'bow-window'].map(shape => (
                          <button
                            key={shape}
                            onClick={() => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, shape: shape as any } }))}
                            className={cn(
                              "py-2 px-1 rounded-xl text-[10px] font-semibold border transition-all text-center truncate",
                              dialog.customRoomConfig?.shape === shape || (!dialog.customRoomConfig?.shape && shape === 'rectangular')
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                : "bg-secondary/50 border-border text-foreground/70 hover:bg-secondary"
                            )}
                          >
                            {shape === 'rectangular' && 'Rettangolo'}
                            {shape === 'l-shape' && 'A forma di L'}
                            {shape === 'chamfered' && 'Smussata'}
                            {shape === 'attic' && 'Mansarda (1)'}
                            {shape === 'double-pitch' && 'Mansarda (2)'}
                            {shape === 't-shape' && 'A forma di T'}
                            {shape === 'u-shape' && 'A forma di U'}
                            {shape === 'alcove' && 'Con Nicchia'}
                            {shape === 'bow-window' && 'Bovindo'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview 2D della stanza */}
                    <RoomPreview2D config={dialog.customRoomConfig} />

                    <div className="flex items-center gap-2 sm:gap-3 mt-2">
                      <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Larghezza (X)</label>
                      <input 
                        type="number" step="0.1"
                        value={dialog.customRoomConfig.width}
                        onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, width: e.target.value } }))}
                        className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Profondità (Z)</label>
                      <input 
                        type="number" step="0.1"
                        value={dialog.customRoomConfig.length}
                        onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, length: e.target.value } }))}
                        className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                    </div>

                    {dialog.customRoomConfig?.shape === 'l-shape' && (
                      <>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Largh. Nicchia</label>
                          <input 
                            type="number" step="0.1"
                            value={dialog.customRoomConfig.wingWidth}
                            onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, wingWidth: e.target.value } }))}
                            className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Prof. Nicchia</label>
                          <input 
                            type="number" step="0.1"
                            value={dialog.customRoomConfig.wingLength}
                            onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, wingLength: e.target.value } }))}
                            className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                      </>
                    )}

                    {dialog.customRoomConfig?.shape === 'chamfered' && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Taglio Angolo</label>
                        <input 
                          type="number" step="0.1"
                          value={dialog.customRoomConfig.chamferSize || ''}
                          onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, chamferSize: parseFloat(e.target.value) } }))}
                          className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                        <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                      </div>
                    )}

                    {dialog.customRoomConfig?.shape === 't-shape' && (
                      <>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Largh. Gamba</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.wingWidth || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, wingWidth: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Prof. Gamba</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.wingLength || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, wingLength: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                      </>
                    )}

                    {dialog.customRoomConfig?.shape === 'u-shape' && (
                      <>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Largh. Vuoto (U)</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.cutoutWidth || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, cutoutWidth: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Prof. Vuoto (U)</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.cutoutLength || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, cutoutLength: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                      </>
                    )}

                    {dialog.customRoomConfig?.shape === 'alcove' && (
                      <>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Largh. Nicchia</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.alcoveWidth || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, alcoveWidth: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Prof. Nicchia</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.alcoveDepth || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, alcoveDepth: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Posizione Nicchia (Offset)</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.alcoveOffset || 0} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, alcoveOffset: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                      </>
                    )}

                    {dialog.customRoomConfig?.shape === 'double-pitch' && (
                      <>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Altezza Colmo</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.ridgeHeight || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, ridgeHeight: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Alt. Ginocchielli</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.kneeHeight || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, kneeHeight: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                      </>
                    )}

                    {dialog.customRoomConfig?.shape === 'bow-window' && (
                      <>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Largh. Bovindo</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.bowWidth || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, bowWidth: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Prof. Bovindo</label>
                          <input type="number" step="0.1" value={dialog.customRoomConfig.bowDepth || ''} onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, bowDepth: parseFloat(e.target.value) } }))} className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                          <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2 sm:gap-3">
                      <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Altezza (Y)</label>
                      <input 
                        type="number" step="0.1"
                        value={dialog.customRoomConfig.height}
                        onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, height: e.target.value } }))}
                        className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                    </div>

                    {dialog.customRoomConfig?.shape === 'attic' && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Ginocchiello</label>
                        <input 
                          type="number" step="0.1"
                          value={dialog.customRoomConfig.kneeHeight}
                          onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, kneeHeight: e.target.value } }))}
                          className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                        <span className="text-xs text-foreground/50 w-6 shrink-0">m</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 sm:gap-3">
                      <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Porte</label>
                      <input 
                        type="number" step="1" min="0"
                        value={dialog.customRoomConfig.doorsCount}
                        onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, doorsCount: e.target.value } }))}
                        className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <span className="text-xs text-foreground/50 w-6 shrink-0">num</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <label className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-foreground/70 leading-tight">Finestre</label>
                      <input 
                        type="number" step="1" min="0"
                        value={dialog.customRoomConfig.windowsCount}
                        onChange={(e) => setDialog(prev => ({ ...prev, customRoomConfig: { ...prev.customRoomConfig!, windowsCount: e.target.value } }))}
                        className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <span className="text-xs text-foreground/50 w-6 shrink-0">num</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
                    <button 
                      onClick={dialog.onCancel}
                      className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors"
                    >
                      Annulla
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (dialog.type === 'tutorial' || dialog.type === 'alert') {
                        closeDialog();
                      } else {
                        if (dialog.type === 'prompt') {
                          dialog.onConfirm?.(dialog.inputValue, dialog.isPublic);
                        } else {
                          dialog.onConfirm?.(dialog.type === 'custom_room' ? dialog.customRoomConfig : undefined);
                        }
                      }
                    }}
                    className={cn(
                      "px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-transform active:scale-95",
                      dialog.type === 'alert' || dialog.type === 'tutorial' ? "bg-blue-600 hover:bg-blue-700 text-white w-full" : "bg-foreground text-background"
                    )}
                  >
                    {dialog.type === 'alert' ? 'OK' : (dialog.type === 'tutorial' ? 'Ho capito, iniziamo!' : (dialog.type === 'prompt' ? 'Salva' : 'Conferma'))}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNIVERSAL FAB MENU (Rendered globally on top of everything) */}
      {isAnythingSelected && (
        <div className="fixed right-4 bottom-[220px] md:right-8 md:bottom-6 z-40 flex flex-col gap-2 items-end pointer-events-none">
          <AnimatePresence>
            {isMobileMenuExpanded && (
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.2, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 30, scale: 0.2, filter: 'blur(8px)' }}
                transition={{ 
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.8
                }}
                style={{ transformOrigin: "bottom center" }}
                className="flex flex-col gap-2 pointer-events-auto bg-gray-800/95 p-2 rounded-2xl border border-gray-600 shadow-2xl backdrop-blur-md mb-2"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setTransformMode("translate")}
                  className={cn("p-2.5 rounded-xl transition-colors flex items-center justify-center", transformMode === "translate" ? "bg-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-white bg-gray-700/50")}
                >
                  <Move className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={() => setTransformMode("rotate")}
                  className={cn("p-2.5 rounded-xl transition-colors flex items-center justify-center", transformMode === "rotate" ? "bg-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-white bg-gray-700/50")}
                >
                  <RotateCw className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => setTransformMode("scale")}
                  className={cn("p-2.5 rounded-xl transition-colors flex items-center justify-center", transformMode === "scale" ? "bg-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-white bg-gray-700/50")}
                >
                  <Maximize className="w-5 h-5" />
                </button>

                <div className="h-px bg-gray-600/50 my-1 mx-2" />

                {transformMode === "rotate" && (
                  <div className="flex flex-col gap-1 items-center bg-gray-900/50 p-1.5 rounded-xl">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedObject) {
                          update3DObject(selectedObject.id, {
                            rotation: [
                              selectedObject.rotation[0],
                              selectedObject.rotation[1] - Math.PI / 12,
                              selectedObject.rotation[2]
                            ]
                          });
                        } else if (selectedRoomNode && selectedObjectId) {
                          const current = nodeTransformations[selectedObjectId];
                          const curRot = current?.rotation || [0, 0, 0];
                          updateNodeTransformation(selectedObjectId, {
                            rotation: [curRot[0], curRot[1] - Math.PI / 12, curRot[2]]
                          });
                        }
                      }}
                      className="p-1 text-blue-400 hover:text-white font-bold text-xs"
                    >
                      ↺
                    </button>
                    <div className="h-px w-full bg-gray-700" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedObject) {
                          update3DObject(selectedObject.id, {
                            rotation: [
                              selectedObject.rotation[0],
                              selectedObject.rotation[1] + Math.PI / 12,
                              selectedObject.rotation[2]
                            ]
                          });
                        } else if (selectedRoomNode && selectedObjectId) {
                          const current = nodeTransformations[selectedObjectId];
                          const curRot = current?.rotation || [0, 0, 0];
                          updateNodeTransformation(selectedObjectId, {
                            rotation: [curRot[0], curRot[1] + Math.PI / 12, curRot[2]]
                          });
                        }
                      }}
                      className="p-1 text-blue-400 hover:text-white font-bold text-xs"
                    >
                      ↻
                    </button>
                  </div>
                )}

                <div className="flex-1" />

                {/* Nascondi (solo per nodi stanza) */}
                {selectedRoomNode && selectedObjectId && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateNodeTransformation(selectedObjectId, { visible: false });
                      setSelectedObjectId(null);
                    }}
                    className="p-2.5 rounded-xl text-white bg-gray-600 hover:bg-gray-500 transition-colors shadow-lg flex items-center justify-center"
                    title="Nascondi elemento"
                  >
                    <EyeOff className="w-5 h-5" />
                  </button>
                )}

                {/* Elimina (solo per oggetti catalogo) */}
                {selectedObject && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      remove3DObject(selectedObject.id);
                    }}
                    className="p-2.5 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg mt-2 flex items-center justify-center"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuExpanded(!isMobileMenuExpanded);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto p-3.5 bg-blue-600 text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-blue-400/30 flex items-center justify-center transition-transform active:scale-90"
          >
            {isMobileMenuExpanded ? <X className="w-6 h-6" /> : (
              transformMode === 'translate' ? <Move className="w-6 h-6" /> :
              transformMode === 'rotate' ? <RotateCw className="w-6 h-6" /> :
              <Maximize className="w-6 h-6" />
            )}
          </button>
        </div>
      )}

    </div>
  );
}
