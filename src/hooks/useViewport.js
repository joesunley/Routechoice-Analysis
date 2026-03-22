import { useState, useRef, useEffect } from 'react';

export function useViewport(mapDimensions) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewportState = useRef({ zoom, pan });
  const workspaceRef = useRef(null);

  useEffect(() => {
    viewportState.current = { zoom, pan };
  }, [zoom, pan]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const onWheel = (e) => {
      e.preventDefault();
      const { zoom, pan } = viewportState.current;
      const zoomSensitivity = 0.0015;
      const delta = -e.deltaY * zoomSensitivity;
      let newZoom = zoom * (1 + delta);
      newZoom = Math.max(0.01, Math.min(newZoom, 50));
      const rect = workspace.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const mapX = (mouseX - pan.x) / zoom;
      const mapY = (mouseY - pan.y) / zoom;
      setZoom(newZoom);
      setPan({ x: mouseX - mapX * newZoom, y: mouseY - mapY * newZoom });
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

  return { zoom, setZoom, pan, setPan, workspaceRef, viewportState, resetZoom };
}
