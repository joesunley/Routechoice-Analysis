import { useState, useRef } from 'react';
import { Point, Variant } from '../types';
import { VARIANT_COLORS } from '../constants';
import { calcPixelDistance } from '../utils/geometry';

export function useVariants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Point[]>([]);
  const [selectedLegIndex, setSelectedLegIndex] = useState(0);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingVariantMetadata, setEditingVariantMetadata] = useState<{ color: string; name: string } | null>(null);
  const [isAltDraggingPoint, setIsAltDraggingPoint] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const currentDrawingRef = useRef<Point[]>([]);

  const addDrawingPoint = (x: number, y: number) => {
    setCurrentDrawing(prev => {
      const next = [...prev, { x, y }];
      currentDrawingRef.current = next;
      return next;
    });
  };

  const undoLastPoint = () => {
    setCurrentDrawing(prev => prev.slice(0, -1));
  };
  const handleFinishVariant = (pointsOverride: Point[] | null = null) => {
    const pointsToSave = pointsOverride || currentDrawing;
    if (pointsToSave.length < 2) {
      setCurrentDrawing([]);
      return;
    }
    setVariants(prev => {
      // If editing an existing variant, update it with new points but preserve color and name
      if (editingVariantId !== null && editingVariantMetadata) {
        const updatedVariant: Variant = {
          id: editingVariantId,
          legIndex: selectedLegIndex,
          points: pointsToSave,
          color: editingVariantMetadata.color,
          name: editingVariantMetadata.name,
        };
        // The variant is still in prev, so we can just map over it
        return prev.map(v => v.id === editingVariantId ? updatedVariant : v);
      }
      
      // Otherwise create a new variant with generated color and name
      const existingLegVariants = prev.filter(v => v.legIndex === selectedLegIndex);
      const color = VARIANT_COLORS[existingLegVariants.length % VARIANT_COLORS.length];
      const name = String.fromCharCode(65 + existingLegVariants.length);
      return [...prev, { id: Date.now(), legIndex: selectedLegIndex, points: pointsToSave, color, name }];
    });
    setCurrentDrawing([]);
    setEditingVariantId(null);
    setEditingVariantMetadata(null);
  };
  const deleteVariant = (id: number) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };
  const editVariant = (id: number) => {
    const variantToEdit = variants.find(v => v.id === id);
    if (variantToEdit) {
      setCurrentDrawing(variantToEdit.points);
      currentDrawingRef.current = variantToEdit.points;
      setSelectedLegIndex(variantToEdit.legIndex);
      setEditingVariantId(id);
      setEditingVariantMetadata({ color: variantToEdit.color, name: variantToEdit.name });
    }
  };

  const tryStartAltDragPoint = (mapX: number, mapY: number, zoom: number): boolean => {
    const points = currentDrawingRef.current;
    if (points.length === 0) return false;
    let nearestIndex = -1;
    let minDist = Infinity;
    const threshold = 50 / zoom;
    points.forEach((p, i) => {
      const d = calcPixelDistance({ x: mapX, y: mapY }, p);
      if (d < minDist && d < threshold) { minDist = d; nearestIndex = i; }
    });
    if (nearestIndex >= 0) {
      setIsAltDraggingPoint(true);
      setDraggedPointIndex(nearestIndex);
      return true;
    }
    return false;
  };

  const moveAltDraggedPoint = (x: number, y: number, pointIndex: number) => {
    setCurrentDrawing(prev => {
      const next = prev.map((p, i) => i === pointIndex ? { x, y } : p);
      currentDrawingRef.current = next;
      return next;
    });
  };

  const endAltDragPoint = () => {
    setIsAltDraggingPoint(false);
    setDraggedPointIndex(null);
  };

  return {
    variants,
    setVariants,
    currentDrawing,
    setCurrentDrawing,
    selectedLegIndex,
    setSelectedLegIndex,
    addDrawingPoint,
    undoLastPoint,
    handleFinishVariant,
    deleteVariant,
    editVariant,
    editingVariantId,
    isAltDraggingPoint,
    draggedPointIndex,
    tryStartAltDragPoint,
    moveAltDraggedPoint,
    endAltDragPoint,
  };
}
