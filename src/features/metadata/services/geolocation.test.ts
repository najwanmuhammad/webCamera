import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestGps } from './geolocation';
import { photonProvider } from './photon';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('GPS and network failures', () => {
  it('reports denial instead of inventing coordinates', async () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (
          _success: unknown,
          fail: (error: { code: number }) => void,
        ) => fail({ code: 1 }),
      },
    });
    await expect(requestGps(new AbortController().signal)).rejects.toThrow(
      'Izin lokasi ditolak',
    );
  });
  it('rejects invalid GPS coordinates', async () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (done: (position: unknown) => void) =>
          done({
            coords: { latitude: NaN, longitude: 110, accuracy: 10 },
            timestamp: Date.now(),
          }),
      },
    });
    await expect(requestGps(new AbortController().signal)).rejects.toThrow(
      'koordinat valid',
    );
  });
  it('allows cancellation while a permission request remains pending', async () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: () => {} },
    });
    const controller = new AbortController();
    const operation = requestGps(controller.signal);
    controller.abort();
    await expect(operation).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('reports offline lookup failure and returns no substitute address', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(
      photonProvider.reverse(
        { latitude: 0, longitude: 0, accuracy: 10, timestamp: 0 },
        new AbortController().signal,
      ),
    ).rejects.toThrow('isi lokasi manual');
  });
});
