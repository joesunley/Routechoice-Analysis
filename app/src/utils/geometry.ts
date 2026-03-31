import { Point } from '@/types';

export const calcPixelDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const calcTotalPixelDistance = (points: Point[]): number => {
  if (!points || points.length < 2) 
    return 0;

  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calcPixelDistance(points[i], points[i + 1]);
  }

  return total;
};

export const pixelsToMeters = (pixels: number, dpi: number, scale: number): number => {
  if (!dpi || !scale || pixels === 0) 
    return 0;

  return ((pixels / dpi) * 2.54 * scale) / 100;
};

export const calculateDpiFromPoints = (pixels: number, meters: number, scale: number): number => {
  if (!meters || !scale || pixels === 0) 
    return 150;
  
  return (pixels * 2.54 * scale) / (meters * 100);
};

export const handleNumericInput = (val: string, setter: (v: string) => void): void => {
  const num = val.replace(/[^0-9.]/g, '');
  setter(num);
};

export const inputEventGuard = (e: React.SyntheticEvent): void => {
  e.stopPropagation();
};
