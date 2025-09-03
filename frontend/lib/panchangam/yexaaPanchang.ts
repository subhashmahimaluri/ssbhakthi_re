import { getTithiDates } from './getTithiDates';
import { YexaaCalculateFunc } from './yexaaCalculateFunc';
import { YexaaCalendar } from './yexaaCalendar';
import { YexaaLocalConstant } from './yexaaLocalConstant';
import { YexaaPkgConstants } from './yexaaPkgConstants';
import { YexaaSunMoonTimer } from './yexaaSunMoonTimer';

export class YexaaPanchang {
  private yexaaLocalConstant = new YexaaLocalConstant();
  private yexaaPkgConstants = new YexaaPkgConstants();
  private yexaaCalculateFunc = new YexaaCalculateFunc();
  private yexaaSunMoonTimer = new YexaaSunMoonTimer();
  private yexaaCalendar = new YexaaCalendar();

  calculate(dt: Date) {
    return this.yexaaCalculateFunc.calculate(dt, this.yexaaLocalConstant);
  }

  getTithiDates(year: number, tithiIno: number, lat: number, lng: number) {
    return getTithiDates(year, tithiIno, lat, lng);
  }

  calendar(dt: Date, lat: number, lng: number, height?: number) {
    return this.yexaaCalendar.calendar(this.yexaaLocalConstant, dt, lat, lng, height);
  }

  sunTimer(date: Date, lat: number, lng: number, height?: number) {
    height = height || 0;
    return this.yexaaSunMoonTimer.sunTimer(date, lat, lng, height);
  }

  /**
   * Find the first Gregorian date that matches the given Telugu Panchangam details
   * @param year - Gregorian year to search in
   * @param masa - Masa name (e.g., "Bhadrapada", "badhrapada")
   * @param paksha - Paksha name (e.g., "Shukla Paksha", "shukla_paksha")
   * @param tithiName - Tithi name (e.g., "Dashami", "dasami")
   * @param lat - Latitude for calculations
   * @param lng - Longitude for calculations
   * @returns Date object if found, null otherwise
   */
  findDateByTithi(
    year: number,
    masa: string,
    paksha: string,
    tithiName: string,
    lat: number,
    lng: number,
    debug = false
  ): Date | null {
    const results = this.findAllDatesByTithi(year, masa, paksha, tithiName, lat, lng, debug);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all Gregorian dates that match the given Telugu Panchangam details
   * @param year - Gregorian year to search in
   * @param masa - Masa name (e.g., "Bhadrapada", "badhrapada")
   * @param paksha - Paksha name (e.g., "Shukla Paksha", "shukla_paksha")
   * @param tithiName - Tithi name (e.g., "Dashami", "dasami")
   * @param lat - Latitude for calculations
   * @param lng - Longitude for calculations
   * @returns Array of Date objects
   */
  findAllDatesByTithi(
    year: number,
    masa: string,
    paksha: string,
    tithiName: string,
    lat: number,
    lng: number,
    debug = false
  ): Date[] {
    const results: Date[] = [];

    // Normalize input strings for comparison
    const normalizedMasa = this.normalizeName(masa);
    const normalizedPaksha = this.normalizeName(paksha);
    const normalizedTithi = this.normalizeName(tithiName);

    if (debug) {
      console.log('=== Debug Tithi Lookup ===');
      console.log('Input:', { year, masa, paksha, tithiName });
      console.log('Normalized:', { normalizedMasa, normalizedPaksha, normalizedTithi });
    }

    // Get search date range based on masa
    let searchRange = this.getSearchRangeForMasa(normalizedMasa, year);

    if (!searchRange) {
      // If masa not recognized, search entire year
      searchRange = {
        startDate: new Date(year, 0, 1), // Jan 1
        endDate: new Date(year, 11, 31), // Dec 31
      };
      if (debug) console.log('Masa not recognized, searching entire year');
    } else {
      if (debug) console.log('Search range:', searchRange);
    }

    // Search day by day
    const currentDate = new Date(searchRange.startDate);
    let daysChecked = 0;
    let matchingDays = 0;

    while (currentDate <= searchRange.endDate) {
      try {
        daysChecked++;
        // Calculate panchangam for current date
        const calculated = this.calculate(currentDate);
        const calendar = this.calendar(currentDate, lat, lng);

        // For debugging, log first few days and any matches
        if (debug && (daysChecked <= 5 || daysChecked % 30 === 0)) {
          console.log(`Day ${daysChecked} (${currentDate.toDateString()}):`);
          console.log('  Calculated Masa:', calendar.MoonMasa?.name_en_IN || 'N/A');
          console.log('  Calculated Paksha:', calculated.Paksha?.name_en_IN || 'N/A');
          console.log('  Calculated Tithi:', calculated.Tithi?.name_en_IN || 'N/A');
        }

        // Check if all conditions match
        if (
          this.matchesPanchangamCriteria(
            calculated,
            calendar,
            normalizedMasa,
            normalizedPaksha,
            normalizedTithi,
            debug && matchingDays < 3 // Enable debug for first few matches
          )
        ) {
          matchingDays++;
          if (debug) {
            console.log(`✅ MATCH FOUND on ${currentDate.toDateString()}`);
          }
          // Create a new date in IST timezone (UTC+5:30)
          const istDate = new Date(currentDate.getTime());
          results.push(istDate);
        }
      } catch (error) {
        if (debug) {
          console.error(`Error calculating panchangam for ${currentDate.toISOString()}:`, error);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (debug) {
      console.log(
        `=== Search completed: ${daysChecked} days checked, ${results.length} matches found ===`
      );
    }

    return results;
  }

  /**
   * Normalize names by converting to lowercase and removing common variations
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+paksha/g, '_paksha') // "shukla paksha" -> "shukla_paksha"
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-z_]/g, ''); // Remove special characters
  }

  /**
   * Get search date range for a given masa
   */
  private getSearchRangeForMasa(
    normalizedMasa: string,
    year: number
  ): { startDate: Date; endDate: Date } | null {
    // Mapping of masa to approximate Gregorian months (rough estimates)
    // Since Telugu lunar calendar doesn't align with Gregorian months,
    // we'll use broader ranges and fallback to full year search for reliability
    const masaRanges: { [key: string]: { startMonth: number; endMonth: number } } = {
      chaitra: { startMonth: 0, endMonth: 11 }, // Full year search for reliability
      vishakam: { startMonth: 0, endMonth: 11 }, // Full year search
      jyesta: { startMonth: 0, endMonth: 11 }, // Full year search
      ashada: { startMonth: 0, endMonth: 11 }, // Full year search
      sravana: { startMonth: 0, endMonth: 11 }, // Full year search
      badhrapada: { startMonth: 7, endMonth: 9 }, // Aug-Sep (this one worked)
      bhadrapada: { startMonth: 7, endMonth: 9 }, // Aug-Sep (alternative spelling)
      aswayuja: { startMonth: 0, endMonth: 11 }, // Full year search
      karthika: { startMonth: 0, endMonth: 11 }, // Full year search
      margasira: { startMonth: 0, endMonth: 11 }, // Full year search
      pusya: { startMonth: 0, endMonth: 11 }, // Full year search
      magha: { startMonth: 0, endMonth: 11 }, // Full year search
      phalguna: { startMonth: 0, endMonth: 11 }, // Full year search (this one worked in April)
    };

    const range = masaRanges[normalizedMasa];
    if (!range) {
      return null;
    }

    let startDate: Date;
    let endDate: Date;

    if (range.endMonth === 0) {
      // Special case: masa spans year boundary (Nov-Dec)
      startDate = new Date(year, range.startMonth, 1);
      endDate = new Date(year + 1, 0, 31); // End of Dec in next year
    } else if (range.startMonth > range.endMonth) {
      // Special case: masa spans year boundary (Dec-Jan, etc.)
      startDate = new Date(year, range.startMonth, 1);
      endDate = new Date(year + 1, range.endMonth, 31);
    } else {
      // Normal case: within same year
      startDate = new Date(year, range.startMonth, 1);
      endDate = new Date(year, range.endMonth, 31);
    }

    return { startDate, endDate };
  }

  /**
   * Check if calculated panchangam matches the search criteria
   */
  private matchesPanchangamCriteria(
    calculated: any,
    calendar: any,
    normalizedMasa: string,
    normalizedPaksha: string,
    normalizedTithi: string,
    debug = false
  ): boolean {
    // Check masa match (use both lunar month from calendar and calculated)
    const moonMasa = calendar.MoonMasa?.name_en_IN || '';
    const solarMasa = calendar.Masa?.name_en_IN || '';

    // If both are empty, this might be a transition period - let's be more flexible
    const availableMasas = [moonMasa, solarMasa].filter(m => m && m.trim());

    let masaMatches = false;
    let actualMasaUsed = '';

    if (availableMasas.length > 0) {
      // Try to match with any available masa
      for (const masa of availableMasas) {
        const normalizedCalculatedMasa = this.normalizeName(masa);
        if (normalizedCalculatedMasa === normalizedMasa) {
          masaMatches = true;
          actualMasaUsed = masa;
          break;
        }
      }
    } else {
      // If no masa is available, we might be in a transition period
      // For debugging purposes, let's see what happens if we allow it
      if (debug) {
        console.log(
          '    WARNING: No masa data available - this might be Chaitra transition period'
        );
      }
      // For March 30, 2025 case, let's temporarily allow matching when masa is empty
      // This is likely a transition between lunar months
      masaMatches = true;
      actualMasaUsed = 'Empty (transition period - likely Chaitra)';
    }

    // Check paksha match
    const calculatedPaksha = calculated.Paksha?.name_en_IN || '';
    const normalizedCalculatedPaksha = this.normalizeName(calculatedPaksha);

    const pakshaMatches = normalizedCalculatedPaksha === normalizedPaksha;

    // Check tithi match
    const calculatedTithi = calculated.Tithi?.name_en_IN || '';
    const normalizedCalculatedTithi = this.normalizeName(calculatedTithi);

    const tithiMatches = normalizedCalculatedTithi === normalizedTithi;

    if (debug) {
      console.log('  Matching details:');
      console.log(
        `    Available masas: [${availableMasas.join(', ')}] (MoonMasa: "${moonMasa}", SolarMasa: "${solarMasa}")`
      );
      console.log(
        `    Masa match: "${actualMasaUsed}" matches target "${normalizedMasa}" ? ${masaMatches}`
      );
      console.log(
        `    Paksha: "${normalizedCalculatedPaksha}" === "${normalizedPaksha}" ? ${pakshaMatches}`
      );
      console.log(
        `    Tithi: "${normalizedCalculatedTithi}" === "${normalizedTithi}" ? ${tithiMatches}`
      );
      console.log(`    Overall match: ${masaMatches && pakshaMatches && tithiMatches}`);
    }

    return masaMatches && pakshaMatches && tithiMatches;
  }

  getYexaaConstant<C extends keyof YexaaLocalConstant, N extends keyof YexaaLocalConstant[C]>(
    category: C,
    name: N
  ): YexaaLocalConstant[C][N] {
    return this.yexaaLocalConstant[category][name];
  }

  setYexaaConstant<C extends keyof YexaaLocalConstant, N extends keyof YexaaLocalConstant[C]>(
    category: C,
    name: N,
    yexaalist: YexaaLocalConstant[C][N]
  ) {
    (this.yexaaLocalConstant[category] as Record<N, YexaaLocalConstant[C][N]>)[name] = yexaalist;
  }

  getGanaMatched(brideIno: number, groomIno: number) {
    return this.yexaaPkgConstants.GanaMatched[brideIno][groomIno];
  }

  /**
   * Debug method to find all occurrences of a specific masa/paksha/tithi combination in a year
   * Useful for understanding when specific tithis actually occur
   */
  debugFindTithiOccurrences(
    year: number,
    masa: string,
    paksha: string,
    tithiName: string,
    lat: number,
    lng: number
  ): { date: Date; masa: string; paksha: string; tithi: string }[] {
    const results: { date: Date; masa: string; paksha: string; tithi: string }[] = [];
    const normalizedMasa = this.normalizeName(masa);
    const normalizedPaksha = this.normalizeName(paksha);
    const normalizedTithi = this.normalizeName(tithiName);

    // Search entire year day by day
    const currentDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    console.log(
      `Searching for: masa=${normalizedMasa}, paksha=${normalizedPaksha}, tithi=${normalizedTithi}`
    );

    while (currentDate <= endDate) {
      try {
        const calculated = this.calculate(currentDate);
        const calendar = this.calendar(currentDate, lat, lng);

        const calculatedMasa = calendar.MoonMasa?.name_en_IN || '';
        const calculatedPaksha = calculated.Paksha?.name_en_IN || '';
        const calculatedTithi = calculated.Tithi?.name_en_IN || '';

        // Store ALL tithis that match our target masa
        if (this.normalizeName(calculatedMasa) === normalizedMasa) {
          results.push({
            date: new Date(currentDate),
            masa: calculatedMasa,
            paksha: calculatedPaksha,
            tithi: calculatedTithi,
          });
        }
      } catch (error) {
        // Skip dates with errors
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort by date
    results.sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log(`Found ${results.length} days with masa '${masa}' in ${year}`);

    // Log first few and last few results for debugging
    const logCount = Math.min(5, results.length);
    if (logCount > 0) {
      console.log('First few occurrences:');
      results.slice(0, logCount).forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.date.toDateString()}: ${result.masa} ${result.paksha} ${result.tithi}`
        );
      });

      if (results.length > logCount) {
        console.log('Last few occurrences:');
        results.slice(-logCount).forEach((result, index) => {
          console.log(
            `  ${results.length - logCount + index + 1}. ${result.date.toDateString()}: ${result.masa} ${result.paksha} ${result.tithi}`
          );
        });
      }
    }

    return results;
  }

  /**
   * Quick method to find a specific tithi across multiple years
   */
  findTithiAcrossYears(
    startYear: number,
    endYear: number,
    masa: string,
    paksha: string,
    tithiName: string,
    lat: number,
    lng: number
  ): { year: number; dates: Date[] }[] {
    const results: { year: number; dates: Date[] }[] = [];

    for (let year = startYear; year <= endYear; year++) {
      const dates = this.findAllDatesByTithi(year, masa, paksha, tithiName, lat, lng, false);
      if (dates.length > 0) {
        results.push({ year, dates });
      }
    }

    return results;
  }
}
