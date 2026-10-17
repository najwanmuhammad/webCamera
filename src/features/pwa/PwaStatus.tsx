import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { usePhotoStore } from '@/features/editor/store/photo-store';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}
export function PwaStatus() {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const hasPhoto = usePhotoStore((state) => state.photo !== null);
  const [updateReady, setUpdateReady] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [error, setError] = useState('');
  const installRef = useRef<InstallPrompt | null>(null);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(
    null,
  );
  useEffect(() => {
    let active = true;
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      void import('virtual:pwa-register')
        .then(({ registerSW }) => {
          if (!active) return;
          updateRef.current = registerSW({
            immediate: true,
            onNeedRefresh: () => {
              if (active) setUpdateReady(true);
            },
            onOfflineReady: () => {
              if (active) setOfflineReady(true);
            },
            onRegisterError: () => {
              if (active)
                setError(
                  'Mode offline belum siap. Tetap gunakan aplikasi saat terhubung.',
                );
            },
          });
        })
        .catch(() => {
          if (active) setError('Mode offline tidak tersedia di browser ini.');
        });
    }
    const onInstall = (event: Event) => {
      event.preventDefault();
      installRef.current = event as InstallPrompt;
      setInstallable(true);
    };
    const onInstalled = () => {
      installRef.current = null;
      setInstallable(false);
    };
    window.addEventListener('beforeinstallprompt', onInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      active = false;
      window.removeEventListener('beforeinstallprompt', onInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  return (
    <aside className="pwa-status" aria-label="Status aplikasi">
      {!online ? (
        <p role="status" className="text-xs leading-relaxed text-primary">
          Anda sedang offline. Edit dan ekspor tetap lokal; pencarian alamat
          memerlukan internet. Foto tidak disimpan setelah halaman dimuat ulang.
        </p>
      ) : offlineReady ? (
        <p role="status" className="text-xs text-muted-foreground">
          Aplikasi siap dibuka offline di browser ini.
        </p>
      ) : null}
      {error ? (
        <p role="status" className="text-xs text-muted-foreground">
          {error}
        </p>
      ) : null}
      {updateReady ? (
        <div className="mt-2">
          <p role="status" className="mb-2 text-xs text-muted-foreground">
            Versi baru tersedia.
            {hasPhoto
              ? ' Simpan foto dan mulai foto baru sebelum memperbarui.'
              : ''}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={hasPhoto}
            onClick={() => {
              void updateRef
                .current?.(true)
                .catch(() =>
                  setError('Pembaruan gagal. Coba lagi saat terhubung.'),
                );
            }}
          >
            Perbarui aplikasi
          </Button>
        </div>
      ) : null}
      {installable ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => {
            const prompt = installRef.current;
            if (!prompt) return;
            void prompt
              .prompt()
              .then(() => prompt.userChoice)
              .catch(() =>
                setError('Gunakan menu browser untuk memasang aplikasi.'),
              )
              .finally(() => {
                installRef.current = null;
                setInstallable(false);
              });
          }}
        >
          Pasang GeoStamp
        </Button>
      ) : null}
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer py-2">
          Pasang aplikasi & privasi
        </summary>
        <p className="pt-2 leading-relaxed">
          Chrome/Edge: menu Pasang aplikasi. iPhone/iPad: Bagikan → Tambahkan ke
          Layar Utama. Ketersediaan bergantung pada browser. Foto hanya ada di
          memori sampai Anda mengunduhnya; muat ulang akan menghapus sesi. GPS
          dan alamat bersifat opsional.
        </p>
      </details>
    </aside>
  );
}
