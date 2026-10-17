import { useRef } from 'react';
import { Camera, ShieldCheck, Image, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';
import { RatioSelector } from '@/components/RatioSelector';
import { CameraPreview } from './CameraPreview';
import { useCameraStore } from '../store/camera-store';
import { useCamera } from '../hooks/useCamera';
import { usePhotoImport } from '../hooks/usePhotoImport';

export function CameraScreen() {
  const aspectRatio = useCameraStore((state) => state.aspectRatio);
  const setAspectRatio = useCameraStore((state) => state.setAspectRatio);
  const camera = useCamera();
  const photoImport = usePhotoImport();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = photoImport.busy;
  const error = photoImport.error ?? camera.error;
  return (
    <>
      <AppHeader step={0} />
      <section
        aria-labelledby="camera-heading"
        className="camera-screen px-5 pt-6 pb-5"
        aria-busy={busy}
      >
        <div className="mb-5 flex items-end justify-between gap-2">
          <div>
            <p className="eyebrow mb-2">SETIAP MOMEN PUNYA CERITA</p>
            <h1
              id="camera-heading"
              className="text-[32px] leading-none font-semibold tracking-[-1.2px]"
            >
              Kamera
            </h1>
          </div>
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <span
              className="size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            Di perangkat Anda
          </span>
        </div>
        <RatioSelector
          value={aspectRatio}
          onChange={setAspectRatio}
          disabled={busy}
        />
        <CameraPreview
          aspectRatio={aspectRatio}
          videoRef={camera.videoRef}
          status={camera.status}
          busy={busy}
          onStart={() => void camera.start()}
          onStop={camera.stop}
          onReady={camera.markReady}
          onError={camera.playbackError}
        />
        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive"
          >
            {error}
          </p>
        ) : null}
        <p
          role="status"
          className="mt-3 text-center text-[11px] text-muted-foreground"
        >
          {busy
            ? 'Memproses foto di perangkat Anda…'
            : 'Pilih bingkai. Rekam momen. Tambahkan cerita.'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
          className="hidden"
          aria-label="Pilih foto dari perangkat"
          disabled={busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) void photoImport.importPhoto(file, aspectRatio);
          }}
        />
        <div className="camera-actions mt-5 flex items-center justify-between gap-4 px-6">
          <div className="flex w-14 flex-col items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={busy}
              aria-label="Buka galeri"
              onClick={() => inputRef.current?.click()}
              className="camera-side-action size-12 rounded-2xl"
            >
              <Image aria-hidden="true" />
            </Button>
            <span className="text-[10px] text-muted-foreground">Galeri</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button
              disabled={busy || camera.status !== 'ready'}
              aria-label="Ambil foto"
              onClick={() => {
                const video = camera.videoRef.current;
                if (video) void photoImport.capture(video, aspectRatio);
              }}
              className="camera-shutter size-[76px] rounded-full border-[2px] border-primary bg-transparent p-1.5 disabled:opacity-40"
            >
              <span className="flex size-full items-center justify-center rounded-full bg-primary">
                <Camera
                  className="size-6!"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
            </Button>
            <span className="text-[10px] text-muted-foreground">
              Ambil foto
            </span>
          </div>
          <div className="flex w-14 flex-col items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={busy || camera.status !== 'ready' || !camera.canSwitch}
              aria-label="Ganti kamera"
              onClick={() => void camera.start(true)}
              className="camera-side-action size-12 rounded-2xl"
            >
              <RefreshCw aria-hidden="true" />
            </Button>
            <span className="text-[10px] text-muted-foreground">Putar</span>
          </div>
        </div>
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
          Galeri dapat digunakan tanpa izin kamera. Waktu, lokasi dan watermark
          dapat diedit setelah foto dipilih.
        </p>
      </section>
      <footer className="privacy-footer">
        <ShieldCheck
          size={15}
          className="shrink-0 text-primary"
          aria-hidden="true"
        />
        <p>
          Foto diproses lokal.
          <br />
          <span className="text-muted-foreground">
            Momen Anda tetap milik Anda.
          </span>
        </p>
      </footer>
    </>
  );
}
