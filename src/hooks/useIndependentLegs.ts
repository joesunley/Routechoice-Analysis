import { useState } from 'react';
import { Control, IndependentLeg } from '@/types';
import { calcPixelDistance } from '@/utils/geometry';

export function useIndependentLegs() {
  const [independentLegs, setIndependentLegs] = useState<IndependentLeg[]>([]);
  const [pendingStart, setPendingStart] = useState<Control | null>(null);
  const [selectedLegId, setSelectedLegId] = useState<number | null>(null);
  const [isAltDragging, setIsAltDragging] = useState(false);
  const [draggedLegId, setDraggedLegId] = useState<number | null>(null);
  const [draggedEndpoint, setDraggedEndpoint] = useState<'start' | 'end' | null>(null);

  const handleFirstClick = (x: number, y: number) => {
    setPendingStart({ id: Date.now(), x, y });
  };

  const handleSecondClick = (x: number, y: number): number => {
    if (!pendingStart) 
      return -1;

    const ts = Date.now();
    const end: Control = { id: ts + 1, x, y };
    const newId = ts + 2;

    setIndependentLegs(prev => {
      const newLeg: IndependentLeg = {
        id: newId,
        label: `Leg ${prev.length + 1}`,
        start: pendingStart,
        end,
        straightLength: calcPixelDistance(pendingStart, end),
      };

      return [...prev, newLeg];
    });
    
    setPendingStart(null);
    setSelectedLegId(newId);

    return newId;
  };

  const cancelPlacement = () => {
    setPendingStart(null);
  };

  const deleteLeg = (id: number) => {
    setIndependentLegs(prev => {
      const filtered = prev.filter(l => l.id !== id);
      return filtered.map((l, i) => ({ ...l, label: `Leg ${i + 1}` }));
    });

    setSelectedLegId(prev => (prev === id ? null : prev));
  };

  const updateLegNotes = (id: number, notes: string) => {
    setIndependentLegs(prev =>
      prev.map(l => l.id === id ? { ...l, notes: notes || undefined } : l)
    );
  };

  const deleteAllLegs = () => {
    setIndependentLegs([]);
    setPendingStart(null);
    setSelectedLegId(null);
  };

  const tryStartAltDrag = (mapX: number, mapY: number, zoom: number): boolean => {
    const threshold = 50 / zoom;
    let best: { legId: number; endpoint: 'start' | 'end'; dist: number } | null = null;

    for (const leg of independentLegs) {
      const ds = calcPixelDistance({ x: mapX, y: mapY }, leg.start);
      const de = calcPixelDistance({ x: mapX, y: mapY }, leg.end);

      if (ds < threshold && (!best || ds < best.dist)) {
        best = { legId: leg.id, endpoint: 'start', dist: ds };
      }

      if (de < threshold && (!best || de < best.dist)) {
        best = { legId: leg.id, endpoint: 'end', dist: de };
      }
    }
    if (best) {
      setIsAltDragging(true);
      setDraggedLegId(best.legId);
      setDraggedEndpoint(best.endpoint);
      return true;
    }

    return false;
  };

  const moveAltDraggedControl = (x: number, y: number) => {
    if (draggedLegId === null || draggedEndpoint === null) 
      return;

    setIndependentLegs(prev =>
      prev.map(l => {
        if (l.id !== draggedLegId) 
          return l;

        const newStart = draggedEndpoint === 'start' ? { ...l.start, x, y } : l.start;
        const newEnd = draggedEndpoint === 'end' ? { ...l.end, x, y } : l.end;
        
        return { ...l, start: newStart, end: newEnd, straightLength: calcPixelDistance(newStart, newEnd) };
      })
    );
  };

  const endAltDrag = () => {
    setIsAltDragging(false);
    setDraggedLegId(null);
    setDraggedEndpoint(null);
  };

  return {
    independentLegs,
    setIndependentLegs,
    pendingStart,
    selectedLegId,
    setSelectedLegId,
    isAltDragging,
    draggedLegId,
    draggedEndpoint,
    handleFirstClick,
    handleSecondClick,
    cancelPlacement,
    deleteLeg,
    updateLegNotes,
    deleteAllLegs,
    tryStartAltDrag,
    moveAltDraggedControl,
    endAltDrag,
  };
}
