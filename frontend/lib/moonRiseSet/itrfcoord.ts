const wgs84_a = 6378137;
const wgs84_f = 0.003352810664747;

const rad2deg = 180.0 / Math.PI;
const deg2rad = Math.PI / 180.0;

const inspect = Symbol.for('nodejs.util.inspect.custom');

import Quaternion from './quaternion';

export default class ITRFCoord {
  raw: [number, number, number];

  constructor(x?: number[] | number, y?: number, z?: number) {
    if (Array.isArray(x)) {
      this.raw = x as [number, number, number];
    } else if (typeof x === 'number') {
      this.raw = [x ?? 0, y ?? 0, z ?? 0];
    } else {
      this.raw = [0, 0, 0];
    }
  }

  static fromGeodetic(lat: number, lon: number, hae: number = 0): ITRFCoord {
    const sinp = Math.sin(lat);
    const cosp = Math.cos(lat);
    const sinl = Math.sin(lon);
    const cosl = Math.cos(lon);
    const f2 = (1 - wgs84_f) * (1 - wgs84_f);
    const C = 1 / Math.sqrt(cosp * cosp + f2 * sinp * sinp);
    const S = f2 * C;

    return new ITRFCoord(
      (wgs84_a * C + hae) * cosp * cosl,
      (wgs84_a * C + hae) * cosp * sinl,
      (wgs84_a * S + hae) * sinp
    );
  }

  static fromGeodeticDeg(latDeg: number, lonDeg: number, hae: number): ITRFCoord {
    return ITRFCoord.fromGeodetic(latDeg * deg2rad, lonDeg * deg2rad, hae);
  }

  height(): number {
    const e2 = 1.0 - (1.0 - wgs84_f) * (1.0 - wgs84_f);
    const phi = this.latitude();
    const sinphi = Math.sin(phi);
    const cosphi = Math.cos(phi);
    const rho = Math.sqrt(this.raw[0] ** 2 + this.raw[1] ** 2);
    const N = wgs84_a / Math.sqrt(1.0 - e2 * sinphi * sinphi);
    return rho * cosphi + (this.raw[2] + e2 * N * sinphi) * sinphi - N;
  }

  longitude(): number {
    return Math.atan2(this.raw[1], this.raw[0]);
  }

  latitude(): number {
    const e2 = 1.0 - (1.0 - wgs84_f) * (1.0 - wgs84_f);
    const ep2 = e2 / (1.0 - e2);
    const b = wgs84_a * (1.0 - wgs84_f);
    const rho = Math.sqrt(this.raw[0] ** 2 + this.raw[1] ** 2);
    let beta = Math.atan2(this.raw[2], (1.0 - wgs84_f) * rho);
    let phi = Math.atan2(
      this.raw[2] + b * ep2 * Math.pow(Math.sin(beta), 3),
      rho - wgs84_a * e2 * Math.pow(Math.cos(beta), 3)
    );
    let betaNew = Math.atan2((1.0 - wgs84_f) * Math.sin(phi), Math.cos(phi));

    let count = 0;
    while (Math.abs(beta - betaNew) > 1.0e-6 && count < 5) {
      beta = betaNew;
      phi = Math.atan2(
        this.raw[2] + b * ep2 * Math.pow(Math.sin(beta), 3),
        rho - wgs84_a * e2 * Math.pow(Math.cos(beta), 3)
      );
      betaNew = Math.atan2((1.0 - wgs84_f) * Math.sin(phi), Math.cos(phi));
      count++;
    }

    return phi;
  }

  qNED2ITRF(): Quaternion {
    const lat = this.latitude();
    const lon = this.longitude();
    return Quaternion.mult(Quaternion.rotz(-lon), Quaternion.roty(lat + Math.PI / 2.0));
  }

  qENU2ITRF(): Quaternion {
    const lat = this.latitude();
    const lon = this.longitude();
    return Quaternion.mult(
      Quaternion.rotz(-lon - Math.PI / 2),
      Quaternion.rotx(lat - Math.PI / 2.0)
    );
  }

  toENU(ref: ITRFCoord): [number, number, number] {
    const lat = ref.latitude();
    const lon = ref.longitude();
    const q = Quaternion.mult(
      Quaternion.rotx(-lat + Math.PI / 2),
      Quaternion.rotz(lon + Math.PI / 2)
    );
    return q.rotate([this.raw[0] - ref.raw[0], this.raw[1] - ref.raw[1], this.raw[2] - ref.raw[2]]);
  }

  toNED(ref: ITRFCoord): [number, number, number] {
    return ref
      .qNED2ITRF()
      .conj()
      .rotate([this.raw[0] - ref.raw[0], this.raw[1] - ref.raw[1], this.raw[2] - ref.raw[2]]);
  }

  longitude_deg(): number {
    return this.longitude() * rad2deg;
  }

  latitude_deg(): number {
    return this.latitude() * rad2deg;
  }

  geocentric_latitude(): number {
    return Math.asin(this.raw[2] / this.norm());
  }

  geocentric_latitude_deg(): number {
    return this.geocentric_latitude() * rad2deg;
  }

  norm(): number {
    return Math.sqrt(this.raw[0] ** 2 + this.raw[1] ** 2 + this.raw[2] ** 2);
  }

  toString(): string {
    return (
      `ITRFCoord(Latitude = ${this.latitude_deg().toFixed(3)} deg, ` +
      `Longitude = ${this.longitude_deg().toFixed(3)} deg, ` +
      `Height = ${this.height().toFixed(0)} m)`
    );
  }

  [inspect](): string {
    return this.toString();
  }
}
