import { create } from 'zustand';

interface Photo {
  url: string;
  edgeUrl: string;
  name: string;
}

interface WorkspaceState {
  photos: Photo[];
  dimensions: any;
  setPhotos: (photos: Photo[]) => void;
  setDimensions: (dims: any) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  photos: [],
  dimensions: null,
  setPhotos: (photos) => set({ photos }),
  setDimensions: (dimensions) => set({ dimensions }),
}));