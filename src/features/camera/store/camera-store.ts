import { create } from 'zustand';
import type { AspectRatio } from '@/features/images/types';
export type { AspectRatio } from '@/features/images/types';
interface CameraState {
  aspectRatio: AspectRatio;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
}
export const useCameraStore = create<CameraState>((set) => ({
  aspectRatio: '3:4',
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
}));
