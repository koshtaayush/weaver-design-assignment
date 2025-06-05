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
      setMinimapDragging(true);
      setDragStart({ x: clickX, y: clickY });
      handleMinimapMove(clickX, clickY);
      return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    if (isCreating) {
      const rectStart = {
        x: (mouseX - offset.x) / zoom,
        y: (mouseY - offset.y) / zoom,
      };
      setStartPos(rectStart);
      setTempRect({ ...rectStart, width: 0, height: 0 });
    } else {
      setIsPanning(true);
      setStartPos({ x: e.clientX, y: e.clientY });
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

    if (minimapDragging && minimapRef.current) {
      const minimapRect = minimapRef.current.getBoundingClientRect();
      const dragX = e.clientX - minimapRect.left;
      const dragY = e.clientY - minimapRect.top;
      handleMinimapMove(dragX, dragY);
    } else if (isCreating && startPos) {
      const current = {
        x: (mouseX - offset.x) / zoom,
        y: (mouseY - offset.y) / zoom,
      };
      setTempRect({
        x: startPos.x,
        y: startPos.y,
        width: current.x - startPos.x,
        height: current.y - startPos.y,
      });
    } else if (isPanning && startPos) {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }));
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isCreating && tempRect) {
      setRects((prev) => [...prev, tempRect]);
      setTempRect(null);
    }
    setIsPanning(false);
    setMinimapDragging(false);
    setStartPos(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = 0.1;
    setZoom((prevZoom) => {
      const newZoom =
        e.deltaY < 0
          ? Math.min(prevZoom + scaleAmount, 3)
          : Math.max(prevZoom - scaleAmount, 0.3);
      const viewWidth = window.innerWidth / newZoom;
      const viewHeight = window.innerHeight / newZoom;
      setOffset((prevOffset) => clampOffset(prevOffset));
      return newZoom;
    });
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
          setMinimapDragging(true);
          setDragStart({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        }}
      ></div>
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

  return (
    <div>
      <button
        onClick={() => setIsCreating((prev) => !prev)}
        style={{ margin: 10 }}
      >
        {isCreating ? "Pan Mode" : "Create Rectangle Mode"}
      </button>
      <button
        onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}
        style={{ margin: 10 }}
      >
        Zoom In
      </button>
      <button
        onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}
        style={{ margin: 10 }}
      >
        Zoom Out
      </button>

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
        <div
          style={{
            position: "absolute",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: `${VIRTUAL_WIDTH}px`,
            height: `${VIRTUAL_HEIGHT}px`,
            transition: isPanning ? "none" : "transform 0.1s ease-out",
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
                backgroundColor: "rgba(0, 150, 255, 0.5)",
                border: "1px solid #0077cc",
              }}
            ></div>
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
