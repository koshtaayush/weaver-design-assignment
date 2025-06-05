import React from "react";
import { COLORS } from "../constants";

const Rectangle = ({ rect, isSelected, isTemp, index }) => {
  const backgroundColor = isSelected
    ? COLORS.SELECTED_RECT
    : COLORS.DEFAULT_RECT;

  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        backgroundColor,
        border: `1px solid ${COLORS.RECT_BORDER}`,
        pointerEvents: "auto",
      }}
    >
      {isTemp && (
        <div
          style={{
            position: "absolute",
            top: -16,
            left: 0,
            fontSize: 10,
            backgroundColor: COLORS.DIMENSION_BG,
            padding: "1px 3px",
            border: `1px solid ${COLORS.DIMENSION_BORDER}`,
            whiteSpace: "nowrap",
          }}
        >
          {Math.round(rect.width)} × {Math.round(rect.height)}
        </div>
      )}
    </div>
  );
};

export default Rectangle;
