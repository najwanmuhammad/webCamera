// Prepared only. Execution deferred until after M5 by user instruction.
import { describe, expect, it } from 'vitest';
import {
  initialMetadata,
  metadataSchema,
  normalizeAddress,
  watermarkLines,
} from './metadata';

describe('timestamp and manual metadata', () => {
  it('starts with a device timestamp and no invented address or coordinates', () => {
    const metadata = initialMetadata('2026-10-17T19:04:00.000Z');
    expect(metadataSchema.safeParse(metadata).success).toBe(true);
    expect(metadata.shortAddress).toBe('');
    expect(metadata.city).toBe('');
    expect(metadata.province).toBe('');
    expect(metadata.country).toBe('');
    expect(metadata.latitude).toBe('');
    expect(metadata.longitude).toBe('');
  });
  it('formats the requested three-line Indonesian watermark', () => {
    expect(
      watermarkLines({
        localTimestamp: '2026-10-18T02:04:00',
        shortAddress: 'Jl. Raya Cikarang',
        city: 'Kabupaten Bekasi',
        province: 'Jawa Barat',
        country: 'Indonesia',
        latitude: '',
        longitude: '',
      }),
    ).toEqual([
      'Minggu, 18 Oktober 2026, 02:04:00',
      'Jl. Raya Cikarang',
      'Kabupaten Bekasi, Jawa Barat, Indonesia',
    ]);
  });
  it('allows a successful manual workflow with location left blank', () => {
    expect(
      metadataSchema.safeParse({
        localTimestamp: '2026-10-18T02:04:00',
        shortAddress: '',
        city: '',
        province: '',
        country: '',
        latitude: '',
        longitude: '',
      }).success,
    ).toBe(true);
  });
  it('normalizes existing Indonesian names without guessing missing levels', () => {
    expect(
      normalizeAddress(
        {
          shortAddress: ' Jalan Raya Cikarang ',
          city: 'Kab. Bekasi',
          province: 'West Java',
          country: 'Indonesia',
        },
        'ID',
      ),
    ).toEqual({
      shortAddress: 'Jl. Raya Cikarang',
      city: 'Kabupaten Bekasi',
      province: 'Jawa Barat',
      country: 'Indonesia',
    });
    expect(
      normalizeAddress(
        { shortAddress: '', city: '', province: '', country: '' },
        '',
      ),
    ).toEqual({ shortAddress: '', city: '', province: '', country: '' });
  });
  it('rejects impossible dates and out-of-range coordinates', () => {
    const metadata = initialMetadata('2026-10-17T19:04:00.000Z');
    expect(
      metadataSchema.safeParse({
        ...metadata,
        localTimestamp: '2026-02-30T02:04:00',
      }).success,
    ).toBe(false);
    expect(
      metadataSchema.safeParse({
        ...metadata,
        latitude: '91',
        longitude: '110',
      }).success,
    ).toBe(false);
    expect(
      metadataSchema.safeParse({ ...metadata, latitude: '-6' }).success,
    ).toBe(false);
  });
});
