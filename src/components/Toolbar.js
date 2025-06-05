import React from "react";

const Toolbar = ({ isCreating, onToggleMode, onZoomIn, onZoomOut }) => {
  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>
      <button onClick={onToggleMode}>
        {isCreating ? "Pan Mode" : "Create Rectangle Mode"}
      </button>
      <button onClick={onZoomIn}>Zoom In</button>
      <button onClick={onZoomOut}>Zoom Out</button>
    </div>
  );
};

export default Toolbar;
