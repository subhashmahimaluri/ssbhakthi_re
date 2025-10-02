import suryaSiddhantamConfig from './suryaSiddhantam.json';
import { YexaaLocalConstant } from './yexaaLocalConstant';

/**
 * Surya Siddhanta Panchang Implementation
 *
 * This class implements astronomical calculations based on the classical
 * Surya Siddhanta text using mean motion formulas for Sun and Moon positions.
 *
 * References:
 * - Surya Siddhanta classical Sanskrit astronomical text
 * - Mean motion calculations for planetary positions
 * - Traditional Hindu astronomical methods
 */
export class YexaaPanchang_SuryaSiddhantam {
  private config = suryaSiddhantamConfig;
  private yexaaConstant: YexaaLocalConstant;

  // Mathematical constants
  private d2r = Math.PI / 180;
  private r2d = 180 / Math.PI;

  // Calculated values for current computation
  public Lmoon!: number;
  public Lsun!: number;
  public LmoonYoga!: number;
  public LsunYoga!: number;
  public ayanamsa: number = 0;
  public skor!: number; // Moon's angular velocity
  public dt: number = 0; // Delta T

  constructor(yexaaConstant: YexaaLocalConstant) {
    this.yexaaConstant = yexaaConstant;
  }

  /**
   * Convert calendar date to Julian Day Number
   * Uses the standard Julian calendar conversion algorithm
   */
  mdy2julian(month: number, day: number, year: number): number {
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;

    let jdn =
      day +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) -
      32045;

    return jdn;
  }

  /**
   * Convert Julian Day to calendar date
   * Returns {month, day, year}
   */
  calData(jd: number): { month: number; day: number; year: number } {
    let a = jd + 32044;
    let b = Math.floor((4 * a + 3) / 146097);
    let c = a - Math.floor((146097 * b) / 4);
    let d = Math.floor((4 * c + 3) / 1461);
    let e = c - Math.floor((1461 * d) / 4);
    let m = Math.floor((5 * e + 2) / 153);

    let day = e - Math.floor((153 * m + 2) / 5) + 1;
    let month = m + 3 - 12 * Math.floor(m / 10);
    let year = 100 * b + d - 4800 + Math.floor(m / 10);

    return { month, day, year };
  }

  /**
   * Normalize angle to 0-360 degree range
   */
  fix360(angle: number): number {
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return angle;
  }

  /**
   * Get day of week from Julian Day
   * 0 = Sunday, 1 = Monday, etc.
   */
  weekDay(jd: number): number {
    return Math.floor(jd + 1.5) % 7;
  }

  /**
   * Calculate ayanamsa using Surya Siddhanta method
   * Based on mean precession rate from the text
   */
  calcayan(jd: number): number {
    // Days since Kaliyuga epoch
    let daysSinceEpoch = jd - this.config.epoch.julianDay;
    let yearsSinceEpoch = daysSinceEpoch / 365.25;

    // Surya Siddhanta ayanamsa: simple linear precession
    // Rate: ~50.26 arc-seconds per year = 0.0139611 degrees per year
    let ayanamsa = (yearsSinceEpoch * this.config.ayanamsa.ratePerYear) / 3600.0;

    this.ayanamsa = this.fix360(ayanamsa);
    return this.ayanamsa;
  }

  /**
   * Simple Delta T calculation for time correction
   * Approximation for historical dates
   */
  dTime(jd: number): number {
    let year = this.calData(jd).year;
    let t = (year - 2000) / 100;

    // Simple polynomial approximation for Delta T
    if (year < 1600) {
      this.dt = 10.5 + 30 * t * t;
    } else if (year < 1900) {
      this.dt = 50 + 40 * t + 20 * t * t;
    } else {
      this.dt = 65 + 0.3 * (year - 2000);
    }

    return this.dt;
  }

  /**
   * Calculate Sun's geocentric longitude using Surya Siddhanta mean motion
   *
   * Reference: Surya Siddhanta Chapter 2 - Mean motions of planets
   */
  sun(jd: number): number {
    // Days since Kaliyuga epoch
    let daysSinceEpoch = jd - this.config.epoch.julianDay;

    // Mean longitude of Sun using Surya Siddhanta daily motion
    let meanLongitude =
      this.config.initialPositions.sun.longitude +
      daysSinceEpoch * this.config.meanMotions.sun.dailyMotion;

    // Mean anomaly (simplified)
    let meanAnomaly =
      meanLongitude - daysSinceEpoch * this.config.meanMotions.sun.dailyMotion * 0.985;

    // Apply equation of center using Surya Siddhanta method
    let correction = 0;
    for (let sunCorr of this.config.corrections.sunCorrections) {
      if (sunCorr.argument === 'meanSunAnomaly') {
        correction += sunCorr.amplitude * Math.sin(meanAnomaly * this.d2r);
      } else if (sunCorr.argument === '2 * meanSunAnomaly') {
        correction += sunCorr.amplitude * Math.sin(2 * meanAnomaly * this.d2r);
      }
    }

    let trueLongitude = meanLongitude + correction;

    // Store for yoga calculation
    this.LsunYoga = trueLongitude;
    this.Lsun = this.fix360(trueLongitude);

    return this.Lsun;
  }

  /**
   * Calculate Moon's geocentric longitude using Surya Siddhanta mean motion
   *
   * Reference: Surya Siddhanta Chapter 2 - Mean motions and corrections
   */
  moon(jd: number): number {
    // Days since Kaliyuga epoch
    let daysSinceEpoch = jd - this.config.epoch.julianDay;

    // Mean longitude of Moon
    let meanLongitude =
      this.config.initialPositions.moon.longitude +
      daysSinceEpoch * this.config.meanMotions.moon.dailyMotion;

    // Mean anomaly of Moon
    let meanAnomaly =
      meanLongitude - daysSinceEpoch * this.config.meanMotions.lunarApogee.dailyMotion;

    // Mean elongation (Moon - Sun)
    let sunMeanLong =
      this.config.initialPositions.sun.longitude +
      daysSinceEpoch * this.config.meanMotions.sun.dailyMotion;
    let meanElongation = meanLongitude - sunMeanLong;

    // Mean anomaly of Sun for perturbations
    let sunMeanAnomaly =
      sunMeanLong - daysSinceEpoch * this.config.meanMotions.sun.dailyMotion * 0.985;

    // Apply corrections using Surya Siddhanta method
    let correction = 0;
    for (let moonCorr of this.config.corrections.moonCorrections) {
      switch (moonCorr.argument) {
        case 'meanMoonAnomaly':
          correction += moonCorr.amplitude * Math.sin(meanAnomaly * this.d2r);
          break;
        case 'meanElongation':
          correction += moonCorr.amplitude * Math.sin(meanElongation * this.d2r);
          break;
        case 'meanSunAnomaly':
          correction += moonCorr.amplitude * Math.sin(sunMeanAnomaly * this.d2r);
          break;
        case '2 * meanElongation':
          correction += moonCorr.amplitude * Math.sin(2 * meanElongation * this.d2r);
          break;
      }
    }

    let trueLongitude = meanLongitude + correction;

    // Calculate approximate angular velocity for tithi calculations
    this.skor = this.config.meanMotions.moon.dailyMotion + correction * 0.01; // Simple velocity correction

    // Store for yoga calculation
    this.LmoonYoga = trueLongitude;
    this.Lmoon = this.fix360(trueLongitude);

    return this.Lmoon;
  }

  /**
   * Simple nutation calculation (approximation)
   */
  nutation(jd: number): number {
    let t = (jd - 2451545.0) / 36525.0;
    let omega = 125.04452 - 1934.136261 * t;
    return -0.00479 * Math.sin(omega * this.d2r);
  }

  /**
   * Solve Kepler's equation using iteration method
   */
  kepler(M: number, e: number, tolerance: number = 1e-6): number {
    let E = M;
    let delta = 1;
    let iterations = 0;

    while (Math.abs(delta) > tolerance && iterations < 30) {
      delta = E - e * Math.sin(E) - M;
      E = E - delta / (1 - e * Math.cos(E));
      iterations++;
    }

    return E;
  }

  /**
   * Convert longitude to degrees, minutes, seconds format
   */
  lon2dms(longitude: number): string {
    let deg = Math.floor(longitude);
    let min = Math.floor((longitude - deg) * 60);
    let sec = Math.floor(((longitude - deg) * 60 - min) * 60);

    return `${deg}° ${min}' ${sec}"`;
  }

  /**
   * Calculate tithi transition times
   * Each tithi is 12 degrees of Moon-Sun separation
   */
  tithi(jd: number, tithiNum: number, tzone: number, angularStep: number = 12): any {
    let startJD = jd;
    let targetAngle = tithiNum * angularStep;
    let nextTargetAngle = (tithiNum + 1) * angularStep;

    // Find tithi start time
    let tithiStartJD = this.findEventTime(startJD - 2, 'tithi', targetAngle);

    // Find tithi end time
    let tithiEndJD = this.findEventTime(tithiStartJD, 'tithi', nextTargetAngle);

    return {
      start: new Date((tithiStartJD + tzone / 24) * 86400000 + new Date(0).getTime()),
      end: new Date((tithiEndJD + tzone / 24) * 86400000 + new Date(0).getTime()),
    };
  }

  /**
   * Calculate nakshatra transition times
   * Each nakshatra is 13.33 degrees (800/60) of Moon's sidereal position
   */
  nakshatra(jd: number, nakshatraNum: number, tzone: number): any {
    let startJD = jd;
    let targetAngle = nakshatraNum * (360 / 27); // 13.33 degrees per nakshatra
    let nextTargetAngle = (nakshatraNum + 1) * (360 / 27);

    // Find nakshatra start time
    let nakshatraStartJD = this.findEventTime(startJD - 2, 'nakshatra', targetAngle);

    // Find nakshatra end time
    let nakshatraEndJD = this.findEventTime(nakshatraStartJD, 'nakshatra', nextTargetAngle);

    return {
      start: new Date((nakshatraStartJD + tzone / 24) * 86400000 + new Date(0).getTime()),
      end: new Date((nakshatraEndJD + tzone / 24) * 86400000 + new Date(0).getTime()),
    };
  }

  /**
   * Calculate yoga transition times
   * Each yoga is 13.33 degrees of combined Sun+Moon motion
   */
  yoga(jd: number, yogaVal: number, tzone: number): any {
    let startJD = jd;
    let targetAngle = (yogaVal * 360) / 27; // 13.33 degrees per yoga
    let nextTargetAngle = ((yogaVal + 1) * 360) / 27;

    // Find yoga start time
    let yogaStartJD = this.findEventTime(startJD - 2, 'yoga', targetAngle);

    // Find yoga end time
    let yogaEndJD = this.findEventTime(yogaStartJD, 'yoga', nextTargetAngle);

    return {
      start: new Date((yogaStartJD + tzone / 24) * 86400000 + new Date(0).getTime()),
      end: new Date((yogaEndJD + tzone / 24) * 86400000 + new Date(0).getTime()),
    };
  }

  /**
   * Find the time when a specific astronomical event occurs
   * Uses iterative method to find precise timing
   */
  private findEventTime(startJD: number, eventType: string, targetAngle: number): number {
    let jd = startJD;
    let tolerance = 1 / 1440; // 1 minute precision
    let maxIterations = 100;
    let iterations = 0;

    while (iterations < maxIterations) {
      this.sun(jd);
      this.moon(jd);
      this.calcayan(jd);

      let currentAngle = 0;

      switch (eventType) {
        case 'tithi':
          // Moon - Sun longitude difference
          let moonSunDiff = this.Lmoon - this.Lsun;
          if (moonSunDiff < 0) moonSunDiff += 360;
          currentAngle = moonSunDiff;
          break;

        case 'nakshatra':
          // Moon's sidereal position
          currentAngle = this.fix360(this.Lmoon + this.ayanamsa);
          break;

        case 'yoga':
          // Sum of Sun and Moon longitudes
          currentAngle = this.fix360(this.Lsun + this.Lmoon + 2 * this.ayanamsa);
          break;
      }

      let angleDiff = targetAngle - currentAngle;

      // Handle wraparound
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      if (Math.abs(angleDiff) < 0.01) {
        // Close enough
        break;
      }

      // Estimate time step based on angular velocity
      let timeStep = angleDiff / (this.skor || 13.176358); // Use Moon's mean motion as fallback
      jd += timeStep;

      iterations++;
    }

    return jd;
  }

  /**
   * Calculate new moon time (Amavasya)
   */
  novolun(jd: number, lunarCycle: number): number {
    // Find when Moon-Sun separation is 0 degrees
    return this.findEventTime(jd, 'tithi', 0);
  }

  /**
   * Main calculation method - computes comprehensive panchangam
   * This matches the interface expected by the existing system
   */
  computePanchang(params: { date: Date; lat: number; lon: number; tz: string }): any {
    const { date, lat, lon } = params;

    // Convert to Julian Day
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hour = date.getHours() + date.getMinutes() / 60;

    let jd = this.mdy2julian(month, day + hour / 24, year);

    // Calculate ayanamsa
    this.calcayan(jd);

    // Calculate celestial positions
    let sunLong = this.sun(jd);
    let moonLong = this.moon(jd);

    // Calculate basic elements
    let tithiNum = this.getTithi(moonLong, sunLong);
    let nakshatraNum = this.getNakshatra(moonLong);
    let yogaVal = this.getYoga(sunLong, moonLong);
    let karanaData = this.getKarana(moonLong, sunLong);

    // Calculate timing details
    let tithiTiming = this.tithi(jd, tithiNum, 5.5); // IST timezone
    let nakshatraTiming = this.nakshatra(jd, nakshatraNum, 5.5);
    let yogaTiming = this.yoga(jd, yogaVal, 5.5);
    let karanaTiming = this.tithi(jd, karanaData[1], 5.5, 6); // Karana is 6 degrees

    return {
      tithi: {
        number: tithiNum,
        name: this.yexaaConstant.Tithi.name_en_IN[tithiNum],
        start: tithiTiming.start,
        end: tithiTiming.end,
      },
      nakshatra: {
        number: nakshatraNum,
        name: this.yexaaConstant.Nakshatra.name_en_IN[nakshatraNum],
        start: nakshatraTiming.start,
        end: nakshatraTiming.end,
      },
      yoga: {
        number: yogaVal,
        name: this.yexaaConstant.Yoga.name_en_IN[yogaVal],
        start: yogaTiming.start,
        end: yogaTiming.end,
      },
      karana: {
        number: karanaData[0],
        name: this.yexaaConstant.Karna.name_en_IN[karanaData[0]],
        start: karanaTiming.start,
        end: karanaTiming.end,
      },
      sun: {
        longitude: sunLong,
      },
      moon: {
        longitude: moonLong,
      },
      ayanamsa: this.ayanamsa,
    };
  }

  /**
   * Helper methods for calculations
   */
  private getTithi(moonLong: number, sunLong: number): number {
    let diff = moonLong - sunLong;
    if (diff < 0) diff += 360;
    return Math.floor(diff / 12);
  }

  private getNakshatra(moonLong: number): number {
    let siderealMoon = this.fix360(moonLong + this.ayanamsa);
    return Math.floor((siderealMoon * 27) / 360);
  }

  private getYoga(sunLong: number, moonLong: number): number {
    let sum = this.fix360(sunLong + moonLong + 2 * this.ayanamsa);
    return Math.floor((sum * 27) / 360);
  }

  private getKarana(moonLong: number, sunLong: number): [number, number] {
    let diff = moonLong - sunLong;
    if (diff < 0) diff += 360;
    let nk = Math.floor(diff / 6);
    let karanaNum = 0;

    if (nk === 0) karanaNum = 10;
    else if (nk >= 57) karanaNum = nk - 50;
    else karanaNum = (nk - 1) % 7;

    return [karanaNum, nk];
  }

  /**
   * Comparison helper method to compare with Drik calculations
   */
  compareWithDrik(date: Date, lat: number, lon: number): { suryaSiddhanta: any; drik: any } {
    // Get Surya Siddhanta calculation
    const suryaSiddhantaResult = this.computePanchang({ date, lat, lon, tz: 'Asia/Kolkata' });

    // Get Drik calculation (using existing system)
    const drikResult = this.getDrikCalculation(date, lat, lon);

    return {
      suryaSiddhanta: suryaSiddhantaResult,
      drik: drikResult,
    };
  }

  /**
   * Get Drik calculation for comparison
   * This uses the existing YexaaPanchang system
   */
  private getDrikCalculation(date: Date, lat: number, lon: number): any {
    // This would typically import and use the existing YexaaPanchang
    // For now, we'll return a placeholder structure
    return {
      note: 'Drik calculation would be imported from existing YexaaPanchang class',
      placeholder: true,
    };
  }
}
