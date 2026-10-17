import type { RefObject } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AspectRatio } from '@/features/images/types';

interface CameraPreviewProps {
  aspectRatio: AspectRatio;
  videoRef: RefObject<HTMLVideoElement | null>;
  status: 'idle' | 'requesting' | 'connecting' | 'ready' | 'error';
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
  onReady: () => void;
  onError: () => void;
}
export function CameraPreview({
  aspectRatio,
  videoRef,
  status,
  busy,
  onStart,
  onStop,
  onReady,
  onError,
}: CameraPreviewProps) {
  const ready = status === 'ready';
  const waiting = status === 'requesting' || status === 'connecting';
  return (
    <div
      className={`camera-preview live-viewfinder ${ready ? 'is-live' : ''}`}
      role="group"
      aria-label="Pratinjau kamera"
      style={{
        aspectRatio: aspectRatio === '3:4' ? '3 / 4' : '9 / 16',
        maxWidth: `calc(max(280px, calc(100svh - 380px)) * ${aspectRatio === '3:4' ? 0.75 : 0.5625})`,
      }}
    >
      <div
        className="viewfinder-corners pointer-events-none"
        aria-hidden="true"
      >
        <i />
        <i />
        <i />
        <i />
      </div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlaying={onReady}
        onLoadedData={onReady}
        onError={onError}
        aria-label="Video kamera langsung"
        className={`absolute inset-0 size-full object-cover ${ready ? '' : 'invisible'}`}
      />
      {!ready ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5 text-center">
          <span className="viewfinder-emblem flex size-16 items-center justify-center rounded-[22px] text-primary">
            <Camera size={25} strokeWidth={1.4} aria-hidden="true" />
          </span>
          <div aria-live="polite">
            <p className="text-base font-semibold tracking-tight">
              {waiting ? 'Menghubungkan kamera…' : 'Bingkai cerita Anda.'}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {status === 'requesting'
                ? 'Izinkan akses kamera di browser. Mikrofon tidak digunakan.'
                : status === 'connecting'
                  ? 'Menunggu gambar dari kamera.'
                  : 'Aktifkan kamera atau pilih foto dari galeri.'}
            </p>
          </div>
          <Button
            disabled={busy}
            className="rounded-full px-5"
            onClick={waiting ? onStop : onStart}
          >
            {waiting
              ? 'Batalkan'
              : status === 'error'
                ? 'Coba kamera lagi'
                : 'Aktifkan kamera'}
          </Button>
        </div>
      ) : (
        <>
          <div
            className="preview-grid pointer-events-none"
            aria-hidden="true"
          />
          <span className="absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] text-primary">
            Kamera aktif
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={onStop}
            className="absolute top-3 right-3 h-8 bg-black/50 text-[10px]"
          >
            Matikan
          </Button>
        </>
      )}
    </div>
  );
}
