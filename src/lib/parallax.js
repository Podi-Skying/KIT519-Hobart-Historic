/**
 * "Look around" maths for the AR photos (pure — unit-tested in tests/lib/parallax.spec.js).
 * The photo is drawn slightly larger than the screen; tilting the phone (or dragging) slides it
 * within that margin, and closer layers (the hotspot bubbles) slide further — parallax depth.
 */

/** Tilt this many degrees from where you started to reach the edge of the margin. */
export const FULL_TILT_DEG = 18

const clamp = (v, max) => Math.max(-max, Math.min(max, v))

/**
 * Scene offset (px) for a device orientation, relative to the pose when looking-around began.
 * Tilt right → you look right → the scene slides left; tilt the top away → look up → scene slides down.
 * @param {{beta:number, gamma:number}} now  DeviceOrientationEvent angles (degrees)
 * @param {{beta:number, gamma:number}} base pose at start
 * @param {{x:number, y:number}} max  margin (px) in each direction
 */
export function tiltOffset(now, base, max, fullTilt = FULL_TILT_DEG) {
  const dGamma = wrap180((now.gamma ?? 0) - (base.gamma ?? 0))
  const dBeta = wrap180((now.beta ?? 0) - (base.beta ?? 0))
  return {
    x: clamp((-dGamma / fullTilt) * max.x, max.x),
    y: clamp((dBeta / fullTilt) * max.y, max.y),
  }
}

/** Angle difference folded into -180…180 (so crossing ±180° doesn't jump). */
export function wrap180(deg) {
  return ((((deg + 180) % 360) + 360) % 360) - 180
}

/**
 * Margin (px) a photo drawn at `scale` × the frame has on each side.
 * @param {{width:number, height:number}} frame
 */
export function overscan(frame, scale) {
  const r = (v) => Math.round(v * 10) / 10
  return { x: r(((scale - 1) / 2) * frame.width), y: r(((scale - 1) / 2) * frame.height) }
}
