"use client";

import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Wand2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-hover border border-gray-200 dark:border-gray-800 text-sm font-medium mb-6">
              <Wand2 className="w-4 h-4 text-blue-500" />
              Il futuro dell'Interior Design
            </span>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-8 leading-tight">
              Progetta la tua stanza, <br className="hidden md:block"/> partendo dalla <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500">realtà.</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Carica le foto del tuo ambiente, inserisci le misure o allega una piantina disegnata a mano. 
              La nostra intelligenza artificiale unirà questi dati per creare un render 3D millimetrico. <br/>
              <span className="text-sm opacity-80 mt-2 block">💡 Usa un Mac? Acquisisci le foto in tempo reale direttamente con il tuo iPhone.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/workspace" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 rounded-full text-base font-medium hover:scale-105 transition-transform active:scale-95 shadow-lg">
                <ImageIcon className="w-5 h-5" />
                Crea il render 3D
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Demo Visual */}
        <motion.div 
          className="mt-20 relative mx-auto max-w-5xl rounded-2xl overflow-hidden shadow-premium"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 relative">
             <Image 
                src="/modern_living_room_after.png" 
                alt="3D Rendered Living Room" 
                fill 
                className="object-cover"
                priority
                unoptimized
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-overlay"></div>
          </div>
        </motion.div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-gray-200 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>
    </section>
  );
}
