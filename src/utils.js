import { CANVAS_CONFIG } from "./constants";

/**
 * Clamps the canvas offset to prevent panning beyond boundaries
 * @param {Object} newOffset - The new offset to clamp
 * @param {number} zoom - Current zoom level
 * @returns {Object} Clamped offset
 */
export const clampOffset = (newOffset, zoom) => {
  const viewWidth = window.innerWidth / zoom;
  const viewHeight = window.innerHeight / zoom;
  const maxOffsetX = 0;
  const maxOffsetY = 0;
  const minOffsetX = -(CANVAS_CONFIG.VIRTUAL_WIDTH * zoom - viewWidth);
  const minOffsetY = -(CANVAS_CONFIG.VIRTUAL_HEIGHT * zoom - viewHeight);

  return {
    x: Math.min(maxOffsetX, Math.max(minOffsetX, newOffset.x)),
    y: Math.min(maxOffsetY, Math.max(minOffsetY, newOffset.y)),
  };
};

/**
 * Converts screen coordinates to canvas coordinates
 * @param {number} mouseX - Mouse X position on screen
 * @param {number} mouseY - Mouse Y position on screen
 * @param {Object} offset - Current canvas offset
 * @param {number} zoom - Current zoom level
 * @returns {Object} Canvas coordinates
 */
export const screenToCanvas = (mouseX, mouseY, offset, zoom) => ({
  x: (mouseX - offset.x) / zoom,
  y: (mouseY - offset.y) / zoom,
});

/**
 * Checks if a point is inside a rectangle
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Object} rect - Rectangle object with x, y, width, height
 * @returns {boolean} True if point is inside rectangle
 */
export const isPointInRect = (x, y, rect) =>
  x >= rect.x &&
  x <= rect.x + rect.width &&
  y >= rect.y &&
  y <= rect.y + rect.height;

/**
 * Creates a rectangle from start and end points
 * @param {Object} startPos - Starting position
 * @param {Object} currentPos - Current position
 * @returns {Object} Rectangle object
 */
export const createRectFromPoints = (startPos, currentPos) => {
  const x = Math.min(startPos.x, currentPos.x);
  const y = Math.min(startPos.y, currentPos.y);
  const width = Math.abs(currentPos.x - startPos.x);
  const height = Math.abs(currentPos.y - startPos.y);
  return { x, y, width, height };
};

/**
 * Throttle function to limit event frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
