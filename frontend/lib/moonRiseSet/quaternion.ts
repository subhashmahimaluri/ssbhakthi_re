const inspect = Symbol.for('nodejs.util.inspect.custom');

export default class Quaternion {
  raw: [number, number, number, number];

  constructor(x?: number, y?: number, z?: number, w?: number) {
    if (x === undefined) {
      this.raw = [0, 0, 0, 1];
      return this;
    }

    this.raw = [x ?? 0, y ?? 0, z ?? 0, w ?? 1];
  }

  static mult(a: Quaternion, b: Quaternion): Quaternion {
    return new Quaternion(
      b.raw[3] * a.raw[0] + b.raw[0] * a.raw[3] + b.raw[1] * a.raw[2] - b.raw[2] * a.raw[1],
      b.raw[3] * a.raw[1] - b.raw[0] * a.raw[2] + b.raw[1] * a.raw[3] + b.raw[2] * a.raw[0],
      b.raw[3] * a.raw[2] + b.raw[0] * a.raw[1] - b.raw[1] * a.raw[0] + b.raw[2] * a.raw[3],
      b.raw[3] * a.raw[3] - b.raw[0] * a.raw[0] - b.raw[1] * a.raw[1] - b.raw[2] * a.raw[2]
    );
  }

  mult(a: Quaternion): void {
    this.raw = [
      a.raw[3] * this.raw[0] +
        a.raw[0] * this.raw[3] +
        a.raw[1] * this.raw[2] -
        a.raw[2] * this.raw[1],
      a.raw[3] * this.raw[1] -
        a.raw[0] * this.raw[2] +
        a.raw[1] * this.raw[3] +
        a.raw[2] * this.raw[0],
      a.raw[3] * this.raw[2] +
        a.raw[0] * this.raw[1] -
        a.raw[1] * this.raw[0] +
        a.raw[2] * this.raw[3],
      a.raw[3] * this.raw[3] -
        a.raw[0] * this.raw[0] -
        a.raw[1] * this.raw[1] -
        a.raw[2] * this.raw[2],
    ];
  }

  static rotate(q: Quaternion, v: [number, number, number]): [number, number, number] {
    return q.rotate(v);
  }

  rotate(v: [number, number, number]): [number, number, number] {
    const qv = new Quaternion(v[0], v[1], v[2], 0);
    const vnew = Quaternion.mult(this, Quaternion.mult(qv, this.conj()));
    return [vnew.raw[0], vnew.raw[1], vnew.raw[2]];
  }

  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  static rotx(theta: number): Quaternion {
    const c2 = Math.cos(theta / 2.0);
    const s2 = Math.sin(theta / 2.0);
    return new Quaternion(s2, 0, 0, c2);
  }

  static roty(theta: number): Quaternion {
    const c2 = Math.cos(theta / 2.0);
    const s2 = Math.sin(theta / 2.0);
    return new Quaternion(0, s2, 0, c2);
  }

  static rotz(theta: number): Quaternion {
    const c2 = Math.cos(theta / 2.0);
    const s2 = Math.sin(theta / 2.0);
    return new Quaternion(0, 0, s2, c2);
  }

  conjugate(): Quaternion {
    return new Quaternion(-this.raw[0], -this.raw[1], -this.raw[2], this.raw[3]);
  }

  conj(): Quaternion {
    return this.conjugate();
  }

  angle(): number {
    return Math.acos(this.raw[3]) * 2.0;
  }

  angle_deg(): number {
    return (this.angle() * 180.0) / Math.PI;
  }

  norm(): number {
    return Math.sqrt(this.raw.reduce((sum, val) => sum + val * val, 0));
  }

  vnorm(): number {
    return Math.sqrt(this.raw.slice(0, 3).reduce((sum, val) => sum + val * val, 0));
  }

  normalized(): void {
    const norm = this.norm();
    for (let i = 0; i < 4; i++) {
      this.raw[i] /= norm;
    }
  }

  axis(): [number, number, number] {
    const vnorm = this.vnorm();
    if (vnorm === 0) return [1, 0, 0];
    return [this.raw[0] / vnorm, this.raw[1] / vnorm, this.raw[2] / vnorm];
  }

  toString(): string {
    return `Quaternion: (Axis = [${this.axis()}], Angle = ${this.angle().toFixed(3)} rad)`;
  }

  [inspect](): string {
    return this.toString();
  }
}
