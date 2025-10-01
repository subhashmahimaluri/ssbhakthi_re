import { YexaaCalendar } from './yexaaCalendar';
import { YexaaLocalConstant } from './yexaaLocalConstant';
import { YexaaPanchangImpl } from './yexaaPanchangImpl';
import { YexaaSunMoonTimer } from './yexaaSunMoonTimer';

export function getTithiDates(year: number, tithiIno: number, lat: number, lng: number) {
  const results: any[] = [];

  const yexaaConstant = new YexaaLocalConstant();
  const yexaaPanchangImpl = new YexaaPanchangImpl(yexaaConstant);
  const yexaaSunMoonTimer = new YexaaSunMoonTimer();
  const yexaaCalendar = new YexaaCalendar();

  // Start from January 1st of the given year
  let currentDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  // IST timezone offset
  const tzone = 5.5;

  // Target tithi (1-30)
  const targetTithi = tithiIno + 1;

  // Track last found tithi date to avoid duplicates within same lunar cycle
  let lastFoundStartDate: Date | null = null;

  // Counter for consecutive days without finding target tithi
  let daysWithoutFind = 0;

  while (currentDate < endDate) {
    try {
      // Get sunrise for current date
      const sunRise = yexaaSunMoonTimer.getSunRiseJd(currentDate, lat, lng);

      // Check if we should skip based on last found date
      if (lastFoundStartDate) {
        const daysSinceLastFound = Math.floor(
          (currentDate.getTime() - lastFoundStartDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Skip if we're within 15 days of last found tithi (minimum safe gap)
        if (daysSinceLastFound < 15) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
      }

      // Check tithi throughout the day
      let foundTithi = false;
      let checkPoints = [
        sunRise, // At sunrise
        sunRise + 0.25, // At noon
        sunRise + 0.5, // At sunset
        sunRise + 0.75, // At midnight
      ];

      for (let checkJd of checkPoints) {
        const tithiAtTime = getCalendarTithi(checkJd, yexaaPanchangImpl);

        if (tithiAtTime === targetTithi) {
          foundTithi = true;
          break;
        }
      }

      // If our target tithi is active at any point during the day
      if (foundTithi) {
        // Calculate precise tithi start and end times
        const tithiTiming = calculateTithiTiming(yexaaPanchangImpl, sunRise, tithiIno, tzone);

        if (tithiTiming && tithiTiming.start && tithiTiming.end) {
          // Skip if this is a duplicate (same start date as previous)
          if (
            lastFoundStartDate &&
            tithiTiming.start.getDate() === lastFoundStartDate.getDate() &&
            tithiTiming.start.getMonth() === lastFoundStartDate.getMonth()
          ) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Skip if start date is from previous year
          if (tithiTiming.start.getFullYear() < year) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Get calendar data for masa
          const calcDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            6,
            0,
            0
          );

          const panchangamCalendar = yexaaCalendar.calendar(yexaaConstant, calcDate, lat, lng);

          // Calculate paksha based on target tithi
          const n_paksha = targetTithi > 15 ? 1 : 0;

          // Get masa from calendar calculation first
          let masaIno = panchangamCalendar.MoonMasa.ino;
          let masaName = panchangamCalendar.MoonMasa.name;
          let masaNameEnIn = panchangamCalendar.MoonMasa.name_en_IN;
          const isLeapMonth = panchangamCalendar.MoonMasa.isLeapMonth || false;

          // For all tithis, we need to calculate masa based on the Amanta system
          // In Amanta system:
          // - Shukla paksha (1-15): month of the previous new moon
          // - Krishna paksha (16-30): month of the next new moon

          let newMoonJd;

          if (targetTithi <= 15) {
            // Shukla paksha - find the previous new moon
            // For tithi 1, new moon was about 0.5 days ago
            // For tithi 15, new moon was about 14.5 days ago
            const daysFromNewMoon = targetTithi - 0.5;

            // Search backward for the previous new moon
            newMoonJd = sunRise - daysFromNewMoon;

            // Refine to find exact new moon
            for (let jd = newMoonJd - 2; jd < newMoonJd + 2; jd += 0.1) {
              const phase = yexaaPanchangImpl.lunarPhase(jd);
              const nextPhase = yexaaPanchangImpl.lunarPhase(jd + 0.1);
              // Look for phase crossing from high to low (new moon)
              if (phase > 350 && nextPhase < 10) {
                newMoonJd = jd + 0.05;
                break;
              }
            }
          } else {
            // Krishna paksha - find the next new moon
            // For tithi 16, new moon is about 14.5 days away
            // For tithi 30, new moon is about 0.5 days away
            const daysToNewMoon = 30.5 - targetTithi;

            // Search forward for the next new moon
            newMoonJd = sunRise + daysToNewMoon;

            // Refine to find exact new moon
            for (let jd = newMoonJd - 2; jd < newMoonJd + 2; jd += 0.1) {
              const phase = yexaaPanchangImpl.lunarPhase(jd);
              const nextPhase = yexaaPanchangImpl.lunarPhase(jd + 0.1);
              // Look for phase crossing from high to low (new moon)
              if (phase > 350 && nextPhase < 10) {
                newMoonJd = jd + 0.05;
                break;
              }
            }
          }

          // Get solar longitude at the new moon
          const solarLongAtNewMoon = yexaaPanchangImpl.fix360(
            yexaaPanchangImpl.sun(newMoonJd) + yexaaPanchangImpl.calcayan(newMoonJd)
          );

          // Calculate correct solar month (0-11)
          const correctSolarMonth = Math.floor(solarLongAtNewMoon / 30);

          // Update masa
          masaIno = correctSolarMonth;

          // Ensure valid index
          if (masaIno < 0) masaIno += 12;
          if (masaIno > 11) masaIno = masaIno % 12;

          masaName = yexaaConstant.Masa.name[masaIno];
          masaNameEnIn = yexaaConstant.Masa.name_en_IN[masaIno];

          // Additional validation - if masa name is still invalid, use date-based approximation
          if (!masaName || !masaNameEnIn) {
            // Use the tithi start date for approximation
            const monthDate = tithiTiming.start;
            const gregorianMonth = monthDate.getMonth(); // 0-11
            const gregorianDay = monthDate.getDate();

            // Approximate masa based on solar calendar
            // Solar months typically start around 14th-16th of Gregorian month
            let approxMasa;
            if (gregorianDay >= 14) {
              // After mid-month, use next masa
              approxMasa = (gregorianMonth + 10) % 12;
            } else {
              // Before mid-month, use current masa
              approxMasa = (gregorianMonth + 9) % 12;
            }

            masaIno = approxMasa;
            masaName = yexaaConstant.Masa.name[masaIno];
            masaNameEnIn = yexaaConstant.Masa.name_en_IN[masaIno];
          }

          // Create result object
          const result = {
            tithi: {
              name: yexaaConstant.Tithi.name[tithiIno],
              name_en_IN: yexaaConstant.Tithi.name_en_IN[tithiIno],
              ino: tithiIno,
              start: tithiTiming.start,
              end: tithiTiming.end,
            },
            paksha: {
              ino: n_paksha,
              name: yexaaConstant.Paksha.name[n_paksha],
              name_en_IN: yexaaConstant.Paksha.name_en_IN[n_paksha],
            },
            masa: {
              ino: masaIno,
              name: masaName,
              name_en_IN: masaNameEnIn,
              isLeapMonth: isLeapMonth,
            },
          };

          results.push(result);
          lastFoundStartDate = new Date(tithiTiming.start);
          daysWithoutFind = 0;

          // Jump ahead safely (20 days to handle short lunar months)
          currentDate.setDate(currentDate.getDate() + 20);
          continue;
        }
      }

      // Track days without finding target
      daysWithoutFind++;

      // If we haven't found anything for 35 days, we might have skipped
      // Go back and check more carefully
      if (daysWithoutFind > 35 && lastFoundStartDate) {
        currentDate.setDate(currentDate.getDate() - 10);
        daysWithoutFind = 0;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    } catch (error) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Sort results by date
  results.sort((a, b) => {
    const dateA = new Date(a.tithi.start);
    const dateB = new Date(b.tithi.start);
    return dateA.getTime() - dateB.getTime();
  });

  return results;
}

// Helper function to get tithi at a specific julian day
function getCalendarTithi(jd: number, yexaaPanchangImpl: YexaaPanchangImpl) {
  let moonPhase = yexaaPanchangImpl.lunarPhase(jd);
  let tithi = Math.ceil(moonPhase / 12);

  // Handle edge case where phase is exactly 0
  if (moonPhase === 0) tithi = 30;

  // Ensure tithi is in valid range 1-30
  if (tithi < 1) tithi = 1;
  if (tithi > 30) tithi = 30;

  return tithi;
}

// Custom function to calculate tithi timing accurately
function calculateTithiTiming(
  yexaaPanchangImpl: YexaaPanchangImpl,
  aroundJd: number,
  tithiIno: number,
  tzone: number
): { start: Date; end: Date } | null {
  // Each tithi represents 12 degrees of lunar phase
  const targetTithi = tithiIno + 1; // Convert to 1-30
  const startPhase = (targetTithi - 1) * 12;
  const endPhase = targetTithi * 12;

  // Special handling for tithi 30 (phase wraps from 348 to 360/0)
  const isLastTithi = targetTithi === 30;

  // Find start of tithi
  let startJd = null;
  // Search in a wider range to ensure we find it
  for (let jd = aroundJd - 3; jd < aroundJd + 2; jd += 0.01) {
    const phase = yexaaPanchangImpl.lunarPhase(jd) % 360;
    const prevPhase = yexaaPanchangImpl.lunarPhase(jd - 0.01) % 360;

    if (isLastTithi) {
      // For tithi 30, detect crossing from <348 to >=348
      if (prevPhase < 348 && phase >= 348) {
        startJd = jd;
        break;
      }
    } else if (targetTithi === 1) {
      // For tithi 1, detect wrap from 359+ to 0-12 OR start from 0
      if ((prevPhase > 348 && phase < 12) || (prevPhase < 1 && phase >= 0)) {
        startJd = jd;
        break;
      }
    } else {
      // For other tithis, detect normal crossing
      if (prevPhase < startPhase && phase >= startPhase) {
        startJd = jd;
        break;
      }
    }
  }

  if (!startJd) return null;

  // Find end of tithi
  let endJd = null;
  for (let jd = startJd + 0.5; jd < startJd + 2.5; jd += 0.01) {
    const phase = yexaaPanchangImpl.lunarPhase(jd) % 360;
    const nextPhase = yexaaPanchangImpl.lunarPhase(jd + 0.01) % 360;

    if (isLastTithi) {
      // For tithi 30, detect wrap from 359+ to 0-12
      if (phase > 348 && nextPhase < 12) {
        endJd = jd + 0.01;
        break;
      }
    } else if (targetTithi === 30) {
      // This should not happen as isLastTithi covers it
      if (phase >= 348 && nextPhase < 12) {
        endJd = jd + 0.01;
        break;
      }
    } else {
      // For other tithis, detect normal crossing
      if (phase < endPhase && nextPhase >= endPhase) {
        endJd = jd + 0.01;
        break;
      }
    }
  }

  if (!endJd) return null;

  // Refine the timings for better accuracy
  startJd = refineTithiBoundary(
    yexaaPanchangImpl,
    startJd - 0.02,
    startJd + 0.02,
    startPhase,
    true,
    isLastTithi,
    targetTithi
  );
  endJd = refineTithiBoundary(
    yexaaPanchangImpl,
    endJd - 0.02,
    endJd + 0.02,
    endPhase,
    false,
    isLastTithi,
    targetTithi
  );

  // Convert to dates with timezone
  const dtStart = yexaaPanchangImpl.dTime(startJd);
  const dtEnd = yexaaPanchangImpl.dTime(endJd);

  return {
    start: yexaaPanchangImpl.calData(startJd + (tzone - dtStart) / 24),
    end: yexaaPanchangImpl.calData(endJd + (tzone - dtEnd) / 24),
  };
}

// Binary search to refine tithi boundary
function refineTithiBoundary(
  yexaaPanchangImpl: YexaaPanchangImpl,
  startJd: number,
  endJd: number,
  targetPhase: number,
  isStart: boolean,
  isLastTithi: boolean,
  targetTithi: number
): number {
  while (endJd - startJd > 0.00001) {
    // Refine to about 1 second
    const mid = (startJd + endJd) / 2;
    const phase = yexaaPanchangImpl.lunarPhase(mid) % 360;

    if (isLastTithi && !isStart) {
      // For end of tithi 30, we're looking for the wrap point
      if (phase > 180) {
        startJd = mid;
      } else {
        endJd = mid;
      }
    } else if (targetTithi === 1 && isStart) {
      // For start of tithi 1, handle the wrap
      if (phase > 180) {
        startJd = mid;
      } else {
        endJd = mid;
      }
    } else if (isStart) {
      // For start boundary, phase should be just under target
      if (phase < targetPhase) {
        startJd = mid;
      } else {
        endJd = mid;
      }
    } else {
      // For end boundary, phase should be just under target
      if (phase < targetPhase) {
        startJd = mid;
      } else {
        endJd = mid;
      }
    }
  }

  return isStart ? endJd : startJd;
}
