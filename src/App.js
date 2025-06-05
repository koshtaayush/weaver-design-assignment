import React, { useRef, useEffect } from "react";
import { useCanvasState } from "./hooks/useCanvasState";
import { useCanvasHandlers } from "./hooks/useCanvasHandlers";
import Toolbar from "./components/Toolbar";
import CanvasLayer from "./components/CanvasLayer";
import Minimap from "./components/Minimap";
import Tooltip from "./components/Tooltip";
import "./styles.css";

export default function App() {
  const canvasRef = useRef(null);
  const minimapRef = useRef(null);

  const state = useCanvasState();
  const {
    isPanning,
    isCreating,
    offset,
    zoom,
    mousePos,
    rects,
    tempRect,
    selectedRects,
    isDraggingMinimap,
    minimapDragStart,
    toggleMode,
    zoomIn,
    zoomOut,
    handleZoom,
    resetInteractionStates,
  } = state;

  const handlers = useCanvasHandlers(state, state, { canvasRef, minimapRef });

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleViewportDrag,
    handleMinimapDrag,
    handleContextMenu,
  } = handlers;

  // Global event listeners for minimap dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMinimapDrag(e);
    const handleGlobalMouseUp = () => resetInteractionStates();

    if (isDraggingMinimap) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isDraggingMinimap,
    minimapDragStart,
    handleMinimapDrag,
    resetInteractionStates,
  ]);

  const handleWheel = (e) => {
    e.preventDefault();
    handleZoom(e.deltaY);
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <Toolbar
        isCreating={isCreating}
        onToggleMode={toggleMode}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />

      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          cursor: isCreating ? "crosshair" : "grab",
          position: "relative",
        }}
      >
        <CanvasLayer
          rects={rects}
          tempRect={tempRect}
          selectedRects={selectedRects}
          offset={offset}
          zoom={zoom}
        />

        <Minimap
          ref={minimapRef}
          rects={rects}
          offset={offset}
          zoom={zoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onViewportDrag={handleViewportDrag}
        />

        <Tooltip tempRect={tempRect} mousePos={mousePos} />
      </div>
    </div>
  );
}
