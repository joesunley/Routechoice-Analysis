import { useState, useEffect } from 'react';
import { Control } from '@/types';
import { calcPixelDistance } from '@/utils/geometry';

export function useControls() {
  const [controls, setControls] = useState<Control[]>([]);
  const [isAltDragging, setIsAltDragging] = useState(false);
  const [draggedControlId, setDraggedControlId] = useState<number | null>(null);
  const [altKeyPressed, setAltKeyPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.altKey) setAltKeyPressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (!e.altKey) setAltKeyPressed(false); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const addControl = (x: number, y: number) => {
    setControls(prev => [...prev, { id: Date.now(), x, y }]);
  };

  const tryStartAltDrag = (mapX: number, mapY: number, zoom: number): boolean => {
    if (controls.length === 0) 
      return false;
    
    let nearest: Control | null = null;
    let minDist = Infinity;
    const threshold = 50 / zoom;

    controls.forEach(c => {
      const d = calcPixelDistance({ x: mapX, y: mapY }, c);
      if (d < minDist && d < threshold) { 
        minDist = d; nearest = c; 
      }
    });

    if (nearest) {
      setIsAltDragging(true);
      setDraggedControlId((nearest as Control).id);
      return true;
    }
    
    return false;
  };

  const moveAltDraggedControl = (x: number, y: number) => {
    setControls(prev => prev.map(c =>
      c.id === draggedControlId ? { ...c, x, y } : c
    ));
  };

  const endAltDrag = () => {
    setIsAltDragging(false);
    setDraggedControlId(null);
  };

  return {
    controls,
    setControls,
    isAltDragging,
    draggedControlId,
    altKeyPressed,
    addControl,
    tryStartAltDrag,
    moveAltDraggedControl,
    endAltDrag,
  };
}
