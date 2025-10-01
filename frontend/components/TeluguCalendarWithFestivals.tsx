import { useLocation } from '@/context/LocationContext';
import { useTranslation } from '@/hooks/useTranslation';
import { CalculatedFestival, calculateFestivalDates } from '@/lib/festivalData';
import { YexaaPanchang } from '@/lib/panchangam';
import { CalculatedVrath, calculateVrathDates } from '@/lib/vrathData';
import { formatTimeIST } from '@/utils/utils';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Row, Spinner } from 'react-bootstrap';
import LocationAccordion from './LocationAccordion';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  panchangData: {
    sunrise: string;
    sunset: string;
    tithi: string;
    tithiTelugu: string;
    nakshatra: string;
    nakshatraTelugu: string;
    tithiNumber: number;
    paksha: string;
    isFestival: boolean;
  };
  festivals: CalculatedFestival[];
  vraths: CalculatedVrath[];
}

interface MonthlyEvent {
  date: Date;
  name: string;
  nameTelugu: string;
  type: 'festival' | 'vrath';
  category: string;
}

export default function TeluguCalendarWithFestivals() {
  const { t, locale } = useTranslation();
  const { lat, lng, city, country } = useLocation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a single panchang instance to reuse for performance
  const panchang = new YexaaPanchang();

  // Memoized festival and vrath calculations for current year
  const currentYear = currentDate.getFullYear();
  const festivals = useMemo(() => {
    try {
      return calculateFestivalDates(currentYear, lat || 17.385044, lng || 78.486671);
    } catch (error) {
      return [];
    }
  }, [currentYear, lat, lng]);

  const vraths = useMemo(() => {
    try {
      return calculateVrathDates(currentYear, lat || 17.385044, lng || 78.486671);
    } catch (error) {
      return [];
    }
  }, [currentYear, lat, lng]);

  // Get festivals and vraths for a specific date
  const getEventsForDate = (date: Date) => {
    const dateFestivals = festivals.filter(festival => isSameDay(festival.gregorianDate, date));

    const dateVraths = vraths.filter(vrath =>
      vrath.upcomingOccurrences.some(occurrence => isSameDay(occurrence, date))
    );

    return { festivals: dateFestivals, vraths: dateVraths };
  };

  // Calculate basic panchang data for a single day with events
  const calculateDayPanchang = (date: Date) => {
    try {
      const validLat = lat || 17.385044;
      const validLng = lng || 78.486671;

      const calculated = panchang.calculate(date);
      const sun = panchang.sunTimer(date, validLat, validLng);
      const tithiNumber = ((calculated.Tithi?.ino || 0) % 15) + 1;
      const paksha = calculated.Paksha?.name_en_IN || '';
      const events = getEventsForDate(date);

      const isFestival =
        calculated.Tithi?.name_en_IN === 'pournami' ||
        calculated.Tithi?.name_en_IN === 'amavasya' ||
        calculated.Tithi?.name_en_IN === 'ekadasi' ||
        events.festivals.length > 0 ||
        events.vraths.length > 0;

      return {
        sunrise: formatTimeIST(sun.sunRise) || '--:--',
        sunset: formatTimeIST(sun.sunSet) || '--:--',
        tithi: calculated.Tithi?.name_en_IN || '',
        tithiTelugu: calculated.Tithi?.name || '',
        nakshatra: calculated.Nakshatra?.name_en_IN || '',
        nakshatraTelugu: calculated.Nakshatra?.name || '',
        tithiNumber,
        paksha,
        isFestival,
        festivals: events.festivals,
        vraths: events.vraths,
      };
    } catch (error) {
      const events = getEventsForDate(date);
      return {
        sunrise: '--:--',
        sunset: '--:--',
        tithi: '',
        tithiTelugu: '',
        nakshatra: '',
        nakshatraTelugu: '',
        tithiNumber: 1,
        paksha: '',
        isFestival: events.festivals.length > 0 || events.vraths.length > 0,
        festivals: events.festivals,
        vraths: events.vraths,
      };
    }
  };

  // Generate calendar days organized by weekday columns
  const generateCalendarDays = (month: Date): CalendarDay[][] => {
    const firstDay = startOfMonth(month);
    const lastDay = endOfMonth(month);
    const today = new Date();
    const weekdayColumns: CalendarDay[][] = [[], [], [], [], [], [], []];
    const startDate = addDays(firstDay, -firstDay.getDay());
    const endDate = addDays(startDate, 34);

    for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
      const currentDateCopy = new Date(date);
      const dayOfWeek = currentDateCopy.getDay();
      const isCurrentMonth = isSameMonth(currentDateCopy, month);
      const isToday = isSameDay(currentDateCopy, today);
      const isSelected = isSameDay(currentDateCopy, selectedDate);
      const panchangData = calculateDayPanchang(currentDateCopy);

      const dayData: CalendarDay = {
        date: currentDateCopy,
        isCurrentMonth,
        isToday,
        isSelected,
        panchangData,
        festivals: panchangData.festivals,
        vraths: panchangData.vraths,
      };

      weekdayColumns[dayOfWeek].push(dayData);
    }

    return weekdayColumns;
  };

  // Get monthly events summary
  const getMonthlyEvents = useMemo((): MonthlyEvent[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const events: MonthlyEvent[] = [];

    festivals.forEach(festival => {
      if (isWithinInterval(festival.gregorianDate, { start: monthStart, end: monthEnd })) {
        events.push({
          date: festival.gregorianDate,
          name: festival.nameEnglish,
          nameTelugu: festival.nameTelugu,
          type: 'festival',
          category: festival.category,
        });
      }
    });

    vraths.forEach(vrath => {
      vrath.upcomingOccurrences.forEach(occurrence => {
        if (isWithinInterval(occurrence, { start: monthStart, end: monthEnd })) {
          events.push({
            date: occurrence,
            name: vrath.nameEnglish,
            nameTelugu: vrath.nameTelugu,
            type: 'vrath',
            category: vrath.category,
          });
        }
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [currentDate, festivals, vraths]);

  // Navigation functions
  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };
  const handleDateClick = (date: Date) => setSelectedDate(date);

  // Load calendar data when month changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const days = generateCalendarDays(currentDate);
      setCalendarDays(days);
    } catch (err) {
      setError('Failed to load calendar data');
      setCalendarDays([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate, lat, lng, festivals, vraths]);

  const weekdays = [
    { en: 'Sun', te: 'ఆది' },
    { en: 'Mon', te: 'సోమ' },
    { en: 'Tue', te: 'మంగళ' },
    { en: 'Wed', te: 'బుధ' },
    { en: 'Thu', te: 'గురు' },
    { en: 'Fri', te: 'శుక్ర' },
    { en: 'Sat', te: 'శని' },
  ];

  const monthYear = format(currentDate, 'MMMM yyyy');
  const monthYearTelugu = `${(t.panchangam as any)[format(currentDate, 'MMMM').toLowerCase()] || format(currentDate, 'MMMM')} ${format(currentDate, 'yyyy')}`;

  const selectedDayEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [selectedDate, festivals, vraths]);

  return (
    <Row className="telugu-calendar-with-festivals g-4 mt-25 py-5">
      {/* Calendar Grid - Left Side */}
      <Col xl={8} lg={8} md={12}>
        <div className="calendar-grid rounded bg-white p-4 shadow">
          <div className="mb-4 text-center">
            <h1>{locale === 'te' ? 'తెలుగు పంచాంగ క్యాలెండర్' : 'Telugu Panchangam Calendar'}</h1>
            <p className="text-muted">
              {locale === 'te'
                ? 'పండుగలు మరియు వ్రతాలతో కూడిన తెలుగు పంచాంగం'
                : 'Telugu Panchangam with Festivals and Vratams'}
            </p>
          </div>

          {/* Navigation Header */}
          <div className="calendar-nav d-flex justify-content-between align-items-center mb-4 rounded p-3">
            <div className="calendar-title">
              <h2 className="text-primary fw-bold mb-0">
                <i className="fas fa-calendar-alt me-2"></i>
                {monthYear}
              </h2>
              <p className="text-muted small mb-0">{monthYearTelugu}</p>
            </div>
            <div className="nav-buttons d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={goToPreviousMonth}>
                <i className="fa fa-chevron-left"></i>
                <span className="d-none d-sm-inline ms-1">Prev</span>
              </Button>
              <Button variant="primary" size="sm" onClick={goToToday}>
                <i className="fas fa-calendar-day me-1"></i>
                Today
              </Button>
              <Button variant="outline-primary" size="sm" onClick={goToNextMonth}>
                <span className="d-none d-sm-inline me-1">Next</span>
                <i className="fa fa-chevron-right"></i>
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {/* Traditional Vertical Column Calendar */}
          <div className="calendar-container">
            {loading ? (
              <div className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-2">{locale === 'te' ? 'లోడ్ అవుతోంది...' : 'Loading...'}</p>
              </div>
            ) : (
              <div className="calendar-table-responsive">
                <table className="calendar-table telugu-calendar table">
                  <tbody>
                    {/* Weekday Header */}
                    <tr className="calendar-heading">
                      {weekdays.map((weekday, columnIndex) => (
                        <td key={columnIndex} className="text-center">
                          <div className="weekdays">
                            <span className="weekday">
                              {locale === 'en' ? weekday.en : `${weekday.en}\n${weekday.te}`}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Calendar Rows */}
                    {calendarDays.length > 0 &&
                      Array.from(
                        { length: Math.max(...calendarDays.map(col => col.length)) },
                        (_, rowIndex) => (
                          <tr key={rowIndex}>
                            {weekdays.map((weekday, columnIndex) => {
                              const day = calendarDays[columnIndex]?.[rowIndex];

                              if (!day) {
                                return <td key={columnIndex} className="inactive-day"></td>;
                              }

                              const cellClasses = ['cal-day'];
                              if (!day.isCurrentMonth) cellClasses.push('inactive-day');
                              if (day.isToday) cellClasses.push('table-info');
                              if (day.isSelected) cellClasses.push('table-primary');
                              if (day.festivals.length > 0) cellClasses.push('has-festival');
                              if (day.vraths.length > 0) cellClasses.push('has-vrath');

                              return (
                                <td
                                  key={columnIndex}
                                  className={cellClasses.join(' ')}
                                  onClick={() => handleDateClick(day.date)}
                                  role="button"
                                >
                                  {/* Main Day Number */}
                                  <div className="main-day">
                                    <a href="#">{format(day.date, 'd')}</a>
                                  </div>

                                  {/* Day Information */}
                                  <div className="day-info">
                                    {/* Tithi */}
                                    <span className="day-tithi">
                                      {locale === 'en'
                                        ? `${day.panchangData.paksha === 'shukla_paksha' ? 'S' : 'K'} ${day.panchangData.tithi}`
                                        : `${day.panchangData.paksha === 'shukla_paksha' ? 'షు' : 'బ'} ${day.panchangData.tithiTelugu}`}
                                    </span>

                                    {/* Telugu Lunar Day Number */}
                                    <span className="sub-day">{day.panchangData.tithiNumber}</span>

                                    {/* Events Indicators */}
                                    <div className="events-indicators">
                                      {day.festivals.length > 0 && (
                                        <span
                                          className="festival-indicator"
                                          title={day.festivals
                                            .map(f =>
                                              locale === 'te' ? f.nameTelugu : f.nameEnglish
                                            )
                                            .join(', ')}
                                        >
                                          <i className="fas fa-star text-warning"></i>
                                          <small>{day.festivals.length}</small>
                                        </span>
                                      )}
                                      {day.vraths.length > 0 && (
                                        <span
                                          className="vrath-indicator"
                                          title={day.vraths
                                            .map(v =>
                                              locale === 'te' ? v.nameTelugu : v.nameEnglish
                                            )
                                            .join(', ')}
                                        >
                                          <i className="fas fa-om text-success"></i>
                                          <small>{day.vraths.length}</small>
                                        </span>
                                      )}
                                    </div>

                                    {/* Nakshatra */}
                                    <span className="day-nakshatra">
                                      {locale === 'en'
                                        ? day.panchangData.nakshatra
                                        : day.panchangData.nakshatraTelugu}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        )
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Events List */}
          <Row className="mt-4">
            <Col>
              <h3 className="mb-3 text-center">
                <i className="fas fa-calendar-check text-primary me-2"></i>
                {locale === 'te'
                  ? `${monthYearTelugu} పండుగలు మరియు వ్రతాలు`
                  : `Festivals & Vratams in ${monthYear}`}
              </h3>

              {getMonthlyEvents.length === 0 ? (
                <div className="text-muted py-4 text-center">
                  <p>
                    {locale === 'te'
                      ? 'ఈ నెలలో పండుగలు లేదా వ్రతాలు లేవు'
                      : 'No festivals or vratams this month'}
                  </p>
                </div>
              ) : (
                <div className="events-list">
                  <ul className="festival-list">
                    {getMonthlyEvents.map((event, index) => (
                      <li key={index} className={`event-item ${event.type}`}>
                        <span className="event-date">{format(event.date, 'dd EEE')}</span>
                        <span className="separator"> - </span>
                        <span className="event-name">
                          {locale === 'te' ? event.nameTelugu : event.name}
                        </span>
                        <span className="event-type-icon">
                          {event.type === 'festival' ? (
                            <i className="fas fa-star text-warning ms-1"></i>
                          ) : (
                            <i className="fas fa-om text-success ms-1"></i>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </Col>

      {/* Day Details Panel - Right Side */}
      <Col xl={4} lg={4} md={12}>
        {/* Location Accordion */}
        <div className="mb-3 rounded bg-white p-3 shadow">
          <LocationAccordion city={city} country={country} />
        </div>

        {/* Day Details Panel */}
        <div className="day-details rounded bg-white p-3 shadow">
          <div className="d-flex justify-content-between align-items-center border-bottom mb-3 pb-2">
            <h4 className="mb-0">{format(selectedDate, 'EEEE, MMM d')}</h4>
            {(selectedDayEvents.festivals.length || selectedDayEvents.vraths.length) && (
              <div className="d-flex gap-1">
                {selectedDayEvents.festivals.length > 0 && (
                  <Badge bg="warning" className="text-dark">
                    <i className="fas fa-star me-1"></i>
                    {selectedDayEvents.festivals.length}
                  </Badge>
                )}
                {selectedDayEvents.vraths.length > 0 && (
                  <Badge bg="success">
                    <i className="fas fa-om me-1"></i>
                    {selectedDayEvents.vraths.length}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Events Section */}
          {(selectedDayEvents.festivals.length > 0 || selectedDayEvents.vraths.length > 0) && (
            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-2">
                <i className="fas fa-calendar-check me-2"></i>
                {locale === 'te' ? 'పండుగలు మరియు వ్రతాలు' : 'Festivals & Vratams'}
              </h6>

              {selectedDayEvents.festivals.map((festival, index) => (
                <div
                  key={index}
                  className="event-detail border-start border-warning border-3 mb-3 rounded p-2"
                >
                  <div className="fw-bold text-warning">
                    <i className="fas fa-star me-1"></i>
                    {locale === 'te' ? festival.nameTelugu : festival.nameEnglish}
                  </div>
                  <div className="small text-muted mb-1">{festival.category}</div>
                  <div className="small">
                    {locale === 'te' ? festival.descriptionTelugu : festival.descriptionEnglish}
                  </div>
                </div>
              ))}

              {selectedDayEvents.vraths.map((vrath, index) => (
                <div
                  key={index}
                  className="event-detail border-start border-success border-3 mb-3 rounded p-2"
                >
                  <div className="fw-bold text-success">
                    <i className="fas fa-om me-1"></i>
                    {locale === 'te' ? vrath.nameTelugu : vrath.nameEnglish}
                  </div>
                  <div className="small text-muted mb-1">{vrath.category}</div>
                  <div className="small">
                    {locale === 'te' ? vrath.descriptionTelugu : vrath.descriptionEnglish}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Panchangam Info */}
          <div className="panchang-summary">
            <h6 className="fw-bold text-primary mb-2">
              <i className="fas fa-calendar-alt me-2"></i>
              {locale === 'te' ? 'పంచాంగం' : 'Panchangam'}
            </h6>
            <div className="small">
              <div className="mb-1">
                <strong>{locale === 'te' ? 'తిథి:' : 'Tithi:'}</strong>
                {selectedDayEvents.festivals.length === 0 &&
                selectedDayEvents.vraths.length === 0 ? (
                  <span className="ms-2">
                    {locale === 'te'
                      ? 'వివరాలు చూడాలంటే తేదీని ఎంచుకోండి'
                      : 'Select a date to see details'}
                  </span>
                ) : (
                  <span className="ms-2">{locale === 'te' ? 'ప్రత్యేక దినం' : 'Special Day'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Col>

      <style jsx>{`
        .calendar-container {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }

        .telugu-calendar {
          width: 100%;
          margin-bottom: 0;
          border-collapse: collapse;
        }

        .telugu-calendar td {
          vertical-align: top;
          border: 1px solid #dee2e6;
          padding: 8px;
          min-height: 120px;
          width: 14.28%;
        }

        .calendar-heading td {
          background: linear-gradient(135deg, #343a40 0%, #495057 100%);
          color: white;
          text-align: center;
          padding: 12px 8px;
        }

        .weekdays {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .weekday {
          font-size: 14px;
          font-weight: bold;
        }

        .cal-day {
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          background-color: #ffffff;
        }

        .cal-day:hover {
          background-color: #f8f9fa;
          box-shadow: inset 0 0 0 2px #007bff;
        }

        .main-day a {
          font-size: 24px;
          font-weight: bold;
          color: #000000;
          text-decoration: none;
          display: block;
        }

        .day-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 10px;
          margin-top: 8px;
        }

        .day-tithi {
          color: #dc3545;
          font-weight: 500;
        }

        .sub-day {
          color: #dc3545;
          font-weight: bold;
          font-size: 12px;
          position: absolute;
          top: 8px;
          right: 8px;
        }

        .events-indicators {
          display: flex;
          gap: 4px;
          margin: 4px 0;
        }

        .festival-indicator,
        .vrath-indicator {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 8px;
        }

        .day-nakshatra {
          color: #666666;
          font-size: 9px;
        }

        .inactive-day {
          background-color: #f8f9fa;
          color: #cccccc;
        }

        .table-info {
          background-color: #d1ecf1 !important;
        }

        .table-primary {
          background-color: #007bff !important;
          color: white !important;
        }

        .has-festival {
          border-left: 4px solid #ffc107 !important;
        }

        .has-vrath {
          border-right: 4px solid #28a745 !important;
        }

        .festival-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .event-item {
          padding: 0.5rem;
          border-bottom: 1px solid #eee;
        }

        .event-item:last-child {
          border-bottom: none;
        }

        .event-date {
          font-weight: bold;
          color: #007bff;
        }

        .event-name {
          margin: 0 0.25rem;
        }

        .separator {
          margin: 0 0.25rem;
        }

        @media (max-width: 768px) {
          .telugu-calendar td {
            padding: 4px;
            min-height: 100px;
          }

          .main-day a {
            font-size: 20px;
          }

          .day-info {
            font-size: 8px;
          }

          .festival-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Row>
  );
}
