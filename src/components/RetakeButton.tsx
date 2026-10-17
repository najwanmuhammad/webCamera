import { useRef } from 'react';
import { Button } from './ui/button';
import { usePhotoStore } from '@/features/editor/store/photo-store';
export function RetakeButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button
        variant="ghost"
        className="text-muted-foreground"
        onClick={() => dialogRef.current?.showModal()}
      >
        Ambil foto baru
      </Button>
      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby="retake-title"
        aria-describedby="retake-description"
      >
        <h2 id="retake-title" className="text-lg font-semibold">
          Mulai foto baru?
        </h2>
        <p
          id="retake-description"
          className="mt-2 text-sm leading-relaxed text-muted-foreground"
        >
          Foto dan perubahan saat ini akan dilepas dari memori. Pastikan JPG
          sudah disimpan jika ingin menyimpannya.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => dialogRef.current?.close()}>
            Batal
          </Button>
          <Button
            onClick={() => {
              dialogRef.current?.close();
              usePhotoStore.getState().clearPhoto();
            }}
          >
            Foto baru
          </Button>
        </div>
      </dialog>
    </>
  );
}
