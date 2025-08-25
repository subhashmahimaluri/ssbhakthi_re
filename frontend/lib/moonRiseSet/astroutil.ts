export const deg2rad = Math.PI / 180;
export const rad2deg = 180.0 / Math.PI;

/**
 * @param a angle in degrees
 * @returns Sine of angle
 */
export const sind = (a: number): number => Math.sin(a * deg2rad);

/**
 * @param a angle in degrees
 * @returns Tangent of angle
 */
export const tand = (a: number): number => Math.tan(a * deg2rad);

/**
 * @param a angle in degrees
 * @returns Cosine of angle
 */
export const cosd = (a: number): number => Math.cos(a * deg2rad);

/**
 * Cross product of two 3-element vectors
 */
export const cross = (a: number[], b: number[]): number[] => {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
};

/**
 * Dot product of two vectors
 */
export const dot = (v1: number[], v2: number[]): number => {
  return v1.reduce((c, v, idx) => c + v * v2[idx], 0);
};

/**
 * Element-wise addition of two vectors
 */
export const eadd = (v1: number[], v2: number[]): number[] => {
  return v1.map((v, idx) => v + v2[idx]);
};

// -------- Array prototype extensions --------

declare global {
  interface Array<T> {
    normsq(): number;
    norm(): number;
    normalize(): number[];
  }
}

if (!Array.prototype.normsq) {
  Array.prototype.normsq = function (): number {
    return this.reduce((c: number, v: number) => c + v * v, 0);
  };
}

if (!Array.prototype.norm) {
  Array.prototype.norm = function (): number {
    return Math.sqrt(this.normsq());
  };
}

if (!Array.prototype.normalize) {
  Array.prototype.normalize = function (): number[] {
    const n = this.norm();
    return this.map((v: number) => v / n);
  };
}

/**
 * Calculates angle (in radians) between two vectors
 */
export const angleBetweenVectors = (v1: number[], v2: number[]): number => {
  const normprod = v1.norm() * v2.norm();
  const crossnorm = cross(v1, v2).norm() / normprod;
  const cdot = dot(v1, v2) / normprod;

  let theta = Math.asin(crossnorm);
  if (cdot < 0) {
    theta = Math.PI - theta;
  }

  return theta;
};
