import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { watermarkLines } from '@/features/metadata/metadata';
import { defaultWatermark } from './types';
import { WatermarkHandle } from './components/WatermarkHandle';
const metadata = {
  localTimestamp: '2026-10-18T02:04:00',
  shortAddress: '',
  city: '',
  province: '',
  country: '',
  latitude: '-6.1234567',
  longitude: '107.1234567',
};
describe('optional coordinate watermark', () => {
  it('hides coordinates by default', () => {
    expect(watermarkLines(metadata).join(' ')).not.toContain('Lintang');
  });
  it('shows a valid pair when enabled', () => {
    expect(watermarkLines(metadata, true)).toContain(
      'Lintang: -6.123457 · Bujur: 107.123457',
    );
  });
  it('accepts zero and does not invent missing or invalid coordinates', () => {
    expect(
      watermarkLines({ ...metadata, latitude: '0', longitude: '0' }, true),
    ).toContain('Lintang: 0.000000 · Bujur: 0.000000');
    for (const latitude of ['', 'NaN', '91'])
      expect(
        watermarkLines({ ...metadata, latitude }, true).join(' '),
      ).not.toContain('Lintang');
  });
  it('prevents native touch scrolling on the drag target', () => {
    render(
      <WatermarkHandle
        settings={defaultWatermark()}
        layout={{
          x: 0.1,
          y: 0.1,
          width: 0.4,
          height: 0.1,
          fontSize: 26,
          padding: 15,
          lineHeight: 39,
          lines: ['Sample'],
        }}
      />,
    );
    expect(screen.getByRole('button')).toHaveStyle({
      touchAction: 'none',
      userSelect: 'none',
    });
  });
});
