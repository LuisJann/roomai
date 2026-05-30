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
  saveProject: (name: string, workspaceData: Partial<WorkspaceState>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

import { createClient } from "@/utils/supabase/client";
import { useWorkspaceStore } from './workspaceStore';

export const useProjectsStore = create<ProjectsState>()((set, get) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async () => {
    // Deprecated: history page now fetches directly from Supabase.
  },

  saveProject: async (name, workspaceData) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      useWorkspaceStore.getState().addNotification({ message: "Devi effettuare l'accesso per salvare i progetti in Cloud.", type: "error" });
      return;
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

    try {
      const { error } = await supabase.from('projects').insert({
        user_id: user.id,
        name,
        data: { workspaceData: safeWorkspaceData }
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
