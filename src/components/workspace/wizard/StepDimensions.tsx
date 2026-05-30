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
        <div className="glass-card rounded-[32px] p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Nome Progetto</label>
            <input 
              type="text" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Es: Camera Matrimoniale, Cucina Rustica" 
              className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/40 text-sm text-white focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none placeholder:text-white/30 transition-all" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Tipo Stanza</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/40 text-sm text-white focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none transition-all"
            >
              <option value="soggiorno">Soggiorno / Living Room</option>
              <option value="camera">Camera da Letto</option>
              <option value="cucina">Cucina</option>
              <option value="studio">Studio / Ufficio</option>
              <option value="bagno">Bagno</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Unità di misura</label>
            <div className="grid grid-cols-2 p-1.5 bg-black/40 border border-white/10 rounded-2xl">
              <button 
                type="button"
                onClick={() => setUnit("cm")}
                className={cn("py-2 text-xs font-bold rounded-xl transition-all", unit === "cm" ? "bg-white text-black shadow-glow" : "text-white/60 hover:text-white")}
              >
                Centimetri (cm)
              </button>
              <button 
                type="button"
                onClick={() => setUnit("m")}
                className={cn("py-2 text-xs font-bold rounded-xl transition-all", unit === "m" ? "bg-white text-black shadow-glow" : "text-white/60 hover:text-white")}
              >
                Metri (m)
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center">
          <div className="glass-panel p-1.5 inline-flex shadow-sm rounded-full">
            <button
              onClick={() => setMode("manual")}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all",
                mode === "manual" ? "bg-white text-black shadow-glow" : "text-white/60 hover:text-white"
              )}
            >
              <Ruler className="w-4 h-4" /> Misure Manuali
            </button>
            <button
              onClick={() => setMode("sketch")}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all",
                mode === "sketch" ? "bg-white text-black shadow-glow" : "text-white/60 hover:text-white"
              )}
            >
              <Pencil className="w-4 h-4" /> Carica Piantina
            </button>
            <button
              onClick={() => setMode("both")}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all",
                mode === "both" ? "bg-white text-black shadow-glow" : "text-white/60 hover:text-white"
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
              <div className="glass-card rounded-[32px] p-8 shadow-sm space-y-6">
                <h3 className="font-bold text-sm border-b border-white/5 pb-3 flex items-center gap-2 text-white">
                  <Ruler className="w-4 h-4 text-blue-400" />
                  Misure Generali dell'Ambiente
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-white/50 mb-2">
                      Lunghezza {unit === "cm" ? "(cm)" : "(m)"}
                    </label>
                    <input 
                      type="number" 
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder={unit === "cm" ? "Es: 450" : "Es: 4.5"}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/40 text-sm text-white focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none placeholder:text-white/30 transition-all" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-white/50 mb-2">
                      Larghezza {unit === "cm" ? "(cm)" : "(m)"}
                    </label>
                    <input 
                      type="number" 
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder={unit === "cm" ? "Es: 350" : "Es: 3.5"}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/40 text-sm text-white focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none placeholder:text-white/30 transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-white/50 mb-2">
                      Altezza {unit === "cm" ? "(cm)" : "(m)"}
                    </label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder={unit === "cm" ? "Es: 270" : "Es: 2.7"}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/40 text-sm text-white focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none placeholder:text-white/30 transition-all" 
                    />
                  </div>
                </div>

                {/* Openings layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">Porte / Passaggi</h4>
                      <p className="text-[10px] text-white/50 mt-0.5">Numero totale di porte presenti</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setDoors(prev => Math.max(0, prev - 1))}
                        className="w-9 h-9 rounded-xl glass-button flex items-center justify-center hover:bg-white/10 active:scale-95 text-white/70 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center text-white">{doors}</span>
                      <button 
                        type="button"
                        onClick={() => setDoors(prev => prev + 1)}
                        className="w-9 h-9 rounded-xl glass-button flex items-center justify-center hover:bg-white/10 active:scale-95 text-white/70 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">Finestre / Vetrate</h4>
                      <p className="text-[10px] text-white/50 mt-0.5">Numero totale di finestre</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setWindows(prev => Math.max(0, prev - 1))}
                        className="w-9 h-9 rounded-xl glass-button flex items-center justify-center hover:bg-white/10 active:scale-95 text-white/70 hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center text-white">{windows}</span>
                      <button 
                        type="button"
                        onClick={() => setWindows(prev => prev + 1)}
                        className="w-9 h-9 rounded-xl glass-button flex items-center justify-center hover:bg-white/10 active:scale-95 text-white/70 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional fixed features */}
                <div className="pt-2">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-white/50 mb-2">
                    Nicchie, colonne o ostacoli fissi (Opzionale)
                  </label>
                  <textarea
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="Es: Colonna sporgente nell'angolo destro (30x30 cm). Radiatore sotto la finestra principale. Nicchia profonda 20cm sulla parete a nord."
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/40 text-sm text-white focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none placeholder:text-white/30 min-h-[100px] resize-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Tab B: Sketch/Drawing Upload */}
            {(mode === "sketch" || mode === "both") && (
              <div className="glass-card rounded-[32px] p-8 shadow-sm space-y-6">
                <h3 className="font-bold text-sm border-b border-white/5 pb-3 flex items-center gap-2 text-white">
                  <Pencil className="w-4 h-4 text-blue-400" />
                  Schema della Stanza Disegnato a Mano
                </h3>

                {sketch ? (
                  <div className="flex glass-card rounded-2xl overflow-hidden shadow-sm relative group p-4 items-center gap-5 hover:border-white/20 transition-colors">
                    <div className="relative w-24 h-24 bg-black/40 rounded-xl overflow-hidden shrink-0">
                      <Image 
                        src={sketch.url} 
                        alt="Stanza Schema" 
                        fill 
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate text-white">{sketch.name}</h4>
                      <p className="text-[10px] text-white/50 mt-1">{sketch.size}</p>
                      <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 font-bold px-3 py-1 rounded-full mt-2 inline-block uppercase tracking-wider">
                        Pronto per la scansione AI
                      </span>
                    </div>
                    <button 
                      onClick={() => setSketch(null)}
                      className="absolute top-4 right-4 text-white/40 hover:text-red-500 p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
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
                      "border border-dashed border-white/20 rounded-[24px] p-10 text-center transition-all min-h-[220px] flex flex-col items-center justify-center bg-black/20",
                      isDragging 
                        ? "border-blue-500 bg-blue-500/10" 
                        : "hover:border-white/40 hover:bg-white/5"
                    )}
                  >
                    <Upload className="w-8 h-8 text-white/40 mb-3" />
                    <h4 className="font-bold text-sm mb-1 text-white">Allega uno schema o piantina</h4>
                    <p className="text-[11px] text-white/50 max-w-xs mb-6">
                      Trascina qui il file dello schema. Accettiamo foto scattate da cellulare o piantine scanned.
                    </p>
                    <button
                      onClick={() => sketchInputRef.current?.click()}
                      className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold shadow-glow hover:scale-[1.02] transition-all anim-spring"
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

          <div className="lg:col-span-4 space-y-6">
            
            {/* Sketch Tutorial Guidelines (Always show if sketch is visible) */}
            {(mode === "sketch" || mode === "both") && (
              <div className="glass-card rounded-[32px] p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Come disegnare lo schema
                </h4>
                
                <ul className="space-y-3.5 text-[11px] text-white/70 leading-relaxed">
                  <li className="flex gap-2.5">
                    <span className="font-bold text-blue-400 shrink-0">1.</span>
                    <span>Disegna la stanza vista dall'alto (schema a scatola o rettangolo).</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="font-bold text-blue-400 shrink-0">2.</span>
                    <span>Segna le lunghezze di ogni parete in metri o centimetri.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="font-bold text-blue-400 shrink-0">3.</span>
                    <span>Traccia e indica la posizione di porte, finestre e caloriferi.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="font-bold text-blue-400 shrink-0">4.</span>
                    <span>Scatta la foto tenendo il telefono parallelo al foglio per evitare ombre.</span>
                  </li>
                </ul>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] text-white/80 leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Anche uno schizzo rapido o una piantina catastale vanno benissimo, purché le scritte siano leggibili!</span>
                </div>
              </div>
            )}

            {/* Fusion Alert */}
            <div className="glass-card border border-green-500/20 rounded-[32px] p-6 shadow-sm space-y-3 bg-green-500/5">
              <h4 className="font-bold text-[10px] uppercase tracking-widest text-green-400">
                AI Data Fusion
              </h4>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Il motore AI di RoomAI sovrappone i dati geometrici e le note inserite qui con le ombre e la prospettiva rilevata nelle foto reali. 
              </p>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Questo elimina i tipici errori delle app puramente visive, posizionando mobili e ingombri con tolleranza inferiore al centimetro.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-white/5 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="glass-button px-6 py-3.5 rounded-full text-xs font-bold hover:text-white transition-all"
        >
          Indietro
        </button>
        
        <button
          onClick={handleNextStep}
          disabled={(mode === "sketch" && !sketch) || (mode === "both" && !sketch)}
          className={cn(
            "px-8 py-3.5 rounded-full text-xs font-bold shadow-glow flex items-center gap-2 anim-spring disabled:hover:scale-100 active:scale-95",
            ((mode === "sketch" && !sketch) || (mode === "both" && !sketch))
              ? "bg-white/10 text-white/30 cursor-not-allowed shadow-none"
              : "bg-white text-black hover:scale-[1.02]"
          )}
        >
          Avvia Elaborazione AI <span className="text-[9px] opacity-60 ml-1">Step 3 di 3</span>
        </button>
      </div>

    </div>
  );
}
