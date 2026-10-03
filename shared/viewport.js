// Shared by the client (to infer and display the viewport) and the server (to
// validate what the client sent before it reaches the prompt).

export const DEVICES = ['mobile', 'tablet', 'desktop'];

export const DEVICE_LABELS = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' };

// Typical CSS widths used to back out the pixel density of a capture.
const TYPICAL_CSS_WIDTH = { mobile: 400, tablet: 900 };

/** Guess the device class from the original capture size. */
export function inferDevice(width, height) {
  const ratio = height / width;
  // Phone captures are tall and at most ~1320px wide even at 3x. A taller,
  // wider image is a full-page desktop capture, not a phone.
  if (ratio >= 1.6 && width <= 1320) return 'mobile';
  if (ratio >= 1.2 && ratio < 1.6) return 'tablet';
  return 'desktop';
}

/** Estimate device pixel ratio and CSS width for a capture of a given class. */
export function estimateScale(device, width) {
  const dpr = device === 'desktop'
    ? (width > 2400 ? 2 : 1)
    : Math.min(4, Math.max(1, Math.round(width / TYPICAL_CSS_WIDTH[device])));
  return { dpr, cssWidth: Math.round(width / dpr) };
}

/**
 * Build the viewport descriptor sent with an audit. `choice` is 'auto' or one
 * of DEVICES; width and height are the ORIGINAL capture size, before downscale.
 */
export function describeViewport({ width, height, choice = 'auto' }) {
  const device = DEVICES.includes(choice) ? choice : inferDevice(width, height);
  return {
    device,
    source: DEVICES.includes(choice) ? 'user' : 'auto',
    width,
    height,
    ...estimateScale(device, width),
  };
}

/** Server-side guard: rebuild the descriptor from trusted fields only. */
export function sanitizeViewport(v) {
  const width = Math.round(Number(v?.width));
  const height = Math.round(Number(v?.height));
  if (!(width > 0 && height > 0 && width <= 20000 && height <= 40000)) return null;
  return describeViewport({ width, height, choice: v?.source === 'user' ? v?.device : 'auto' });
}
