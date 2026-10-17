import { ratioValue, type AspectRatio, type NormalizedCrop } from './types';

// Coordinates always refer to the full, orientation-normalized source image.
export function centerCrop(
  width: number,
  height: number,
  ratio: AspectRatio,
): NormalizedCrop {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error('Dimensi foto tidak valid.');
  }
  const target = ratioValue(ratio);
  const source = width / height;
  const cropWidth = source > target ? target / source : 1;
  const cropHeight = source > target ? 1 : source / target;
  return {
    x: (1 - cropWidth) / 2,
    y: (1 - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

export function moveCrop(
  crop: NormalizedCrop,
  x: number,
  y: number,
): NormalizedCrop {
  return {
    ...crop,
    x: Math.max(0, Math.min(1 - crop.width, x)),
    y: Math.max(0, Math.min(1 - crop.height, y)),
  };
}

// Shared drawing rule for editor preview and subsequent full-resolution export.
export function drawCrop(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  crop: NormalizedCrop,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    crop.x * sourceWidth,
    crop.y * sourceHeight,
    crop.width * sourceWidth,
    crop.height * sourceHeight,
    0,
    0,
    width,
    height,
  );
}
