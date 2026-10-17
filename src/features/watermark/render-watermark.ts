import { watermarkLines } from '@/features/metadata/metadata';
import type { PhotoMetadata } from '@/features/metadata/types';
import type { WatermarkSettings } from './types';

export interface WatermarkLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  lines: string[];
  padding: number;
  lineHeight: number;
}
export const clampUnit = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const families = {
  sans: 'Arial, sans-serif',
  serif: 'Georgia, serif',
  mono: 'monospace',
};
export function watermarkFont(settings: WatermarkSettings, size: number) {
  return `${settings.bold ? 700 : 400} ${size}px ${families[settings.font]}`;
}

function wrap(
  context: CanvasRenderingContext2D,
  paragraphs: string[],
  maxWidth: number,
): string[] {
  const result: string[] = [];
  for (const paragraph of paragraphs) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) {
        result.push(line);
        line = '';
      }
      // Hard-wrap unbroken names, preserving every code point rather than clipping.
      for (const character of Array.from(word)) {
        if (line && context.measureText(line + character).width > maxWidth) {
          result.push(line);
          line = '';
        }
        line += character;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

export function layoutWatermark(
  context: CanvasRenderingContext2D,
  metadata: PhotoMetadata,
  settings: WatermarkSettings,
  aspect: number,
): WatermarkLayout {
  // Fixed reference units make line breaks identical at preview/export sizes.
  const width = 1000;
  const height = width / aspect;
  const margin = 20;
  const paragraphs = watermarkLines(metadata);
  let size = Math.max(10, Math.min(60, settings.fontSize * width));
  let lines: string[] = [];
  let padding = 0;
  let lineHeight = 0;
  let boxWidth = 0;
  let boxHeight = 0;
  for (let attempt = 0; attempt < 64; attempt++) {
    context.font = watermarkFont(settings, size);
    padding = size * 0.6;
    lineHeight = size * 1.5;
    lines = wrap(context, paragraphs, width - 2 * margin - 2 * padding);
    boxWidth = lines.length
      ? Math.min(
          width - 2 * margin,
          Math.max(...lines.map((line) => context.measureText(line).width)) +
            padding * 2,
        )
      : 0;
    boxHeight = lines.length ? lines.length * lineHeight + padding * 2 : 0;
    if (boxHeight <= height - 2 * margin) break;
    size *= 0.9;
  }
  const x =
    margin + clampUnit(settings.x) * Math.max(0, width - 2 * margin - boxWidth);
  const y =
    margin +
    clampUnit(settings.y) * Math.max(0, height - 2 * margin - boxHeight);
  return {
    x: x / width,
    y: y / height,
    width: boxWidth / width,
    height: boxHeight / height,
    fontSize: size,
    padding,
    lineHeight,
    lines,
  };
}

export function drawWatermark(
  context: CanvasRenderingContext2D,
  metadata: PhotoMetadata,
  settings: WatermarkSettings,
  width: number,
  height: number,
): WatermarkLayout {
  context.save();
  const layout = layoutWatermark(context, metadata, settings, width / height);
  const referenceHeight = (1000 * height) / width;
  context.scale(width / 1000, width / 1000);
  const x = layout.x * 1000;
  const y = layout.y * referenceHeight;
  const boxWidth = layout.width * 1000;
  const boxHeight = layout.height * referenceHeight;
  context.globalAlpha = clampUnit(settings.backgroundOpacity);
  context.fillStyle = settings.backgroundColor;
  context.fillRect(x, y, boxWidth, boxHeight);
  context.globalAlpha = 1;
  context.fillStyle = settings.color;
  context.font = watermarkFont(settings, layout.fontSize);
  context.textAlign = settings.align;
  context.textBaseline = 'middle';
  const textX =
    settings.align === 'left'
      ? x + layout.padding
      : settings.align === 'right'
        ? x + boxWidth - layout.padding
        : x + boxWidth / 2;
  layout.lines.forEach((line, index) =>
    context.fillText(
      line,
      textX,
      y + layout.padding + layout.lineHeight * (index + 0.5),
    ),
  );
  context.restore();
  return layout;
}
