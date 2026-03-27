import { useState } from 'react';
import { Variant } from '@/types';
import { calcPixelDistance } from '@/utils/geometry';

export function useVariantLabels() {
  const [isAltDraggingLabel, setIsAltDraggingLabel] = useState(false);
  const [draggedVariantId, setDraggedVariantId] = useState<number | null>(null);

  const tryStartAltDragLabel = (
    mapX: number,
    mapY: number,
    zoom: number,
    variants: Variant[],
    selectedLegIndex: number | null
  ): boolean => {
    if (selectedLegIndex === null) 
      return false;    // Get variants for the selected leg

    const legVariants = variants.filter(v => v.legIndex === selectedLegIndex);
    if (legVariants.length === 0) 
      return false;

    let nearest: Variant | null = null;
    let minDist = Infinity;
    const threshold = 80 / zoom;

    for (const variant of legVariants) {
      // Calculate label position
      const midPoint = variant.points[Math.floor(variant.points.length / 2)];
      const labelOffset = variant.labelOffset || { x: 0, y: 0 };
      const labelPos = { 
        x: midPoint.x + labelOffset.x, 
        y: midPoint.y + labelOffset.y 
      };

      const d = calcPixelDistance({ x: mapX, y: mapY }, labelPos);
      if (d < minDist && d < threshold) {
        minDist = d;
        nearest = variant;
      }
    }

    if (nearest) {
      setIsAltDraggingLabel(true);
      setDraggedVariantId(nearest.id);
      return true;
    }

    return false;
  };

  const moveAltDraggedLabel = (x: number, y: number, variants: Variant[]): Variant[] => {
    return variants.map(v => {
      if (v.id === draggedVariantId) {
        const midPoint = v.points[Math.floor(v.points.length / 2)];

        return {
          ...v,
          labelOffset: {
            x: x - midPoint.x,
            y: y - midPoint.y,
          },
        };
      }
      
      return v;
    });
  };

  const endAltDragLabel = () => {
    setIsAltDraggingLabel(false);
    setDraggedVariantId(null);
  };

  return {
    isAltDraggingLabel,
    draggedVariantId,
    tryStartAltDragLabel,
    moveAltDraggedLabel,
    endAltDragLabel,
  };
}
