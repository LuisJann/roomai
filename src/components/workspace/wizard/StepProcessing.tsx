"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, ScanLine, Ruler, Cuboid, CheckCircle2, 
  UploadCloud, Compass, LayoutGrid, CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

const steps = [
  { id: 1, title: "Upload completato", icon: UploadCloud, detail: "File trasmessi ed indicizzati con successo." },
  { id: 2, title: "Analisi prospettiva stanza", icon: ScanLine, detail: "Rilevazione linee di fuga e calcolo prospettico dalle foto." },
  { id: 3, title: "Riconoscimento elementi architettonici", icon: Compass, detail: "Individuazione pareti, pavimenti, finestre e porte." },
  { id: 4, title: "Allineamento misure e proporzioni", icon: Ruler, detail: "Fusione dati metrici con le immagini (Sensor Fusion)." },
  { id: 5, title: "Costruzione modello 3D", icon: Cuboid, detail: "Rendering dei volumi primari e dello scheletro spaziale." },
  { id: 6, title: "Generazione proposta arredamento", icon: Sparkles, detail: "Disposizione mobili intelligenti basata sul tipo stanza." },
];

export function StepProcessing() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // Total duration of simulation: ~10 seconds
    // We increment step progress every 1.6 seconds
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length) {
          clearInterval(interval);
          setTimeout(() => {
            router.push("/workspace/results");
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1600);

    // Percentage progressive counter
    const pctInterval = setInterval(() => {
      setPercentage(prev => {
        if (prev >= 100) {
          clearInterval(pctInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 90);

    return () => {
      clearInterval(interval);
      clearInterval(pctInterval);
    };
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Top Banner and Spinner */}
      <div className="text-center mb-10">
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* External rotating circle */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-0 border-4 border-dashed border-blue-500/30 rounded-full"
          />
          {/* Inner rotating gradient circle */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            className="absolute inset-2 border-4 border-gradient rounded-full border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent"
          />
          {/* Central Pulsing Icon */}
          <div className="absolute inset-4 bg-surface dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight mb-2">Fusione Dati ed Elaborazione AI</h2>
        <p className="text-foreground/60 text-sm max-w-md mx-auto">
          Il nostro modello di intelligenza artificiale spaziale sta analizzando le foto ed inserendo le misure geometriche in scala.
        </p>

        {/* Global Progress Bar */}
        <div className="max-w-xs mx-auto mt-6 space-y-2">
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-foreground/50">
            <span>AVANZAMENTO PIPELINE</span>
            <span>{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3.5 bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div 
              key={step.id} 
              className={`flex items-start gap-4 p-3 rounded-2xl transition-all duration-300 ${
                isActive ? "bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20" : "border border-transparent"
              }`}
            >
              {/* Step Circle Indicator */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                isCompleted ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-800/30" :
                isActive ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" :
                "bg-gray-50 text-gray-400 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <step.icon className={`w-4.5 h-4.5 ${isActive ? "animate-pulse" : ""}`} />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold transition-colors duration-500 ${
                    isActive ? "text-foreground" : isCompleted ? "text-foreground/80" : "text-foreground/30"
                  }`}>
                    {step.title}
                  </h4>
                  {isActive && (
                    <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                      In corso...
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[9px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-0.5">
                      Completato
                    </span>
                  )}
                </div>
                
                {/* Description */}
                <p className={`text-[11px] mt-0.5 transition-colors duration-500 ${
                  isActive ? "text-foreground/70" : isCompleted ? "text-foreground/50" : "text-foreground/20"
                }`}>
                  {step.detail}
                </p>

                {isActive && (
                  <motion.div 
                    layoutId="processing-progress"
                    className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 w-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.6, ease: "linear" }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
