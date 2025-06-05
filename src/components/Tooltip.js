// tooltip-component.js - EXACTLY the same, no changes needed
import React from "react";
import { COLORS } from "../constants";

const Tooltip = ({ tempRect, mousePos }) => {
  if (!tempRect || !mousePos) return null;

  const x = mousePos.x + 10;
  const y = mousePos.y + 10;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        backgroundColor: COLORS.TOOLTIP_BG,
        color: COLORS.TOOLTIP_TEXT,
        padding: "2px 6px",
        fontSize: "12px",
        borderRadius: "4px",
        pointerEvents: "none",
        zIndex: 1001,
      }}
    >
      {`${Math.abs(tempRect.width.toFixed(0))} x ${Math.abs(
        tempRect.height.toFixed(0)
      )}`}
    </div>
  );
};

export default Tooltip;
