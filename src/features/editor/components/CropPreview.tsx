import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { renderPhoto } from '@/features/images/render-photo';
import { WatermarkHandle } from '@/features/watermark/components/WatermarkHandle';
import type { WatermarkLayout } from '@/features/watermark/render-watermark';
import { loadImage } from '@/features/images/image-processing';
import type { Photo } from '@/features/images/types';
import { usePhotoStore } from '../store/photo-store';

export function CropPreview({
  photo,
  mode = 'crop',
}: {
  photo: Photo;
  mode?: 'crop' | 'watermark';
}) {
  const [layout, setLayout] = useState<WatermarkLayout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    id: number;
    x: number;
    y: number;
    cropX: number;
    cropY: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setCropPosition = usePhotoStore((state) => state.setCropPosition);

  const draw = useEffectEvent(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Pratinjau Canvas tidak tersedia di browser ini.');
      return;
    }
    const [numerator, denominator] =
      photo.aspectRatio === '3:4' ? ([3, 4] as const) : ([9, 16] as const);
    // A modest preview bitmap; original pixels stay untouched in photo.blob.
    const scale = Math.max(
      1,
      Math.min(
        Math.floor(840 / numerator),
        Math.floor((photo.width * photo.crop.width) / numerator),
      ),
    );
    canvas.width = numerator * scale;
    canvas.height = denominator * scale;
    const nextLayout = renderPhoto(
      context,
      image,
      photo,
      canvas.width,
      canvas.height,
    );
    setLayout((previous) =>
      previous &&
      previous.x === nextLayout.x &&
      previous.y === nextLayout.y &&
      previous.width === nextLayout.width &&
      previous.height === nextLayout.height
        ? previous
        : nextLayout,
    );
  });

  useEffect(() => {
    let cancelled = false;
    let loaded: HTMLImageElement | null = null;
    void loadImage(photo.url)
      .then((image) => {
        if (cancelled) {
          image.src = '';
          return;
        }
        loaded = image;
        imageRef.current = image;
        draw();
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Pratinjau foto gagal dimuat.',
          );
      });
    return () => {
      cancelled = true;
      imageRef.current = null;
      if (loaded) loaded.src = '';
    };
  }, [photo.url]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => draw());
    return () => cancelAnimationFrame(frame);
  }, [
    photo.crop.x,
    photo.crop.y,
    photo.crop.width,
    photo.crop.height,
    photo.aspectRatio,
    photo.metadata,
    photo.watermark,
  ]);

  return (
    <>
      <div
        className="camera-preview"
        style={{
          aspectRatio: photo.aspectRatio === '3:4' ? '3 / 4' : '9 / 16',
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Pratinjau potongan foto"
          className={`absolute inset-0 size-full ${mode === 'crop' ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`}
          onPointerDown={(event) => {
            if (mode !== 'crop' || event.button !== 0 || dragRef.current)
              return;
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              cropX: photo.crop.x,
              cropY: photo.crop.y,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.id !== event.pointerId) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (!bounds.width || !bounds.height) return;
            setCropPosition(
              drag.cropX -
                ((event.clientX - drag.x) / bounds.width) * photo.crop.width,
              drag.cropY -
                ((event.clientY - drag.y) / bounds.height) * photo.crop.height,
            );
          }}
          onPointerUp={(event) => {
            if (dragRef.current?.id === event.pointerId) {
              dragRef.current = null;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
          onLostPointerCapture={() => {
            dragRef.current = null;
          }}
        />
        {mode === 'crop' ? (
          <div
            className="preview-grid pointer-events-none"
            aria-hidden="true"
          />
        ) : null}
        {mode === 'watermark' && layout ? (
          <WatermarkHandle layout={layout} settings={photo.watermark} />
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </>
  );
}
