"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { Heart, MessageCircle, User, Loader2, Compass, Box, ArrowDownWideNarrow, Clock, Flame } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface PublicProject {
  id: string;
  name: string;
  created_at: string;
  thumbnail?: string;
  social: {
    is_public: boolean;
    author_nickname: string;
    author_avatar_id: number;
    likes: string[];
    comments: any[];
  };
}

export default function ExplorePage() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'most_liked' | 'most_commented'>('newest');

  useEffect(() => {
    async function fetchPublicProjects() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq("data->social->is_public", true)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const publicProj = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          created_at: d.created_at,
          thumbnail: d.data.thumbnail,
          social: d.data.social || {}
        }));
        setProjects(publicProj);
      }
      setLoading(false);
    }
    fetchPublicProjects();
  }, []);

  const toggleLike = async (projectId: string, currentLikes: string[]) => {
    if (!currentUserId) return;
    
    const hasLiked = currentLikes.includes(currentUserId);
    const newLikes = hasLiked 
      ? currentLikes.filter(id => id !== currentUserId)
      : [...currentLikes, currentUserId];

    // Optimistic update
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, social: { ...p.social, likes: newLikes } };
      }
      return p;
    }));

    const supabase = createClient();
    // To update, we first fetch the full data payload to not lose workspaceData
    const { data: project } = await supabase.from('projects').select('data').eq('id', projectId).single();
    if (project) {
      const updatedData = {
        ...project.data,
        social: {
          ...project.data.social,
          likes: newLikes
        }
      };
      await supabase.from('projects').update({ data: updatedData }).eq('id', projectId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[16px] bg-gradient-to-tr from-blue-500 to-emerald-500 text-white flex items-center justify-center shadow-glow shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Esplora Community</h1>
            <p className="text-foreground/50 text-sm mt-1">Prendi ispirazione dai progetti degli altri designer.</p>
          </div>
        </div>

        {!loading && projects.length > 0 && (
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="px-2 sm:px-3 py-1 flex items-center gap-2 text-foreground/50">
              <ArrowDownWideNarrow className="w-4 h-4 hidden sm:block" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Ordina:</span>
            </div>
            <div className="flex items-center gap-1">
              {(['newest', 'most_liked', 'most_commented'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${sortBy === option ? 'bg-white/10 text-white shadow-sm' : 'text-foreground/50 hover:text-white hover:bg-white/5'}`}
                  title={option === 'newest' ? 'Più Recenti' : option === 'most_liked' ? 'Più Popolari' : 'Più Discussi'}
                >
                  {option === 'newest' && <Clock className="w-4 h-4" />}
                  {option === 'most_liked' && <Flame className="w-4 h-4" />}
                  {option === 'most_commented' && <MessageCircle className="w-4 h-4" />}
                  <span className="hidden sm:inline">
                    {option === 'newest' && 'Più Recenti'}
                    {option === 'most_liked' && 'Più Popolari'}
                    {option === 'most_commented' && 'Più Discussi'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-foreground/50 font-medium animate-pulse">Caricamento progetti...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/5">
          <Compass className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Nessun progetto pubblico</h3>
          <p className="text-foreground/50">Diventa il primo a condividere un progetto con la community!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {[...projects].sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'most_liked') return (b.social.likes?.length || 0) - (a.social.likes?.length || 0);
            if (sortBy === 'most_commented') return (b.social.comments?.length || 0) - (a.social.comments?.length || 0);
            return 0;
          }).map((project, i) => {
            const hasLiked = currentUserId ? project.social.likes?.includes(currentUserId) : false;
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="break-inside-avoid glass-card border border-white/10 rounded-3xl overflow-hidden group hover:border-white/20 transition-colors"
              >
                {/* Abstract Thumbnail / Real Thumbnail */}
                <Link href={`/workspace/explore/${project.id}`}>
                  <div className="w-full aspect-[4/3] bg-gradient-to-br from-black/60 to-black/20 flex items-center justify-center relative overflow-hidden">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                        <div className="w-20 h-20 rounded-full bg-blue-500/10 blur-2xl absolute top-1/4 left-1/4" />
                        <div className="w-24 h-24 rounded-full bg-purple-500/10 blur-2xl absolute bottom-1/4 right-1/4" />
                        <div className="glass-panel p-3 rounded-2xl border border-white/10 shadow-glow group-hover:scale-110 transition-transform duration-500">
                          <Box className="w-8 h-8 text-white/50" />
                        </div>
                      </>
                    )}
                  </div>
                </Link>

                <div className="p-5">
                  <Link href={`/workspace/explore/${project.id}`}>
                    <h3 className="text-lg font-bold mb-3 group-hover:text-blue-400 transition-colors truncate">{project.name}</h3>
                  </Link>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <img src={`/avatars/avatar_${project.social.author_avatar_id || 1}.png`} alt="Avatar" className="w-6 h-6 rounded-full border border-white/10" />
                      <span className="text-xs font-medium text-foreground/70">{project.social.author_nickname || 'Anonimo'}</span>
                    </div>
                    <span className="text-[10px] text-foreground/40 font-medium">
                      {formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: it })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    <button 
                      onClick={() => toggleLike(project.id, project.social.likes || [])}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${hasLiked ? 'text-red-500' : 'text-foreground/50 hover:text-red-400'}`}
                    >
                      <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                      {project.social.likes?.length || 0}
                    </button>
                    <Link href={`/workspace/explore/${project.id}`} className="flex items-center gap-1.5 text-xs font-bold text-foreground/50 hover:text-blue-400 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      {project.social.comments?.length || 0}
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
