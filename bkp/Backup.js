import React, { useState, useRef, useEffect, useCallback } from "react";
import "./styles.css";

export default function App() {
  const canvasRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState(null);
  const [rects, setRects] = useState([]);
  const [tempRect, setTempRect] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [mousePos, setMousePos] = useState(null);
  const minimapRef = useRef(null);
  const [minimapDragging, setMinimapDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 200;
  const VIRTUAL_WIDTH = 10000;
  const VIRTUAL_HEIGHT = 10000;

  const [selectedRects, setSelectedRects] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState(null);

  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [minimapDragStart, setMinimapDragStart] = useState(null);

  const clampOffset = useCallback(
    (newOffset) => {
      const viewWidth = window.innerWidth / zoom;
      const viewHeight = window.innerHeight / zoom;
      const maxOffsetX = 0;
      const maxOffsetY = 0;
      const minOffsetX = -(VIRTUAL_WIDTH * zoom - viewWidth);
      const minOffsetY = -(VIRTUAL_HEIGHT * zoom - viewHeight);

      return {
        x: Math.min(maxOffsetX, Math.max(minOffsetX, newOffset.x)),
        y: Math.min(maxOffsetY, Math.max(minOffsetY, newOffset.y)),
      };
    },
    [zoom]
  );

  const handleMinimapMove = useCallback(
    (clickX, clickY) => {
      const viewWidth = window.innerWidth / zoom;
      const viewHeight = window.innerHeight / zoom;
      const scaleX = VIRTUAL_WIDTH / MINIMAP_WIDTH;
      const scaleY = VIRTUAL_HEIGHT / MINIMAP_HEIGHT;
      const newOffsetX = -clickX * scaleX + viewWidth / 2;
      const newOffsetY = -clickY * scaleY + viewHeight / 2;
      setOffset(clampOffset({ x: newOffsetX * zoom, y: newOffsetY * zoom }));
    },
    [zoom, clampOffset]
  );

  const handleMouseDown = (e) => {
    // Don't draw if clicking inside the minimap
    const minimapRect = minimapRef.current.getBoundingClientRect();
    if (
      minimapRect &&
      e.clientX >= minimapRect.left &&
      e.clientX <= minimapRect.right &&
      e.clientY >= minimapRect.top &&
      e.clientY <= minimapRect.bottom
    ) {
      const clickX = e.clientX - minimapRect.left;
      const clickY = e.clientY - minimapRect.top;
      setMinimapDragging(true);
      setDragStart({ x: clickX, y: clickY });
      handleMinimapMove(clickX, clickY);
      return; // exit early if clicking on the minimap
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    const canvasX = (mouseX - offset.x) / zoom;
    const canvasY = (mouseY - offset.y) / zoom;

    if (e.button === 2) {
      setRects((prev) => prev.filter((_, i) => !selectedRects.includes(i)));
      setSelectedRects([]);
      return;
    }

    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (
        canvasX >= r.x &&
        canvasX <= r.x + r.width &&
        canvasY >= r.y &&
        canvasY <= r.y + r.height
      ) {
        setSelectedRects([i]);
        setDraggingIndex(i);
        setDragOffset({ x: canvasX - r.x, y: canvasY - r.y });
        return;
      }
    }

    if (isCreating) {
      const rectStart = { x: canvasX, y: canvasY };
      setStartPos(rectStart);
      setTempRect({ ...rectStart, width: 0, height: 0 });
    } else {
      setIsPanning(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setSelectedRects([]);
    }
  };

  const lastMove = useRef(Date.now());

  const handleMouseMove = (e) => {
    const now = Date.now();
    if (now - lastMove.current < 16) return;
    lastMove.current = now;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    setMousePos({ x: mouseX, y: mouseY });

    const canvasX = (mouseX - offset.x) / zoom;
    const canvasY = (mouseY - offset.y) / zoom;

    if (isCreating && startPos && e.buttons === 1) {
      const x = Math.min(startPos.x, canvasX);
      const y = Math.min(startPos.y, canvasY);
      const width = Math.abs(canvasX - startPos.x);
      const height = Math.abs(canvasY - startPos.y);
      setTempRect({ x, y, width, height });
    } else if (draggingIndex !== null && dragOffset) {
      setRects((prevRects) => {
        const updated = [...prevRects];
        selectedRects.forEach((i) => {
          updated[i] = {
            ...updated[i],
            x: canvasX - dragOffset.x,
            y: canvasY - dragOffset.y,
          };
        });
        return updated;
      });
    } else if (isPanning && startPos) {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }));
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isCreating && tempRect && tempRect.width > 0 && tempRect.height > 0) {
      setRects((prev) => [...prev, tempRect]);
    }
    setTempRect(null);
    setIsPanning(false);
    setDraggingIndex(null);
    setDragOffset(null);
    setIsDraggingMinimap(false);
    setMinimapDragStart(null);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const renderMinimapRects = () => {
    const scaleX = MINIMAP_WIDTH / VIRTUAL_WIDTH;
    const scaleY = MINIMAP_HEIGHT / VIRTUAL_HEIGHT;
    return rects.map((r, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: r.x * scaleX,
          top: r.y * scaleY,
          width: Math.abs(r.width) * scaleX,
          height: Math.abs(r.height) * scaleY,
          backgroundColor: "rgba(0, 150, 255, 0.4)",
        }}
      ></div>
    ));
  };

  const renderViewportBox = () => {
    const viewWidth = window.innerWidth / zoom;
    const viewHeight = window.innerHeight / zoom;
    const scaleX = MINIMAP_WIDTH / VIRTUAL_WIDTH;
    const scaleY = MINIMAP_HEIGHT / VIRTUAL_HEIGHT;
    const left = (-offset.x / zoom) * scaleX;
    const top = (-offset.y / zoom) * scaleY;

    return (
      <div
        style={{
          position: "absolute",
          border: "1px solid red",
          left,
          top,
          width: viewWidth * scaleX,
          height: viewHeight * scaleY,
          cursor: "grab",
          zIndex: 10,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingMinimap(true);
          setMinimapDragStart({ x: e.clientX, y: e.clientY });
        }}
      />
    );
  };

  const renderTempDimensions = () => {
    if (!tempRect || !mousePos) return null;
    const x = mousePos.x + 10;
    const y = mousePos.y + 10;
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "2px 6px",
          fontSize: "12px",
          borderRadius: "4px",
          pointerEvents: "none",
        }}
      >
        {`${Math.abs(tempRect.width.toFixed(0))} x ${Math.abs(
          tempRect.height.toFixed(0)
        )}`}
      </div>
    );
  };

  const handleMinimapClick = (e) => {
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newOffsetX = -(
      (clickX / MINIMAP_WIDTH) * VIRTUAL_WIDTH * zoom -
      window.innerWidth / 2
    );
    const newOffsetY = -(
      (clickY / MINIMAP_HEIGHT) * VIRTUAL_HEIGHT * zoom -
      window.innerHeight / 2
    );
    setOffset(clampOffset({ x: newOffsetX, y: newOffsetY }));
  };

  const handleMinimapDrag = (e) => {
    if (!isDraggingMinimap || !minimapDragStart) return;

    const dx = e.clientX - minimapDragStart.x;
    const dy = e.clientY - minimapDragStart.y;

    const percentX = dx / MINIMAP_WIDTH;
    const percentY = dy / MINIMAP_HEIGHT;

    setOffset((prev) =>
      clampOffset({
        x: prev.x - percentX * VIRTUAL_WIDTH * zoom,
        y: prev.y - percentY * VIRTUAL_HEIGHT * zoom,
      })
    );

    setMinimapDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e) => handleMinimapDrag(e);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingMinimap, minimapDragStart]);

  return (
    <div onContextMenu={handleContextMenu}>
      <button onClick={() => setIsCreating((prev) => !prev)}>
        {isCreating ? "Pan Mode" : "Create Rectangle Mode"}
      </button>
      <button onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}>
        Zoom In
      </button>
      <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}>
        Zoom Out
      </button>

      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((prevZoom) => {
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            return Math.min(3, Math.max(0.3, prevZoom + delta));
          });
        }}
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          cursor: isCreating ? "crosshair" : "grab",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: `${VIRTUAL_WIDTH}px`,
            height: `${VIRTUAL_HEIGHT}px`,
          }}
        >
          {[...rects, tempRect].filter(Boolean).map((rect, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                backgroundColor: selectedRects.includes(i)
                  ? "rgba(255, 0, 0, 0.5)"
                  : "rgba(0, 150, 255, 0.5)",
                border: "1px solid #0077cc",
                pointerEvents: "auto",
              }}
            >
              {tempRect === rect && (
                <div
                  style={{
                    position: "absolute",
                    top: -16,
                    left: 0,
                    fontSize: 10,
                    backgroundColor: "#fff",
                    padding: "1px 3px",
                    border: "1px solid #ccc",
                    whiteSpace: "nowrap",
                  }}
                >
                  {Math.round(rect.width)} × {Math.round(rect.height)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          ref={minimapRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            width: MINIMAP_WIDTH,
            height: MINIMAP_HEIGHT,
            position: "absolute",
            bottom: 20,
            right: 20,
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            border: "1px solid #000",
            cursor: "pointer",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {renderMinimapRects()}
          {renderViewportBox()}
        </div>

        {renderTempDimensions()}
      </div>
    </div>
  );
}
