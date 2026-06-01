import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// Custom IndexedDB storage for Zustand to bypass localStorage 5MB limits
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface Photo {
  url: string;
  edgeUrl: string;
  name: string;
}

export interface DetectedFurniture {
  id: string;
  name: string;
  type: string;
  status: "keep" | "evaluate" | "replace";
}

export interface AppNotification {
  id: string;
  message: string;
  type: "info" | "success" | "error";
  link?: string;
}

export interface PendingTask {
  id: string;
  type: "inspiration" | "render";
  status: "loading";
}

export interface Interactive3DObject {
  id: string;
  type: string; // e.g. "box", "bed", "sofa", "custom"
  modelUrl?: string; // URL al file .glb se è un modello reale
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface FurnitureCatalogItem {
  id: string;
  name: string;
  type: string;
  thumbnailUrl: string;
  modelUrl?: string;
}

export interface NodeTransformation {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  visible?: boolean;
  color?: string;
  intensity?: number;
}

export interface RoomNode {
  id: string;
  name: string;
}

export interface HistoryState {
  nodeTransformations: Record<string, NodeTransformation>;
  addedObjects: Interactive3DObject[];
}

export interface CustomRoomConfig {
  shape?: 'rectangular' | 'l-shape' | 'chamfered' | 'attic' | 't-shape' | 'u-shape' | 'alcove' | 'double-pitch' | 'bow-window';
  width: number;
  length: number;
  height: number;
  doorsCount: number;
  windowsCount: number;
  wingWidth?: number;
  wingLength?: number;
  chamferSize?: number;
  kneeHeight?: number;
  ridgeHeight?: number;
  cutoutWidth?: number;
  cutoutLength?: number;
  alcoveWidth?: number;
  alcoveDepth?: number;
  alcoveOffset?: number;
  bowWidth?: number;
  bowDepth?: number;
}

export interface WorkspaceState {
  photos: Photo[];
  dimensions: any;
  detectedFurniture: DetectedFurniture[];
  geminiApiKey: string;
  freeGenerations: number;
  savedInspirations: string[];
  savedRenders: string[];
  notifications: AppNotification[];
  pendingTasks: PendingTask[];
  custom3DModelUrl: string | null;
  cloudModelUrl: string | null;
  customRoomConfig: CustomRoomConfig | null;
  selectedObjectId: string | null;
  addedObjects: Interactive3DObject[];
  roomNodes: RoomNode[];
  nodeTransformations: Record<string, NodeTransformation>;
  nodeDimensions: Record<string, [number, number, number]>;
  furnitureCatalog: FurnitureCatalogItem[];
  
  setPhotos: (photos: Photo[]) => void;
  setDimensions: (dims: any) => void;
  setDetectedFurniture: (furniture: DetectedFurniture[]) => void;
  setGeminiApiKey: (key: string) => void;
  incrementFreeGenerations: () => void;
  saveInspiration: (url: string) => void;
  deleteInspiration: (url: string) => void;
  saveRender: (url: string) => void;
  deleteRender: (url: string) => void;
  setCustom3DModelUrl: (url: string | null) => void;
  setCloudModelUrl: (url: string | null) => void;
  setCustomRoomConfig: (config: CustomRoomConfig | null) => void;
  
  add3DObject: (obj: Interactive3DObject) => void;
  update3DObject: (id: string, updates: Partial<Interactive3DObject>) => void;
  remove3DObject: (id: string) => void;
  
  setRoomNodes: (nodes: RoomNode[]) => void;
  setSelectedObjectId: (id: string | null) => void;
  setNodeDimension: (id: string, dim: [number, number, number]) => void;
  setNodeDimensions: (dims: Record<string, [number, number, number]>) => void;
  updateNodeTransformation: (nodeId: string, transform: NodeTransformation) => void;
  resetNodeTransformations: () => void;
  resetWorkspace: () => void;
  
  addNotification: (notification: Omit<AppNotification, "id"> & { id?: string }) => void;
  removeNotification: (id: string) => void;
  addPendingTask: (task: PendingTask) => void;
  removePendingTask: (id: string) => void;
  
  history: HistoryState[];
  saveToHistory: () => void;
  undo: () => void;
  
  loadedProjectOwner: string | null;
  setLoadedProjectOwner: (owner: string | null) => void;

  transformMode: "translate" | "rotate" | "scale";
  setTransformMode: (mode: "translate" | "rotate" | "scale") => void;
  isReadOnly: boolean;
  setReadOnly: (isReadOnly: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      photos: [],
      dimensions: null,
      detectedFurniture: [],
      geminiApiKey: "",
      freeGenerations: 0,
      savedInspirations: [],
      savedRenders: [],
      notifications: [],
      pendingTasks: [],
      custom3DModelUrl: null,
      cloudModelUrl: null,
      customRoomConfig: null,
      selectedObjectId: null,
      addedObjects: [],
      roomNodes: [],
      nodeTransformations: {},
      nodeDimensions: {},
      history: [],
      loadedProjectOwner: null,
      transformMode: "translate",
      isReadOnly: false,
      
      setTransformMode: (mode) => set({ transformMode: mode }),
      setReadOnly: (isReadOnly) => set({ isReadOnly }),
      furnitureCatalog: [
        {
          id: 'catalog_sofa',
          name: 'Divano (Base)',
          type: 'sofa',
          thumbnailUrl: '/catalog/sofa.png',
        },
        {
          id: 'catalog_tv',
          name: 'Televisore (Base)',
          type: 'tv',
          thumbnailUrl: '/catalog/tv.png',
        },
        {
          id: 'catalog_table',
          name: 'Tavolo (Base)',
          type: 'table',
          thumbnailUrl: '/catalog/table.png',
        },
        {
          id: 'catalog_bed',
          name: 'Letto Matrimoniale (Base)',
          type: 'bed',
          thumbnailUrl: '/catalog/bed.png',
        },
        {
          id: 'catalog_closet',
          name: 'Armadio (Base)',
          type: 'closet',
          thumbnailUrl: '/catalog/closet.png',
        },
        {
          id: 'catalog_chair',
          name: 'Sedia (Base)',
          type: 'chair',
          thumbnailUrl: '/catalog/chair.png',
        },
        {
          id: 'catalog_cube',
          name: 'Cubo Scalabile',
          type: 'cube',
          thumbnailUrl: '/catalog/cube.png',
        }
      ],

      setPhotos: (photos: Photo[]) => set({ photos }),
      setDimensions: (dimensions: any) => set({ dimensions }),
      setDetectedFurniture: (detectedFurniture: DetectedFurniture[]) => set({ detectedFurniture }),
      setGeminiApiKey: (key: string) => set({ geminiApiKey: key }),
      incrementFreeGenerations: () => set((state: WorkspaceState) => ({ freeGenerations: state.freeGenerations + 1 })),
      saveInspiration: (url: string) => set((state: WorkspaceState) => ({ savedInspirations: [...state.savedInspirations, url] })),
      deleteInspiration: (url: string) => set((state: WorkspaceState) => ({ savedInspirations: state.savedInspirations.filter(u => u !== url) })),
      saveRender: (url: string) => set((state: WorkspaceState) => ({ savedRenders: [...state.savedRenders, url] })),
      deleteRender: (url: string) => set((state: WorkspaceState) => ({ savedRenders: state.savedRenders.filter(u => u !== url) })),
      setCustom3DModelUrl: (url: string | null) => set({ custom3DModelUrl: url }),
      setCloudModelUrl: (url: string | null) => set({ cloudModelUrl: url }),
      setCustomRoomConfig: (config: CustomRoomConfig | null) => set({ customRoomConfig: config }),
      setLoadedProjectOwner: (owner: string | null) => set({ loadedProjectOwner: owner }),

      saveToHistory: () => set((state: WorkspaceState) => {
        const currentState: HistoryState = {
          // Deep clone to prevent reference mutations
          nodeTransformations: JSON.parse(JSON.stringify(state.nodeTransformations)),
          addedObjects: JSON.parse(JSON.stringify(state.addedObjects))
        };
        return {
          history: [...state.history, currentState].slice(-20) // Keep last 20 states
        };
      }),
      
      undo: () => set((state: WorkspaceState) => {
        if (state.history.length === 0) return state;
        const newHistory = [...state.history];
        const lastState = newHistory.pop()!;
        return {
          history: newHistory,
          nodeTransformations: lastState.nodeTransformations,
          addedObjects: lastState.addedObjects
        };
      }),

      add3DObject: (obj: Interactive3DObject) => set((state: WorkspaceState) => {
        state.saveToHistory();
        return { addedObjects: [...state.addedObjects, obj] };
      }),
      update3DObject: (id: string, updates: Partial<Interactive3DObject>) => set((state: WorkspaceState) => {
        state.saveToHistory();
        return {
          addedObjects: state.addedObjects.map((o: Interactive3DObject) => o.id === id ? { ...o, ...updates } : o)
        };
      }),
      remove3DObject: (id: string) => set((state: WorkspaceState) => {
        state.saveToHistory();
        return {
          addedObjects: state.addedObjects.filter((o: Interactive3DObject) => o.id !== id)
        };
      }),
      
      setRoomNodes: (nodes: RoomNode[]) => set({ roomNodes: nodes }),
      setSelectedObjectId: (id: string | null) => set({ selectedObjectId: id }),
      setNodeDimension: (id: string, dim: [number, number, number]) => set((state: WorkspaceState) => ({ 
        nodeDimensions: { ...state.nodeDimensions, [id]: dim } 
      })),
      setNodeDimensions: (dims: Record<string, [number, number, number]>) => set((state: WorkspaceState) => ({
        nodeDimensions: { ...state.nodeDimensions, ...dims }
      })),
      
      updateNodeTransformation: (nodeId: string, transform: NodeTransformation) => set((state: WorkspaceState) => {
        state.saveToHistory();
        const prev = state.nodeTransformations[nodeId] || {};
        return {
          nodeTransformations: {
            ...state.nodeTransformations,
            [nodeId]: { ...prev, ...transform }
          }
        };
      }),
      resetNodeTransformations: () => set((state: WorkspaceState) => {
        state.saveToHistory();
        return { nodeTransformations: {} };
      }),
      
      resetWorkspace: () => set((state: WorkspaceState) => {
        state.saveToHistory();
        return {
          addedObjects: [],
          nodeTransformations: {},
          custom3DModelUrl: null,
          cloudModelUrl: null,
          customRoomConfig: null,
          roomNodes: [],
          nodeDimensions: {}
        };
      }),
      
      addNotification: (notification: Omit<AppNotification, "id"> & { id?: string }) => set((state: WorkspaceState) => {
        const id = notification.id || Date.now().toString();
        // Remove if already exists to replace it
        const filtered = state.notifications.filter((n: AppNotification) => n.id !== id);
        return { notifications: [...filtered, { ...notification, id } as AppNotification] };
      }),
      removeNotification: (id: string) => set((state: WorkspaceState) => ({
        notifications: state.notifications.filter((n: AppNotification) => n.id !== id)
      })),
      addPendingTask: (task: PendingTask) => set((state: WorkspaceState) => ({
        pendingTasks: [...state.pendingTasks, task]
      })),
      removePendingTask: (id: string) => set((state: WorkspaceState) => ({
        pendingTasks: state.pendingTasks.filter((t: PendingTask) => t.id !== id)
      })),
    }),
    {
      name: 'roomai-workspace-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => 
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['notifications', 'pendingTasks', 'furnitureCatalog', 'history'].includes(key))
        ) as unknown as WorkspaceState,
      merge: (persistedState: any, currentState: any) => {
        const safeState = { ...persistedState };
        
        // Strip legacy blob URLs during rehydration
        if (typeof safeState.custom3DModelUrl === 'string' && safeState.custom3DModelUrl.startsWith('blob:')) {
          safeState.custom3DModelUrl = null;
        }
        if (Array.isArray(safeState.addedObjects)) {
          safeState.addedObjects = safeState.addedObjects.map((obj: any) => {
            if (typeof obj.modelUrl === 'string' && obj.modelUrl.startsWith('blob:')) {
              return { ...obj, modelUrl: undefined, type: 'cube' };
            }
            return obj;
          });
        }

        return {
          ...currentState,
          ...safeState,
          pendingTasks: [],
          history: [], // Reset history on load
          furnitureCatalog: currentState.furnitureCatalog, // Usa sempre quello hardcoded nel codice
        };
      },
    }
  )
);