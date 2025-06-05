import React from "react";
import Rectangle from "./Rectangle";
import { CANVAS_CONFIG } from "../constants";

const CanvasLayer = ({ rects, tempRect, selectedRects, offset, zoom }) => {
  const allRects = [...rects, tempRect].filter(Boolean);

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        transformOrigin: "0 0",
        width: `${CANVAS_CONFIG.VIRTUAL_WIDTH}px`,
        height: `${CANVAS_CONFIG.VIRTUAL_HEIGHT}px`,
      }}
    >
      {allRects.map((rect, i) => (
        <Rectangle
          key={i}
          rect={rect}
          isSelected={selectedRects.includes(i)}
          isTemp={tempRect === rect}
          index={i}
        />
      ))}
    </div>
  );
};

export default CanvasLayer;
