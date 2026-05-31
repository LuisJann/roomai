"use client";

import { Sidebar } from "@/components/workspace/Sidebar";
import { useState, useEffect } from "react";
import { Menu, Sparkles, X, Home, Image as ImageIcon, Box } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { NicknameModal } from "@/components/workspace/NicknameModal";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // The 3D Editor and the Explore Detail page use their own full-screen layouts
  const isEditor = pathname === "/workspace/3d-editor";
  const isExploreDetail = pathname.startsWith("/workspace/explore/") && pathname !== "/workspace/explore";
  const hideGlobalMobileNav = isEditor || isExploreDetail;

  const [menuHeight, setMenuHeight] = useState(560);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const updateHeight = () => setMenuHeight(Math.min(window.innerHeight - 80, 700));
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    async function checkPermissions() {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setHasAccess(false);
        return;
      }

      setUser(user);

      const { data: roleData } = await supabase.from('users_roles').select('role, permissions').eq('id', user.id).single();
      
      if (roleData?.role === 'admin') {
        setHasAccess(true);
        return;
      }

      const perms = roleData?.permissions || {};
      let allowed = true;

      if (pathname === '/' && !perms.canAccessLanding) allowed = false;
      if (pathname === '/workspace/3d-editor' && !perms.canAccess3DEditor) allowed = false;
      if (pathname === '/workspace/inspiration' && !perms.canAccessIspirazione) allowed = false;
      if (pathname === '/workspace/history' && !perms.canAccessStorico) allowed = false;
      if (pathname === '/workspace' && !perms.canAccessModificaAI) allowed = false;
      if (pathname === '/workspace/gallery' && !perms.canAccessModificaAI && !perms.canAccessIspirazione) allowed = false;

      // Settings is always allowed

      setHasAccess(allowed);
    }
    checkPermissions();
  }, [pathname]);

  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-full">
          <X className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold">Accesso Negato</h1>
        <p className="text-muted-foreground text-sm max-w-md text-center">
          Non hai i permessi necessari per visualizzare questa sezione. Contatta l'amministratore.
        </p>
        <button 
          onClick={async () => {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-semibold transition-colors"
        >
          Esci (Logout)
        </button>
      </div>
    );
  }

  if (hasAccess === null) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className={`flex bg-background flex-col md:flex-row ${isEditor ? "h-[100dvh] overflow-hidden" : "min-h-screen"}`}>
      <NicknameModal user={user} onComplete={() => {
        // Refresh user data if needed, or simply let the modal close.
        const updateUserData = async () => {
          const { createClient } = await import('@/utils/supabase/client');
          const supabase = createClient();
          const { data } = await supabase.auth.getUser();
          if (data.user) setUser(data.user);
        };
        updateUserData();
      }} />
      
      {/* Liquid Mobile Hamburger Menu */}
      <>
        {/* Logo on the left (visible on mobile) */}
        {!hideGlobalMobileNav && (
          <div className="md:hidden fixed top-6 left-6 z-40 flex items-center gap-2 bg-surface/80 backdrop-blur-xl px-4 py-3 rounded-full border border-white/10 shadow-premium pointer-events-none">
            <div className="w-6 h-6 rounded-lg bg-foreground text-background flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:block">RoomAI</span>
          </div>
        )}

        {!hideGlobalMobileNav && (
          <div className={`md:hidden fixed z-[80] flex justify-end ${isEditor ? "top-[9px] right-4" : "top-6 right-6"}`}>
            <motion.div
            animate={{
              width: isMobileOpen ? 280 : (isEditor ? 34 : 56),
              height: isMobileOpen ? menuHeight : (isEditor ? 34 : 56),
              borderRadius: isMobileOpen ? 24 : (isEditor ? 10 : 28),
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 26,
              mass: 0.8,
            }}
            className={cn(
              "overflow-hidden cursor-pointer pointer-events-auto",
              (!isEditor || isMobileOpen) 
                ? "glass-panel !bg-black/85 !backdrop-blur-[40px] !border-white/20 shadow-[0_16px_60px_rgba(0,0,0,0.8)]" 
                : "glass-button flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10"
            )}
            style={{ maxWidth: 'calc(100vw - 32px)', originX: 1, originY: 0 }}
            onClick={() => { 
              if (!isMobileOpen) {
                setIsMobileOpen(true);
                window.dispatchEvent(new CustomEvent('mobile-menu-opened'));
              }
            }}
          >
            {/* FAB Icon */}
            <AnimatePresence>
              {!isMobileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Menu className={`${isEditor ? "w-4 h-4" : "w-6 h-6"} text-white`} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expanded Sidebar Content */}
            <AnimatePresence>
              {isMobileOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-white/90">
                      Menu Principale
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsMobileOpen(false); }} 
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors bg-white/5"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} isMobileMenu />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        )}
      </>

      {/* The Sidebar is fixed on desktop */}
      <div className="hidden md:block">
        <Sidebar isOpen={false} onClose={() => {}} />
      </div>
      
      <main className={cn(
        "flex-1 flex flex-col min-h-0",
        (isEditor || isExploreDetail) ? "p-0 overflow-hidden md:pl-72" : "px-4 pb-4 pt-24 md:py-6 md:pr-6 md:pl-72 overflow-y-auto"
      )}>
        {children}
      </main>
    </div>
  );
}
