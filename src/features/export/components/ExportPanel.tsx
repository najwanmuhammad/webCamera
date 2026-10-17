import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RetakeButton } from '@/components/RetakeButton';
import type { Photo } from '@/features/images/types';
import {
  exportDimensions,
  exportPhoto,
  type ExportSize,
} from '../export-photo';

type Result = Awaited<ReturnType<typeof exportPhoto>> & { url: string };
export function ExportPanel({
  photo,
  onEdit,
}: {
  photo: Photo;
  onEdit: () => void;
}) {
  const [quality, setQuality] = useState(0.92);
  const [size, setSize] = useState<ExportSize>('native');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const work = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      work.current?.abort();
      work.current = null;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );
  function resetResult() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setResult(null);
    setNotice('');
  }
  async function prepare() {
    if (work.current) return;
    resetResult();
    const controller = new AbortController();
    work.current = controller;
    setBusy(true);
    setError('');
    try {
      const output = await exportPhoto(photo, quality, size, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(output.blob);
      urlRef.current = url;
      setResult({ ...output, url });
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : 'Ekspor gagal. Coba ukuran hemat.',
        );
    } finally {
      if (work.current === controller) {
        work.current = null;
        setBusy(false);
      }
    }
  }
  let dimensions = 'Foto terlalu kecil';
  try {
    const output = exportDimensions(photo, size);
    dimensions = `${output.width} × ${output.height} px`;
  } catch {
    /* Display the actionable error when preparing. */
  }
  return (
    <section
      aria-labelledby="export-title"
      className="space-y-5"
      aria-busy={busy}
    >
      <Button variant="ghost" className="-ml-4" onClick={onEdit}>
        <ArrowLeft aria-hidden="true" />
        Kembali mengedit
      </Button>
      <div>
        <p className="eyebrow">SIMPAN CERITA ANDA</p>
        <h1
          id="export-title"
          className="mt-2 text-3xl font-semibold tracking-tight"
        >
          Foto siap disimpan.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Watermark menyatu dengan foto. JPG dibuat di perangkat Anda.
        </p>
      </div>
      {result ? (
        <div className="rounded-2xl border border-border bg-black/20 p-2">
          <img
            src={result.url}
            width={result.width}
            height={result.height}
            alt="Hasil JPG dengan watermark permanen"
            className="h-auto w-full rounded-xl"
          />
          <p className="px-2 pt-3 pb-1 text-xs text-muted-foreground">
            {result.width} × {result.height} px ·{' '}
            {new Intl.NumberFormat('id-ID', {
              maximumFractionDigits: 2,
            }).format(result.blob.size / 1048576)}{' '}
            MB
          </p>
        </div>
      ) : null}
      <label className="editor-label">
        Resolusi
        <select
          className="editor-field mt-2"
          disabled={busy}
          value={size}
          onChange={(event) => {
            resetResult();
            setSize(event.target.value as ExportSize);
          }}
        >
          <option value="native">Asli sesuai potongan</option>
          <option value="compact">Hemat · sisi panjang maks. 2048 px</option>
        </select>
      </label>
      <p className="text-xs text-muted-foreground">
        {dimensions}. Ukuran asli tidak diperkecil otomatis.
      </p>
      <label className="editor-label">
        Kualitas JPG · {Math.round(quality * 100)}%
        <input
          className="mt-3 block w-full accent-primary"
          disabled={busy}
          type="range"
          min={0.6}
          max={1}
          step={0.01}
          value={quality}
          onChange={(event) => {
            resetResult();
            setQuality(Number(event.target.value));
          }}
        />
      </label>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <Button className="w-full" disabled={busy} onClick={() => void prepare()}>
        {busy ? 'Merender JPG…' : result ? 'Buat ulang JPG' : 'Siapkan JPG'}
      </Button>
      {result ? (
        <>
          <Button asChild className="w-full">
            <a
              href={result.url}
              download={result.filename}
              onClick={() =>
                setNotice(
                  'Unduhan diminta. Periksa unduhan browser; pada iPhone, Anda juga dapat membuka gambar lalu menyimpannya.',
                )
              }
            >
              <Download aria-hidden="true" />
              Unduh JPG
            </a>
          </Button>
          {typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({
            files: [
              new File([result.blob], result.filename, { type: 'image/jpeg' }),
            ],
          }) ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                void navigator
                  .share({
                    files: [
                      new File([result.blob], result.filename, {
                        type: 'image/jpeg',
                      }),
                    ],
                  })
                  .catch((cause: unknown) => {
                    if (!(
                      cause instanceof DOMException &&
                      cause.name === 'AbortError'
                    ))
                      setError(
                        'Berbagi tidak tersedia. Gunakan tombol Unduh JPG.',
                      );
                  });
              }}
            >
              <Share2 aria-hidden="true" />
              Bagikan JPG
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            JPG tidak menyertakan metadata GPS EXIF. Informasi yang Anda pilih
            tampil sebagai watermark.
          </p>
        </>
      ) : null}
      <p role="status" className="text-sm text-primary">
        {notice}
      </p>
      <div className="flex justify-center">
        <RetakeButton />
      </div>
    </section>
  );
}
