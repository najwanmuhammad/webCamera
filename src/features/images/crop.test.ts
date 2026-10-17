// Prepared for execution after M5; not run during M1 at the user's request.
import { describe, expect, it } from 'vitest';
import { centerCrop, moveCrop } from './crop';

describe('non-destructive crop geometry', () => {
  it('uses the full image when the source already matches 3:4', () => {
    expect(centerCrop(3000, 4000, '3:4')).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });
  it('center-crops a landscape source to 3:4 without stretching', () => {
    expect(centerCrop(4000, 3000, '3:4')).toEqual({
      x: 0.21875,
      y: 0,
      width: 0.5625,
      height: 1,
    });
  });
  it('keeps full height and narrows a portrait source for 9:16', () => {
    expect(centerCrop(3000, 4000, '9:16')).toEqual({
      x: 0.125,
      y: 0,
      width: 0.75,
      height: 1,
    });
  });
  it('crops excess height from a tall portrait', () => {
    const crop = centerCrop(1000, 3000, '3:4');
    expect(crop.x).toBe(0);
    expect(crop.width).toBe(1);
    expect(crop.y).toBeCloseTo(5 / 18);
    expect(crop.height).toBeCloseTo(4 / 9);
  });
  it('clamps panning to the source without changing crop dimensions', () => {
    expect(moveCrop({ x: 0.125, y: 0, width: 0.75, height: 1 }, 2, -3)).toEqual(
      { x: 0.25, y: 0, width: 0.75, height: 1 },
    );
  });
  it.each([
    [0, 3000],
    [3000, -1],
    [NaN, 3000],
    [Infinity, 3000],
  ])('rejects invalid dimensions %s × %s', (width, height) => {
    expect(() => centerCrop(width, height, '3:4')).toThrow(
      'Dimensi foto tidak valid.',
    );
  });
});
