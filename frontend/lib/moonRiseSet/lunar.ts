import { sind, cosd } from './astroutil';

const deg2rad = Math.PI / 180;
const rad2deg = 180 / Math.PI;

type TimeScale = 'UTC' | 'TAI' | 'TT' | 'GPS';

declare global {
  interface Date {
    jd(ts?: TimeScale): number;
  }
}

// Extend Date prototype
Date.prototype.jd = function (ts: TimeScale = 'UTC'): number {
  let timeshift_seconds = 0;

  if (ts === 'TAI') {
    timeshift_seconds = utc2tai(this);
  } else if (ts === 'TT') {
    timeshift_seconds = utc2tai(this) + 32.184;
  } else if (ts === 'GPS') {
    const utcgps0 = new Date(Date.UTC(1980, 0, 6));
    if (this > utcgps0) {
      timeshift_seconds = utc2tai(this) - 19;
    }
  }

  return (this.valueOf() + timeshift_seconds * 1000) / 86400000 + 2440587.5;
};

const gmst = (jd_ut1: number): number => {
  const tut1 = (jd_ut1 - 2451545.0) / 36525.0;

  let gmst =
    67310.54841 + tut1 * (876600.0 * 3600.0 + 8640184.812866) + tut1 * (0.093104 - tut1 * 6.2e-6);

  gmst = (((gmst % 86400.0) / 240.0) * Math.PI) / 180.0;
  return gmst < 0 ? gmst + 2 * Math.PI : gmst;
};

const jd2Date = (jdUTC: number): Date => {
  return new Date((jdUTC - 2440587.5) * 86400 * 1000);
};

// Dummy TAI converter – replace with real leap second logic if needed
function utc2tai(date: Date): number {
  return 0;
}

interface GeoCoord {
  longitude: () => number;
  geocentric_latitude: () => number;
}

export const moonRiseSet = (thedate: Date, coord: GeoCoord): { rise: Date; set: Date } => {
  const observer_longitude = coord.longitude();
  const observer_latitude = coord.geocentric_latitude();
  const tolerance = 10 / 86400;

  const fields: ('rise' | 'set')[] = ['rise', 'set'];

  const [hrise, hset] = fields.map((_, riseidx) => {
    let cnt = 0;
    let JDtemp = Math.floor(thedate.jd()) + 0.5 - observer_longitude / (2.0 * Math.PI);
    let deltaUT = 0.001;
    let deltaJD = 0.0;
    let deltaGHA: number | undefined = undefined;
    let GHA = 0;

    while (cnt < 10 && Math.abs(deltaUT) > tolerance) {
      const T = (JDtemp - 2451545.0) / 36525.0;

      const lambda_ecliptic =
        deg2rad *
        (218.32 +
          481267.8813 * T +
          6.29 * sind(134.9 + 477198.85 * T) -
          1.27 * sind(259.2 - 413335.38 * T) +
          0.66 * sind(235.7 + 890534.23 * T) +
          0.21 * sind(269.9 + 954397.7 * T) -
          0.19 * sind(357.5 + 35999.05 * T) -
          0.11 * sind(186.6 + 966404.05 * T));

      const phi_ecliptic =
        deg2rad *
        (5.13 * sind(93.3 + 483202.03 * T) +
          0.28 * sind(228.2 + 960400.87 * T) -
          0.28 * sind(318.3 + 6003.18 * T) -
          0.17 * sind(217.6 - 407332.2 * T));

      const obliquity = (23.439291 - 0.0130042 * T) * deg2rad;

      const pX = Math.cos(phi_ecliptic) * Math.cos(lambda_ecliptic);
      const pY =
        Math.cos(obliquity) * Math.cos(phi_ecliptic) * Math.sin(lambda_ecliptic) -
        Math.sin(obliquity) * Math.sin(phi_ecliptic);
      const pZ =
        Math.sin(obliquity) * Math.cos(phi_ecliptic) * Math.sin(lambda_ecliptic) +
        Math.cos(obliquity) * Math.sin(phi_ecliptic);

      const ra = Math.atan2(pY, pX);
      const dec = Math.asin(pZ);

      const gmst_ = gmst(JDtemp);
      const GHAn = gmst_ - ra;
      const LHA = GHAn + observer_longitude;

      if (deltaGHA === undefined) {
        deltaGHA = 347.81 * deg2rad;
      } else {
        deltaGHA = (GHAn - GHA) / deltaUT;
      }

      if (deltaGHA < 0) {
        deltaGHA += (2.0 * Math.PI) / Math.abs(deltaUT);
      }

      const cosLHAn =
        (0.00233 - Math.sin(observer_latitude) * Math.sin(dec)) /
        (Math.cos(observer_latitude) * Math.cos(dec));

      if (Math.abs(cosLHAn) > 1.0) {
        deltaUT = 1; // Skip to next day
      } else {
        let LHAn = Math.acos(cosLHAn);
        if (riseidx === 0) {
          LHAn = 2.0 * Math.PI - LHAn;
        }

        deltaUT = (LHAn - LHA) / deltaGHA;

        if (deltaUT < -0.5) {
          deltaUT += (2.0 * Math.PI) / deltaGHA;
        } else if (deltaUT > 0.5) {
          deltaUT -= (2.0 * Math.PI) / deltaGHA;
        }

        if (deltaJD + deltaUT < 0.0) {
          deltaUT += 1;
        }

        GHA = GHAn;
      }

      JDtemp += deltaUT;
      deltaJD += deltaUT;
      cnt++;
    }

    return jd2Date(JDtemp);
  });

  return { rise: hrise, set: hset };
};
