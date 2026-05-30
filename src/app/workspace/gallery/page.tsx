"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Download, ImageIcon, Images, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function GalleryPage() {
  const [renders, setRenders] = useState<any[]>([]);
  const [inspirations, setInspirations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSeeRenders, setCanSeeRenders] = useState(false);
  const [canSeeInspirations, setCanSeeInspirations] = useState(false);


  const supabase = createClient();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase.from('users_roles').select('role, permissions').eq('id', user.id).single();
    const isAdmin = roleData?.role === 'admin';
    const perms = roleData?.permissions || {};
    
    setCanSeeRenders(isAdmin || perms.canAccessModificaAI);
    setCanSeeInspirations(isAdmin || perms.canAccessIspirazione);

    const { data, error } = await supabase.from('user_images').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    
    if (data && !error) {
      setRenders(data.filter(img => img.type === 'render'));
      setInspirations(data.filter(img => img.type === 'inspiration'));
    }
    setLoading(false);
  };

  const deleteImage = async (id: string, storagePath: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa immagine?")) return;
    
    // Optimistic UI update
    setRenders(renders.filter(r => r.id !== id));
    setInspirations(inspirations.filter(i => i.id !== id));

    await supabase.storage.from('gallery').remove([storagePath]);
    await supabase.from('user_images').delete().eq('id', id);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-white">
          <Images className="w-8 h-8 text-blue-400" /> I Miei Render e Ispirazioni
        </h1>
        <p className="text-white/60 mt-2">
          Qui trovi tutto il materiale generato in background e salvato nel Database.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <>
          {canSeeRenders && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <ImageIcon className="w-5 h-5 text-indigo-400" /> Render Reali (Strutturali)
            </h2>
            {renders.length === 0 ? (
              <div className="glass-card rounded-[32px] p-8 text-center text-white/50">
                Non hai ancora salvato nessun render reale.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renders.map((img) => (
                  <div key={img.id} className="glass-card rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:-translate-y-1 transition-all duration-300 border border-white/10 hover:border-white/20 p-2">
                    <div className="relative w-full h-64 rounded-xl overflow-hidden">
                      <Image src={img.public_url} alt="Render" fill className="object-cover" unoptimized />
                    </div>
                    <div className="pt-3 flex gap-2">
                      <a href={img.public_url} download target="_blank" rel="noreferrer" className="flex-1 bg-white text-black text-center py-2 px-1 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 anim-spring hover:scale-[1.02] shadow-glow">
                        <Download className="w-3.5 h-3.5 shrink-0" /> Scarica
                      </a>
                      <button onClick={() => deleteImage(img.id, img.storage_path)} className="flex-1 bg-red-500/10 text-red-500 py-2 px-1 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 hover:bg-red-500/20 anim-spring hover:scale-[1.02]">
                        <Trash2 className="w-3.5 h-3.5 shrink-0" /> Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          )}

          {canSeeInspirations && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <ImageIcon className="w-5 h-5 text-yellow-400" /> Ispirazioni (Text-to-Image)
            </h2>
            {inspirations.length === 0 ? (
              <div className="glass-card rounded-[32px] p-8 text-center text-white/50">
                Nessuna ispirazione salvata.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inspirations.map((img) => (
                  <div key={img.id} className="glass-card rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:-translate-y-1 transition-all duration-300 border border-white/10 hover:border-white/20 p-2">
                    <div className="relative w-full h-64 rounded-xl overflow-hidden">
                      <Image src={img.public_url} alt="Inspiration" fill className="object-cover" unoptimized />
                    </div>
                    <div className="pt-3 flex gap-2">
                      <a href={img.public_url} download target="_blank" rel="noreferrer" className="flex-1 bg-white text-black text-center py-2 px-1 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 anim-spring hover:scale-[1.02] shadow-glow">
                        <Download className="w-3.5 h-3.5 shrink-0" /> Scarica
                      </a>
                      <button onClick={() => deleteImage(img.id, img.storage_path)} className="flex-1 bg-red-500/10 text-red-500 py-2 px-1 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 hover:bg-red-500/20 anim-spring hover:scale-[1.02]">
                        <Trash2 className="w-3.5 h-3.5 shrink-0" /> Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          )}
        </>
      )}
    </div>
  );
}
