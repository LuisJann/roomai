"use client";

import { useState } from "react";
import { StepPhotos } from "@/components/workspace/wizard/StepPhotos";
import { StepDimensions } from "@/components/workspace/wizard/StepDimensions";
import { StepProcessing } from "@/components/workspace/wizard/StepProcessing";
import { Camera, Ruler, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function WorkspacePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const setPhotos = useWorkspaceStore((state) => state.setPhotos);
  const setDimensions = useWorkspaceStore((state) => state.setDimensions);

  const stepsList = [
    { id: 1, name: "Foto Ambiente", desc: "Upload angolazioni", icon: Camera },
    { id: 2, name: "Misure & Schema", desc: "Geometria e piantine", icon: Ruler },
    { id: 3, name: "Elaborazione AI", desc: "Calcolo volumetrico", icon: Sparkles },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crea Progetto Stanza</h1>
          <p className="text-xs text-foreground/50 mt-1">
            Trasforma il tuo ambiente reale in un render 3D e ricevi proposte d'arredo su misura.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-surface border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-2xl shadow-sm overflow-x-auto max-w-full">
          {stepsList.map((s, index) => {
            const isCompleted = step > s.id;
            const isActive = step === s.id;

            return (
              <div key={s.id} className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isCompleted ? "bg-green-500 text-white" :
                    isActive ? "bg-foreground text-background" : "bg-foreground/5 text-foreground/40"
                  )}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="hidden sm:block">
                    <p className={cn("text-xs font-bold leading-none", isActive ? "text-foreground" : "text-foreground/50")}>
                      {s.name}
                    </p>
                    <p className="text-[9px] text-foreground/40 leading-none mt-0.5">{s.desc}</p>
                  </div>
                </div>
                {index < stepsList.length - 1 && (
                  <div className="h-px w-6 bg-gray-200 dark:bg-gray-800" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-[400px]">
        {step === 1 && (
          <StepPhotos 
            onNext={(uploadedPhotos) => {
              setPhotos(uploadedPhotos);
              setStep(2);
            }} 
          />
        )}

        {step === 2 && (
          <StepDimensions 
            onBack={() => setStep(1)}
            onNext={(dims) => {
              setDimensions(dims);
              localStorage.setItem("roomai_dimensions", JSON.stringify(dims));
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <StepProcessing />
        )}
      </div>
    </div>
  );
}