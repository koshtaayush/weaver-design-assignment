import React from 'react';
import { CANVAS_CONFIG, COLORS } from '../constants';

const Minimap = ({ 
  rects, 
  offset, 
  zoom, 
  onMouseDown, 
  onMouseMove, 
  onMouseUp, 
  onViewportDrag 
}) => {
  const renderMinimapRects = () => {
    const scaleX = CANVAS_CONFIG.MINIMAP_WIDTH / CANVAS_CONFIG.VIRTUAL_WIDTH;
    const scaleY = CANVAS_CONFIG.MINIMAP_HEIGHT / CANVAS_CONFIG.VIRTUAL_HEIGHT;
    
    return rects.map((r, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: r.x * scaleX,
          top: r.y * scaleY,
          width: Math.abs(r.width) * scaleX,
          height: Math.abs(r.height) * scaleY,
          backgroundColor: COLORS.MINIMAP_RECT,
        }}
      />
    ));
  };

  const renderViewportBox = () => {
    const viewWidth = window.innerWidth / zoom;
    const viewHeight = window.innerHeight / zoom;
    const scaleX = CANVAS_CONFIG.MINIMAP_WIDTH / CANVAS_CONFIG.VIRTUAL_WIDTH;
    const scaleY = CANVAS_CONFIG.MINIMAP_HEIGHT / CANVAS_CONFIG.VIRTUAL_HEIGHT;
    const left = (-offset.x / zoom) * scaleX;
    const top = (-offset.y / zoom) * scaleY;

    return (
      <div
        style={{
          position: "absolute",
          border: `1px solid ${COLORS.VIEWPORT_BORDER}`,
          left,
          top,
          width: viewWidth * scaleX,
          height: viewHeight * scaleY,
          cursor: "grab",
          zIndex: 10,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onViewportDrag(e);
        }}
      />
    );
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        width: CANVAS_CONFIG.MINIMAP_WIDTH,
        height: CANVAS_CONFIG.MINIMAP_HEIGHT,
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: COLORS.MINIMAP_BG,
        border: "1px solid #000",
        cursor: "pointer",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      {renderMinimapRects()}
      {renderViewportBox()}
    </div>
  );
};

export default Minimap;