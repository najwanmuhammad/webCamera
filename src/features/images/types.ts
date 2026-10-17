import type { WatermarkSettings } from '@/features/watermark/types';
import type {
  PhotoMetadata,
  LocationEvidence,
} from '@/features/metadata/types';
export type AspectRatio = '3:4' | '9:16';
export interface NormalizedCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Photo {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  source: 'camera' | 'gallery';
  capturedAt: string;
  metadata: PhotoMetadata;
  watermark: WatermarkSettings;
  metadataRevision: number;
  location: LocationEvidence;
  aspectRatio: AspectRatio;
  crop: NormalizedCrop;
}
export const ratioValue = (ratio: AspectRatio) =>
  ratio === '3:4' ? 3 / 4 : 9 / 16;
