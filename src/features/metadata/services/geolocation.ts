import type { GpsFix } from '../types';
export function requestGps(signal: AbortSignal): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) {
      reject(
        new Error(
          'GPS memerlukan HTTPS atau localhost. Anda dapat mengisi lokasi manual.',
        ),
      );
      return;
    }
    if (!navigator.geolocation) {
      reject(
        new Error('GPS tidak didukung browser ini. Isi lokasi secara manual.'),
      );
      return;
    }
    if (signal.aborted) {
      reject(new DOMException('Cancelled', 'AbortError'));
      return;
    }
    const finish = (action: () => void) => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      action();
    };
    const onAbort = () =>
      finish(() => reject(new DOMException('Cancelled', 'AbortError')));
    const timer = window.setTimeout(
      () =>
        finish(() =>
          reject(
            new Error(
              'Waktu pencarian GPS habis. Coba lagi atau isi lokasi manual.',
            ),
          ),
        ),
      17000,
    );
    signal.addEventListener('abort', onAbort, { once: true });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (signal.aborted) return;
        const { latitude, longitude, accuracy } = position.coords;
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          Math.abs(latitude) > 90 ||
          Math.abs(longitude) > 180
        ) {
          finish(() =>
            reject(
              new Error(
                'GPS tidak memberikan koordinat valid. Isi lokasi manual.',
              ),
            ),
          );
          return;
        }
        finish(() =>
          resolve({
            latitude,
            longitude,
            accuracy,
            timestamp: position.timestamp,
          }),
        );
      },
      (error) =>
        finish(() =>
          reject(
            new Error(
              error.code === 1
                ? 'Izin lokasi ditolak. Izinkan lokasi di pengaturan situs atau isi secara manual.'
                : error.code === 3
                  ? 'Waktu pencarian GPS habis. Coba lagi atau isi lokasi manual.'
                  : 'Lokasi perangkat tidak tersedia. Coba di area terbuka atau isi secara manual.',
            ),
          ),
        ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  });
}
