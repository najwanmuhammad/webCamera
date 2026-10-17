import type { Photo } from './types';
import { drawCrop } from './crop';
import { drawWatermark } from '@/features/watermark/render-watermark';

// Used by editor preview and intended for the full-resolution export in M4.
// Caller chooses Canvas size and owns decoding/closing the source image.
export function renderPhoto(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  photo: Photo,
  width: number,
  height: number,
) {
  drawCrop(
    context,
    image,
    photo.width,
    photo.height,
    photo.crop,
    width,
    height,
  );
  context.save();
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.restore();
  return drawWatermark(context, photo.metadata, photo.watermark, width, height);
}
