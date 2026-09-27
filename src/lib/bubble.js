/**
 * Where an AR hotspot bubble may be dragged (pure, unit-tested).
 * Positions are % of the hotspot layer, which itself moves with the gyro / look-around
 * parallax — so the horizontal limits come from the *visible* stage, converted into layer %,
 * and use the bubble's real width. (The old fixed 12–88 % limits ignored both: bubbles hit an
 * invisible wall well before the screen edge.)
 */
import { rubberband } from './gesture'

/** Keep this much of the screen edge free (px). */
export const EDGE_MARGIN = 8

/**
 * @param {{left:number,width:number}} stage  visible AR stage rect
 * @param {{left:number,width:number}} layer  hotspot layer rect (may be shifted / wider)
 * @param {number} bubbleWidth  px
 * @returns {{minX:number,maxX:number}} in % of the layer
 */
export function horizontalRange(stage, layer, bubbleWidth, margin = EDGE_MARGIN) {
  const half = bubbleWidth / 2 + margin
  const toPercent = (px) => ((px - layer.left) / layer.width) * 100
  const minX = toPercent(stage.left + half)
  const maxX = toPercent(stage.left + stage.width - half)
  return minX <= maxX ? { minX, maxX } : { minX: 50, maxX: 50 }
}

/**
 * Past a limit the bubble follows the finger less and less (rubber band, like iOS),
 * instead of stopping dead; on release it springs back to `clamp`.
 * `dimension` is the size the overshoot is measured against (layer width/height in %: 100).
 */
export function softClamp(value, min, max, dimension = 100) {
  if (value < min) return min + rubberband(value - min, dimension)
  if (value > max) return max + rubberband(value - max, dimension)
  return value
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
