import { useEffect, useRef, useState } from 'react';
import { usePhotoStore } from '@/features/editor/store/photo-store';
import { requestGps } from '../services/geolocation';
import { photonProvider } from '../services/photon';
import type { GeocodingProvider } from '../types';

type Status = 'idle' | 'gps' | 'address' | 'done' | 'error';
export function useLocation(provider: GeocodingProvider = photonProvider) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  function cancel() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus('idle');
    setMessage('Pencarian dibatalkan. Anda dapat mengisi lokasi manual.');
  }
  async function locate() {
    const photo = usePhotoStore.getState().photo;
    if (!photo || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const { url, metadataRevision: revision } = photo;
    const current = () =>
      !controller.signal.aborted &&
      usePhotoStore.getState().photo?.url === url &&
      usePhotoStore.getState().photo?.metadataRevision === revision;
    setStatus('gps');
    setMessage('Menunggu izin dan koordinat GPS…');
    let timeout: number | undefined;
    try {
      const fix = await requestGps(controller.signal);
      if (!current()) {
        if (!controller.signal.aborted) {
          setStatus('idle');
          setMessage(
            'Perubahan manual dipertahankan. Tekan GPS lagi untuk memperbarui lokasi.',
          );
        }
        return;
      }
      usePhotoStore.getState().applyGpsFix(url, revision, fix);
      setStatus('address');
      setMessage('Koordinat GPS diterima. Mencari alamat…');
      timeout = window.setTimeout(() => controller.abort(), 12000);
      const address = await provider.reverse(fix, controller.signal);
      if (!current()) {
        if (!controller.signal.aborted) {
          setStatus('idle');
          setMessage(
            'Perubahan manual dipertahankan; alamat otomatis tidak diterapkan.',
          );
        }
        return;
      }
      usePhotoStore.getState().applyAddress(url, revision, address);
      setStatus('done');
      setMessage(
        'Alamat dari penyedia diterapkan. Periksa hasil dan edit jika perlu.',
      );
    } catch (error) {
      if (controllerRef.current !== controller) return;
      setStatus('error');
      setMessage(
        controller.signal.aborted
          ? 'Pencarian alamat melewati batas waktu. Koordinat yang diterima tetap tersimpan; alamat dapat diisi manual.'
          : error instanceof Error
            ? error.message
            : 'Lokasi gagal diperoleh. Silakan isi manual.',
      );
    } finally {
      window.clearTimeout(timeout);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }
  return { status, message, locate, cancel, providerName: provider.name };
}
