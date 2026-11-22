import type {FontRole} from '../themes';

let context: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

/** Real font metrics from the browser, including tracking. Only called behind FontGate. */
export const measureWith = (role: FontRole, italic = false) => (text: string, size: number): number => {
  const key = `${role.family}|${role.weight}|${italic}|${role.tracking}|${size}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  context ??= document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable for font measurement');
  context.font = `${italic ? 'italic ' : ''}${role.weight} ${size}px "${role.family}"`;
  const width = context.measureText(text).width + role.tracking * (size / 100) * Math.max(0, text.length - 1);
  cache.set(key, width);
  return width;
};

/** Tracking in tokens is per 100px of size, so it scales with the type. */
export const trackingOf = (role: FontRole, size: number) => role.tracking * (size / 100);
