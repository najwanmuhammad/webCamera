import { decodeImage } from '@/features/images/image-processing';
import { renderPhoto } from '@/features/images/render-photo';
import type { Photo } from '@/features/images/types';
import { metadataSchema } from '@/features/metadata/metadata';

export type ExportSize = 'native' | 'compact';
export function exportDimensions(
  photo: Pick<Photo, 'width' | 'height' | 'crop' | 'aspectRatio'>,
  size: ExportSize,
) {
  const [numerator, denominator] =
    photo.aspectRatio === '3:4' ? ([3, 4] as const) : ([9, 16] as const);
  const availableWidth = photo.width * photo.crop.width;
  const availableHeight = photo.height * photo.crop.height;
  // Round down by whole ratio units; no stretched pixels or silent upscaling.
  let units = Math.floor(
    Math.min(availableWidth / numerator, availableHeight / denominator) + 1e-7,
  );
  if (size === 'compact')
    units = Math.min(units, Math.floor(2048 / denominator));
  if (units < 1)
    throw new Error(
      'Foto terlalu kecil untuk diekspor dengan rasio ini. Pilih foto yang lebih besar.',
    );
  return { width: units * numerator, height: units * denominator };
}

export async function exportPhoto(
  photo: Photo,
  quality: number,
  size: ExportSize,
  signal: AbortSignal,
) {
  if (!metadataSchema.safeParse(photo.metadata).success)
    throw new Error('Periksa tanggal dan metadata sebelum menyimpan foto.');
  if (!Number.isFinite(quality) || quality < 0.6 || quality > 1)
    throw new Error('Kualitas JPG harus antara 60 dan 100%.');
  const { width, height } = exportDimensions(photo, size);
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const pixelLimit = memory && memory <= 4 ? 12_000_000 : 24_000_000;
  if (width * height > pixelLimit)
    throw new Error(
      'Resolusi asli memerlukan terlalu banyak memori. Pilih ukuran hemat (maks. 2048 piksel) atau gunakan perangkat dengan memori lebih besar.',
    );
  signal.throwIfAborted();
  const decoded = await decodeImage(photo.blob);
  const canvas = document.createElement('canvas');
  try {
    signal.throwIfAborted();
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error(
        'Memori Canvas tidak tersedia. Coba ukuran hemat atau foto yang lebih kecil.',
      );
    // JPEG has no alpha; flatten transparent gallery images onto white.
    renderPhoto(context, decoded.image, photo, width, height);
    signal.throwIfAborted();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result && result.type === 'image/jpeg'
            ? resolve(result)
            : reject(
                new Error(
                  'JPG gagal dibuat. Coba ukuran hemat atau foto yang lebih kecil.',
                ),
              ),
        'image/jpeg',
        quality,
      ),
    );
    signal.throwIfAborted();
    return {
      blob,
      width,
      height,
      filename: `GeoStamp-${photo.metadata.localTimestamp.replace(/[^0-9]/g, '')}.jpg`,
    };
  } finally {
    decoded.release();
    canvas.width = canvas.height = 0;
  }
}
