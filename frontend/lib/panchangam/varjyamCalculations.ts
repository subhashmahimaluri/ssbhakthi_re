import varjyamConfig from './varjyamConfig.json';

export interface VarjyamPeriod {
  start: Date;
  end: Date;
  nakshatraName?: string;
}

export interface VarjyamResult {
  periods: VarjyamPeriod[];
  totalDuration: number; // in minutes
  nakshatraName?: string;
}

/**
 * Calculate Varjyam timing for a given Nakshatra
 *
 * @param nakshatraName The name of the nakshatra (English transliteration)
 * @param nakshatraStart Start time of the nakshatra
 * @param nakshatraEnd End time of the nakshatra
 * @returns VarjyamResult with calculated periods
 */
export function calculateVarjyam(
  nakshatraName: string,
  nakshatraStart: Date,
  nakshatraEnd: Date
): VarjyamResult | null {
  // Comprehensive nakshatra name mapping to handle various spellings
  const nakshatraNameMap: { [key: string]: string } = {
    ashwini: 'ashwini',
    aswini: 'ashwini',
    bharani: 'bharani',
    krittika: 'krithika',
    krthika: 'krithika',
    rohini: 'rohini',
    mrigashirsha: 'mrigashirsha',
    mrigasira: 'mrigashirsha',
    mrigashira: 'mrigashirsha',
    ardra: 'ardra',
    arudra: 'ardra',
    punarvasu: 'punarvasu',
    pushya: 'pushya',
    pushyami: 'pushya',
    ashlesha: 'ashlesha',
    aslesha: 'ashlesha',
    makha: 'makha',
    magha: 'makha',
    'purva phalguni': 'purva_phalguni',
    purva_phalguni: 'purva_phalguni',
    purvaphalguni: 'purva_phalguni',
    'uttara phalguni': 'uttara_phalguni',
    uttara_phalguni: 'uttara_phalguni',
    uttaraphalguni: 'uttara_phalguni',
    hasta: 'hasta',
    chitra: 'chitra',
    swati: 'swati',
    vishaka: 'vishaka',
    visakha: 'vishaka',
    anuradha: 'anuradha',
    jyeshta: 'jyeshta',
    jyeshtha: 'jyeshta',
    moola: 'moola',
    mula: 'moola',
    'purva ashadha': 'purva_ashadha',
    purva_ashadha: 'purva_ashadha',
    purvaashadha: 'purva_ashadha',
    'uttara ashadha': 'uttara_ashadha',
    uttara_ashadha: 'uttara_ashadha',
    uttaraashadha: 'uttara_ashadha',
    shravana: 'shravana',
    sravana: 'shravana',
    dhanishta: 'dhanishta',
    dhanishtha: 'dhanishta',
    shatabhisha: 'shatabhisha',
    shatabhishak: 'shatabhisha',
    'purva bhadrapada': 'purva_bhadrapada',
    purva_bhadrapada: 'purva_bhadrapada',
    purvabhadrapada: 'purva_bhadrapada',
    'uttara bhadrapada': 'uttara_bhadrapada',
    uttara_bhadrapada: 'uttara_bhadrapada',
    uttarabhadrapada: 'uttara_bhadrapada',
    revati: 'revati',
  };

  // Normalize nakshatra name to lowercase and handle spaces/hyphens
  const normalizedInput = nakshatraName.toLowerCase().replace(/[-\s]/g, '_');
  const normalizedName =
    nakshatraNameMap[normalizedInput] || nakshatraNameMap[nakshatraName.toLowerCase()];

  // Get the fraction for this nakshatra
  const fraction = normalizedName
    ? varjyamConfig.nakshatraFractions[
        normalizedName as keyof typeof varjyamConfig.nakshatraFractions
      ]
    : null;

  if (!fraction) {
    console.warn(
      `Varjyam: Unknown nakshatra name: ${nakshatraName} (normalized: ${normalizedName})`
    );
    return null;
  }

  // Validate date inputs
  if (
    !nakshatraStart ||
    !nakshatraEnd ||
    isNaN(nakshatraStart.getTime()) ||
    isNaN(nakshatraEnd.getTime())
  ) {
    console.warn(`Varjyam: Invalid date inputs for ${nakshatraName}`);
    return null;
  }

  // Calculate nakshatra duration in minutes
  const nakshatraDurationMs = nakshatraEnd.getTime() - nakshatraStart.getTime();
  const nakshatraDurationMins = nakshatraDurationMs / (1000 * 60);

  // Handle negative duration (shouldn't happen in normal cases)
  if (nakshatraDurationMins <= 0) {
    console.warn(`Varjyam: Invalid nakshatra duration for ${nakshatraName}`);
    return null;
  }

  // Calculate offset from nakshatra start (when Varjyam begins)
  const offsetMins = nakshatraDurationMins * fraction;

  // Calculate proportional Varjyam duration
  // Standard: 96 minutes for 24-hour nakshatra, proportionally adjusted
  const varjyamDurationMins =
    (nakshatraDurationMins / varjyamConfig.constants.nakshatraDurationBase) *
    varjyamConfig.constants.varjyamDurationBase;

  // Calculate Varjyam start time
  const varjyamStart = new Date(nakshatraStart.getTime() + offsetMins * 60 * 1000);

  // Calculate Varjyam end time
  const varjyamEnd = new Date(varjyamStart.getTime() + varjyamDurationMins * 60 * 1000);

  // Ensure Varjyam doesn't extend beyond nakshatra period
  const finalVarjyamEnd = varjyamEnd.getTime() > nakshatraEnd.getTime() ? nakshatraEnd : varjyamEnd;

  return {
    periods: [
      {
        start: varjyamStart,
        end: finalVarjyamEnd,
      },
    ],
    totalDuration: (finalVarjyamEnd.getTime() - varjyamStart.getTime()) / (1000 * 60),
  };
}

/**
 * Calculate Varjyam for multiple nakshatras overlapping a given date
 *
 * @param nakshatras Array of nakshatra periods for the day
 * @param calendarDate The calendar date to check overlaps for
 * @returns Array of VarjyamResult for all overlapping periods
 */
export function calculateDailyVarjyam(
  nakshatras: Array<{ name: string; start: Date; end: Date }>,
  calendarDate: Date
): VarjyamResult[] {
  const results: VarjyamResult[] = [];
  const seenVarjyamPeriods = new Set<string>();

  // Define calendar day boundaries (00:00 to 23:59:59 IST)
  const dayStart = new Date(calendarDate);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(calendarDate);
  dayEnd.setHours(23, 59, 59, 999);

  for (const nakshatra of nakshatras) {
    // Calculate Varjyam for this nakshatra period
    const varjyamResult = calculateVarjyam(nakshatra.name, nakshatra.start, nakshatra.end);

    if (varjyamResult && varjyamResult.periods.length > 0) {
      // Check each Varjyam period for overlap with the calendar date
      const overlappingPeriods: VarjyamPeriod[] = [];

      for (const period of varjyamResult.periods) {
        // Check if Varjyam period overlaps with the calendar date
        const hasOverlap =
          (period.start >= dayStart && period.start <= dayEnd) || // Starts within day
          (period.end >= dayStart && period.end <= dayEnd) || // Ends within day
          (period.start <= dayStart && period.end >= dayEnd); // Spans entire day

        if (hasOverlap) {
          // Create unique identifier for this Varjyam period to avoid duplicates
          // Round to nearest minute to handle small timing differences
          const varjyamId = `${nakshatra.name}-${Math.floor(period.start.getTime() / 60000)}-${Math.floor(period.end.getTime() / 60000)}`;

          if (!seenVarjyamPeriods.has(varjyamId)) {
            seenVarjyamPeriods.add(varjyamId);
            overlappingPeriods.push({
              start: period.start,
              end: period.end,
              nakshatraName: nakshatra.name,
            });
          }
        }
      }

      if (overlappingPeriods.length > 0) {
        results.push({
          periods: overlappingPeriods,
          totalDuration: overlappingPeriods.reduce(
            (total, period) =>
              total + (period.end.getTime() - period.start.getTime()) / (1000 * 60),
            0
          ),
          nakshatraName: nakshatra.name,
        });
      }
    }
  }

  // Sort results by start time of first period
  results.sort((a, b) => {
    const aStart = a.periods[0]?.start.getTime() || 0;
    const bStart = b.periods[0]?.start.getTime() || 0;
    return aStart - bStart;
  });

  return results;
}

/**
 * Format Varjyam time range for display
 *
 * @param period VarjyamPeriod to format
 * @param locale Locale for formatting (defaults to 'en-IN')
 * @returns Formatted time string
 */
export function formatVarjyamTime(period: VarjyamPeriod, locale: string = 'en-IN'): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  };

  const startTime = period.start.toLocaleTimeString(locale, options);
  const endTime = period.end.toLocaleTimeString(locale, options);

  return `${startTime} - ${endTime}`;
}

/**
 * Get all nakshatra periods that overlap with a given calendar date
 * This function scans a 48-hour window to catch all overlapping periods
 *
 * @param date The calendar date to get nakshatras for
 * @param lat Latitude for calculations
 * @param lng Longitude for calculations
 * @param panchangInstance Instance of YexaaPanchang to use for calculations
 * @returns Array of nakshatra periods with their timings
 */
export function getAllNakshatraPeriods(
  date: Date,
  lat: number,
  lng: number,
  panchangInstance: any
): Array<{ name: string; start: Date; end: Date }> {
  const periods: Array<{ name: string; start: Date; end: Date }> = [];
  const seenPeriods = new Set<string>();

  // Check 48-hour window around the target date to catch all overlapping nakshatras
  const startDate = new Date(date.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
  const endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000); // 24 hours after

  // Check every 6 hours to ensure we don't miss any nakshatra transitions
  for (
    let checkDate = new Date(startDate);
    checkDate <= endDate;
    checkDate.setHours(checkDate.getHours() + 6)
  ) {
    try {
      const calculated = panchangInstance.calculate(new Date(checkDate));

      if (calculated.Nakshatra && calculated.Nakshatra.name_en_IN) {
        const nakshatraStart = new Date(calculated.Nakshatra.start);
        const nakshatraEnd = new Date(calculated.Nakshatra.end);
        const nakshatraName = calculated.Nakshatra.name_en_IN;

        // Create unique identifier for this period
        const periodId = `${nakshatraName}-${nakshatraStart.getTime()}-${nakshatraEnd.getTime()}`;

        // Avoid duplicates
        if (!seenPeriods.has(periodId)) {
          seenPeriods.add(periodId);
          periods.push({
            name: nakshatraName,
            start: nakshatraStart,
            end: nakshatraEnd,
          });
        }
      }
    } catch (err) {
      // Continue on calculation errors
      console.warn('Error calculating nakshatra for date:', checkDate, err);
    }
  }

  // Sort by start time
  periods.sort((a, b) => a.start.getTime() - b.start.getTime());

  return periods;
}
