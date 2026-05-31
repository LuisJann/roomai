"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Sparkles, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassAvatar, AVATARS_DATA } from "@/components/ui/GlassAvatar";

export function NicknameModal({ user, onComplete }: { user: any, onComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !user.user_metadata?.nickname) {
      setIsOpen(true);
    }
  }, [user]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError("Inserisci un nickname valido.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      data: { 
        nickname: nickname.trim(),
        avatar_id: avatarId
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setIsOpen(false);
      onComplete();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 text-white flex items-center justify-center mb-6 shadow-glow">
                <Sparkles className="w-7 h-7" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Fermi tutti!</h2>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                RoomAI è diventato Social! ✨ Prima di continuare a progettare, dicci come vuoi farti chiamare dagli altri designer.
              </p>

              {error && (
                <div className="w-full bg-red-500/10 text-red-400 text-xs font-medium p-3 rounded-xl mb-6 border border-red-500/20 text-center">
                  {error}
                </div>
              )}

              <div className="w-full space-y-5">
                <div className="space-y-2 text-left">
                  <label className="text-[11px] font-bold tracking-widest text-white/50 uppercase px-1">Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/30"
                    placeholder="Es. InteriorGuru_99"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[11px] font-bold tracking-widest text-white/50 uppercase px-1">Scegli il tuo Avatar</label>
                  <div className="flex gap-4 overflow-x-auto py-3 px-3 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                            className="w-12 h-12 sm:w-14 sm:h-14"
                            iconClassName="w-5 h-5 sm:w-6 sm:h-6"
                          />
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 bg-white text-black p-0.5 rounded-full z-20 shadow-lg">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={loading || !nickname.trim()}
                  className="w-full mt-4 bg-white text-black py-4 rounded-2xl text-sm font-bold shadow-glow hover:scale-[1.02] active:scale-95 anim-spring disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Entra nella Community
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
