"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Loader2, ArrowLeft, Heart, MessageCircle, X, Send, Reply, ChevronDown, ChevronUp, Trash2, Flag, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
import dynamic from 'next/dynamic';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { GlassAvatar } from "@/components/ui/GlassAvatar";

const RoomViewer3D = dynamic(
  () => import("@/components/workspace/RoomViewer3D").then((mod) => mod.RoomViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest animate-pulse">Caricamento Motore 3D...</span>
      </div>
    )
  }
);

export default function ReadOnlyProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightCommentId = searchParams?.get('highlightCommentId');
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string | null>(null);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<number>(5);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  
  const [reportingComment, setReportingComment] = useState<any>(null);
  const [reportCategory, setReportCategory] = useState<string>('Spam o messaggi indesiderati');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  const isAdmin = currentUserData?.email === 'giannoneluigi10@gmail.com';
  
  const setReadOnly = useWorkspaceStore(state => state.setReadOnly);

  useEffect(() => {
    async function loadProject() {
      if (!id) return;
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setCurrentUserData(user.user_metadata);
      }

      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      
      if (data && !error) {
        setProjectData(data);
        setReadOnly(true);
        if (data.data?.workspaceData) {
          let safeCustomUrl = data.data.workspaceData.custom3DModelUrl;
          if (typeof safeCustomUrl === 'string' && safeCustomUrl.startsWith('blob:')) {
            safeCustomUrl = null;
          }

          let safeAddedObjects = data.data.workspaceData.addedObjects || [];
          if (Array.isArray(safeAddedObjects)) {
            safeAddedObjects = safeAddedObjects.map((obj: any) => {
              if (typeof obj.modelUrl === 'string' && obj.modelUrl.startsWith('blob:')) {
                return { ...obj, modelUrl: undefined, type: 'cube' };
              }
              return obj;
            });
          }

          useWorkspaceStore.setState({
            addedObjects: safeAddedObjects,
            nodeTransformations: data.data.workspaceData.nodeTransformations || {},
            custom3DModelUrl: safeCustomUrl,
          });
        }
      }
      setLoading(false);
    }
    loadProject();

    return () => {
      useWorkspaceStore.getState().setReadOnly(false);
    };
  }, [id]);

  useEffect(() => {
    if (highlightCommentId && projectData) {
      setShowComments(true);
      setHighlightedId(highlightCommentId);
      
      const comments = projectData.data.social?.comments || [];
      for (const c of comments) {
        if (c.id === highlightCommentId || c.replies?.some((r: any) => r.id === highlightCommentId)) {
          setExpandedThreadId(c.id);
          break;
        }
      }
      
      setTimeout(() => {
        const el = document.getElementById(`comment-${highlightCommentId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove highlight very slowly after 3 seconds
        setTimeout(() => setHighlightedId(null), 3000);
      }, 800); // slightly longer delay to allow the chat sidebar to slide in first
    }
  }, [highlightCommentId, projectData]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !projectData || !currentUserId) return;
    
    const comment = {
      id: crypto.randomUUID(),
      author_nickname: currentUserData?.nickname || 'Anonimo',
      author_avatar_id: currentUserData?.avatar_id || 1,
      author_id: currentUserId,
      text: newComment.trim(),
      created_at: new Date().toISOString(),
      likes: [],
      replies: []
    };

    let updatedComments = [...(projectData.data.social?.comments || [])];

    if (replyingToId) {
      updatedComments = updatedComments.map((c: any) => {
        if (c.id === replyingToId) {
          return { ...c, replies: [...(c.replies || []), comment] };
        }
        return c;
      });
    } else {
      updatedComments.push(comment);
    }
    
    const updatedData = {
      ...projectData.data,
      social: {
        ...projectData.data.social,
        comments: updatedComments
      }
    };

    setProjectData({ ...projectData, data: updatedData });
    setNewComment("");
    setReplyingToId(null);
    setReplyingToName(null);

    const supabase = createClient();
    await supabase.from('projects').update({ data: updatedData }).eq('id', id);
  };

  const handleDeleteComment = async (commentId: string, parentId?: string, byAdmin: boolean = false) => {
    if (!projectData) return;
    
    let updatedComments = [...(projectData.data.social?.comments || [])];
    
    const deletionText = byAdmin ? "Commento rimosso dalla Moderazione." : "Questo commento è stato rimosso dall'autore.";

    if (parentId) {
      const parentIndex = updatedComments.findIndex(c => c.id === parentId);
      if (parentIndex > -1) {
        const parent = { ...updatedComments[parentIndex] };
        parent.replies = (parent.replies || []).map((r: any) => {
          if (r.id === commentId) {
            return { ...r, is_deleted: true, deleted_by_admin: byAdmin, original_text: r.text, text: deletionText };
          }
          return r;
        });
        updatedComments[parentIndex] = parent;
      }
    } else {
      const index = updatedComments.findIndex(c => c.id === commentId);
      if (index > -1) {
        const comment = updatedComments[index];
        if (comment.replies && comment.replies.length > 0) {
          updatedComments[index] = { ...comment, is_deleted: true, deleted_by_admin: byAdmin, original_text: comment.text, text: deletionText };
        } else {
          updatedComments.splice(index, 1);
        }
      }
    }

    const updatedData = {
      ...projectData.data,
      social: {
        ...projectData.data.social,
        comments: updatedComments
      }
    };

    setProjectData({ ...projectData, data: updatedData });

    const supabase = createClient();
    await supabase.from('projects').update({ data: updatedData }).eq('id', id);
  };

  const handleRestoreComment = async (commentId: string, parentId?: string) => {
    if (!projectData || !isAdmin) return;
    
    let updatedComments = [...(projectData.data.social?.comments || [])];

    if (parentId) {
      const parentIndex = updatedComments.findIndex(c => c.id === parentId);
      if (parentIndex > -1) {
        const parent = { ...updatedComments[parentIndex] };
        parent.replies = (parent.replies || []).map((r: any) => {
          if (r.id === commentId && r.is_deleted && r.deleted_by_admin) {
            return { ...r, is_deleted: false, deleted_by_admin: false, text: r.original_text };
          }
          return r;
        });
        updatedComments[parentIndex] = parent;
      }
    } else {
      const index = updatedComments.findIndex(c => c.id === commentId);
      if (index > -1) {
        const comment = updatedComments[index];
        if (comment.is_deleted && comment.deleted_by_admin) {
          updatedComments[index] = { ...comment, is_deleted: false, deleted_by_admin: false, text: comment.original_text };
        }
      }
    }

    const updatedData = {
      ...projectData.data,
      social: {
        ...projectData.data.social,
        comments: updatedComments
      }
    };

    setProjectData({ ...projectData, data: updatedData });

    const supabase = createClient();
    await supabase.from('projects').update({ data: updatedData }).eq('id', id);
  };

  const submitReport = async () => {
    if (!currentUserId || !projectData || !reportingComment) return;
    
    const finalReason = reportCategory === 'Altro' ? `Altro: ${reportDetails.trim()}` : reportCategory;
    if (reportCategory === 'Altro' && !reportDetails.trim()) return;
    
    setIsSubmittingReport(true);
    const supabase = createClient();
    await supabase.from('reported_comments').insert({
      project_id: id,
      comment_id: reportingComment.id,
      reporter_id: currentUserId,
      reason: finalReason,
      status: 'pending'
    });

    setIsSubmittingReport(false);
    setReportingComment(null);
    setReportCategory('Spam o messaggi indesiderati');
    setReportDetails('');
    setShowReportSuccess(true);
    setTimeout(() => setShowReportSuccess(false), 3000);
  };

  const handleLikeComment = async (commentId: string, parentId?: string) => {
    if (!currentUserId || !projectData) return;
    
    const updatedComments = [...(projectData.data.social?.comments || [])];
    
    const toggleLike = (likes: string[] = []) => {
      if (likes.includes(currentUserId)) {
        return likes.filter(id => id !== currentUserId);
      }
      return [...likes, currentUserId];
    };

    if (parentId) {
      const parentIndex = updatedComments.findIndex(c => c.id === parentId);
      if (parentIndex > -1) {
        const parent = { ...updatedComments[parentIndex] };
        parent.replies = (parent.replies || []).map((r: any) => {
          if (r.id === commentId) {
            return { ...r, likes: toggleLike(r.likes) };
          }
          return r;
        });
        updatedComments[parentIndex] = parent;
      }
    } else {
      const index = updatedComments.findIndex(c => c.id === commentId);
      if (index > -1) {
        updatedComments[index] = {
          ...updatedComments[index],
          likes: toggleLike(updatedComments[index].likes)
        };
      }
    }

    const updatedData = {
      ...projectData.data,
      social: {
        ...projectData.data.social,
        comments: updatedComments
      }
    };

    setProjectData({ ...projectData, data: updatedData });

    const supabase = createClient();
    await supabase.from('projects').update({ data: updatedData }).eq('id', id);
  };

  const handleToggleLike = async () => {
    if (!currentUserId || !projectData) return;
    
    const currentLikes = projectData.data.social?.likes || [];
    const hasLiked = currentLikes.includes(currentUserId);
    
    const newLikes = hasLiked 
      ? currentLikes.filter((userId: string) => userId !== currentUserId)
      : [...currentLikes, currentUserId];

    const updatedData = {
      ...projectData.data,
      social: {
        ...projectData.data.social,
        likes: newLikes
      }
    };

    setProjectData({ ...projectData, data: updatedData });

    const supabase = createClient();
    await supabase.from('projects').update({ data: updatedData }).eq('id', id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h2 className="text-xl font-bold mb-4">Progetto non trovato</h2>
        <Link href="/workspace/explore" className="text-blue-500 hover:underline">Torna a Esplora</Link>
      </div>
    );
  }

  const social = projectData.data?.social || {};
  const hasLiked = currentUserId ? social.likes?.includes(currentUserId) : false;

  const sortedComments = [...(social.comments || [])].sort((a: any, b: any) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    const likesA = a.likes?.length || 0;
    const likesB = b.likes?.length || 0;
    
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const scoreA = dateA + (likesA * twoHoursMs);
    const scoreB = dateB + (likesB * twoHoursMs);
    
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-black relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-50 p-2 sm:p-4 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-4 max-w-[65%] sm:max-w-[70%]">
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
          
          <div className="glass-panel px-3 py-2 sm:px-5 sm:py-3 rounded-[16px] sm:rounded-[20px] flex flex-col justify-center shadow-lg min-w-0">
            <h1 className="font-semibold text-white/95 text-sm sm:text-base tracking-wide leading-none mb-1.5 sm:mb-2 truncate">{projectData.name}</h1>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <GlassAvatar 
                id={social.author_avatar_id || 1}
                className="w-4 h-4 sm:w-5 sm:h-5 shadow-sm shrink-0"
                iconClassName="w-2 h-2 sm:w-2.5 sm:h-2.5"
              />
              <span className="text-[10px] sm:text-[11px] font-medium text-white/80 tracking-wide truncate">{social.author_nickname || 'Anonimo'}</span>
              <span className="hidden sm:inline text-[10px] text-white/30 px-0.5 shrink-0">•</span>
              <span className="hidden sm:inline text-[11px] text-white/50 truncate">{formatDistanceToNow(new Date(projectData.created_at), { addSuffix: true, locale: it })}</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center shrink-0">
          <div className="glass-panel px-3 py-2 sm:px-4 sm:py-2 rounded-[16px] sm:rounded-[20px] flex items-center gap-3 sm:gap-4 shadow-lg">
            <button 
              onClick={handleToggleLike}
              className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold transition-colors ${hasLiked ? 'text-red-500' : 'text-white hover:text-red-400'}`}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${hasLiked ? 'fill-current' : ''}`} />
              {social.likes?.length || 0}
            </button>
            <button 
              onClick={() => setShowComments(true)}
              className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-blue-400 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {social.comments?.length || 0}
            </button>
          </div>
        </div>
      </div>

      {reportingComment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[90] flex items-center justify-center p-4">
          <div className="bg-black/60 backdrop-blur-[40px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.37)] rounded-[24px] w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 sm:p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Segnala Commento
              </h3>
              <button 
                onClick={() => { setReportingComment(null); setReportCategory('Spam o messaggi indesiderati'); setReportDetails(''); }}
                className="w-8 h-8 rounded-full glass-button flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-5">
              <div className="glass-panel border border-white/10 rounded-[16px] p-4">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Stai segnalando:</p>
                <div className="flex items-center gap-2 mb-2">
                  <GlassAvatar 
                    id={reportingComment.author_avatar_id || 1}
                    className="w-6 h-6 shadow-sm shrink-0"
                    iconClassName="w-3 h-3"
                  />
                  <span className="font-semibold text-sm text-white/90">{reportingComment.author_nickname || 'Anonimo'}</span>
                </div>
                <p className="text-sm text-white/70 italic border-l-2 border-white/20 pl-3">"{reportingComment.text}"</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Motivo principale</label>
                  <select 
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-[12px] p-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:bg-white/5 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Spam o messaggi indesiderati">Spam o messaggi indesiderati</option>
                    <option value="Contenuto offensivo o molesto">Contenuto offensivo o molesto</option>
                    <option value="Fuori tema / Non attinente">Fuori tema / Non attinente</option>
                    <option value="Altro">Altro (specificare)</option>
                  </select>
                </div>
                
                {reportCategory === 'Altro' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-white/80 mb-2">Dettagli aggiuntivi</label>
                    <textarea 
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Descrivi brevemente il problema..."
                      className="w-full bg-black/40 border border-white/10 rounded-[12px] p-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:bg-white/5 transition-all resize-none min-h-[80px]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 border-t border-white/10 bg-black/20 flex gap-3 justify-end shrink-0">
              <button 
                onClick={() => { setReportingComment(null); setReportCategory('Spam o messaggi indesiderati'); setReportDetails(''); }}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={submitReport}
                disabled={isSubmittingReport || (reportCategory === 'Altro' && !reportDetails.trim())}
                className="px-5 py-2.5 rounded-full text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
              >
                {isSubmittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                Conferma 
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in">
          <CheckCircle className="w-5 h-5" />
          Segnalazione inviata!
        </div>
      )}

      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm z-[85] transition-opacity duration-500 ${showComments ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setShowComments(false)}
      />

      <div className={`absolute top-0 right-0 h-full w-full sm:w-[400px] max-w-full bg-black/60 backdrop-blur-[40px] border-l border-white/10 z-[90] flex flex-col transition-transform duration-500 shadow-2xl ${showComments ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 sm:p-6 border-b border-white/10 flex justify-between items-center shrink-0 bg-black/20">
          <h2 className="text-lg font-bold text-white/95 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            Commenti ({social.comments?.length || 0})
          </h2>
          <button onClick={() => setShowComments(false)} className="w-8 h-8 flex items-center justify-center glass-button rounded-full hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!sortedComments || sortedComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center border border-white/5">
                <MessageCircle className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 text-sm font-medium">Nessun commento.<br/>Sii il primo a rompere il ghiaccio!</p>
            </div>
          ) : (
            sortedComments.map((comment: any) => (
              <div key={comment.id} id={`comment-${comment.id}`} className="flex flex-col gap-2">
                <div className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-[20px] transition-all duration-1000 ease-in-out ${comment.id === highlightedId ? 'bg-yellow-500/20 border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] scale-[1.02] z-10' : (comment.is_deleted ? ('bg-white/[0.03] border border-white/5 ' + (isAdmin ? 'opacity-80' : 'opacity-60 grayscale')) : 'bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] shadow-sm')}`}>
                  <div className="shrink-0 pt-0.5">
                    <GlassAvatar 
                      id={comment.is_deleted ? 1 : (comment.author_avatar_id || 1)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 ${comment.is_deleted ? 'opacity-50 grayscale' : 'shadow-lg'}`}
                      iconClassName="w-4 h-4 sm:w-5 sm:h-5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1 gap-2">
                      <span className="font-semibold text-[13px] sm:text-sm text-white/95 truncate">{comment.is_deleted ? (comment.deleted_by_admin ? '[Moderato]' : '[Cancellato]') : (comment.author_nickname || 'Anonimo')}</span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-white/40 whitespace-nowrap shrink-0">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: it })}</span>
                    </div>
                    <p className={`text-[13px] sm:text-sm leading-relaxed break-words mb-2 ${comment.is_deleted ? (isAdmin ? 'text-red-400 font-medium' : (comment.deleted_by_admin ? 'text-red-400/50 italic' : 'text-white/40 italic')) : 'text-white/80'}`}>
                      {comment.is_deleted && isAdmin ? `[ORIGINALE]: ${comment.original_text || comment.text}` : comment.text}
                    </p>
                    
                    {comment.is_deleted && comment.deleted_by_admin && isAdmin && (
                      <div className="flex justify-end mt-1">
                        <button onClick={() => handleRestoreComment(comment.id)} className="flex items-center gap-1.5 text-[11px] font-bold text-green-400 hover:text-green-300 transition-colors bg-green-400/10 hover:bg-green-400/20 px-2 py-1 rounded">
                          <RotateCcw className="w-3 h-3" />
                          Ripristina Commento
                        </button>
                      </div>
                    )}
                    
                    {!comment.is_deleted && (
                      <div className="flex items-center gap-4 text-[11px] font-bold text-white/50">
                        <button 
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1.5 transition-colors ${comment.likes?.includes(currentUserId) ? 'text-red-500' : 'hover:text-red-400'}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${comment.likes?.includes(currentUserId) ? 'fill-current' : ''}`} />
                          {comment.likes?.length || 0}
                        </button>
                        <button 
                          onClick={() => { setReplyingToId(comment.id); setReplyingToName(comment.author_nickname || 'Anonimo'); }}
                          className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          Rispondi
                        </button>
                        {comment.author_id !== currentUserId && comment.author_nickname !== currentUserData?.nickname && !isAdmin && (
                          <button onClick={() => setReportingComment(comment)} className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors ml-auto text-white/30 hover:text-white/80">
                            <Flag className="w-3 h-3" />
                          </button>
                        )}
                        {(isAdmin || comment.author_id === currentUserId || (!comment.author_id && comment.author_nickname === currentUserData?.nickname)) && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id, undefined, isAdmin && comment.author_id !== currentUserId)} 
                            className="flex items-center gap-1.5 hover:text-red-400 transition-colors ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 sm:ml-12 pl-4 border-l-2 border-white/10 space-y-3">
                    {expandedThreadId !== comment.id ? (
                      <button 
                        onClick={() => { setExpandedThreadId(comment.id); setVisibleRepliesCount(5); }}
                        className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors py-1"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Mostra {comment.replies.length} rispost{comment.replies.length === 1 ? 'a' : 'e'}
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setExpandedThreadId(null)}
                          className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-white/50 hover:text-white transition-colors py-1 mb-2"
                        >
                          <ChevronUp className="w-4 h-4" />
                          Nascondi risposte
                        </button>

                        {comment.replies.slice(0, visibleRepliesCount).map((reply: any) => (
                          <div key={reply.id} id={`comment-${reply.id}`} className={`flex gap-3 p-3 rounded-[16px] relative group transition-all duration-1000 ease-in-out ${reply.id === highlightedId ? 'bg-yellow-500/20 border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] scale-[1.02] z-10' : (reply.is_deleted ? ('bg-white/[0.02] border border-white/5 ' + (isAdmin ? 'opacity-80' : 'opacity-60 grayscale')) : 'bg-white/[0.02] border border-white/5')}`}>
                            <div className="absolute -left-6 top-6 w-5 h-px bg-white/10" />
                            <div className="shrink-0 pt-0.5">
                              <GlassAvatar 
                                id={reply.is_deleted ? 1 : (reply.author_avatar_id || 1)}
                                className={`w-6 h-6 sm:w-8 sm:h-8 shadow-sm shrink-0 ${reply.is_deleted ? 'opacity-50 grayscale' : ''}`}
                                iconClassName="w-3 h-3 sm:w-4 sm:h-4"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="font-semibold text-[12px] sm:text-[13px] text-white/90 truncate">{reply.is_deleted ? (reply.deleted_by_admin ? '[Moderato]' : '[Cancellato]') : (reply.author_nickname || 'Anonimo')}</span>
                                <span className="text-[9px] sm:text-[10px] font-medium text-white/40 whitespace-nowrap shrink-0">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: it })}</span>
                              </div>
                              <p className={`text-[12px] sm:text-[13px] leading-relaxed break-words mb-1.5 ${reply.is_deleted ? (isAdmin ? 'text-red-400 font-medium' : (reply.deleted_by_admin ? 'text-red-400/50 italic' : 'text-white/40 italic')) : 'text-white/70'}`}>
                                {reply.is_deleted && isAdmin ? `[ORIGINALE]: ${reply.original_text || reply.text}` : reply.text}
                              </p>
                              
                              {reply.is_deleted && reply.deleted_by_admin && isAdmin && (
                                <div className="flex justify-end mb-2">
                                  <button onClick={() => handleRestoreComment(reply.id, comment.id)} className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 hover:text-green-300 transition-colors bg-green-400/10 hover:bg-green-400/20 px-2 py-1 rounded">
                                    <RotateCcw className="w-3 h-3" />
                                    Ripristina Risposta
                                  </button>
                                </div>
                              )}
                              
                              {!reply.is_deleted && (
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => handleLikeComment(reply.id, comment.id)}
                                    className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${reply.likes?.includes(currentUserId) ? 'text-red-500' : 'text-white/40 hover:text-red-400'}`}
                                  >
                                    <Heart className={`w-3 h-3 ${reply.likes?.includes(currentUserId) ? 'fill-current' : ''}`} />
                                    {reply.likes?.length || 0}
                                  </button>
                                  {reply.author_id !== currentUserId && reply.author_nickname !== currentUserData?.nickname && !isAdmin && (
                                    <button onClick={() => setReportingComment(reply)} className="flex items-center gap-1 hover:text-yellow-400 transition-colors ml-auto text-white/30 hover:text-white/80">
                                      <Flag className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                  {(isAdmin || reply.author_id === currentUserId || (!reply.author_id && reply.author_nickname === currentUserData?.nickname)) && (
                                    <button 
                                      onClick={() => handleDeleteComment(reply.id, comment.id, isAdmin && reply.author_id !== currentUserId)} 
                                      className="flex items-center gap-1 text-[10px] font-bold text-white/40 hover:text-red-400 transition-colors ml-auto"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {visibleRepliesCount < comment.replies.length && (
                          <button 
                            onClick={() => setVisibleRepliesCount(prev => prev + 5)}
                            className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors py-2"
                          >
                            <ChevronDown className="w-4 h-4" />
                            Mostra altre {comment.replies.length - visibleRepliesCount} risposte
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl shrink-0 pb-safe flex flex-col gap-3">
          {currentUserId ? (
            <>
              {replyingToId && (
                <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                  <span className="text-xs text-blue-400 font-medium">
                    Stai rispondendo a <span className="font-bold text-blue-300">{replyingToName}</span>
                  </span>
                  <button onClick={() => { setReplyingToId(null); setReplyingToName(null); }} className="text-white/50 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex gap-2 sm:gap-3">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Scrivi un commento..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                  onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                />
                <button 
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center bg-blue-500/90 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/30"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-0.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center bg-white/5 border border-white/10 rounded-xl py-3 px-4">
              <p className="text-xs text-white/60">Devi accedere per poter commentare.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3D Canvas area */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <RoomViewer3D />
      </div>

      {/* Overlay Disclaimer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-3 rounded-full pointer-events-none">
        <p className="text-xs font-bold text-white/50 tracking-wider uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Modalità Sola Lettura
        </p>
      </div>
    </div>
  );
}
