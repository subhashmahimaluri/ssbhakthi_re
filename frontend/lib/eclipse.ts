import { SearchGlobalSolarEclipse, SearchLunarEclipse } from 'astronomy-engine';

export interface EclipseEvent {
  id: string;
  kind: 'solar' | 'lunar';
  type: string; // total, partial, annular, penumbral
  date: Date; // peak date
  peak: Date; // peak time
  // Add location-specific properties
  localInfo?: {
    isVisible: boolean;
    maxObscuration?: number;
    localCircumstances?: {
      begin?: Date;
      end?: Date;
      maxTime?: Date;
    };
  };
}

export class YexaaEclipse {
  /**
   * Get all eclipses for a given year.
   */
  getEclipsesForYear(year: number): EclipseEvent[] {
    const eclipses: EclipseEvent[] = [];

    try {
      // Solar eclipses
      let date = new Date(`${year}-01-01T00:00:00Z`);
      while (true) {
        const e = SearchGlobalSolarEclipse(date);
        if (e.peak.date.getUTCFullYear() !== year) break;
        eclipses.push({
          id: `solar-${e.peak.date.toISOString()}`,
          kind: 'solar',
          type: e.kind,
          date: e.peak.date,
          peak: e.peak.date,
        });
        date = new Date(e.peak.date.getTime() + 24 * 60 * 60 * 1000); // move forward 1 day
      }

      // Lunar eclipses
      date = new Date(`${year}-01-01T00:00:00Z`);
      while (true) {
        const e = SearchLunarEclipse(date);
        if (e.peak.date.getUTCFullYear() !== year) break;
        eclipses.push({
          id: `lunar-${e.peak.date.toISOString()}`,
          kind: 'lunar',
          type: e.kind,
          date: e.peak.date,
          peak: e.peak.date,
        });
        date = new Date(e.peak.date.getTime() + 24 * 60 * 60 * 1000); // move forward 1 day
      }
    } catch (error) {}

    return eclipses.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Find next eclipse after a given date.
   */
  getNextEclipse(after: Date): EclipseEvent | null {
    try {
      const solar = SearchGlobalSolarEclipse(after);
      const lunar = SearchLunarEclipse(after);

      return solar.peak.date < lunar.peak.date
        ? {
            id: `solar-${solar.peak.date.toISOString()}`,
            kind: 'solar',
            type: solar.kind,
            date: solar.peak.date,
            peak: solar.peak.date,
          }
        : {
            id: `lunar-${lunar.peak.date.toISOString()}`,
            kind: 'lunar',
            type: lunar.kind,
            date: lunar.peak.date,
            peak: lunar.peak.date,
          };
    } catch (error) {
      return null;
    }
  }

  /**
   * Find eclipse by ID (useful for detail views)
   */
  findEclipseById(id: string, year: number): EclipseEvent | null {
    const eclipses = this.getEclipsesForYear(year);
    return eclipses.find(eclipse => eclipse.id === id) || null;
  }

  /**
   * Get eclipse type display name
   */
  getEclipseTypeDisplayName(eclipse: EclipseEvent): string {
    const kind = eclipse.kind === 'solar' ? 'Solar' : 'Lunar';
    const type = eclipse.type.charAt(0).toUpperCase() + eclipse.type.slice(1);
    return `${type} ${kind} Eclipse`;
  }

  /**
   * Format eclipse date for display with timezone support
   */
  formatEclipseDate(eclipse: EclipseEvent, timeZone: string = 'Asia/Kolkata'): string {
    return eclipse.peak.toLocaleDateString('en-IN', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format eclipse time for display with timezone support
   */
  formatEclipseTime(eclipse: EclipseEvent, timeZone: string = 'Asia/Kolkata'): string {
    return eclipse.peak.toLocaleTimeString('en-IN', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get eclipse visibility information for a location
   * Note: This is a basic implementation. For more accurate local circumstances,
   * consider using astronomy-engine's local solar eclipse functions
   */
  getEclipseVisibilityInfo(
    eclipse: EclipseEvent,
    lat: number,
    lng: number
  ): {
    isVisible: boolean;
    note: string;
  } {
    // This is a simplified approach - for real implementation,
    // you'd need to use SearchLocalSolarEclipse for solar eclipses
    // and calculate lunar eclipse visibility based on moon elevation

    if (eclipse.kind === 'lunar') {
      // Lunar eclipses are visible from anywhere on the night side of Earth
      return {
        isVisible: true,
        note: 'Lunar eclipses are visible from anywhere where the moon is above the horizon',
      };
    } else {
      // Solar eclipses have limited visibility zones
      return {
        isVisible: true, // Simplified - would need proper calculation
        note: 'Visibility depends on your exact location within the eclipse path',
      };
    }
  }
}
