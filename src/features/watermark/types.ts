export interface WatermarkSettings {
  // Fraction of available travel, after subtracting the rendered box size.
  x: number;
  y: number;
  fontSize: number; // relative to image width
  font: 'sans' | 'serif' | 'mono';
  bold: boolean;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  align: 'left' | 'center' | 'right';
}
export const defaultWatermark = (): WatermarkSettings => ({
  x: 1,
  y: 0,
  fontSize: 0.026,
  font: 'sans',
  bold: false,
  color: '#ffffff',
  backgroundColor: '#000000',
  backgroundOpacity: 0.45,
  align: 'right',
});
