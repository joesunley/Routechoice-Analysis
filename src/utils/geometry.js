export const calcPixelDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const calcTotalPixelDistance = (points) => {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calcPixelDistance(points[i], points[i + 1]);
  }
  return total;
};

export const pixelsToMeters = (pixels, dpi, scale) => {
  if (!dpi || !scale || pixels === 0) return 0;
  return ((pixels / dpi) * 2.54 * scale) / 100;
};

export const calculateDpiFromPoints = (pixels, meters, scale) => {
  if (!meters || !scale || pixels === 0) return 150;
  return (pixels * 2.54 * scale) / (meters * 100);
};

export const handleNumericInput = (val, setter) => {
  const num = val.replace(/[^0-9.]/g, '');
  setter(num);
};

export const inputEventGuard = (e) => {
  e.stopPropagation();
};
