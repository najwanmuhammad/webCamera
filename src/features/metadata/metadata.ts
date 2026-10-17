import { format, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { z } from 'zod';
import type { Address, PhotoMetadata } from './types';

export function validLocalTimestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return false;
  const date = parseISO(value);
  return (
    isValid(date) &&
    format(date, "yyyy-MM-dd'T'HH:mm:ss") ===
      (value.length === 16 ? `${value}:00` : value)
  );
}
const coordinate = (limit: number) =>
  z
    .string()
    .refine(
      (value) =>
        value.trim() === '' ||
        (/^-?\d+(\.\d+)?$/.test(value) &&
          Number.isFinite(Number(value)) &&
          Math.abs(Number(value)) <= limit),
      'Koordinat tidak valid.',
    );
export const metadataSchema = z
  .object({
    localTimestamp: z
      .string()
      .refine(
        validLocalTimestamp,
        'Isi tanggal dan waktu yang valid hingga detik.',
      ),
    shortAddress: z.string().max(160, 'Maksimal 160 karakter.'),
    city: z.string().max(100, 'Maksimal 100 karakter.'),
    province: z.string().max(100, 'Maksimal 100 karakter.'),
    country: z.string().max(100, 'Maksimal 100 karakter.'),
    latitude: coordinate(90),
    longitude: coordinate(180),
  })
  .refine(
    (value) =>
      Boolean(value.latitude.trim()) === Boolean(value.longitude.trim()),
    {
      path: ['longitude'],
      message: 'Isi kedua koordinat atau kosongkan keduanya.',
    },
  );

export function initialMetadata(instant: string): PhotoMetadata {
  return {
    localTimestamp: format(parseISO(instant), "yyyy-MM-dd'T'HH:mm:ss"),
    shortAddress: '',
    city: '',
    province: '',
    country: '',
    latitude: '',
    longitude: '',
  };
}
const provinceNames: Record<string, string> = {
  'west java': 'Jawa Barat',
  'central java': 'Jawa Tengah',
  'east java': 'Jawa Timur',
  'north sumatra': 'Sumatera Utara',
  'west sumatra': 'Sumatera Barat',
  'south sumatra': 'Sumatera Selatan',
  'north sulawesi': 'Sulawesi Utara',
  'central sulawesi': 'Sulawesi Tengah',
  'south sulawesi': 'Sulawesi Selatan',
  'southeast sulawesi': 'Sulawesi Tenggara',
  'west sulawesi': 'Sulawesi Barat',
  'west kalimantan': 'Kalimantan Barat',
  'central kalimantan': 'Kalimantan Tengah',
  'south kalimantan': 'Kalimantan Selatan',
  'east kalimantan': 'Kalimantan Timur',
  'north kalimantan': 'Kalimantan Utara',
  'north maluku': 'Maluku Utara',
  'west nusa tenggara': 'Nusa Tenggara Barat',
  'east nusa tenggara': 'Nusa Tenggara Timur',
  'west papua': 'Papua Barat',
  'south papua': 'Papua Selatan',
  'central papua': 'Papua Tengah',
};
const clean = (value: string) => value.trim().replace(/\s+/g, ' ');
export function normalizeAddress(
  address: Address,
  countryCode: string,
): Address {
  const indonesia = countryCode.toLowerCase() === 'id';
  const province = clean(address.province).replace(/^Provinsi\s+/i, '');
  return {
    shortAddress: clean(address.shortAddress).replace(/^Jalan\s+/i, 'Jl. '),
    city: clean(address.city)
      .replace(/^Kab\.?\s+/i, 'Kabupaten ')
      .replace(/^Kota\s+/i, 'Kota '),
    province: indonesia
      ? (provinceNames[province.toLowerCase()] ?? province)
      : province,
    country: indonesia ? 'Indonesia' : clean(address.country),
  };
}
export function watermarkLines(metadata: PhotoMetadata): string[] {
  const stamp = validLocalTimestamp(metadata.localTimestamp)
    ? format(parseISO(metadata.localTimestamp), 'eeee, d MMMM yyyy, HH:mm:ss', {
        locale: id,
      })
    : '';
  const title = stamp ? stamp[0]!.toUpperCase() + stamp.slice(1) : '';
  return [
    title,
    clean(metadata.shortAddress),
    [metadata.city, metadata.province, metadata.country]
      .map(clean)
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean);
}
