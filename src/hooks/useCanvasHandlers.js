import { useCallback, useRef } from "react";
import { screenToCanvas, isPointInRect, createRectFromPoints } from "../utils";
import { CANVAS_CONFIG } from "../constants";

export const useCanvasHandlers = (state, actions, refs) => {
  const {
    isPanning,
    isCreating,
    offset,
    startPos,
    zoom,
    rects,
    selectedRects,
    draggingIndex,
    dragOffset,
    isDraggingMinimap,
    minimapDragStart,
  } = state;

  const {
    setIsPanning,
    setStartPos,
    setMousePos,
    setRects,
    setTempRect,
    setSelectedRects,
    setDraggingIndex,
    setDragOffset,
    setOffset,
    setIsDraggingMinimap,
    setMinimapDragStart,
    resetInteractionStates,
  } = actions;

  const { canvasRef, minimapRef } = refs;

  const lastMove = useRef(Date.now());

  const handleMinimapMove = useCallback(
    (clickX, clickY) => {
      const viewWidth = window.innerWidth / zoom;
      const viewHeight = window.innerHeight / zoom;
      const scaleX = CANVAS_CONFIG.VIRTUAL_WIDTH / CANVAS_CONFIG.MINIMAP_WIDTH;
      const scaleY =
        CANVAS_CONFIG.VIRTUAL_HEIGHT / CANVAS_CONFIG.MINIMAP_HEIGHT;
      const newOffsetX = -clickX * scaleX + viewWidth / 2;
      const newOffsetY = -clickY * scaleY + viewHeight / 2;
      setOffset({ x: newOffsetX * zoom, y: newOffsetY * zoom });
    },
    [zoom, setOffset]
  );

  const handleMouseDown = useCallback(
    (e) => {
      // Don't draw if clicking inside the minimap
      const minimapRect = minimapRef.current?.getBoundingClientRect();
      if (
        minimapRect &&
        e.clientX >= minimapRect.left &&
        e.clientX <= minimapRect.right &&
        e.clientY >= minimapRect.top &&
        e.clientY <= minimapRect.bottom
      ) {
        const clickX = e.clientX - minimapRect.left;
        const clickY = e.clientY - minimapRect.top;
        handleMinimapMove(clickX, clickY);
        return; // exit early if clicking on the minimap
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;
      const canvasCoords = screenToCanvas(mouseX, mouseY, offset, zoom);

      if (e.button === 2) {
        setRects((prev) => prev.filter((_, i) => !selectedRects.includes(i)));
        setSelectedRects([]);
        return;
      }

      // Check for rectangle selection
      for (let i = rects.length - 1; i >= 0; i--) {
        const r = rects[i];
        if (isPointInRect(canvasCoords.x, canvasCoords.y, r)) {
          setSelectedRects([i]);
          setDraggingIndex(i);
          setDragOffset({
            x: canvasCoords.x - r.x,
            y: canvasCoords.y - r.y,
          });
          return;
        }
      }

      if (isCreating) {
        const rectStart = { x: canvasCoords.x, y: canvasCoords.y };
        setStartPos(rectStart);
        setTempRect({ ...rectStart, width: 0, height: 0 });
      } else {
        setIsPanning(true);
        setStartPos({ x: e.clientX, y: e.clientY });
        setSelectedRects([]);
      }
    },
    [
      canvasRef,
      minimapRef,
      offset,
      zoom,
      rects,
      selectedRects,
      isCreating,
      setIsPanning,
      setStartPos,
      setTempRect,
      setSelectedRects,
      setDraggingIndex,
      setDragOffset,
      setRects,
      handleMinimapMove,
    ]
  );

  const handleMouseMove = useCallback(
    (e) => {
      const now = Date.now();
      if (now - lastMove.current < CANVAS_CONFIG.THROTTLE_MS) return;
      lastMove.current = now;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;
      setMousePos({ x: mouseX, y: mouseY });

      const canvasCoords = screenToCanvas(mouseX, mouseY, offset, zoom);

      if (isCreating && startPos && e.buttons === 1) {
        const newRect = createRectFromPoints(startPos, canvasCoords);
        setTempRect(newRect);
      } else if (draggingIndex !== null && dragOffset) {
        setRects((prevRects) => {
          const updated = [...prevRects];
          selectedRects.forEach((i) => {
            updated[i] = {
              ...updated[i],
              x: canvasCoords.x - dragOffset.x,
              y: canvasCoords.y - dragOffset.y,
            };
          });
          return updated;
        });
      } else if (isPanning && startPos) {
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        setOffset({ x: offset.x + dx, y: offset.y + dy });
        setStartPos({ x: e.clientX, y: e.clientY });
      }
    },
    [
      canvasRef,
      offset,
      zoom,
      isCreating,
      startPos,
      draggingIndex,
      dragOffset,
      isPanning,
      selectedRects,
      setMousePos,
      setTempRect,
      setRects,
      setOffset,
      setStartPos,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (
      isCreating &&
      state.tempRect &&
      state.tempRect.width > 0 &&
      state.tempRect.height > 0
    ) {
      setRects((prev) => [...prev, state.tempRect]);
    }
    resetInteractionStates();
  }, [isCreating, state.tempRect, setRects, resetInteractionStates]);

  const handleViewportDrag = useCallback(
    (e) => {
      setIsDraggingMinimap(true);
      setMinimapDragStart({ x: e.clientX, y: e.clientY });
    },
    [setIsDraggingMinimap, setMinimapDragStart]
  );

  const handleMinimapDrag = useCallback(
    (e) => {
      if (!isDraggingMinimap || !minimapDragStart) return;

      const dx = e.clientX - minimapDragStart.x;
      const dy = e.clientY - minimapDragStart.y;

      const percentX = dx / CANVAS_CONFIG.MINIMAP_WIDTH;
      const percentY = dy / CANVAS_CONFIG.MINIMAP_HEIGHT;

      setOffset({
        x: offset.x - percentX * CANVAS_CONFIG.VIRTUAL_WIDTH * zoom,
        y: offset.y - percentY * CANVAS_CONFIG.VIRTUAL_HEIGHT * zoom,
      });

      setMinimapDragStart({ x: e.clientX, y: e.clientY });
    },
    [
      isDraggingMinimap,
      minimapDragStart,
      offset,
      zoom,
      setOffset,
      setMinimapDragStart,
    ]
  );

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleViewportDrag,
    handleMinimapDrag,
    handleContextMenu,
  };
};
