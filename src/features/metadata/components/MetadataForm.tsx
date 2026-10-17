import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { usePhotoStore } from '@/features/editor/store/photo-store';
import type { Photo } from '@/features/images/types';
import type { PhotoMetadata } from '../types';
import { metadataSchema } from '../metadata';
import { useLocation } from '../hooks/useLocation';

const fields = [
  {
    name: 'localTimestamp',
    label: 'Tanggal dan waktu',
    type: 'datetime-local',
  },
  { name: 'shortAddress', label: 'Alamat singkat', type: 'text' },
  { name: 'city', label: 'Kabupaten / kota', type: 'text' },
  { name: 'province', label: 'Provinsi', type: 'text' },
  { name: 'country', label: 'Negara', type: 'text' },
  { name: 'latitude', label: 'Lintang (opsional)', type: 'text' },
  { name: 'longitude', label: 'Bujur (opsional)', type: 'text' },
] as const;

export function MetadataForm({
  photo,
  onContinue,
}: {
  photo: Photo;
  onContinue: () => void;
}) {
  const updateMetadata = usePhotoStore((state) => state.updateMetadata);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhotoMetadata>({
    values: photo.metadata,
    resolver: zodResolver(metadataSchema),
    mode: 'onChange',
    resetOptions: { keepErrors: true },
  });
  const location = useLocation();
  const locating = location.status === 'gps' || location.status === 'address';
  return (
    <form
      id="metadata-form"
      className="mt-6 space-y-4"
      noValidate
      onSubmit={handleSubmit(onContinue)}
    >
      <div>
        <h2 className="text-base font-medium">Waktu & lokasi</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Waktu berasal dari perangkat saat foto diambil atau diimpor, dalam
          zona waktu perangkat. Semua isian dapat diedit; lokasi boleh kosong.
        </p>
      </div>
      <div className="rounded-xl border border-border p-3">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Gunakan lokasi perangkat saat ini. Koordinat dikirim ke{' '}
          {location.providerName} untuk mencari alamat. Foto tidak dikirim.
          Lokasi ini bukan lokasi EXIF foto galeri.
        </p>
        <Button
          variant="outline"
          onClick={locating ? location.cancel : () => void location.locate()}
        >
          {locating ? 'Batalkan pencarian' : 'Gunakan GPS saat ini'}
        </Button>
        {location.message ? (
          <p
            className={`mt-2 text-xs leading-relaxed ${location.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
            role={location.status === 'error' ? 'alert' : 'status'}
          >
            {location.message}
          </p>
        ) : null}
        {photo.location.fix ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Akurasi perangkat: ±{Math.round(photo.location.fix.accuracy)} m.
            Alamat penyedia dapat berbeda dari titik GPS.
          </p>
        ) : null}
        <p className="mt-2 text-[10px] text-muted-foreground">
          Alamat:{' '}
          <a
            className="underline"
            href="https://photon.komoot.io"
            target="_blank"
            rel="noreferrer"
          >
            Photon
          </a>{' '}
          · ©{' '}
          <a
            className="underline"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap contributors
          </a>
        </p>
      </div>
      {fields.map(({ name, label, type }) => (
        <div key={name}>
          <label className="editor-label" htmlFor={`metadata-${name}`}>
            {label}
          </label>
          <input
            id={`metadata-${name}`}
            type={type}
            autoComplete={
              name === 'shortAddress'
                ? 'street-address'
                : name === 'city'
                  ? 'address-level2'
                  : name === 'province'
                    ? 'address-level1'
                    : name === 'country'
                      ? 'country-name'
                      : 'off'
            }
            step={name === 'localTimestamp' ? 1 : undefined}
            inputMode={
              name === 'latitude' || name === 'longitude'
                ? 'decimal'
                : undefined
            }
            maxLength={
              name === 'shortAddress'
                ? 160
                : name === 'localTimestamp'
                  ? undefined
                  : 100
            }
            className="editor-field"
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? `error-${name}` : undefined}
            {...register(name, {
              onChange: (event: { target: { value: string } }) =>
                updateMetadata({ [name]: event.target.value }),
            })}
          />
          {errors[name] ? (
            <p className="editor-error" id={`error-${name}`}>
              {errors[name]?.message}
            </p>
          ) : null}
        </div>
      ))}
      <Button type="submit" className="w-full">
        Lanjut ke watermark
      </Button>
    </form>
  );
}
