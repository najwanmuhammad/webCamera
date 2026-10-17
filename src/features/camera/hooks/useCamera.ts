import { useCallback, useEffect, useRef, useState } from 'react';

type CameraStatus = 'idle' | 'requesting' | 'connecting' | 'ready' | 'error';
type Facing = 'environment' | 'user';

function cameraError(error: unknown): string {
  const name =
    error instanceof DOMException || error instanceof Error ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Izin kamera ditolak. Izinkan kamera di pengaturan situs browser, lalu coba lagi. Anda tetap dapat memilih foto dari galeri.';
    case 'NotFoundError':
      return 'Kamera tidak ditemukan. Sambungkan kamera atau pilih foto dari galeri.';
    case 'NotReadableError':
    case 'AbortError':
      return 'Kamera tidak dapat dibuka. Tutup aplikasi lain yang memakai kamera, lalu coba lagi.';
    case 'OverconstrainedError':
      return 'Kamera yang diminta tidak tersedia. Coba kamera lain atau gunakan galeri.';
    default:
      return 'Kamera gagal dibuka. Coba lagi atau pilih foto dari galeri.';
  }
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [canSwitch, setCanSwitch] = useState(false);

  const release = useCallback(() => {
    requestRef.current += 1;
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback(() => {
    release();
    setStatus('idle');
    setCanSwitch(false);
    setError(null);
  }, [release]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) stop();
    };
    const onPageHide = () => stop();
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
      release();
    };
  }, [release, stop]);

  async function start(switchCamera = false) {
    if (status === 'requesting' || status === 'connecting') return;
    const currentSettings = streamRef.current
      ?.getVideoTracks()[0]
      ?.getSettings();
    const currentDeviceId = currentSettings?.deviceId;
    const knowsFacing =
      currentSettings?.facingMode === 'user' ||
      currentSettings?.facingMode === 'environment';
    const nextFacing: Facing = switchCamera
      ? facing === 'environment'
        ? 'user'
        : 'environment'
      : facing;
    const cameras = devicesRef.current;
    const currentIndex = cameras.findIndex(
      (device) => device.deviceId === currentDeviceId,
    );
    const alternate =
      switchCamera && cameras.length > 1
        ? cameras[(currentIndex + 1) % cameras.length]
        : undefined;
    release();
    const request = requestRef.current;
    setCanSwitch(false);
    setError(null);
    if (!window.isSecureContext) {
      setStatus('error');
      setError(
        'Kamera memerlukan HTTPS atau localhost. Anda tetap dapat memilih foto dari galeri.',
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError(
        'Browser ini tidak mendukung kamera. Gunakan browser terbaru atau pilih foto dari galeri.',
      );
      return;
    }
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(alternate && !knowsFacing
            ? { deviceId: { exact: alternate.deviceId } }
            : {
                facingMode: switchCamera
                  ? { exact: nextFacing }
                  : { ideal: nextFacing },
              }),
          width: { ideal: 4096 },
          height: { ideal: 3072 },
        },
      });
      if (request !== requestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error('No video track');
      track.onended = () => {
        if (request !== requestRef.current) return;
        release();
        setStatus('error');
        setCanSwitch(false);
        setError(
          'Koneksi kamera terputus. Aktifkan kembali kamera atau pilih foto dari galeri.',
        );
      };
      const actualFacing = track.getSettings().facingMode;
      setFacing(
        actualFacing === 'user' || actualFacing === 'environment'
          ? actualFacing
          : nextFacing,
      );
      const video = videoRef.current;
      if (!video) throw new Error('No preview element');
      setStatus('connecting');
      video.srcObject = stream;
      await video.play();
      if (request !== requestRef.current) return;
      // Playback can begin before the first decoded frame; onPlaying/onLoadedData
      // enables the shutter only when dimensions and readyState are valid.
      if (video.readyState >= 2 && video.videoWidth > 0) setStatus('ready');
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (request !== requestRef.current) return;
        devicesRef.current = devices.filter(
          (device) => device.kind === 'videoinput',
        );
        setCanSwitch(devicesRef.current.length > 1);
      } catch {
        if (request === requestRef.current) setCanSwitch(true);
      }
    } catch (cause) {
      if (request !== requestRef.current) return;
      release();
      setStatus('error');
      setCanSwitch(false);
      setError(cameraError(cause));
    }
  }

  function markReady() {
    const video = videoRef.current;
    if (
      streamRef.current?.active &&
      video &&
      video.readyState >= 2 &&
      video.videoWidth > 0
    )
      setStatus('ready');
  }

  function playbackError() {
    if (!streamRef.current) return;
    release();
    setStatus('error');
    setCanSwitch(false);
    setError(
      'Pratinjau kamera tidak dapat diputar. Coba aktifkan kamera kembali.',
    );
  }

  return {
    videoRef,
    status,
    error,
    canSwitch,
    facing,
    start,
    stop,
    markReady,
    playbackError,
  };
}
