import { useState, useRef, useEffect } from 'react';
import { MapDimensions, PanState } from '../types';

export function useViewport(mapDimensions: MapDimensions) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const viewportState = useRef({ zoom, pan });
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewportState.current = { zoom, pan };
  }, [zoom, pan]);
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    let isZooming = false;

    const onWheel = (e: WheelEvent) => {
      if (isZooming) return;
      e.preventDefault();
      const { zoom: currentZoom, pan: currentPan } = viewportState.current;
      const zoomFactor = 1.41;

      let newZoom = (-e.deltaY > 0) ?
        currentZoom * zoomFactor :
        currentZoom / zoomFactor;
    
      newZoom = Math.max(0.01, Math.min(newZoom, 50));
      const rect = workspace.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const mapX = (mouseX - currentPan.x) / currentZoom;
      const mapY = (mouseY - currentPan.y) / currentZoom;
      isZooming = true;
      setZoom(newZoom);
      setPan({ x: mouseX - mapX * newZoom, y: mouseY - mapY * newZoom });
      setTimeout(() => { isZooming = false; }, 50);
    };

    workspace.addEventListener('wheel', onWheel, { passive: false });
    return () => workspace.removeEventListener('wheel', onWheel);
  }, []);
  const resetZoom = () => {
    const fitZoom = Math.min(
      (window.innerWidth - 320) / mapDimensions.width,
      window.innerHeight / mapDimensions.height
    ) * 0.90;
    const z = fitZoom > 0 ? fitZoom : 1;
    setZoom(z);
    setPan({
      x: (window.innerWidth - 320 - mapDimensions.width * z) / 2,
      y: (window.innerHeight - mapDimensions.height * z) / 2,
    });
  };

  const zoomToCenter = (zoomFactor: number) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const rect = workspace.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const { zoom: currentZoom, pan: currentPan } = viewportState.current;
    const mapX = (centerX - currentPan.x) / currentZoom;
    const mapY = (centerY - currentPan.y) / currentZoom;

    const newZoom = Math.max(0.01, Math.min(currentZoom * zoomFactor, 50));
    setPan({
      x: centerX - mapX * newZoom,
      y: centerY - mapY * newZoom,
    });
    setZoom(newZoom);
  };

  return { zoom, setZoom, pan, setPan, workspaceRef, viewportState, resetZoom, zoomToCenter };
}
