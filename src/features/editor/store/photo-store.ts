import type { WatermarkSettings } from '@/features/watermark/types';
import { clampUnit } from '@/features/watermark/render-watermark';
import type { PhotoMetadata, GpsFix, Address } from '@/features/metadata/types';
import { create } from 'zustand';
import { centerCrop, moveCrop } from '@/features/images/crop';
import type { AspectRatio, Photo } from '@/features/images/types';

interface PhotoState {
  photo: Photo | null;
  setPhoto: (photo: Photo) => void;
  clearPhoto: () => void;
  setRatio: (ratio: AspectRatio) => void;
  updateWatermark: (patch: Partial<WatermarkSettings>) => void;
  updateMetadata: (patch: Partial<PhotoMetadata>) => void;
  applyGpsFix: (url: string, revision: number, fix: GpsFix) => void;
  applyAddress: (url: string, revision: number, address: Address) => void;
  setCropPosition: (x: number, y: number) => void;
}
export const usePhotoStore = create<PhotoState>((set) => ({
  photo: null,
  setPhoto: (photo) =>
    set((state) => {
      if (state.photo && state.photo.url !== photo.url)
        URL.revokeObjectURL(state.photo.url);
      return { photo };
    }),
  clearPhoto: () =>
    set((state) => {
      if (state.photo) URL.revokeObjectURL(state.photo.url);
      return { photo: null };
    }),
  setRatio: (aspectRatio) =>
    set((state) => ({
      photo: state.photo
        ? {
            ...state.photo,
            aspectRatio,
            crop: centerCrop(
              state.photo.width,
              state.photo.height,
              aspectRatio,
            ),
          }
        : null,
    })),
  updateWatermark: (patch) =>
    set((state) => {
      if (!state.photo) return {};
      const settings = { ...state.photo.watermark, ...patch };
      return {
        photo: {
          ...state.photo,
          watermark: {
            ...settings,
            x: clampUnit(settings.x),
            y: clampUnit(settings.y),
            backgroundOpacity: clampUnit(settings.backgroundOpacity),
            fontSize: Math.max(0.018, Math.min(0.05, settings.fontSize)),
          },
        },
      };
    }),
  updateMetadata: (patch) =>
    set((state) => {
      if (!state.photo) return {};
      const coordinatesChanged = 'latitude' in patch || 'longitude' in patch;
      const addressChanged = [
        'shortAddress',
        'city',
        'province',
        'country',
      ].some((key) => key in patch);
      return {
        photo: {
          ...state.photo,
          metadata: { ...state.photo.metadata, ...patch },
          metadataRevision: state.photo.metadataRevision + 1,
          location: {
            ...state.photo.location,
            ...(coordinatesChanged
              ? { source: 'manual' as const, fix: null }
              : {}),
            ...(addressChanged ? { addressSource: 'manual' as const } : {}),
          },
        },
      };
    }),
  applyGpsFix: (url, revision, fix) =>
    set((state) => {
      if (
        !state.photo ||
        state.photo.url !== url ||
        state.photo.metadataRevision !== revision
      )
        return {};
      return {
        photo: {
          ...state.photo,
          metadata: {
            ...state.photo.metadata,
            ...(state.photo.location.addressSource === 'provider'
              ? { shortAddress: '', city: '', province: '', country: '' }
              : {}),
            latitude: String(fix.latitude),
            longitude: String(fix.longitude),
          },
          location: {
            ...state.photo.location,
            fix,
            source: 'gps' as const,
            addressSource:
              state.photo.location.addressSource === 'provider'
                ? ('none' as const)
                : state.photo.location.addressSource,
          },
        },
      };
    }),
  applyAddress: (url, revision, address) =>
    set((state) => {
      if (
        !state.photo ||
        state.photo.url !== url ||
        state.photo.metadataRevision !== revision
      )
        return {};
      return {
        photo: {
          ...state.photo,
          metadata: { ...state.photo.metadata, ...address },
          location: {
            ...state.photo.location,
            addressSource: 'provider' as const,
          },
        },
      };
    }),
  setCropPosition: (x, y) =>
    set((state) => ({
      photo: state.photo
        ? { ...state.photo, crop: moveCrop(state.photo.crop, x, y) }
        : null,
    })),
}));
