import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkspaceState } from './workspaceStore';

export interface SavedProject {
  id: string;
  name: string;
  date: string;
  thumbnail?: string;
  
  // The complete serialized state of the workspace for this project
  workspaceData: Partial<WorkspaceState>;
}

interface ProjectsState {
  projects: SavedProject[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  saveProject: (name: string, workspaceData: Partial<WorkspaceState>, isPublic?: boolean, thumbnail?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

import { createClient } from "@/utils/supabase/client";
import { useWorkspaceStore } from './workspaceStore';
import { get as idbGet } from 'idb-keyval';

export const useProjectsStore = create<ProjectsState>()((set, get) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async () => {
    // Deprecated: history page now fetches directly from Supabase.
  },

  saveProject: async (name, workspaceData, isPublic = false, thumbnail) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      useWorkspaceStore.getState().addNotification({ message: "Devi effettuare l'accesso per salvare i progetti in Cloud.", type: "error" });
      return;
    }

    // Controlla se esiste già un progetto con questo nome per questo utente
    try {
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', name)
        .single();
        
      if (existingProject) {
        useWorkspaceStore.getState().addNotification({ message: `Hai già un progetto chiamato "${name}". Scegli un nome diverso.`, type: "error" });
        return;
      }
    } catch (e) {
      // Ignora l'errore se non trova nulla (PGRST116 è l'errore per "0 rows returned" da .single())
    }

    const safeWorkspaceData = { ...workspaceData };
    
    if (safeWorkspaceData.custom3DModelUrl?.startsWith('blob:')) {
      safeWorkspaceData.custom3DModelUrl = null;
    }
    
    if (safeWorkspaceData.addedObjects) {
      safeWorkspaceData.addedObjects = safeWorkspaceData.addedObjects.map(obj => {
        if (obj.modelUrl?.startsWith('blob:')) {
          return { ...obj, modelUrl: undefined, type: 'cube' };
        }
        return obj;
      });
    }

    const projectData: any = { workspaceData: safeWorkspaceData };
    if (thumbnail) {
      projectData.thumbnail = thumbnail;
    }
    
    if (isPublic) {
      projectData.social = {
        is_public: true,
        author_nickname: user.user_metadata?.nickname || 'Anonimo',
        author_avatar_id: user.user_metadata?.avatar_id || 1,
        likes: [],
        comments: []
      };

      // Upload local GLB file to Supabase Storage if present
      if (safeWorkspaceData.custom3DModelUrl?.startsWith('idb://')) {
        const fileId = safeWorkspaceData.custom3DModelUrl.replace('idb://', '');
        
        const uploadNotificationId = 'upload-glb-info';
        useWorkspaceStore.getState().addNotification({ id: uploadNotificationId, message: "Upload del file 3D in corso...", type: "info" });

        // 1. Fetch limit and admin status
        let maxScans = 5;
        let isAdmin = false;
        try {
          const { data: settingsData } = await supabase.from('app_settings').select('value').eq('key', 'max_public_scans').single();
          if (settingsData && settingsData.value) {
            maxScans = parseInt(settingsData.value);
          }
          const { data: roleData } = await supabase.from('users_roles').select('role').eq('id', user.id).single();
          if (roleData && roleData.role === 'admin') isAdmin = true;
        } catch (e) {
          console.error("Error reading app_settings or role", e);
        }
        
        // 2. Count existing public scans
        try {
          const { data: userProjects } = await supabase.from('projects').select('data').eq('user_id', user.id);
          const publicScansCount = (userProjects || []).filter(p => {
            return p.data?.social?.is_public === true && 
                   p.data?.workspaceData?.cloudModelUrl;
          }).length;
          
          if (!isAdmin && publicScansCount >= maxScans) {
            useWorkspaceStore.getState().removeNotification('upload-glb-info');
            useWorkspaceStore.getState().addNotification({ message: `Hai raggiunto il limite massimo di ${maxScans} modelli scansionati pubblici. CanceIla un progetto pubblico per liberare spazio.`, type: "error" });
            return; // Abort save
          }
        } catch (e) {
          console.error("Error counting scans", e);
        }
        
        // 3. Upload file
        const file = await idbGet(fileId);
        if (file instanceof File || file instanceof Blob) {
          const fileExt = file instanceof File ? file.name.split('.').pop() : 'glb';
          const fileName = `${user.id}/${Date.now()}_${fileId}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('public-project')
            .upload(fileName, file, {
              contentType: file.type || 'model/gltf-binary',
              upsert: false
            });
            
          useWorkspaceStore.getState().removeNotification('upload-glb-info');
            
          if (uploadError) {
            console.error('Storage Upload Error:', uploadError);
            useWorkspaceStore.getState().addNotification({ message: "Errore nel caricamento del file 3D nel cloud. Verifica i permessi del bucket.", type: "error" });
            return; // Abort save if upload fails
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('public-project')
            .getPublicUrl(fileName);
            
          safeWorkspaceData.cloudModelUrl = publicUrlData.publicUrl;
          projectData.workspaceData.cloudModelUrl = publicUrlData.publicUrl;
        } else {
            useWorkspaceStore.getState().removeNotification('upload-glb-info');
            useWorkspaceStore.getState().addNotification({ message: "File 3D non trovato nel browser locale.", type: "error" });
            return;
        }
      }
    }

    try {
      const { error } = await supabase.from('projects').insert({
        user_id: user.id,
        name,
        data: projectData
      });

      if (error) {
        console.error("Failed to save project to Supabase:", error);
        useWorkspaceStore.getState().addNotification({ message: "Errore nel salvataggio in Cloud.", type: "error" });
      }
    } catch (error) {
      console.error("Failed to save project to DB:", error);
    }
  },
  
  deleteProject: async (id) => {
    // Deprecated: history page now handles deletes directly from Supabase.
  }
}));
