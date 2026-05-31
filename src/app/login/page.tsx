"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Loader2, ArrowLeft, CheckCircle2, XCircle, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GlassAvatar, AVATARS_DATA } from "@/components/ui/GlassAvatar";

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const passwordRules = [
    { label: "Almeno 8 caratteri", valid: password.length >= 8 },
    { label: "Almeno 1 lettera maiuscola", valid: /[A-Z]/.test(password) },
    { label: "Almeno 1 numero", valid: /[0-9]/.test(password) },
    { label: "Almeno 1 carattere speciale", valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password) },
  ];

  const isPasswordValid = passwordRules.every(rule => rule.valid);

  const handleAuth = async () => {
    setError(null);

    if (!isLoginMode) {
      if (!isPasswordValid) {
        setError("La password non rispetta tutti i requisiti di sicurezza.");
        return;
      }
      if (password !== passwordConfirm) {
        setError("Le password non coincidono.");
        return;
      }
      if (!nickname.trim()) {
        setError("Devi scegliere un nickname.");
        return;
      }
    }

    setLoading(true);

    const safeEmail = email.trim();

    const { error } = isLoginMode 
      ? await supabase.auth.signInWithPassword({ email: safeEmail, password })
      : await supabase.auth.signUp({ 
          email: safeEmail, 
          password,
          options: {
            data: {
              nickname: nickname.trim(),
              avatar_id: avatarId
            }
          }
        });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#050505] p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Animated Decorative Background Blobs */}
      <motion.div 
        animate={{ 
          rotate: 360,
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          rotate: -360,
          scale: [1, 1.3, 1],
          x: [0, -60, 0],
          y: [0, 60, 0]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" 
      />

      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-[420px] max-h-[85dvh] overflow-y-auto glass-scrollbar bg-black/40 backdrop-blur-[60px] border border-white/10 rounded-[32px] p-6 sm:p-10 relative z-10 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
      >
        <style dangerouslySetInnerHTML={{__html: `
          .glass-scrollbar::-webkit-scrollbar { width: 12px; }
          .glass-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .glass-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; background-clip: padding-box; border: 4px solid transparent; }
          .glass-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); background-clip: padding-box; border: 4px solid transparent; }
          .glass-scrollbar-horizontal::-webkit-scrollbar { height: 12px; }
          .glass-scrollbar-horizontal::-webkit-scrollbar-track { background: transparent; }
          .glass-scrollbar-horizontal::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; background-clip: padding-box; border: 4px solid transparent; }
          .glass-scrollbar-horizontal::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); background-clip: padding-box; border: 4px solid transparent; }
          .scrollbar-none::-webkit-scrollbar { display: none; }
        `}} />
        {/* Inner subtle glow line */}
        <div className="absolute inset-0 rounded-[32px] ring-1 ring-white/5 pointer-events-none" />

        <motion.div layout="position" className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-white/80 text-black flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,255,255,0.3)] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-1.5 text-center">
            {isLoginMode ? "Accedi" : "Crea Account"}
          </h1>
          <p className="text-white/50 text-xs sm:text-sm text-center font-medium px-4">
            {isLoginMode ? "Bentornato! Inserisci i tuoi dati per continuare." : "Unisciti e sincronizza i tuoi progetti 3D in Cloud."}
          </p>
        </motion.div>

        {error && (
          <div className="bg-red-500/10 text-red-500 text-sm font-medium p-3 rounded-xl mb-6 text-center border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <motion.div layout="position" className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase pl-2">Email</label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all placeholder:text-white/20"
                placeholder="mario@email.it"
              />
            </div>
          </motion.div>

          <motion.div layout="position" className="space-y-1">
            <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase pl-2">Password</label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors z-10" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all placeholder:text-white/20"
                placeholder="••••••••"
              />
            </div>
            
            <AnimatePresence>
              {!isLoginMode && password.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="pt-2 overflow-hidden"
                >
                  <div className="space-y-2 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Sicurezza Password</p>
                    {passwordRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        {rule.valid ? (
                          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          </div>
                        )}
                        <span className={`text-xs transition-colors duration-300 ${rule.valid ? 'text-green-500/90 font-medium' : 'text-white/40'}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {!isLoginMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 sm:space-y-4 w-full min-w-0"
              >
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase pl-2">Conferma Password</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors z-10" />
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="relative w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all placeholder:text-white/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase pl-2">Nickname</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors z-10" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="relative w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all placeholder:text-white/20"
                      placeholder="Il tuo nome da designer"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 w-full min-w-0">
                  <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase pl-2">Scegli Avatar</label>
                  <div className="flex gap-5 overflow-x-auto py-5 px-4 glass-scrollbar-horizontal w-full">
                    {AVATARS_DATA.map((avatar) => {
                      const isSelected = avatarId === avatar.id;
                      return (
                        <button
                          key={avatar.id}
                          onClick={() => setAvatarId(avatar.id)}
                          className={`relative shrink-0 transition-all duration-500 outline-none rounded-full
                            ${isSelected ? '' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                        >
                          <GlassAvatar 
                            id={avatar.id} 
                            isSelected={isSelected}
                            className="w-11 h-11 sm:w-14 sm:h-14"
                            iconClassName="w-5 h-5 sm:w-6 sm:h-6"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout="position" className="flex flex-col gap-4 pt-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <button
                onClick={handleAuth}
                disabled={loading || !email || !password || (!isLoginMode && (!isPasswordValid || !passwordConfirm || !nickname.trim()))}
                className="relative w-full bg-white text-black py-4 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2 overflow-hidden"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {isLoginMode ? "Accedi all'Area Personale" : "Crea il tuo Account"}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
            
            <button
              onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
              className="text-[11px] font-bold tracking-widest text-white/40 hover:text-white transition-colors uppercase text-center"
            >
              {isLoginMode 
                ? "Non hai un account? Registrati" 
                : "Hai già un account? Accedi"}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
