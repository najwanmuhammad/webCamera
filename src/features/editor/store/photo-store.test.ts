import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePhotoStore } from './photo-store';
import { initialMetadata } from '@/features/metadata/metadata';
import { defaultWatermark } from '@/features/watermark/types';
import type { Photo } from '@/features/images/types';
const NativeURL = URL;
function photoFixture(): Photo {
  return {
    blob: new Blob(),
    url: 'blob:owned-photo',
    width: 1200,
    height: 1600,
    source: 'gallery',
    capturedAt: '2026-10-18T02:04:00Z',
    metadata: initialMetadata('2026-10-18T02:04:00Z'),
    metadataRevision: 0,
    watermark: defaultWatermark(),
    location: { fix: null, source: 'none', addressSource: 'none' },
    aspectRatio: '3:4',
    crop: { x: 0, y: 0, width: 1, height: 1 },
  };
}
afterEach(() => {
  usePhotoStore.setState({ photo: null });
  vi.unstubAllGlobals();
});
describe('photo ownership and GPS/manual edit races', () => {
  it('releases the source URL on retake', () => {
    const revoked: string[] = [];
    vi.stubGlobal(
      'URL',
      class extends NativeURL {
        static revokeObjectURL(url: string) {
          revoked.push(url);
        }
      },
    );
    usePhotoStore.setState({ photo: photoFixture() });
    usePhotoStore.getState().clearPhoto();
    expect(usePhotoStore.getState().photo).toBeNull();
    expect(revoked).toEqual(['blob:owned-photo']);
  });
  it('keeps manual edits when an older address lookup finishes', () => {
    usePhotoStore.setState({ photo: photoFixture() });
    usePhotoStore.getState().updateMetadata({ city: 'Kota pilihan pengguna' });
    usePhotoStore.getState().applyAddress('blob:owned-photo', 0, {
      shortAddress: 'Provider street',
      city: 'Provider city',
      province: '',
      country: '',
    });
    expect(usePhotoStore.getState().photo!.metadata.city).toBe(
      'Kota pilihan pengguna',
    );
    expect(usePhotoStore.getState().photo!.metadata.country).toBe('');
  });
  it('clears an old provider address when replacing its GPS coordinates', () => {
    const photo = photoFixture();
    photo.metadata.city = 'Alamat GPS lama';
    photo.location.addressSource = 'provider';
    usePhotoStore.setState({ photo });
    usePhotoStore.getState().applyGpsFix(photo.url, 0, {
      latitude: 0,
      longitude: 0,
      accuracy: 20,
      timestamp: 0,
    });
    const next = usePhotoStore.getState().photo!;
    expect(next.metadata.city).toBe('');
    expect(next.metadata.latitude).toBe('0');
    expect(next.metadata.longitude).toBe('0');
    expect(next.location.addressSource).toBe('none');
  });
});
