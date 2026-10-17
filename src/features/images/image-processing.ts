import { defaultWatermark } from '@/features/watermark/types';
import { initialMetadata } from '@/features/metadata/metadata';
import { centerCrop } from './crop';
import type { AspectRatio, Photo } from './types';

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
]);

function checkDimensions(width: number, height: number) {
  if (
    !width ||
    !height ||
    width * height > MAX_PIXELS ||
    Math.max(width, height) > 16384
  ) {
    throw new Error(
      'Foto terlalu besar atau dimensinya tidak valid. Gunakan foto hingga 40 MP dan sisi maksimal 16384 piksel.',
    );
  }
}

export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new Error(
                'Foto gagal diproses. Coba foto dengan ukuran lebih kecil.',
              ),
            ),
      'image/png',
    );
  });
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          'Foto tidak dapat dibaca. Coba JPG, PNG, WebP atau AVIF. Dukungan HEIC bergantung pada browser.',
        ),
      );
    image.src = url;
  });
}

export async function decodeImage(blob: Blob): Promise<{
  image: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: 'from-image',
      });
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Some browsers support the HTML image decoder for formats/options that
      // createImageBitmap cannot decode. Both apply embedded orientation.
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => {
        image.src = '';
        URL.revokeObjectURL(url);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function importFile(
  file: File,
  ratio: AspectRatio,
  capturedAt: string,
): Promise<Photo> {
  if (!file.size) throw new Error('File foto kosong. Pilih foto lain.');
  if (file.size > MAX_BYTES)
    throw new Error('Ukuran file maksimal 50 MB. Pilih foto yang lebih kecil.');
  if (
    file.type
      ? !IMAGE_TYPES.has(file.type.toLowerCase())
      : !/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name)
  ) {
    throw new Error(
      'Format tidak didukung. Pilih JPG, PNG, WebP, AVIF, atau HEIC jika didukung browser.',
    );
  }
  const decoded = await decodeImage(file);
  const canvas = document.createElement('canvas');
  try {
    checkDimensions(decoded.width, decoded.height);
    canvas.width = decoded.width;
    canvas.height = decoded.height;
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error('Browser tidak mendukung pemrosesan foto dengan Canvas.');
    context.drawImage(decoded.image, 0, 0);
    // PNG holds the oriented pixels, with no EXIF orientation to apply again.
    const blob = await canvasBlob(canvas);
    return makePhoto(
      blob,
      decoded.width,
      decoded.height,
      'gallery',
      ratio,
      capturedAt,
    );
  } finally {
    decoded.release();
    canvas.width = canvas.height = 0;
  }
}

export async function captureFrame(
  video: HTMLVideoElement,
  ratio: AspectRatio,
  capturedAt: string,
): Promise<Photo> {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight)
    throw new Error(
      'Kamera belum siap. Tunggu pratinjau tampil lalu coba lagi.',
    );
  checkDimensions(video.videoWidth, video.videoHeight);
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const width = canvas.width;
  const height = canvas.height;
  try {
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error(
        'Browser tidak mendukung pengambilan foto dengan Canvas.',
      );
    // Snapshot synchronously at shutter time; crop remains non-destructive.
    context.drawImage(video, 0, 0, width, height);
    return makePhoto(
      await canvasBlob(canvas),
      width,
      height,
      'camera',
      ratio,
      capturedAt,
    );
  } finally {
    canvas.width = canvas.height = 0;
  }
}

function makePhoto(
  blob: Blob,
  width: number,
  height: number,
  source: Photo['source'],
  aspectRatio: AspectRatio,
  capturedAt: string,
): Photo {
  return {
    blob,
    width,
    height,
    source,
    capturedAt,
    metadata: initialMetadata(capturedAt),
    watermark: defaultWatermark(),
    metadataRevision: 0,
    location: { fix: null, source: 'none', addressSource: 'none' },
    aspectRatio,
    crop: centerCrop(width, height, aspectRatio),
    url: URL.createObjectURL(blob),
  };
}
