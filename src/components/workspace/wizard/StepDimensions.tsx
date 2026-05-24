"use client";

import { useState, useRef } from "react";
import { Ruler, Pencil, Upload, Layers, Plus, Minus, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface StepDimensionsProps {
  onNext: (dimensions: any) => void;
  onBack: () => void;
}

type ModeType = "manual" | "sketch" | "both";

export function StepDimensions({ onNext, onBack }: StepDimensionsProps) {
  const [mode, setMode] = useState<ModeType>("manual");
  
  // General Room settings
  const [roomName, setRoomName] = useState("Il mio Soggiorno");
  const [roomType, setRoomType] = useState("soggiorno");
  const [unit, setUnit] = useState<"cm" | "m">("cm");

  // Mode A: Manual Dimensions
  const [length, setLength] = useState<string>("450");
  const [width, setWidth] = useState<string>("350");
  const [height, setHeight] = useState<string>("270");
  const [doors, setDoors] = useState<number>(1);
  const [windows, setWindows] = useState<number>(2);
  const [features, setFeatures] = useState<string>("");

  // Mode B: Sketch/Blueprint Upload
  const [sketch, setSketch] = useState<{ name: string; url: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const sketchInputRef = useRef<HTMLInputElement>(null);

  const handleSketchFile = (files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      setSketch({
        name: file.name,
        url: url,
        size: sizeMB
      });
    }
  };

  const handleNextStep = () => {
    const data = {
      roomName,
      roomType,
      unit,
      mode,
      manual: mode !== "sketch" ? {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        doors,
        windows,
        features
      } : null,
      sketch: mode !== "manual" ? sketch?.url : null
    };
    onNext(data);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight mb-2">Misure e Piantina della stanza</h2>
        <p className="text-foreground/60 text-sm">
          Unendo foto reali e coordinate metriche, l'AI garantisce proporzioni perfette per il posizionamento dei nuovi arredi.
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Meta details row: Room name & Room Type */}
        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">Nome Progetto</label>
            <input 
              type="text" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Es: Camera Matrimoniale, Cucina Rustica" 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-background text-sm focus:ring-2 focus:ring-foreground outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">Tipo Stanza</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-background text-sm focus:ring-2 focus:ring-foreground outline-none"
            >
              <option value="soggiorno">Soggiorno / Living Room</option>
              <option value="camera">Camera da Letto</option>
              <option value="cucina">Cucina</option>
              <option value="studio">Studio / Ufficio</option>
              <option value="bagno">Bagno</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1.5">Unità di misura</label>
            <div className="grid grid-cols-2 p-1 bg-background border border-gray-200 dark:border-gray-800 rounded-xl">
              <button 
                type="button"
                onClick={() => setUnit("cm")}
                className={cn("py-1.5 text-xs font-semibold rounded-lg transition-colors", unit === "cm" ? "bg-foreground text-background" : "text-foreground/60")}
              >
                Centimetri (cm)
              </button>
              <button 
                type="button"
                onClick={() => setUnit("m")}
                className={cn("py-1.5 text-xs font-semibold rounded-lg transition-colors", unit === "m" ? "bg-foreground text-background" : "text-foreground/60")}
              >
                Metri (m)
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center">
          <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-full p-1 inline-flex shadow-sm">
            <button
              onClick={() => setMode("manual")}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
                mode === "manual" ? "bg-foreground text-background shadow-sm" : "text-foreground/60 hover:text-foreground"
              )}
            >
              <Ruler className="w-4 h-4" /> Misure Manuali
            </button>
            <button
              onClick={() => setMode("sketch")}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
                mode === "sketch" ? "bg-foreground text-background shadow-sm" : "text-foreground/60 hover:text-foreground"
              )}
            >
              <Pencil className="w-4 h-4" /> Carica Piantina
            </button>
            <button
              onClick={() => setMode("both")}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all",
                mode === "both" ? "bg-foreground text-background shadow-sm" : "text-foreground/60 hover:text-foreground"
              )}
            >
              <Layers className="w-4 h-4" /> Usa Entrambe
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tab A: Manual Inputs */}
            {(mode === "manual" || mode === "both") && (
              <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-semibold text-sm border-b border-gray-100 dark:border-gray-900 pb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-blue-500" />
                  Misure Generali dell'Ambiente
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                      Lunghezza {unit === "cm" ? "(cm)" : "(m)"}
                    </label>
                    <input 
                      type="number" 
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder={unit === "cm" ? "Es: 450" : "Es: 4.5"}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-background text-sm focus:ring-2 focus:ring-foreground outline-none" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                      Larghezza {unit === "cm" ? "(cm)" : "(m)"}
                    </label>
                    <input 
                      type="number" 
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder={unit === "cm" ? "Es: 350" : "Es: 3.5"}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-background text-sm focus:ring-2 focus:ring-foreground outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                      Altezza {unit === "cm" ? "(cm)" : "(m)"}
                    </label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder={unit === "cm" ? "Es: 270" : "Es: 2.7"}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-background text-sm focus:ring-2 focus:ring-foreground outline-none" 
                    />
                  </div>
                </div>

                {/* Openings layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-900">
                  <div className="flex items-center justify-between p-3 bg-background border border-gray-200 dark:border-gray-800 rounded-xl">
                    <div>
                      <h4 className="text-xs font-semibold">Porte / Passaggi</h4>
                      <p className="text-[10px] text-foreground/50">Numero totale di porte presenti</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setDoors(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-surface border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-surface-hover active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{doors}</span>
                      <button 
                        type="button"
                        onClick={() => setDoors(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-surface border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-surface-hover active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-background border border-gray-200 dark:border-gray-800 rounded-xl">
                    <div>
                      <h4 className="text-xs font-semibold">Finestre / Vetrate</h4>
                      <p className="text-[10px] text-foreground/50">Numero totale di finestre</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setWindows(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-surface border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-surface-hover active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{windows}</span>
                      <button 
                        type="button"
                        onClick={() => setWindows(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-surface border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-surface-hover active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional fixed features */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                    Nicchie, colonne o ostacoli fissi (Opzionale)
                  </label>
                  <textarea
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="Es: Colonna sporgente nell'angolo destro (30x30 cm). Radiatore sotto la finestra principale. Nicchia profonda 20cm sulla parete a nord."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-background text-sm focus:ring-2 focus:ring-foreground outline-none min-h-[90px] resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab B: Sketch/Drawing Upload */}
            {(mode === "sketch" || mode === "both") && (
              <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm border-b border-gray-100 dark:border-gray-900 pb-2 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-500" />
                  Schema della Stanza Disegnato a Mano
                </h3>

                {sketch ? (
                  <div className="flex bg-background border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm relative group p-3 items-center gap-4">
                    <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shrink-0">
                      <Image 
                        src={sketch.url} 
                        alt="Stanza Schema" 
                        fill 
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold truncate text-foreground/90">{sketch.name}</h4>
                      <p className="text-[10px] text-foreground/50 mt-0.5">{sketch.size}</p>
                      <span className="text-[9px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block">
                        Pronto per la scansione AI
                      </span>
                    </div>
                    <button 
                      onClick={() => setSketch(null)}
                      className="absolute top-3 right-3 text-foreground/40 hover:text-red-500 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleSketchFile(e.dataTransfer.files);
                      }
                    }}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-all min-h-[180px] flex flex-col items-center justify-center",
                      isDragging 
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" 
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-surface-hover/30"
                    )}
                  >
                    <Upload className="w-8 h-8 text-foreground/40 mb-3" />
                    <h4 className="font-semibold text-sm mb-1">Allega uno schema o piantina</h4>
                    <p className="text-[11px] text-foreground/50 max-w-xs mb-4">
                      Trascina qui il file dello schema. Accettiamo foto scattate da cellulare o piantine scanned.
                    </p>
                    <button
                      onClick={() => sketchInputRef.current?.click()}
                      className="bg-foreground text-background px-4 py-2 rounded-full text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      Sfoglia file
                    </button>
                    <input 
                      type="file" 
                      ref={sketchInputRef} 
                      onChange={(e) => e.target.files && handleSketchFile(e.target.files)} 
                      accept="image/*"
                      className="hidden" 
                    />
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Tips Side */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Sketch Tutorial Guidelines (Always show if sketch is visible) */}
            {(mode === "sketch" || mode === "both") && (
              <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3.5">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Come disegnare lo schema
                </h4>
                
                <ul className="space-y-3 text-[11px] text-foreground/80">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500 shrink-0">1.</span>
                    <span>Disegna la stanza vista dall'alto (schema a scatola o rettangolo).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500 shrink-0">2.</span>
                    <span>Segna le lunghezze di ogni parete in metri o centimetri.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500 shrink-0">3.</span>
                    <span>Traccia e indica la posizione di porte, finestre e caloriferi.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500 shrink-0">4.</span>
                    <span>Scatta la foto tenendo il telefono parallelo al foglio per evitare ombre.</span>
                  </li>
                </ul>

                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-[10px] text-foreground/70 leading-normal flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Anche uno schizzo rapido o una piantina catastale vanno benissimo, purché le scritte siano leggibili!</span>
                </div>
              </div>
            )}

            {/* Fusion Alert */}
            <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-green-600 dark:text-green-400">
                AI Data Fusion
              </h4>
              <p className="text-[11px] text-foreground/70 leading-relaxed">
                Il motore AI di RoomAI sovrappone i dati geometrici e le note inserite qui con le ombre e la prospettiva rilevata nelle foto reali. 
              </p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">
                Questo elimina i tipici errori delle app puramente visive, posizionando mobili e ingombri con tolleranza inferiore al centimetro.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-800 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="bg-surface border border-gray-200 dark:border-gray-800 text-foreground px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-surface-hover active:scale-95 transition-all"
        >
          Indietro
        </button>
        
        <button
          onClick={handleNextStep}
          disabled={(mode === "sketch" && !sketch) || (mode === "both" && !sketch)}
          className={cn(
            "px-8 py-3 rounded-full text-xs font-semibold transition-all shadow-md flex items-center gap-2",
            ((mode === "sketch" && !sketch) || (mode === "both" && !sketch))
              ? "bg-foreground/10 text-foreground/30 cursor-not-allowed"
              : "bg-foreground text-background hover:scale-105 active:scale-95"
          )}
        >
          Avvia Elaborazione AI <span className="text-[10px] opacity-60">Step 3 di 3</span>
        </button>
      </div>

    </div>
  );
}
