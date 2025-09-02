import { useLocation } from '@/context/LocationContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ITRFCoord, moonRiseSet } from '@/lib/moonRiseSet';
import { MoonTime, PanchangamData, SunTime } from '@/types/panchangam';
import {
  formatDay,
  formatMonth,
  formatTimeIST,
  formatToDateTimeIST,
  startEndDateFormat,
} from '@/utils/utils';
import { addDays, format } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Collapse } from 'react-bootstrap';
import imgSprite from '../assets/images/icons/panchangam_sprite.png';
import { YexaaPanchang } from '../lib/panchangam';
import AutoComplete from './AutoComplete';
import PanchangSlide from './PanchangSlide';

// Types for anga display
interface AngaEntry {
  name: string;
  start: Date;
  end: Date;
  ino: number;
  paksha?: string; // For tithi entries
}

interface DisplayAnga {
  label: string;
  time: string;
}

interface PanchangamProps {
  date?: string | Date;
}

export default function PanchangamTable({ date }: PanchangamProps) {
  const [openCollapse, setOpenCollapse] = useState(false);
  const [panchangamData, setPanchangamData] = useState<PanchangamData>({});
  const [sunTime, setSunTime] = useState<SunTime>({});
  const [moonTime, setMoonTime] = useState<MoonTime>({});
  const [displayTithis, setDisplayTithis] = useState<DisplayAnga[]>([]);
  const [displayNakshatras, setDisplayNakshatras] = useState<DisplayAnga[]>([]);
  const [displayYogas, setDisplayYogas] = useState<DisplayAnga[]>([]);
  const [displayKaranas, setDisplayKaranas] = useState<DisplayAnga[]>([]);

  const { t } = useTranslation();
  const { lat, lng, city, country } = useLocation();
  const panchangamDate = date ? new Date(date) : new Date();

  const getUrlDate = (offset: number) => format(addDays(panchangamDate, offset), 'yyyy-MM-dd');
  const getLabelDate = (offset: number) => format(addDays(panchangamDate, offset), 'MMM d');

  // Helper function to get sunrise time as Date object
  const getSunriseDate = (date: Date, lat: number, lng: number): Date => {
    const panchang = new YexaaPanchang();
    const sun = panchang.sunTimer(date, lat, lng);
    return new Date(sun.sunRise || date);
  };

  // Helper function to calculate all angas for the day according to Telugu Panchangam rules
  const getDayAngas = (entries: AngaEntry[], sunRise: Date): DisplayAnga[] => {
    const nextSunrise = new Date(sunRise.getTime() + 24 * 60 * 60 * 1000);
    const results: DisplayAnga[] = [];

    for (const anga of entries) {
      const start = new Date(anga.start);
      const end = new Date(anga.end);

      // Check if this anga is relevant for the day (intersects with sunrise to next sunrise)
      if (end <= sunRise || start >= nextSunrise) {
        continue; // Skip angas that don't intersect with our day
      }

      let tag = '';
      let time = `${formatToDateTimeIST(start)} – ${formatToDateTimeIST(end)}`;

      // Apply Telugu Panchangam rules
      if (start > sunRise && end < nextSunrise) {
        // Anga begins and ends between two sunrises
        tag = ' [Kshaya]';
      } else if (start < sunRise && end > nextSunrise) {
        // Anga spans across two consecutive sunrises
        tag = ' [Vriddhi]';
      } else if (end.getTime() === sunRise.getTime()) {
        // Anga ends exactly at sunrise - next anga is official (normal case, no tag)
        // This anga should not be displayed as it's not the day's main anga
        continue;
      }
      // else: normal display (anga present at sunrise)

      const pakshaPrefix = anga.paksha ? `${anga.paksha} ` : '';
      const label = `${pakshaPrefix}${anga.name}${tag}`;

      results.push({
        label,
        time,
      });
    }

    return results;
  };

  // Helper function to get multiple angas around a date
  const getAllAngasForDay = (
    date: Date,
    lat: number,
    lng: number,
    angaType: 'tithi' | 'nakshatra' | 'yoga' | 'karana'
  ): AngaEntry[] => {
    const panchang = new YexaaPanchang();
    const angas: AngaEntry[] = [];

    // Calculate angas for a 48-hour window to catch overlapping angas
    const startDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    // Check every 6 hours to catch all possible angas
    for (
      let checkDate = startDate;
      checkDate <= endDate;
      checkDate.setHours(checkDate.getHours() + 6)
    ) {
      try {
        const calculated = panchang.calculate(new Date(checkDate));
        let angaData;

        switch (angaType) {
          case 'tithi':
            angaData = calculated.Tithi;
            break;
          case 'nakshatra':
            angaData = calculated.Nakshatra;
            break;
          case 'yoga':
            angaData = calculated.Yoga;
            break;
          case 'karana':
            angaData = calculated.Karna;
            break;
          default:
            continue;
        }

        if (angaData) {
          const angaEntry: AngaEntry = {
            name: angaData.name_en_IN || '',
            start: new Date(angaData.start),
            end: new Date(angaData.end),
            ino: angaData.ino,
          };

          // Add paksha information for tithi
          if (angaType === 'tithi' && calculated.Paksha) {
            angaEntry.paksha = calculated.Paksha.name_en_IN || '';
          }

          // Avoid duplicates by checking if we already have this exact anga
          const isDuplicate = angas.some(
            existing =>
              existing.ino === angaEntry.ino &&
              Math.abs(existing.start.getTime() - angaEntry.start.getTime()) < 60000 // within 1 minute
          );

          if (!isDuplicate) {
            angas.push(angaEntry);
          }
        }
      } catch (err) {
        console.error(`Error calculating ${angaType} for`, checkDate, err);
      }
    }

    // Sort by start time
    return angas.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  useEffect(() => {
    try {
      const panchang = new YexaaPanchang();

      const calendar = panchang.calendar(panchangamDate, lat, lng);
      const calculated = panchang.calculate(panchangamDate);
      const sun = panchang.sunTimer(panchangamDate, lat, lng);
      const moonDate = new Date(panchangamDate);
      const moonCoords = ITRFCoord.fromGeodeticDeg(lat, lng, 0);
      const moon = moonRiseSet(moonDate, moonCoords);

      setPanchangamData({
        tithi: calculated.Tithi?.name_en_IN || '',
        tithiTime: startEndDateFormat(calculated.Tithi.start, calculated.Tithi.end),
        nakshatra: calculated.Nakshatra?.name_en_IN || '',
        nakshatraTime: startEndDateFormat(calculated.Nakshatra.start, calculated.Nakshatra.end),
        yoga: calculated.Yoga?.name_en_IN || '',
        yogaTime: startEndDateFormat(calculated.Yoga.start, calculated.Yoga.end),
        karana: calculated.Karna?.name_en_IN || '',
        karanaTime: startEndDateFormat(calculated.Karna.start, calculated.Karna.end),
        moonMasa: calendar.MoonMasa?.name_en_IN || '',
        masa: calendar.Masa?.name_en_IN || '',
        paksha: calculated.Paksha?.name_en_IN || '',
        day: calculated.Day?.name_en_UK || '',
        ayana: calendar?.Ayana.name_en_IN || '',
        ritu: calendar?.DrikRitu.name_en_IN || '',
        teluguYear: calendar?.TeluguYear.name_en_IN || '',
      });

      setSunTime(sun);
      setMoonTime(moon);

      // Calculate display angas according to Telugu Panchangam rules
      const sunriseTime = getSunriseDate(panchangamDate, lat, lng);

      const allTithis = getAllAngasForDay(panchangamDate, lat, lng, 'tithi');
      const dayTithis = getDayAngas(allTithis, sunriseTime);
      setDisplayTithis(dayTithis);

      const allNakshatras = getAllAngasForDay(panchangamDate, lat, lng, 'nakshatra');
      const dayNakshatras = getDayAngas(allNakshatras, sunriseTime);
      setDisplayNakshatras(dayNakshatras);

      const allYogas = getAllAngasForDay(panchangamDate, lat, lng, 'yoga');
      const dayYogas = getDayAngas(allYogas, sunriseTime);
      setDisplayYogas(dayYogas);

      const allKaranas = getAllAngasForDay(panchangamDate, lat, lng, 'karana');
      const dayKaranas = getDayAngas(allKaranas, sunriseTime);
      setDisplayKaranas(dayKaranas);
    } catch (err) {
      console.error('Error calculating Panchangam:', err);
      setPanchangamData({});
      setSunTime({});
      setMoonTime({});
      setDisplayTithis([]);
      setDisplayNakshatras([]);
      setDisplayYogas([]);
      setDisplayKaranas([]);
    }
  }, [lat, lng, date]);

  const renderAngaItem = (
    title: string,
    displayAngas: DisplayAnga[],
    fallbackKey?: string,
    fallbackTime?: string
  ) => (
    <div className="panchang-date">
      <h4 className="gr-text-6 text-black">{title}</h4>
      <ul className="list-unstyled gr-text-8 border-bottom pb-4">
        {displayAngas.length > 0
          ? displayAngas.map((anga, index) => (
              <li key={index}>
                <span className="fw-bold">
                  {(t.panchangam as any)[anga.label.split(' [')[0]] || anga.label.split(' [')[0]}
                </span>
                {anga.label.includes('[') && (
                  <span className="text-warning ms-1">{anga.label.match(/\[.*\]/)?.[0]}</span>
                )}{' '}
                :<span className="ms-1">{anga.time}</span>
              </li>
            ))
          : fallbackKey &&
            fallbackTime && (
              <li>
                <span className="fw-bold">
                  {fallbackKey ? (t.panchangam as any)[fallbackKey] || fallbackKey : ''}
                </span>{' '}
                :<span className="ms-1">{fallbackTime}</span>
              </li>
            )}
      </ul>
    </div>
  );

  return (
    <>
      <div className="panchang-header text-black">
        <div className="d-flex w-100 align-items-center">
          <div className="pn-header-text flex-grow-1 pl-2">
            <div className="panchang-nav py-1">
              <ul className="list-unstyled">
                <li className="nav-prev fw-bold">
                  <Link href={`/panchangam/${getUrlDate(-1)}`}>
                    <i className="fa fa-angle-left" /> {getLabelDate(-1)}
                  </Link>
                </li>
                <li className="nav-prev fw-bold">
                  <Link href={`/panchangam/${format(new Date(), 'yyyy-MM-dd')}`}>Today</Link>
                </li>
                <li className="nav-next fw-bold">
                  <Link href={`/panchangam/${getUrlDate(1)}`}>
                    {getLabelDate(1)} <i className="fa fa-angle-right" />
                  </Link>
                </li>
              </ul>
            </div>
            <div className="panchang-title fw-bold">
              <span className="icon-sprite icon-sprite-balaji"></span>
              <h4 className="text-black">
                {t.panchangam.panchang}{' '}
                {(t.panchangam as any)[formatMonth(panchangamDate)] || formatMonth(panchangamDate)}{' '}
                {formatDay(panchangamDate)}, {panchangamDate.getFullYear()}
              </h4>
            </div>
            <div className="collapse-search">
              <div
                className="collapse-header fw-bold py-1 text-white"
                aria-expanded={openCollapse}
                onClick={() => setOpenCollapse(!openCollapse)}
              >
                {city}, {country} <i className="fa fa-chevron-down"></i>
              </div>
              <Collapse in={openCollapse}>
                <div id="collapse-text">
                  <AutoComplete />
                </div>
              </Collapse>
            </div>
          </div>
        </div>
      </div>

      <div className="panchang-secondary-header px-lg-14 px-md-12 px-sm-2 overflow-hidden px-4">
        <PanchangSlide
          sunrise={formatTimeIST(sunTime.sunRise)}
          sunset={formatTimeIST(sunTime.sunSet)}
          moonrise={formatTimeIST(moonTime.rise)}
          moonset={formatTimeIST(moonTime.set)}
        />
      </div>

      <div className="pricing-card gr-hover-shadow-1 gr-text-color border bg-white px-4 py-2">
        <div className="panchang-date">
          <ul className="list-unstyled gr-text-8 border-bottom pb-3">
            <li>
              <span className="fw-bold">{t.panchangam.date}</span> :{' '}
              <span>
                {(t.panchangam as any)[formatMonth(panchangamDate)] || formatMonth(panchangamDate)}{' '}
                {formatDay(panchangamDate)}
              </span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.week_day}</span> :{' '}
              <span>
                {panchangamData.day
                  ? (t.panchangam as any)[panchangamData.day] || panchangamData.day
                  : ''}
              </span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.tithi}</span> :{' '}
              <span>
                {panchangamData.tithi
                  ? (t.panchangam as any)[panchangamData.tithi] || panchangamData.tithi
                  : ''}
              </span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.month}</span> :{' '}
              <span>
                {panchangamData.moonMasa
                  ? (t.panchangam as any)[panchangamData.moonMasa] || panchangamData.moonMasa
                  : ''}
              </span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.nakshatra}</span> :{' '}
              <span>
                {panchangamData.nakshatra
                  ? (t.panchangam as any)[panchangamData.nakshatra] || panchangamData.nakshatra
                  : ''}
              </span>
            </li>
            <li>
              <span className="fw-bold">{(t.panchangam as any).paksha || 'Paksha'}</span> :{' '}
              <span>
                {panchangamData.paksha
                  ? (t.panchangam as any)[panchangamData.paksha] || panchangamData.paksha
                  : ''}
              </span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.lunar_year}</span> :{' '}
              <span>
                {panchangamData.teluguYear
                  ? (t.panchangam as any)[panchangamData.teluguYear] || panchangamData.teluguYear
                  : ''}
              </span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.ruthu}</span> :{' '}
              <span>
                {panchangamData.ritu
                  ? (t.panchangam as any)[panchangamData.ritu] || panchangamData.ritu
                  : ''}
              </span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.ayana}</span> :{' '}
              <span>
                {panchangamData.ayana
                  ? (t.panchangam as any)[panchangamData.ayana] || panchangamData.ayana
                  : ''}
              </span>
            </li>
          </ul>
        </div>
        <div className="panchang-date">
          <h4 className="gr-text-6 text-black">{t.panchangam.tithi}</h4>
          <ul className="list-unstyled gr-text-8 border-bottom pb-4">
            {displayTithis.length > 0 ? (
              displayTithis.map((tithi, index) => {
                const labelWithoutTag = tithi.label.split(' [')[0];
                const parts = labelWithoutTag.split(' ');
                let displayLabel = '';

                if (parts.length >= 2) {
                  // Has paksha (e.g., "sukla_paksha vidiya")
                  const paksha = parts[0];
                  const tithiName = parts.slice(1).join(' ');
                  const pakshaTranslation = (t.panchangam as any)[paksha] || paksha;
                  const tithiTranslation = (t.panchangam as any)[tithiName] || tithiName;
                  displayLabel = `${pakshaTranslation} ${tithiTranslation}`;
                } else {
                  // No paksha, just tithi name
                  displayLabel = (t.panchangam as any)[labelWithoutTag] || labelWithoutTag;
                }

                return (
                  <li key={index}>
                    <span className="fw-bold">{displayLabel}</span>
                    {tithi.label.includes('[') && (
                      <span className="text-warning ms-1">{tithi.label.match(/\[.*\]/)?.[0]}</span>
                    )}{' '}
                    :<span className="ms-1">{tithi.time}</span>
                  </li>
                );
              })
            ) : (
              <li>
                <span className="fw-bold">
                  {panchangamData.tithi
                    ? (t.panchangam as any)[panchangamData.tithi] || panchangamData.tithi
                    : ''}
                </span>{' '}
                :<span className="ms-1">{panchangamData.tithiTime}</span>
              </li>
            )}
          </ul>
        </div>
        {renderAngaItem(
          t.panchangam.nakshatra,
          displayNakshatras,
          panchangamData.nakshatra,
          panchangamData.nakshatraTime
        )}
        {renderAngaItem(
          (t.panchangam as any).karana || 'Karana',
          displayKaranas,
          panchangamData.karana,
          panchangamData.karanaTime
        )}
        {renderAngaItem(
          t.panchangam.yoga,
          displayYogas,
          panchangamData.yoga,
          panchangamData.yogaTime
        )}
        <div className="panchang-date">
          <h4 className="gr-text-6 text-black">{t.panchangam.sun_moon_time}</h4>
          <ul className="list-unstyled gr-text-8">
            <li>
              <span className="fw-bold">{t.panchangam.sunrise}</span> :{' '}
              {formatTimeIST(sunTime.sunRise)}
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.sunset}</span> :{' '}
              {formatTimeIST(sunTime.sunSet)}
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.moonrise}</span> :{' '}
              {formatTimeIST(moonTime.rise)}
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.moonset}</span> :{' '}
              {formatTimeIST(moonTime.set)}
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .icon-sprite {
          background-image: url(${imgSprite.src});
          background-repeat: no-repeat;
          width: 56px;
          height: 40px;
          display: inline-block;
        }
      `}</style>
    </>
  );
}
