import { describe, expect, it } from 'vitest';
import { exportDimensions } from './export-photo';

describe('JPG output dimensions', () => {
  it('retains cropped native pixels at the selected ratio', () => {
    expect(
      exportDimensions(
        {
          width: 4000,
          height: 3000,
          aspectRatio: '3:4',
          crop: { x: 0.21875, y: 0, width: 0.5625, height: 1 },
        },
        'native',
      ),
    ).toEqual({ width: 2250, height: 3000 });
  });
  it('uses an explicit bounded size without upscaling', () => {
    expect(
      exportDimensions(
        {
          width: 3000,
          height: 4000,
          aspectRatio: '9:16',
          crop: { x: 0.125, y: 0, width: 0.75, height: 1 },
        },
        'compact',
      ),
    ).toEqual({ width: 1152, height: 2048 });
    expect(
      exportDimensions(
        {
          width: 300,
          height: 400,
          aspectRatio: '3:4',
          crop: { x: 0, y: 0, width: 1, height: 1 },
        },
        'compact',
      ),
    ).toEqual({ width: 300, height: 400 });
  });
  it('rejects a source too small for whole ratio units', () => {
    expect(() =>
      exportDimensions(
        {
          width: 1,
          height: 1,
          aspectRatio: '9:16',
          crop: { x: 0, y: 0, width: 1, height: 1 },
        },
        'native',
      ),
    ).toThrow('Foto terlalu kecil');
  });
});
