import { useState } from 'react';
import { Point, Variant } from '../types';
import { VARIANT_COLORS } from '../constants';

export function useVariants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Point[]>([]);
  const [selectedLegIndex, setSelectedLegIndex] = useState(0);

  const addDrawingPoint = (x: number, y: number) => {
    setCurrentDrawing(prev => [...prev, { x, y }]);
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
      const existingLegVariants = prev.filter(v => v.legIndex === selectedLegIndex);
      const color = VARIANT_COLORS[existingLegVariants.length % VARIANT_COLORS.length];
      const name = String.fromCharCode(65 + existingLegVariants.length);
      return [...prev, { id: Date.now(), legIndex: selectedLegIndex, points: pointsToSave, color, name }];
    });
    setCurrentDrawing([]);
  };
  const deleteVariant = (id: number) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const editVariant = (id: number) => {
    const variantToEdit = variants.find(v => v.id === id);
    if (variantToEdit) {
      setCurrentDrawing(variantToEdit.points);
      setSelectedLegIndex(variantToEdit.legIndex);
      deleteVariant(id);
    }
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
  };
}
