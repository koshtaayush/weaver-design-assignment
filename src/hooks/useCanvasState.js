import { useState, useCallback } from "react";
import { clampOffset } from "../utils";
import { CANVAS_CONFIG } from "../constants";

export const useCanvasState = () => {
  // Canvas interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [mousePos, setMousePos] = useState(null);

  // Rectangle states
  const [rects, setRects] = useState([]);
  const [tempRect, setTempRect] = useState(null);
  const [selectedRects, setSelectedRects] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState(null);

  // Minimap states
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [minimapDragStart, setMinimapDragStart] = useState(null);

  const clampedSetOffset = useCallback(
    (newOffset) => {
      setOffset(clampOffset(newOffset, zoom));
    },
    [zoom]
  );

  const resetInteractionStates = useCallback(() => {
    setTempRect(null);
    setIsPanning(false);
    setDraggingIndex(null);
    setDragOffset(null);
    setIsDraggingMinimap(false);
    setMinimapDragStart(null);
  }, []);

  const toggleMode = useCallback(() => {
    setIsCreating((prev) => !prev);
    setSelectedRects([]);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) =>
      Math.min(z + CANVAS_CONFIG.ZOOM_STEP, CANVAS_CONFIG.MAX_ZOOM)
    );
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) =>
      Math.max(z - CANVAS_CONFIG.ZOOM_STEP, CANVAS_CONFIG.MIN_ZOOM)
    );
  }, []);

  const handleZoom = useCallback((delta) => {
    setZoom((prevZoom) => {
      const zoomDelta =
        delta < 0 ? CANVAS_CONFIG.ZOOM_STEP : -CANVAS_CONFIG.ZOOM_STEP;
      return Math.min(
        CANVAS_CONFIG.MAX_ZOOM,
        Math.max(CANVAS_CONFIG.MIN_ZOOM, prevZoom + zoomDelta)
      );
    });
  }, []);

  return {
    // States
    isPanning,
    isCreating,
    offset,
    startPos,
    zoom,
    mousePos,
    rects,
    tempRect,
    selectedRects,
    draggingIndex,
    dragOffset,
    isDraggingMinimap,
    minimapDragStart,
    // Setters
    setIsPanning,
    setIsCreating,
    setOffset: clampedSetOffset,
    setStartPos,
    setZoom,
    setMousePos,
    setRects,
    setTempRect,
    setSelectedRects,
    setDraggingIndex,
    setDragOffset,
    setIsDraggingMinimap,
    setMinimapDragStart,
    // Actions
    resetInteractionStates,
    toggleMode,
    zoomIn,
    zoomOut,
    handleZoom,
  };
};
