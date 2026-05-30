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
    }

    setLoading(true);

    const safeEmail = email.trim();

    const { error } = isLoginMode 
      ? await supabase.auth.signInWithPassword({ email: safeEmail, password })
      : await supabase.auth.signUp({ email: safeEmail, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isLoginMode ? "Accedi a RoomAI" : "Crea un Account"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoginMode ? "Bentornato! Inserisci i tuoi dati." : "Inizia a sincronizzare i tuoi progetti 3D in Cloud."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 text-sm font-medium p-3 rounded-xl mb-6 text-center border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80 px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="mario@email.it"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80 px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLoginMode && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/80 px-1">Conferma Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-6">
            <button
              onClick={handleAuth}
              disabled={loading || !email || !password || (!isLoginMode && !passwordConfirm)}
              className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoginMode ? "Accedi" : "Registrati Ora"}
            </button>
            
            <button
              onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
              className="text-sm text-foreground/60 hover:text-foreground hover:underline transition-colors mt-2"
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
