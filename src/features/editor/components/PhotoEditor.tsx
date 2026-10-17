import { ExportPanel } from '@/features/export/components/ExportPanel';
import { RetakeButton } from '@/components/RetakeButton';
import { WatermarkControls } from '@/features/watermark/components/WatermarkControls';
import { useEffect, useRef, useState } from 'react';
import { MetadataForm } from '@/features/metadata/components/MetadataForm';
import { RotateCcw } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { RatioSelector } from '@/components/RatioSelector';
import { Button } from '@/components/ui/button';
import { centerCrop } from '@/features/images/crop';
import type { Photo } from '@/features/images/types';
import { useCameraStore } from '@/features/camera/store/camera-store';
import { usePhotoStore } from '../store/photo-store';
import { CropPreview } from './CropPreview';

export function PhotoEditor({ photo }: { photo: Photo }) {
  const [stage, setStage] = useState<'metadata' | 'watermark' | 'export'>(
    'metadata',
  );
  const setRatio = usePhotoStore((state) => state.setRatio);
  const setCropPosition = usePhotoStore((state) => state.setCropPosition);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  return (
    <>
      <AppHeader
        step={stage === 'metadata' ? 1 : stage === 'watermark' ? 2 : 3}
      />
      <section
        className="px-5 pt-6 pb-6"
        aria-labelledby={stage === 'export' ? 'export-title' : 'editor-heading'}
      >
        {stage === 'export' ? (
          <ExportPanel photo={photo} onEdit={() => setStage('watermark')} />
        ) : (
          <>
            <div className="-ml-4 mb-4">
              <RetakeButton />
            </div>
            <h1
              ref={titleRef}
              tabIndex={-1}
              id="editor-heading"
              className="mb-2 text-[28px] leading-none font-medium tracking-[-1px]"
            >
              {stage === 'metadata' ? 'Edit foto' : 'Watermark'}
            </h1>
            <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
              {stage === 'metadata'
                ? 'Atur bingkai, waktu dan lokasi. Foto asli tetap utuh.'
                : 'Geser watermark dan sesuaikan tampilannya.'}
            </p>
            <div
              role="group"
              aria-label="Bagian editor"
              className="editor-tabs mb-5 flex gap-1"
            >
              <Button
                className="flex-1"
                variant="ghost"
                aria-pressed={stage === 'metadata'}
                onClick={() => setStage('metadata')}
              >
                Foto & metadata
              </Button>
              <Button
                className="flex-1"
                variant="ghost"
                aria-pressed={stage === 'watermark'}
                type={stage === 'metadata' ? 'submit' : 'button'}
                form={stage === 'metadata' ? 'metadata-form' : undefined}
              >
                Watermark
              </Button>
            </div>
            <RatioSelector
              value={photo.aspectRatio}
              onChange={(ratio) => {
                useCameraStore.getState().setAspectRatio(ratio);
                setRatio(ratio);
              }}
            />
            <CropPreview
              key={photo.url}
              photo={photo}
              mode={stage === 'metadata' ? 'crop' : 'watermark'}
            />
            {stage === 'metadata' ? (
              <>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Geser foto untuk mengatur potongan, atau gunakan penggeser di
                  bawah.
                </p>
                <div className="mt-4 space-y-4">
                  <label className="block text-xs text-muted-foreground">
                    Posisi horizontal
                    <input
                      aria-label="Posisi horizontal"
                      className="mt-2 block w-full accent-primary"
                      type="range"
                      min={0}
                      max={Math.max(0, 1 - photo.crop.width)}
                      step="any"
                      value={photo.crop.x}
                      disabled={photo.crop.width >= 1 - 1e-9}
                      onChange={(event) =>
                        setCropPosition(
                          Number(event.currentTarget.value),
                          photo.crop.y,
                        )
                      }
                    />
                  </label>
                  <label className="block text-xs text-muted-foreground">
                    Posisi vertikal
                    <input
                      aria-label="Posisi vertikal"
                      className="mt-2 block w-full accent-primary"
                      type="range"
                      min={0}
                      max={Math.max(0, 1 - photo.crop.height)}
                      step="any"
                      value={photo.crop.y}
                      disabled={photo.crop.height >= 1 - 1e-9}
                      onChange={(event) =>
                        setCropPosition(
                          photo.crop.x,
                          Number(event.currentTarget.value),
                        )
                      }
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-muted-foreground">
                    {photo.source === 'camera' ? 'Kamera' : 'Galeri'} ·{' '}
                    {photo.width} × {photo.height} px
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const crop = centerCrop(
                        photo.width,
                        photo.height,
                        photo.aspectRatio,
                      );
                      setCropPosition(crop.x, crop.y);
                    }}
                  >
                    <RotateCcw aria-hidden="true" />
                    Pusatkan
                  </Button>
                </div>
                <MetadataForm
                  photo={photo}
                  onContinue={() => setStage('watermark')}
                />
              </>
            ) : (
              <>
                <WatermarkControls settings={photo.watermark} />
                <Button
                  className="mt-6 w-full"
                  onClick={() => setStage('export')}
                >
                  Lanjut ke simpan JPG
                </Button>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
