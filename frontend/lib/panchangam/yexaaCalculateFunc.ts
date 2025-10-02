import varjyamConfig from './varjyamConfig.json';
import { YexaaLocalConstant } from './yexaaLocalConstant';
import { YexaaPanchangImpl } from './yexaaPanchangImpl';

export class YexaaCalculateFunc {
  calculate(d: Date, yexaaConstant: YexaaLocalConstant) {
    const panchangImpl = new YexaaPanchangImpl(yexaaConstant);
    let Day: any = {} as {};
    let Tithi: any = {} as {};
    let Paksha: any = {} as {};
    let Nakshatra: any = {} as {};
    let Karna: any = {} as {};
    let Yoga: any = {} as {};
    let Ayanamsa: any = {} as {};
    let Raasi: any = {} as {};
    let Julian: any = {} as {};
    let Gana: any = {} as {};
    let Guna: any = {} as {};
    let Trinity: any = {} as {};

    var n_wday,
      n_tithi = 1,
      n_naksh = 1,
      n_karana = 0,
      n_yoga;
    //var yexaaPanchangImpl = new YexaaPanchangImpl();

    var day = d.getDate();
    var mon = d.getMonth() + 1;
    var year = d.getFullYear();
    var hr = d.getHours();
    hr += d.getMinutes() / 60;
    var tzone = (d.getTimezoneOffset() / 60) * -1;

    let inpmin: any = Math.floor(d.getMinutes());
    if (inpmin < 10) inpmin = '0' + inpmin;

    // Julian date in local p. LT:
    let dayhr = day + hr / 24;
    let jdlt = panchangImpl.mdy2julian(mon, dayhr, year);

    // Day:
    n_wday = panchangImpl.weekDay(jdlt);
    Day.ino = n_wday;
    Day.name = yexaaConstant.Day.name[n_wday];
    Day.name_en_UK = yexaaConstant.Day.name_en_UK[n_wday];

    // julian day at the begining of the day
    let jd0 = panchangImpl.mdy2julian(mon, day, year);
    let jdut = jd0 + (hr - tzone) / 24;
    panchangImpl.dt = panchangImpl.dTime(jdut);
    let jd = jdut + panchangImpl.dt / 24;

    //ayyanamsa
    panchangImpl.ayanamsa = panchangImpl.calcayan(jd);

    // Logitudinal Moon
    panchangImpl.Lmoon = panchangImpl.moon(jd);

    // Logitudinal Sun
    panchangImpl.Lsun = panchangImpl.sun(jd);

    // yoga:
    let zyoga = this.getZYoga(panchangImpl, panchangImpl.ayanamsa, jd);
    n_yoga = this.getYoga(zyoga);
    let s_yoga = panchangImpl.yoga(jd, zyoga, tzone);

    // Nakstra
    n_naksh = this.getNakshatra(panchangImpl, panchangImpl.Lmoon, panchangImpl.ayanamsa);
    var s_naksh = panchangImpl.nakshatra(jd, n_naksh, tzone);

    // tithi
    n_tithi = this.getTithi(panchangImpl.Lmoon, panchangImpl.Lsun);
    var s_tithi = panchangImpl.tithi(jd, n_tithi, tzone, 12);

    // paksha
    let n_paksha = this.getPaksha(n_tithi + 1);

    // Karana
    let KaranaArray = this.getKarana(panchangImpl.Lmoon, panchangImpl.Lsun);
    n_karana = KaranaArray[0];
    let nk = KaranaArray[1];
    let s_karana = panchangImpl.tithi(jd, nk, tzone, 6);

    let z = this.getRaasi(panchangImpl, panchangImpl.Lmoon, panchangImpl.ayanamsa);

    Ayanamsa.name = panchangImpl.lon2dms(panchangImpl.ayanamsa);
    Raasi.name = yexaaConstant.Raasi.name[z];
    Raasi.ino = z;
    Raasi.name_en_UK = yexaaConstant.Raasi.name_en_UK[z];

    Guna.ino = this.getRaasiGuna(Raasi.ino);
    Guna.name_en_IN = yexaaConstant.Guna.name_en_IN[Guna.ino];
    Guna.name_en_UK = yexaaConstant.Guna.name_en_UK[Guna.ino];
    Guna.name = yexaaConstant.Guna.name[Guna.ino];

    Nakshatra.name = yexaaConstant.Nakshatra.name[n_naksh];
    Nakshatra.name_en_IN = yexaaConstant.Nakshatra.name_en_IN[n_naksh];
    Nakshatra.ino = n_naksh;
    Nakshatra.start = s_naksh.start;
    Nakshatra.end = s_naksh.end;

    Trinity.ino = this.getTrinityByNakshatra(Nakshatra.ino);
    Trinity.name_en_IN = yexaaConstant.Trinity.name_en_IN[Trinity.ino];
    Trinity.name = yexaaConstant.Trinity.name[Trinity.ino];
    Gana.ino = this.getGanaViaNakshatra(Nakshatra.ino);
    Gana.name_en_IN = yexaaConstant.Gana.name_en_IN[Gana.ino];
    Gana.name_en_UK = yexaaConstant.Gana.name_en_UK[Gana.ino];
    Gana.name = yexaaConstant.Gana.name[Gana.ino];

    Karna.name = yexaaConstant.Karna.name[n_karana];
    Karna.name_en_IN = yexaaConstant.Karna.name_en_IN[n_karana];
    Karna.ino = n_karana;
    Karna.start = s_karana.start;
    Karna.end = s_karana.end;
    Yoga.name = yexaaConstant.Yoga.name[n_yoga];
    Yoga.name_en_IN = yexaaConstant.Yoga.name_en_IN[n_yoga];
    Yoga.ino = n_yoga;
    Yoga.start = s_yoga.start;
    Yoga.end = s_yoga.end;
    Tithi.name = yexaaConstant.Tithi.name[n_tithi];
    Tithi.name_en_IN = yexaaConstant.Tithi.name_en_IN[n_tithi];
    Tithi.ino = n_tithi;
    Tithi.start = s_tithi.start;
    Tithi.end = s_tithi.end;

    Paksha.ino = n_paksha;
    Paksha.name = yexaaConstant.Paksha.name[n_paksha];
    Paksha.name_en_IN = yexaaConstant.Paksha.name_en_IN[n_paksha];
    Paksha.name_en_UK = yexaaConstant.Paksha.name_en_UK[n_paksha];

    Julian.date = jd;
    Julian.day = Math.floor(jd);

    return {
      Day,
      Tithi,
      Paksha,
      Nakshatra,
      Karna,
      Yoga,
      Ayanamsa,
      Raasi,
      Julian,
      Gana,
      Guna,
      Trinity,
    };
  }

  getTithi(Lmoon: number, Lsun: number) {
    if (Lmoon < Lsun) Lmoon += 360;
    return Math.floor((Lmoon - Lsun) / 12);
  }

  getNakshatra(yexaaPanchangImpl: YexaaPanchangImpl, Lmoon: number, ayanamsa: number) {
    let Lmoon0 = yexaaPanchangImpl.fix360(Lmoon + ayanamsa);
    return Math.floor((Lmoon0 * 6) / 80);
  }

  getZYoga(yexaaPanchangImpl: YexaaPanchangImpl, ayanamsa: number, jd: number) {
    yexaaPanchangImpl.moon(jd);
    yexaaPanchangImpl.sun(jd);
    let dmoonYoga = yexaaPanchangImpl.LmoonYoga + ayanamsa - 491143.07698973856;
    let dsunYoga = yexaaPanchangImpl.LsunYoga + ayanamsa - 36976.91240579201;

    return dmoonYoga + dsunYoga;
  }

  getYoga(zyoga: number) {
    let n_yoga = (zyoga * 6) / 80;
    while (n_yoga < 0) n_yoga += 27;
    while (n_yoga > 27) n_yoga -= 27;

    return Math.floor(n_yoga);
  }

  getKarana(Lmoon0: number, Lsun0: number) {
    let n_karana = 0,
      nk = 0;
    if (Lmoon0 < Lsun0) Lmoon0 += 360;
    nk = Math.floor((Lmoon0 - Lsun0) / 6);
    if (nk === 0) n_karana = 10;
    if (nk >= 57) n_karana = nk - 50;
    if (nk > 0 && nk < 57) n_karana = nk - 1 - Math.floor((nk - 1) / 7) * 7;
    return [n_karana, nk];
  }

  getRaasi(yexaaPanchangImpl: YexaaPanchangImpl, Lmoon: number, ayanamsa: number) {
    return Math.floor(Math.abs(yexaaPanchangImpl.fix360(Lmoon + ayanamsa)) / 30);
  }

  getPaksha(n_tithi: number): number {
    return n_tithi > 15 ? 1 : 0;
  }

  getRaasiGuna(raasiIndex: number) {
    return raasiIndex % 3;
  }

  getTrinityByNakshatra(raasiIndex: number) {
    return Math.floor(raasiIndex / 9);
  }

  getGanaViaNakshatra(raasiIndex: number) {
    let ganaPostions = [
      0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0,
    ];
    return ganaPostions[raasiIndex];
  }

  /**
   * Calculate Varjyam timings based on Nakshatra and sunrise time
   * @param sunriseTime - Sunrise time as Date object
   * @param nakshatraName - Name of the nakshatra (English key)
   * @param nakshatraEndTime - End time of nakshatra as Date object
   * @param timezone - Timezone offset in hours
   * @returns Varjyam timing object with start and end times
   */
  calculateVarjyam(
    sunriseTime: Date,
    nakshatraName: string,
    nakshatraEndTime: Date,
    timezone: number = 0
  ): {
    start: Date;
    end: Date;
    startISO: string;
    endISO: string;
    startFormatted: string;
    endFormatted: string;
  } | null {
    try {
      // Get varjyam configuration for the nakshatra
      const varjyamData = (varjyamConfig as any)[nakshatraName.toLowerCase()];

      if (!varjyamData) {
        console.warn(`No Varjyam data found for nakshatra: ${nakshatraName}`);
        return null;
      }

      const { startGhati, durationGhati } = varjyamData;

      // Convert ghatikas to minutes (1 ghati = 24 minutes)
      const startMinutes = startGhati * 24;
      const durationMinutes = durationGhati * 24;

      // Calculate varjyam start time (from sunrise)
      const varjyamStart = new Date(sunriseTime.getTime() + startMinutes * 60 * 1000);

      // Calculate varjyam end time
      const varjyamEnd = new Date(varjyamStart.getTime() + durationMinutes * 60 * 1000);

      // Ensure varjyam doesn't extend beyond nakshatra boundary
      const actualVarjyamEnd = varjyamEnd > nakshatraEndTime ? nakshatraEndTime : varjyamEnd;

      // If varjyam starts after nakshatra ends, return null
      if (varjyamStart >= nakshatraEndTime) {
        return null;
      }

      // Format times for display
      const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        });
      };

      return {
        start: varjyamStart,
        end: actualVarjyamEnd,
        startISO: varjyamStart.toISOString(),
        endISO: actualVarjyamEnd.toISOString(),
        startFormatted: formatTime(varjyamStart),
        endFormatted: formatTime(actualVarjyamEnd),
      };
    } catch (error) {
      console.error('Error calculating Varjyam:', error);
      return null;
    }
  }
}
