import { useState } from 'react';
import { VARIANT_COLORS } from '../constants';

export function useVariants() {
  const [variants, setVariants] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState([]);
  const [selectedLegIndex, setSelectedLegIndex] = useState(0);

  const addDrawingPoint = (x, y) => {
    setCurrentDrawing(prev => [...prev, { x, y }]);
  };

  const undoLastPoint = () => {
    setCurrentDrawing(prev => prev.slice(0, -1));
  };

  const handleFinishVariant = (pointsOverride = null) => {
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

  const deleteVariant = (id) => {
    setVariants(prev => prev.filter(v => v.id !== id));
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
  };
}
