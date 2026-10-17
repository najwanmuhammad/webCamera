import { useEffect, useRef, useState } from 'react';
import { captureFrame, importFile } from '@/features/images/image-processing';
import type { AspectRatio, Photo } from '@/features/images/types';
import { usePhotoStore } from '@/features/editor/store/photo-store';

export function usePhotoImport() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(true);
  const lock = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function processPhoto(create: () => Promise<Photo>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const photo = await create();
      if (!active.current) {
        URL.revokeObjectURL(photo.url);
        return;
      }
      usePhotoStore.getState().setPhoto(photo);
    } catch (cause) {
      if (active.current)
        setError(
          cause instanceof Error
            ? cause.message
            : 'Foto gagal diproses. Pilih foto lain atau coba lagi.',
        );
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  }

  function capture(video: HTMLVideoElement, ratio: AspectRatio) {
    const capturedAt = new Date().toISOString();
    return processPhoto(() => captureFrame(video, ratio, capturedAt));
  }
  function importPhoto(file: File, ratio: AspectRatio) {
    const importedAt = new Date().toISOString();
    return processPhoto(() => importFile(file, ratio, importedAt));
  }
  return { busy, error, capture, importPhoto };
}
