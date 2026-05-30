"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, Image as ImageIcon, Wand2, Smartphone, Box, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

const features = [
  {
    icon: Smartphone,
    title: "Connessione Mobile",
    description: "Scansiona un QR code col tuo iPhone e carica istantaneamente le foto dell'ambiente direttamente sul Mac.",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Box,
    title: "Editor 3D Spaziale",
    description: "Posiziona porte, finestre e librerie 3D in un ambiente digitale millimetrico per progettare gli spazi esatti.",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    icon: Sparkles,
    title: "Intelligenza Artificiale",
    description: "Usa l'AI generativa per creare decine di render iper-realistici partendo dalla tua stanza vuota o arredata.",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  }
];

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-sm font-medium mb-8 shadow-sm text-white/80">
              <Wand2 className="w-4 h-4 text-blue-400 animate-pulse" />
              L'Interior Design Definitivo
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-semibold tracking-tight mb-8 leading-[1.1] text-white">
            La tua stanza, <br className="hidden md:block"/> riprogettata dalla <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">realtà.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Dimentica i vecchi software complessi. Scatta una foto, costruisci l'ambiente in 3D con precisione millimetrica e lascia che l'Intelligenza Artificiale arredi lo spazio per te.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/workspace/3d-editor" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full text-base font-bold shadow-glow hover:scale-[1.02] transition-all active:scale-95 group anim-spring">
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Avvia l'App
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div 
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {features.map((feature, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card p-8 rounded-[32px] text-left border border-white/5"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Liquid Background Decorations */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"
      />
    </section>
  );
}
