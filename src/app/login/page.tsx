"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  const handleAuth = async () => {
    setError(null);

    if (!isLoginMode) {
      if (password !== passwordConfirm) {
        setError("Le password non coincidono.");
        return;
      }
      if (password.length < 6) {
        setError("La password deve contenere almeno 6 caratteri.");
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-4 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] glass-card p-8 sm:p-10 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-[16px] bg-white text-black flex items-center justify-center mb-5 shadow-glow">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isLoginMode ? "Accedi a RoomAI" : "Crea un Account"}
          </h1>
          <p className="text-white/60 text-sm mt-2 text-center">
            {isLoginMode ? "Bentornato! Inserisci i tuoi dati." : "Inizia a sincronizzare i tuoi progetti 3D in Cloud."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 text-sm font-medium p-3 rounded-xl mb-6 text-center border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold tracking-widest text-white/50 uppercase px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/30"
                placeholder="mario@email.it"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold tracking-widest text-white/50 uppercase px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLoginMode && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-widest text-white/50 uppercase px-1">Conferma Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/30"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {!isLoginMode && (
            <>
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-widest text-white/50 uppercase px-1">Nickname</label>
                <div className="relative">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/30"
                    placeholder="Il tuo nome da designer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-widest text-white/50 uppercase px-1">Scegli il tuo Avatar</label>
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 pt-1 px-1">
                  {[1, 2, 3, 4, 5, 6].map((id) => (
                    <button
                      key={id}
                      onClick={() => setAvatarId(id)}
                      className={`relative shrink-0 rounded-full transition-all duration-300 ${avatarId === id ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100 hover:scale-105'}`}
                    >
                      <img src={`/avatars/avatar_${id}.png`} alt={`Avatar ${id}`} className="w-12 h-12 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-4 pt-8">
            <button
              onClick={handleAuth}
              disabled={loading || !email || !password || (!isLoginMode && (!passwordConfirm || !nickname.trim()))}
              className="w-full bg-white text-black py-3.5 rounded-full text-sm font-bold shadow-glow hover:scale-[1.02] active:scale-95 anim-spring disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoginMode ? "Accedi" : "Registrati Ora"}
            </button>
            
            <button
              onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
              className="text-xs font-semibold tracking-wide text-white/50 hover:text-white transition-colors mt-2 uppercase"
            >
              {isLoginMode 
                ? "Non hai un account? Registrati" 
                : "Hai già un account? Accedi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
