import { z } from 'zod';
import { normalizeAddress } from '../metadata';
import type { Address, GeocodingProvider } from '../types';

const payloadSchema = z.object({
  features: z.array(
    z.object({
      properties: z.object({
        street: z.string().max(200).optional(),
        housenumber: z.string().max(200).optional(),
        city: z.string().max(200).optional(),
        county: z.string().max(200).optional(),
        state: z.string().max(200).optional(),
        country: z.string().max(200).optional(),
        countrycode: z.string().max(200).optional(),
      }),
    }),
  ),
});
const endpoint =
  import.meta.env.VITE_PHOTON_REVERSE_URL || 'https://photon.komoot.io/reverse';
const cache = new Map<string, Address>();
let nextAllowedAt = 0;

export const photonProvider: GeocodingProvider = {
  name: 'Photon / OpenStreetMap',
  async reverse(fix, signal) {
    // Exact input coordinates, no rounded-coordinate or IP-location substitution.
    const key = `${endpoint}|${fix.latitude}|${fix.longitude}`;
    const cached = cache.get(key);
    if (cached) return cached;
    if (Date.now() < nextAllowedAt)
      throw new Error('Tunggu sebentar sebelum mencari alamat lagi.');
    nextAllowedAt = Date.now() + 1500;
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set('lat', String(fix.latitude));
    url.searchParams.set('lon', String(fix.longitude));
    url.searchParams.set('limit', '1');
    url.searchParams.set('radius', '0.1');
    const response = await fetch(url, {
      signal,
      credentials: 'omit',
      headers: { Accept: 'application/json', 'Accept-Language': 'id' },
      referrerPolicy: 'strict-origin-when-cross-origin',
    }).catch((error: unknown) => {
      if (signal.aborted) throw error;
      throw new Error(
        'Tidak dapat terhubung ke penyedia alamat. Periksa koneksi atau isi lokasi manual.',
      );
    });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? 'Penyedia alamat sedang membatasi permintaan. Isi alamat manual atau coba lagi nanti.'
          : 'Penyedia alamat tidak tersedia. Isi alamat secara manual.',
      );
    const payload: unknown = await response.json().catch(() => {
      throw new Error(
        'Respons penyedia alamat tidak valid. Isi alamat secara manual.',
      );
    });
    const result = payloadSchema.safeParse(payload);
    if (!result.success || !result.data.features[0])
      throw new Error(
        'Alamat tidak ditemukan. Koordinat GPS tetap tersimpan; isi alamat secara manual.',
      );
    const address = result.data.features[0].properties;
    const normalized = normalizeAddress(
      {
        shortAddress: [address.street, address.housenumber]
          .filter(Boolean)
          .join(' '),
        city: address.city || address.county || '',
        province: address.state || '',
        country: address.country || '',
      },
      address.countrycode || '',
    );
    if (!Object.values(normalized).some(Boolean))
      throw new Error(
        'Penyedia tidak mengembalikan alamat. Isi alamat secara manual.',
      );
    if (cache.size >= 20) cache.clear();
    cache.set(key, normalized);
    return normalized;
  },
};
