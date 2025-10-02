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
import { Badge, Button, Collapse } from 'react-bootstrap';
import imgSprite from '../assets/images/icons/panchangam_sprite.png';
import { abhijitMuhurth, brahmaMuhurtham, getRahuKalam, pradoshaTime } from '../lib/goodBadTime';
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

interface SelectedLocationData {
  city: string;
  province: string;
  country: string;
  iso2: string;
  lat: number;
  lng: number;
  timezone: string;
}

interface PanchangamProps {
  date?: string | Date;
  showViewMore?: boolean;
}

export default function PanchangamTable({ date, showViewMore = false }: PanchangamProps) {
  const [openCollapse, setOpenCollapse] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [panchangamData, setPanchangamData] = useState<PanchangamData>({});
  const [sunTime, setSunTime] = useState<SunTime>({});
  const [moonTime, setMoonTime] = useState<MoonTime>({});
  const [displayTithis, setDisplayTithis] = useState<DisplayAnga[]>([]);
  const [displayNakshatras, setDisplayNakshatras] = useState<DisplayAnga[]>([]);
  const [displayYogas, setDisplayYogas] = useState<DisplayAnga[]>([]);
  const [displayKaranas, setDisplayKaranas] = useState<DisplayAnga[]>([]);

  const { t, locale } = useTranslation();
  const { lat, lng, city, country, setLocationData } = useLocation();
  const panchangamDate = date ? new Date(date) : new Date();

  const getUrlDate = (offset: number) => format(addDays(panchangamDate, offset), 'yyyy-MM-dd');
  const getLabelDate = (offset: number) => format(addDays(panchangamDate, offset), 'MMM d');

  // Location handling functions
  const handleLocationSelect = (locationData: SelectedLocationData) => {
    setSelectedLocation(locationData);
  };

  const handleSubmit = async () => {
    if (selectedLocation) {
      setIsSubmitting(true);
      setSubmitProgress(0);

      // Simulate progress steps with smooth animation
      const progressSteps = [20, 40, 60, 80, 100];

      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setSubmitProgress(progressSteps[i]);
      }

      // Apply the location change
      setLocationData(selectedLocation);

      // Show success state
      setShowSuccess(true);

      // Reset state with delay for smooth transition
      setTimeout(() => {
        setSelectedLocation(null);
        setSubmitProgress(0);
        setShowSuccess(false);
        setIsSubmitting(false);
        setOpenCollapse(false);
      }, 1500);
    }
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setOpenCollapse(false);
  };

  // Helper function to get sunrise time as Date object
  const getSunriseDate = (date: Date, lat: number, lng: number): Date => {
    const panchang = new YexaaPanchang();
    const sun = panchang.sunTimer(date, lat, lng);
    return new Date(sun.sunRise || date);
  };

  // Helper function to calculate all angas for the day according to Telugu Panchangam rules
  const getDayAngas = (
    entries: AngaEntry[],
    sunRise: Date,
    angaType: 'tithi' | 'nakshatra' | 'yoga' | 'karana'
  ): DisplayAnga[] => {
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

      // Apply Telugu Panchangam rules - only for Tithi entries
      if (angaType === 'tithi') {
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
      } catch (err) {}
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
      const dayTithis = getDayAngas(allTithis, sunriseTime, 'tithi');
      setDisplayTithis(dayTithis);

      const allNakshatras = getAllAngasForDay(panchangamDate, lat, lng, 'nakshatra');
      const dayNakshatras = getDayAngas(allNakshatras, sunriseTime, 'nakshatra');
      setDisplayNakshatras(dayNakshatras);

      const allYogas = getAllAngasForDay(panchangamDate, lat, lng, 'yoga');
      const dayYogas = getDayAngas(allYogas, sunriseTime, 'yoga');
      setDisplayYogas(dayYogas);

      const allKaranas = getAllAngasForDay(panchangamDate, lat, lng, 'karana');
      const dayKaranas = getDayAngas(allKaranas, sunriseTime, 'karana');
      setDisplayKaranas(dayKaranas);
    } catch (err) {
      setPanchangamData({});
      setSunTime({});
      setMoonTime({});
      setDisplayTithis([]);
      setDisplayNakshatras([]);
      setDisplayYogas([]);
      setDisplayKaranas([]);
    }
  }, [lat, lng, date]);

  const handleViewMoreClick = () => {
    setIsExpanded(!isExpanded);
  };

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
                className={`collapse-header fw-bold d-flex justify-content-between align-items-center py-1 text-white ${showSuccess ? 'success-glow' : ''}`}
                aria-expanded={openCollapse}
                onClick={() => !isSubmitting && setOpenCollapse(!openCollapse)}
                style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                <div className="location-display d-flex align-items-center">
                  <i
                    className={`fas fa-map-marker-alt me-2 ${isSubmitting ? 'pulse-icon' : ''}`}
                  ></i>
                  <span>
                    {city}, {country}
                  </span>
                  {showSuccess && (
                    <Badge bg="success" className="fade-in ms-2">
                      <i className="fas fa-check me-1"></i>Updated!
                    </Badge>
                  )}
                </div>
                <i className={`fa ${openCollapse ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </div>
              <Collapse in={openCollapse}>
                <div
                  id="collapse-text"
                  className="border-top p-3"
                  style={{ backgroundColor: '#6f0e0e', color: 'white' }}
                >
                  <div className="mb-2">
                    <label
                      className="form-label small mb-2"
                      style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    >
                      <i className="fas fa-search me-1"></i>
                      Search for a city to update Panchangam calculations:
                    </label>
                  </div>
                  <AutoComplete
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                  />

                  {selectedLocation && (
                    <div className="location-preview slide-down mt-3 rounded border bg-white p-2">
                      <div className="d-flex align-items-center mb-2">
                        <img
                          className="flag-bounce me-2 rounded"
                          src={`https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/${selectedLocation.iso2}.svg`}
                          alt="Flag"
                          width="20"
                          height="15"
                        />
                        <div>
                          <div className="fw-bold text-dark">{selectedLocation.city}</div>
                          <small className="text-muted">
                            {selectedLocation.province}, {selectedLocation.country}
                          </small>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {isSubmitting && (
                        <div className="progress mb-2" style={{ height: '4px' }}>
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            role="progressbar"
                            style={{ width: `${submitProgress}%`, transition: 'width 0.3s ease' }}
                          ></div>
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        <Button
                          variant={showSuccess ? 'success' : 'primary'}
                          size="sm"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className={`flex-grow-1 submit-btn ${isSubmitting ? 'submitting' : ''} ${showSuccess ? 'success-state' : ''}`}
                        >
                          {showSuccess ? (
                            <>
                              <i className="fas fa-check-circle bounce-in me-1"></i>
                              Applied Successfully!
                            </>
                          ) : isSubmitting ? (
                            <>
                              <div
                                className="spinner-border spinner-border-sm spin-animation me-1"
                                role="status"
                                aria-hidden="true"
                              ></div>
                              Updating Panchangam... ({submitProgress}%)
                            </>
                          ) : (
                            <>
                              <i className="fas fa-sync-alt me-1"></i>
                              Update Panchangam
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className={`cancel-btn ${isSubmitting ? 'disabled-state' : ''}`}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-2">
                    <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      <i className="fas fa-info-circle me-1"></i>
                      Changing location will recalculate all Panchangam elements for the new
                      coordinates.
                    </small>
                  </div>
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
        {showViewMore && !isExpanded && (
          <div className="mt-3 text-center">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleViewMoreClick}
              className="px-4"
            >
              {locale === 'te' ? 'మరిన్ని చూడండి' : 'View More'}
            </Button>
          </div>
        )}
        {(!showViewMore || isExpanded) && (
          <>
            {/* Inauspicious Period */}
            <div className="panchang-date">
              <h4 className="gr-text-6 text-black">{t.panchangam.inauspicious_period}</h4>
              <ul className="list-unstyled gr-text-8 border-bottom pb-4">
                {sunTime.sunRise &&
                  sunTime.sunSet &&
                  (() => {
                    try {
                      const rahuKalamTimes = getRahuKalam(
                        formatTimeIST(sunTime.sunRise),
                        formatTimeIST(sunTime.sunSet),
                        format(panchangamDate, 'EEEE') as any
                      );
                      return (
                        <>
                          <li>
                            <span className="fw-bold">{t.panchangam.rahu}</span> :{' '}
                            {rahuKalamTimes.rahu}
                          </li>
                          <li>
                            <span className="fw-bold">{t.panchangam.gulika}</span> :{' '}
                            {rahuKalamTimes.gulika}
                          </li>
                          <li>
                            <span className="fw-bold">{t.panchangam.yamaganda}</span> :{' '}
                            {rahuKalamTimes.yamaganda}
                          </li>
                        </>
                      );
                    } catch (error) {
                      return (
                        <>
                          <li>
                            <span className="fw-bold">{t.panchangam.rahu}</span> : N/A
                          </li>
                          <li>
                            <span className="fw-bold">{t.panchangam.gulika}</span> : N/A
                          </li>
                          <li>
                            <span className="fw-bold">{t.panchangam.yamaganda}</span> : N/A
                          </li>
                        </>
                      );
                    }
                  })()}
              </ul>
            </div>
            {/* Auspicious Period */}
            <div className="panchang-date">
              <h4 className="gr-text-6 text-black">{t.panchangam.auspicious_period}</h4>
              <ul className="list-unstyled gr-text-8 border-bottom pb-4">
                {sunTime.sunRise && sunTime.sunSet && (
                  <>
                    <li>
                      <span className="fw-bold">{t.panchangam.abhijit_muhurat}</span> :{' '}
                      {(() => {
                        try {
                          return abhijitMuhurth(
                            formatTimeIST(sunTime.sunRise),
                            formatTimeIST(sunTime.sunSet)
                          );
                        } catch (error) {
                          return 'N/A';
                        }
                      })()}
                    </li>
                    <li>
                      <span className="fw-bold">{t.panchangam.brahma_muhurat}</span> :{' '}
                      {(() => {
                        try {
                          return brahmaMuhurtham(formatTimeIST(sunTime.sunRise));
                        } catch (error) {
                          return 'N/A';
                        }
                      })()}
                    </li>
                    <li>
                      <span className="fw-bold">{t.panchangam.pradosha_time}</span> :{' '}
                      {(() => {
                        try {
                          return pradoshaTime(
                            formatTimeIST(sunTime.sunSet),
                            formatTimeIST(addDays(sunTime.sunRise || new Date(), 1))
                          );
                        } catch (error) {
                          return 'N/A';
                        }
                      })()}
                    </li>
                  </>
                )}
              </ul>
            </div>
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
            {showViewMore && isExpanded && (
              <div className="mt-3 text-center">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleViewMoreClick}
                  className="px-4"
                >
                  {locale === 'te' ? 'తక్కువ చూపించు' : 'Show Less'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>
        {`
          .icon-sprite {
            background-image: url(${imgSprite.src});
            background-repeat: no-repeat;
            width: 56px;
            height: 40px;
            display: inline-block;
          }

          /* View More Button - Orange Theme with Animation */
          .view-more-btn {
            background-color: #ff6600 !important;
            border-color: #ff6600 !important;
            color: white !important;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .view-more-btn:hover {
            background-color: #e65c00 !important;
            border-color: #e65c00 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(255, 102, 0, 0.3);
          }

          .view-more-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(255, 102, 0, 0.3);
          }

          .view-more-btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 5px;
            height: 5px;
            background: rgba(255, 255, 255, 0.5);
            opacity: 0;
            border-radius: 100%;
            transform: scale(1, 1) translate(-50%);
            transform-origin: 50% 50%;
          }

          .view-more-btn:focus:not(:active)::after {
            animation: ripple 1s ease-out;
          }

          @keyframes ripple {
            0% {
              transform: scale(0, 0);
              opacity: 0.5;
            }
            100% {
              transform: scale(50, 50);
              opacity: 0;
            }
          }

          /* Enhanced Location Selector Animations */
          .collapse-header {
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .collapse-header:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
          }

          /* Theme-specific styling for location search */
          #collapse-text {
            border-top-color: rgba(255, 255, 255, 0.2) !important;
          }

          #collapse-text .form-label {
            font-weight: 500;
          }

          #collapse-text .fas {
            opacity: 0.9;
          }

          .location-display {
            transition: all 0.2s ease;
          }

          .pulse-icon {
            animation: pulse 1.5s ease-in-out infinite;
          }

          .success-glow {
            animation: success-glow 1s ease-in-out;
            background-color: rgba(40, 167, 69, 0.2) !important;
          }

          .fade-in {
            animation: fadeIn 0.5s ease-in;
          }

          .slide-down {
            animation: slideDown 0.3s ease-out;
          }

          .flag-bounce {
            animation: flagBounce 0.6s ease-out;
          }

          .location-preview {
            transform-origin: top;
            transition: all 0.3s ease;
          }

          .submit-btn {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .submit-btn.submitting {
            transform: scale(0.98);
          }

          .submit-btn.success-state {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          }

          .bounce-in {
            animation: bounceIn 0.6s ease-out;
          }

          .spin-animation {
            animation: spin 1s linear infinite;
          }

          .cancel-btn {
            transition: all 0.2s ease;
          }

          .cancel-btn.disabled-state {
            opacity: 0.5;
            transform: scale(0.95);
          }

          /* Keyframe Animations */
          @keyframes pulse {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }

          @keyframes success-glow {
            0% {
              background-color: rgba(40, 167, 69, 0);
            }
            50% {
              background-color: rgba(40, 167, 69, 0.3);
            }
            100% {
              background-color: rgba(40, 167, 69, 0.2);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-15px) scaleY(0.8);
            }
            to {
              opacity: 1;
              transform: translateY(0) scaleY(1);
            }
          }

          @keyframes flagBounce {
            0% {
              transform: scale(0) rotate(0deg);
            }
            50% {
              transform: scale(1.2) rotate(5deg);
            }
            100% {
              transform: scale(1) rotate(0deg);
            }
          }

          @keyframes bounceIn {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* Progress Bar Enhancements */
          .progress {
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
          }

          .progress-bar {
            background: linear-gradient(45deg, #007bff, #0056b3);
            border-radius: 10px;
            transition: width 0.3s ease;
          }

          .progress-bar-animated {
            animation: progress-bar-stripes 1s linear infinite;
          }

          @keyframes progress-bar-stripes {
            0% {
              background-position: 1rem 0;
            }
            100% {
              background-position: 0 0;
            }
          }

          /* Mobile Responsive */
          @media (max-width: 768px) {
            .location-preview {
              margin: 8px 0;
            }

            .submit-btn {
              font-size: 12px;
            }

            .cancel-btn {
              min-width: 32px;
            }
          }
        `}
      </style>
    </>
  );
}
