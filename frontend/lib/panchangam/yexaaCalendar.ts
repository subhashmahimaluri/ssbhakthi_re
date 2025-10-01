import { getAyana, getDrikRitu, getTeluguYearName } from './getCalendarExtras';
import { YexaaCalculateFunc } from './yexaaCalculateFunc';
import { YexaaLocalConstant } from './yexaaLocalConstant';
import { YexaaPanchangImpl } from './yexaaPanchangImpl';
import { YexaaSunMoonTimer } from './yexaaSunMoonTimer';

export class YexaaCalendar {
  calendar(yexaaConstant: YexaaLocalConstant, dt: Date, lat: number, lng: number, height?: number) {
    let Tithi: any = {} as {};
    let Nakshatra: any = {} as {};
    let Yoga: any = {} as {};
    let Karna: any = {} as {};
    let Masa: any = {} as {};
    let MoonMasa: any = {} as {};
    let Raasi: any = {} as {};
    let Ritu: any = {} as {};
    let Paksha: any = {} as {};
    let Gana: any = {} as {};
    let Guna: any = {} as {};
    let Trinity: any = {} as {};
    let yexaaPanchangImpl = new YexaaPanchangImpl(yexaaConstant);
    let yexaaCalculateFunc = new YexaaCalculateFunc();
    let yexaaSunMoonTimer = new YexaaSunMoonTimer();
    let sunRise = yexaaSunMoonTimer.getSunRiseJd(dt, lat, lng, height);
    let nn_tithi = this.getCalendarTithi(sunRise, yexaaPanchangImpl);
    let nn_paksha = yexaaCalculateFunc.getPaksha(nn_tithi);
    let ayanamsaAtRise = yexaaPanchangImpl.calcayan(sunRise);
    let nn_naksh = this.getCalendarNakshatra(
      yexaaCalculateFunc,
      yexaaPanchangImpl,
      ayanamsaAtRise,
      sunRise
    );
    let nn_yoga = this.getCalendarYoga(
      yexaaCalculateFunc,
      yexaaPanchangImpl,
      sunRise,
      ayanamsaAtRise
    );
    let nn_karana = yexaaCalculateFunc.getKarana(
      yexaaPanchangImpl.moon(sunRise),
      yexaaPanchangImpl.sun(sunRise)
    )[0];
    let nn_raasi = this.getCalendarRaasi(
      yexaaPanchangImpl,
      yexaaPanchangImpl.sun(sunRise),
      ayanamsaAtRise
    );

    let masa: { n_maasa: number; is_leap_month: boolean } = this.getMasa(
      yexaaPanchangImpl,
      nn_tithi,
      sunRise
    );

    let ritu = this.getRitu(masa.n_maasa);

    Raasi.ino = nn_raasi - 1;
    Raasi.name_en_UK = yexaaConstant.Raasi.name_en_UK[nn_raasi - 1];
    Raasi.name = yexaaConstant.Raasi.name[nn_raasi - 1];
    Guna.ino = yexaaCalculateFunc.getRaasiGuna(Raasi.ino);
    Guna.name_en_IN = yexaaConstant.Guna.name_en_IN[Guna.ino];
    Guna.name_en_UK = yexaaConstant.Guna.name_en_UK[Guna.ino];
    Guna.name = yexaaConstant.Guna.name[Guna.ino];

    Tithi.name = yexaaConstant.Tithi.name[nn_tithi - 1];
    Tithi.name_en_IN = yexaaConstant.Tithi.name_en_IN[nn_tithi - 1];
    Tithi.ino = nn_tithi - 1;
    Paksha.ino = nn_paksha;
    Paksha.name = yexaaConstant.Paksha.name[nn_paksha];
    Paksha.name_en_IN = yexaaConstant.Paksha.name_en_IN[nn_paksha];
    Paksha.name_en_UK = yexaaConstant.Paksha.name_en_UK[nn_paksha];

    Nakshatra.name = yexaaConstant.Nakshatra.name[nn_naksh];
    Nakshatra.name_en_IN = yexaaConstant.Nakshatra.name_en_IN[nn_naksh];
    Nakshatra.ino = nn_naksh;
    Trinity.ino = yexaaCalculateFunc.getTrinityByNakshatra(Nakshatra.ino);
    Trinity.name_en_IN = yexaaConstant.Trinity.name_en_IN[Trinity.ino];
    Trinity.name = yexaaConstant.Trinity.name[Trinity.ino];
    Gana.ino = yexaaCalculateFunc.getGanaViaNakshatra(Nakshatra.ino);
    Gana.name_en_IN = yexaaConstant.Gana.name_en_IN[Gana.ino];
    Gana.name_en_UK = yexaaConstant.Gana.name_en_UK[Gana.ino];
    Gana.name = yexaaConstant.Gana.name[Gana.ino];

    Yoga.name = yexaaConstant.Yoga.name[nn_yoga];
    Yoga.name_en_IN = yexaaConstant.Yoga.name_en_IN[nn_yoga];
    Yoga.ino = nn_yoga;
    Karna.name = yexaaConstant.Karna.name[nn_karana];
    Karna.name_en_IN = yexaaConstant.Karna.name_en_IN[nn_karana];
    Karna.ino = nn_karana;
    Masa.ino = nn_raasi - 1;

    // Fix negative index issue for solar masa calculation
    let solarMasaIndex = nn_raasi - 1;

    // Handle negative indices by wrapping around (12 months)
    if (solarMasaIndex < 0) {
      solarMasaIndex += 12;
    }

    // Ensure index is within valid range (0-11)
    solarMasaIndex = solarMasaIndex % 12;

    Masa.name = yexaaConstant.Masa.name[solarMasaIndex] || '';
    Masa.name_en_IN = yexaaConstant.Masa.name_en_IN[solarMasaIndex] || '';
    MoonMasa.ino = masa.n_maasa - 2;
    MoonMasa.isLeapMonth = masa.is_leap_month;

    // Fix negative index issue for masa calculation
    let moonMasaIndex = masa.n_maasa - 2;

    // Handle negative indices by wrapping around (12 months)
    if (moonMasaIndex < 0) {
      moonMasaIndex += 12;
    }

    // Ensure index is within valid range (0-11)
    moonMasaIndex = moonMasaIndex % 12;

    MoonMasa.name = yexaaConstant.Masa.name[moonMasaIndex] || '';
    MoonMasa.name_en_IN = yexaaConstant.Masa.name_en_IN[moonMasaIndex] || '';
    Ritu.ino = ritu;
    Ritu.name = yexaaConstant.Ritu.name[ritu];
    Ritu.name_en_UK = yexaaConstant.Ritu.name_en_UK[ritu];

    const solarLongitude = yexaaPanchangImpl.fix360(
      yexaaPanchangImpl.sun(sunRise) + ayanamsaAtRise
    );

    // Get extras
    const ayana = getAyana(solarLongitude);
    const drikRitu = getDrikRitu(solarLongitude);

    // Calculate Telugu year based on Chaitra Shukla Padyami date for the year
    const teluguYear = this.getTeluguYearForDate(dt, lat, lng);

    return {
      Tithi,
      Paksha,
      Nakshatra,
      Yoga,
      Karna,
      Masa,
      MoonMasa,
      Raasi,
      Ritu,
      Gana,
      Guna,
      Trinity,
      Ayana: { name_en_IN: ayana },
      DrikRitu: { name_en_IN: drikRitu },
      TeluguYear: { name_en_IN: teluguYear },
    };
  }

  getSakaYear(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Saka calendar starts on March 22 (or March 21 in leap years)
    const isBeforeSakaStart = month < 3 || (month === 3 && day < 22);

    return isBeforeSakaStart ? year - 79 - 1 : year - 79;
  }

  getTeluguYearIndex(currentYear: number, isNewYearStarted: boolean): number {
    const baseYear = 1867;
    const offset = isNewYearStarted ? 0 : -1;
    return (currentYear + offset - baseYear + 60) % 60;
  }

  /**
   * Get Telugu year name for a given date using sunrise-based panchangam calculation
   * @param date - The date to get Telugu year for
   * @param lat - Latitude for sunrise calculation
   * @param lng - Longitude for sunrise calculation
   * @returns Telugu year name
   */
  getTeluguYearForDate(date: Date, lat: number = 17.385, lng: number = 78.4867): string {
    const currentYear = date.getFullYear();

    // Use the same sunrise-based approach as the main calendar method
    const yexaaConstant = new YexaaLocalConstant();
    const yexaaPanchangImpl = new YexaaPanchangImpl(yexaaConstant);
    const yexaaSunMoonTimer = new YexaaSunMoonTimer();

    // Get sunrise for the input date
    const sunRise = yexaaSunMoonTimer.getSunRiseJd(date, lat, lng);
    const nn_tithi = this.getCalendarTithi(sunRise, yexaaPanchangImpl);
    const masa = this.getMasa(yexaaPanchangImpl, nn_tithi, sunRise);

    // Fix negative index issue for masa calculation
    let moonMasaIndex = masa.n_maasa - 2;
    if (moonMasaIndex < 0) {
      moonMasaIndex += 12;
    }
    moonMasaIndex = moonMasaIndex % 12;

    // Check if today's sunrise shows Chaitra Shukla Padyami or later
    const isChaitraMasa = moonMasaIndex === 11; // Chaitra is at index 11
    const isShuklaPackha = nn_tithi >= 1 && nn_tithi <= 15; // Shukla paksha
    const isPadyami = nn_tithi === 1; // Padyami is the first tithi

    // Check if we're on or after the start of Telugu new year
    let teluguCalendarYear;
    if (isChaitraMasa && isShuklaPackha && isPadyami) {
      // Today is exactly Chaitra Shukla Padyami - new year starts today
      teluguCalendarYear = currentYear;
    } else if (isChaitraMasa && isShuklaPackha && nn_tithi > 1) {
      // We're in Chaitra Shukla but after Padyami - new year has already started
      teluguCalendarYear = currentYear;
    } else {
      // Check if this year's Chaitra Shukla Padyami has already passed
      const thisYearPadyami = this.findTeluguNewYearStart(currentYear);
      const inputDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const padyamiDateOnly = new Date(
        thisYearPadyami.getFullYear(),
        thisYearPadyami.getMonth(),
        thisYearPadyami.getDate()
      );

      if (inputDateOnly >= padyamiDateOnly) {
        teluguCalendarYear = currentYear;
      } else {
        teluguCalendarYear = currentYear - 1;
      }
    }

    return getTeluguYearName(teluguCalendarYear);
  }

  /**
   * Find the date when Telugu New Year starts (Chaitra Shukla Padyami) for a given Gregorian year
   * @param year - Gregorian year
   * @returns Date object for Chaitra Shukla Padyami (Telugu New Year start)
   */
  findTeluguNewYearStart(year: number): Date {
    // Search in March-May range for Chaitra Shukla Padyami
    // Start from March 1st and check each day
    const startDate = new Date(year, 2, 1); // March 1st
    const endDate = new Date(year, 4, 31); // May 31st

    const yexaaConstant = new YexaaLocalConstant();
    const yexaaPanchangImpl = new YexaaPanchangImpl(yexaaConstant);
    const yexaaCalculateFunc = new YexaaCalculateFunc();
    const yexaaSunMoonTimer = new YexaaSunMoonTimer();

    // Default coordinates (Hyderabad) if not specified
    const lat = 17.385;
    const lng = 78.4867;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      try {
        const sunRise = yexaaSunMoonTimer.getSunRiseJd(d, lat, lng);
        const nn_tithi = this.getCalendarTithi(sunRise, yexaaPanchangImpl);
        const masa = this.getMasa(yexaaPanchangImpl, nn_tithi, sunRise);

        // Fix negative index issue for masa calculation
        let moonMasaIndex = masa.n_maasa - 2;
        if (moonMasaIndex < 0) {
          moonMasaIndex += 12;
        }
        moonMasaIndex = moonMasaIndex % 12;

        // Check if this is Chaitra Shukla Padyami (Telugu New Year)
        const isChaitraMasa = moonMasaIndex === 11; // Chaitra is at index 11
        const isShuklaPackha = nn_tithi >= 1 && nn_tithi <= 15; // Shukla paksha
        const isPadyami = nn_tithi === 1; // Padyami is the first tithi

        if (isChaitraMasa && isShuklaPackha && isPadyami) {
          return new Date(d);
        }
      } catch (error) {
        // Continue searching if there's an error with this date
        continue;
      }
    }

    // Fallback: if not found, estimate based on previous patterns
    // Typically occurs in late March or early April
    const fallbackDate = new Date(year, 2, 30); // March 30th as fallback

    return fallbackDate;
  }

  // get tithi in (1-15) Sukla and (16-30) Krushna
  getCalendarTithi(sunRise: number, yexaaPanchangImpl: YexaaPanchangImpl) {
    let moonPhaseToday = yexaaPanchangImpl.lunarPhase(sunRise);
    let today = Math.ceil(moonPhaseToday / 12);
    let tithi = today;
    //check for skipped tithi
    let moonPhaseTommorow = yexaaPanchangImpl.lunarPhase(sunRise + 1);
    let tommorow = Math.ceil(moonPhaseTommorow / 12);
    let isSkipped = (tommorow - today) % 30 > 1;
    if (isSkipped) {
      tithi = today + 1;
    }
    return tithi;
  }

  getCalendarNakshatra(
    yexaaCalculateFunc: YexaaCalculateFunc,
    yexaaPanchangImpl: YexaaPanchangImpl,
    ayanamsa: number,
    sunRise: number
  ) {
    let nak_today = yexaaCalculateFunc.getNakshatra(
      yexaaPanchangImpl,
      yexaaPanchangImpl.moon(sunRise),
      ayanamsa
    );
    let nak_tmrw = yexaaCalculateFunc.getNakshatra(
      yexaaPanchangImpl,
      yexaaPanchangImpl.moon(sunRise + 1),
      yexaaPanchangImpl.calcayan(sunRise + 1)
    );
    let n_nak = nak_today;
    let isSkipped = (nak_tmrw - nak_today) % 27 > 1;
    if (isSkipped) {
      n_nak = nak_today + 1;
    }
    return n_nak;
  }

  getCalendarYoga(
    yexaaCalculateFunc: YexaaCalculateFunc,
    yexaaPanchangImpl: YexaaPanchangImpl,
    sunRise: number,
    ayanamsa: number
  ) {
    let todayYoga = yexaaCalculateFunc.getYoga(
      yexaaCalculateFunc.getZYoga(yexaaPanchangImpl, ayanamsa, sunRise)
    );
    let tmorowYoga = yexaaCalculateFunc.getYoga(
      yexaaCalculateFunc.getZYoga(
        yexaaPanchangImpl,
        yexaaPanchangImpl.calcayan(sunRise + 1),
        sunRise + 1
      )
    );
    let n_yoga = todayYoga;
    let isSkipped = (tmorowYoga - todayYoga) % 27 > 1;
    if (isSkipped) {
      n_yoga = todayYoga + 1;
    }
    return n_yoga;
  }

  getCalendarRaasi(yexaaPanchangImpl: YexaaPanchangImpl, Lsun: number, ayanamsa: number) {
    let solar_nirayana = yexaaPanchangImpl.fix360(Lsun + ayanamsa);
    return Math.ceil(solar_nirayana / 30);
  }

  getMasa(yexaaPanchangImpl: YexaaPanchangImpl, tithi: number, sunrise: number) {
    let lastNewMoon = sunrise - (tithi - 1);
    let nextNewMoon = sunrise + (29 - (tithi - 1));
    let currentSolarMonth = this.getCalendarRaasi(
      yexaaPanchangImpl,
      yexaaPanchangImpl.sun(lastNewMoon),
      yexaaPanchangImpl.calcayan(lastNewMoon)
    );
    let nextSolarMonth = this.getCalendarRaasi(
      yexaaPanchangImpl,
      yexaaPanchangImpl.sun(nextNewMoon),
      yexaaPanchangImpl.calcayan(nextNewMoon)
    );

    let is_leap_month = currentSolarMonth === nextSolarMonth;
    let n_maasa = is_leap_month ? currentSolarMonth : currentSolarMonth + 1;
    if (n_maasa > 12) {
      n_maasa = n_maasa % 12;
    }

    return { n_maasa, is_leap_month };
  }

  getRitu(masa_num: number): number {
    return Math.floor((masa_num - 1) / 2);
  }
}
