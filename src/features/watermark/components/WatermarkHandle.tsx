import { useRef } from 'react';
import type { WatermarkLayout } from '../render-watermark';
import type { WatermarkSettings } from '../types';
import { usePhotoStore } from '@/features/editor/store/photo-store';

export function WatermarkHandle({
  layout,
  settings,
}: {
  layout: WatermarkLayout;
  settings: WatermarkSettings;
}) {
  const drag = useRef<{
    pointer: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
    travelX: number;
    travelY: number;
  } | null>(null);
  const update = usePhotoStore((state) => state.updateWatermark);
  if (!layout.width || !layout.height) return null;
  return (
    <button
      type="button"
      aria-label="Pindahkan watermark; gunakan tombol panah untuk menggeser"
      className="absolute touch-none cursor-grab rounded border border-dashed border-primary/70 bg-transparent focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing"
      style={{
        left: `${layout.x * 100}%`,
        top: `${layout.y * 100}%`,
        width: `${layout.width * 100}%`,
        height: `${layout.height * 100}%`,
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 0.05 : 0.01;
        if (
          ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
            event.key,
          )
        ) {
          event.preventDefault();
          update({
            x:
              settings.x +
              (event.key === 'ArrowLeft'
                ? -step
                : event.key === 'ArrowRight'
                  ? step
                  : 0),
            y:
              settings.y +
              (event.key === 'ArrowUp'
                ? -step
                : event.key === 'ArrowDown'
                  ? step
                  : 0),
          });
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || drag.current) return;
        const parent = event.currentTarget.parentElement;
        if (!parent) return;
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        const bounds = parent.getBoundingClientRect();
        const marginX = 0.04;
        const marginY = (0.04 * bounds.width) / bounds.height;
        drag.current = {
          pointer: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          x: settings.x,
          y: settings.y,
          travelX: Math.max(0, bounds.width * (1 - marginX - layout.width)),
          travelY: Math.max(0, bounds.height * (1 - marginY - layout.height)),
        };
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current || current.pointer !== event.pointerId) return;
        update({
          x:
            current.x +
            (current.travelX > 0
              ? (event.clientX - current.clientX) / current.travelX
              : 0),
          y:
            current.y +
            (current.travelY > 0
              ? (event.clientY - current.clientY) / current.travelY
              : 0),
        });
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointer === event.pointerId) {
          drag.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
    />
  );
}
