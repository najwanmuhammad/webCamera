import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WatermarkHandle } from './components/WatermarkHandle';
import { defaultWatermark } from './types';
import { usePhotoStore } from '@/features/editor/store/photo-store';
import { initialMetadata } from '@/features/metadata/metadata';

afterEach(() => {
  usePhotoStore.setState({ photo: null });
  vi.restoreAllMocks();
});
it('coalesces touch movements into one frame and keeps the last position on release', () => {
  const settings = { ...defaultWatermark(), x: 0, y: 0 };
  usePhotoStore.setState({
    photo: {
      blob: new Blob(),
      url: 'blob:test',
      width: 1000,
      height: 1000,
      source: 'gallery',
      capturedAt: '2026-10-18T02:04:00Z',
      metadata: initialMetadata('2026-10-18T02:04:00Z'),
      metadataRevision: 0,
      location: { fix: null, source: 'none', addressSource: 'none' },
      watermark: settings,
      aspectRatio: '3:4',
      crop: { x: 0, y: 0, width: 1, height: 1 },
    },
  });
  let frame: FrameRequestCallback | undefined;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frame = callback;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  render(
    <div>
      <WatermarkHandle
        settings={settings}
        layout={{
          x: 0.02,
          y: 0.02,
          width: 0.4,
          height: 0.1,
          fontSize: 26,
          padding: 15,
          lineHeight: 39,
          lines: ['Sample'],
        }}
      />
    </div>,
  );
  const button = screen.getByRole('button');
  Object.assign(button, {
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  });
  vi.spyOn(button.parentElement!, 'getBoundingClientRect').mockReturnValue({
    width: 100,
    height: 100,
  } as DOMRect);
  function pointer(type: string, x: number, y: number) {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
    });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    fireEvent(button, event);
  }
  pointer('pointerdown', 0, 0);
  pointer('pointermove', 20, 20);
  pointer('pointermove', 56, 86);
  expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  expect(usePhotoStore.getState().photo!.watermark.x).toBe(0);
  act(() => frame!(0));
  expect(usePhotoStore.getState().photo!.watermark.x).toBe(1);
  expect(usePhotoStore.getState().photo!.watermark.y).toBe(1);
  pointer('pointermove', 28, 43);
  pointer('pointerup', 28, 43);
  expect(usePhotoStore.getState().photo!.watermark.x).toBeCloseTo(0.5);
  expect(usePhotoStore.getState().photo!.watermark.y).toBeCloseTo(0.5);
});
