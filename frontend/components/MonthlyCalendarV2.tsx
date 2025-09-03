import { useLocation } from '@/context/LocationContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ITRFCoord, moonRiseSet } from '@/lib/moonRiseSet';
import { YexaaPanchang } from '@/lib/panchangam';
import { formatTimeIST } from '@/utils/utils';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { useEffect, useState } from 'react';
import { Alert, Button, Col, Row, Spinner } from 'react-bootstrap';
import LocationAccordion from './LocationAccordion';
import TithiList from './TithiList';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isPrevMonth: boolean;
  isNextMonth: boolean;
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
}

interface DayDetails {
  date: Date;
  basic: any;
  calendar: any;
  sun: any;
  moon: any;
}

export default function MonthlyCalendar() {
  const { t, locale } = useTranslation();
  const { lat, lng, city, country } = useLocation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[][]>([]);
  const [dayDetails, setDayDetails] = useState<DayDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a single panchang instance to reuse
  const panchang = new YexaaPanchang();

  // Calculate basic panchang data for a single day
  const calculateDayPanchang = (date: Date) => {
    try {
      // Ensure we have valid coordinates
      const validLat = lat || 17.385044; // Default to Hyderabad
      const validLng = lng || 78.486671;

      const calculated = panchang.calculate(date);
      const sun = panchang.sunTimer(date, validLat, validLng);

      // Get Telugu lunar day number (1-15 for each paksha)
      const tithiNumber = ((calculated.Tithi?.ino || 0) % 15) + 1;
      const paksha = calculated.Paksha?.name_en_IN || '';

      // Check for special days/festivals
      const isFestival =
        calculated.Tithi?.name_en_IN === 'pournami' ||
        calculated.Tithi?.name_en_IN === 'amavasya' ||
        calculated.Tithi?.name_en_IN === 'ekadasi';

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
      };
    } catch (error) {
      console.error('Error calculating panchang for', date, error);
      return {
        sunrise: '--:--',
        sunset: '--:--',
        tithi: '',
        tithiTelugu: '',
        nakshatra: '',
        nakshatraTelugu: '',
        tithiNumber: 1,
        paksha: '',
        isFestival: false,
      };
    }
  };

  // Generate calendar days organized by weekday columns (vertical layout)
  const generateCalendarDays = (month: Date): CalendarDay[][] => {
    const firstDay = startOfMonth(month);
    const lastDay = endOfMonth(month);
    const today = new Date();

    // Create 7 columns for each day of the week
    const weekdayColumns: CalendarDay[][] = [[], [], [], [], [], [], []]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat

    // Start from the beginning of the month and include previous/next month dates to fill columns
    const startDate = addDays(firstDay, -firstDay.getDay()); // Start from Sunday of the first week
    const endDate = addDays(startDate, 34); // 5 weeks × 7 days = 35 days total

    for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
      const currentDateCopy = new Date(date);
      const dayOfWeek = currentDateCopy.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const isCurrentMonth = isSameMonth(currentDateCopy, month);
      const isToday = isSameDay(currentDateCopy, today);
      const isSelected = isSameDay(currentDateCopy, selectedDate);

      const dayData: CalendarDay = {
        date: currentDateCopy,
        isCurrentMonth,
        isPrevMonth: currentDateCopy < firstDay,
        isNextMonth: currentDateCopy > lastDay,
        isToday,
        isSelected,
        panchangData: calculateDayPanchang(currentDateCopy),
      };

      // Add to the appropriate weekday column
      weekdayColumns[dayOfWeek].push(dayData);
    }

    return weekdayColumns;
  };

  // Calculate detailed day information
  const calculateDayDetails = async (date: Date): Promise<DayDetails | null> => {
    try {
      // Ensure we have valid coordinates
      const validLat = lat || 17.385044; // Default to Hyderabad
      const validLng = lng || 78.486671;

      const basic = panchang.calculate(date);
      const calendar = panchang.calendar(date, validLat, validLng);
      const sun = panchang.sunTimer(date, validLat, validLng);
      const moonCoords = ITRFCoord.fromGeodeticDeg(validLat, validLng, 0);
      const moon = moonRiseSet(date, moonCoords);

      return {
        date,
        basic,
        calendar,
        sun,
        moon,
      };
    } catch (error) {
      console.error('Error calculating day details for', date, error);
      return null;
    }
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Load calendar data when month changes
  useEffect(() => {
    // Ensure we have valid coordinates, use defaults if not available
    const validLat = lat || 17.385044; // Default to Hyderabad
    const validLng = lng || 78.486671;

    setLoading(true);
    setError(null);

    try {
      console.log(
        'Generating calendar for:',
        format(currentDate, 'MMMM yyyy'),
        'at coordinates:',
        validLat,
        validLng
      );
      const days = generateCalendarDays(currentDate);
      console.log('Generated', days.length, 'calendar days');
      setCalendarDays(days);
    } catch (err) {
      console.error('Error generating calendar:', err);
      setError('Failed to load calendar data');
      setCalendarDays([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate, lat, lng]);

  // Load day details when selected date changes
  useEffect(() => {
    setDetailsLoading(true);

    calculateDayDetails(selectedDate)
      .then(details => {
        setDayDetails(details);
      })
      .catch(err => {
        console.error('Error loading day details:', err);
        setDayDetails(null);
      })
      .finally(() => {
        setDetailsLoading(false);
      });
  }, [selectedDate, lat, lng]);

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

  const year = new Date().getFullYear();

  return (
    <Row className="monthly-calendar g-4 mt-25 py-5">
      {/* Calendar Grid - Left Side */}
      <Col xl={8} lg={8} md={12}>
        <div className="calendar-grid rounded bg-white p-4 shadow">
          <div className="mb-4 text-center">
            <h1>
              {(t.panchangam as any).calender || 'Telugu Panchangam Calendar'} {year}
            </h1>
            <p className="text-muted">
              {(t.panchangam as any).calender_desc ||
                'Monthly view of Telugu Panchangam with daily astronomical information'}
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
              <Button
                variant="outline-primary"
                size="sm"
                onClick={goToPreviousMonth}
                className="nav-btn"
              >
                <i className="fa fa-chevron-left"></i>
                <span className="d-none d-sm-inline ms-1">Prev</span>
              </Button>
              <Button variant="primary" size="sm" onClick={goToToday} className="today-btn">
                <i className="fas fa-calendar-day me-1"></i>
                Today
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={goToNextMonth}
                className="nav-btn"
              >
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

          {/* Traditional Vertical Column Calendar (Telugu Panchangam Style) */}
          <div className="calendar-container">
            {loading ? (
              <div className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-2">Loading calendar...</p>
              </div>
            ) : (
              <div className="calendar-table-responsive">
                <table className="calendar-table telugu-calendar table-calendar vertical-calendar table">
                  <tbody>
                    {/* Weekday Header Row with Day Info */}
                    <tr className="day calendar-heading">
                      {weekdays.map((weekday, columnIndex) => (
                        <td key={columnIndex}>
                          <div className="weekdays">
                            <span className="weekday">
                              {locale === 'en' ? weekday.en : `${weekday.en}\n${weekday.te}`}
                            </span>
                            <div className="day-info">
                              {/* Additional day info can be added here */}
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Calendar Rows - Each row represents one week */}
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

                              // Generate cell classes based on day type
                              const cellClasses = ['cal-day'];

                              if (!day.isCurrentMonth) {
                                cellClasses.push('inactive-day');
                              }

                              if (day.isToday) cellClasses.push('table-info');
                              if (day.isSelected) cellClasses.push('table-primary');
                              if (day.panchangData.isFestival) cellClasses.push('festival');

                              return (
                                <td
                                  key={columnIndex}
                                  className={cellClasses.join(' ')}
                                  onClick={() => handleDateClick(day.date)}
                                  role="button"
                                  aria-haspopup="true"
                                  data-day={format(day.date, 'd')}
                                >
                                  {/* Main Day Number */}
                                  <div
                                    className="main-day main-day-te"
                                    data-week_en={weekday.en}
                                    data-week_te={weekday.te}
                                  >
                                    <a href="#">{format(day.date, 'd')}</a>
                                  </div>

                                  {/* Day Information */}
                                  <div className="day-info">
                                    {/* Tithi */}
                                    <span className="day-tithi">
                                      {locale === 'en'
                                        ? `${day.panchangData.paksha === 'shukla_paksha' ? 'S' : 'K'} ${day.panchangData.tithi || day.panchangData.tithiTelugu}`
                                        : `${day.panchangData.paksha === 'shukla_paksha' ? 'షు' : 'బ'} ${day.panchangData.tithiTelugu}`}
                                    </span>

                                    {/* Telugu Lunar Day Number */}
                                    <span className="sub-day">{day.panchangData.tithiNumber}</span>

                                    {/* Nakshatra */}
                                    <span className="day-nakshatra">
                                      {locale === 'en'
                                        ? day.panchangData.nakshatra
                                        : day.panchangData.nakshatraTelugu}
                                    </span>

                                    {/* Sun Times */}
                                    <span className="day-sun-times">
                                      {locale === 'en'
                                        ? `☀ ${day.panchangData.sunrise} | 🌙 ${day.panchangData.sunset}`
                                        : `ఉ ${day.panchangData.sunrise} ల ${day.panchangData.sunset}`}
                                    </span>

                                    {/* Festival Indicator */}
                                    {day.panchangData.isFestival && (
                                      <span className="festival-indicator">
                                        <i className="fas fa-star text-danger"></i>
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        )
                      )}
                  </tbody>

                  {/* Footer with Legend */}
                  <tfoot>
                    <tr>
                      <td className="tl pad" colSpan={7}>
                        {locale === 'en'
                          ? 'S - Shukla Paksha, K - Krishna Paksha, ☀ - Sunrise, 🌙 - Sunset'
                          : 'దు - దుర్ముహూర్తము, వ - వర్జ్యము, షు - శుద్ధ పాడ్యమి, బ - బహుళ, ల - లగాయతు, తె - రేపటి, ఉ - ఉదయం, మ - మధ్యాహ్నం, సా - సాయంత్రం, రా - రాత్రి'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <Row className="mt-5 py-2">
            <Col>
              <h1 className="text-center">
                {t.panchangam.tithi_list} {year}
              </h1>
              <p className="text-center">Complete list of Telugu Tithi dates and timing</p>
              <TithiList />
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

        {/* Day Details Panel - Right Side */}
        <div className="day-details rounded bg-white p-3 shadow">
          <div className="d-flex justify-content-between align-items-center border-bottom mb-3 pb-2">
            <h4 className="mb-0">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h4>
            {(dayDetails?.basic?.Tithi?.name_en_IN === 'pournami' ||
              dayDetails?.basic?.Tithi?.name_en_IN === 'amavasya' ||
              dayDetails?.basic?.Tithi?.name_en_IN === 'ekadasi') && (
              <div className="festival-badge bg-warning text-dark small rounded px-2 py-1">
                <i className="fas fa-star me-1"></i>
                Special Day
              </div>
            )}
          </div>

          {detailsLoading ? (
            <div className="py-4 text-center">
              <Spinner animation="border" size="sm" />
              <p className="text-muted mt-2">Loading details...</p>
            </div>
          ) : dayDetails ? (
            <div className="panchang-details">
              {/* Sun & Moon Times */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-2">
                  <i className="fas fa-sun text-warning me-2"></i>
                  Sun & Moon Times
                </h6>
                <div className="row small">
                  <div className="col-6">
                    <div className="d-flex align-items-center mb-1">
                      <i className="fas fa-sun text-warning me-2" style={{ fontSize: '12px' }}></i>
                      <strong>Sunrise:</strong>
                    </div>
                    <div className="text-muted ms-3">{formatTimeIST(dayDetails.sun.sunRise)}</div>
                    <div className="d-flex align-items-center mb-1 mt-2">
                      <i
                        className="fas fa-moon text-secondary me-2"
                        style={{ fontSize: '12px' }}
                      ></i>
                      <strong>Sunset:</strong>
                    </div>
                    <div className="text-muted ms-3">{formatTimeIST(dayDetails.sun.sunSet)}</div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center mb-1">
                      <i className="fas fa-moon text-info me-2" style={{ fontSize: '12px' }}></i>
                      <strong>Moonrise:</strong>
                    </div>
                    <div className="text-muted ms-3">{formatTimeIST(dayDetails.moon.rise)}</div>
                    <div className="d-flex align-items-center mb-1 mt-2">
                      <i className="fas fa-moon text-dark me-2" style={{ fontSize: '12px' }}></i>
                      <strong>Moonset:</strong>
                    </div>
                    <div className="text-muted ms-3">{formatTimeIST(dayDetails.moon.set)}</div>
                  </div>
                </div>
              </div>

              {/* Panchangam Elements */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary mb-2">
                  <i className="fas fa-calendar-alt text-primary me-2"></i>
                  Panchangam
                </h6>
                <div className="small">
                  <div className="row mb-2">
                    <div className="col-4 fw-bold d-flex align-items-center">
                      <i
                        className="fas fa-calendar text-primary me-1"
                        style={{ fontSize: '10px' }}
                      ></i>
                      Tithi:
                    </div>
                    <div className="col-8">
                      {(t.panchangam as any)[dayDetails.basic.Tithi?.name_en_IN] ||
                        dayDetails.basic.Tithi?.name_en_IN ||
                        'N/A'}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-4 fw-bold d-flex align-items-center">
                      <i className="fas fa-star text-info me-1" style={{ fontSize: '10px' }}></i>
                      Nakshatra:
                    </div>
                    <div className="col-8">
                      {(t.panchangam as any)[dayDetails.basic.Nakshatra?.name_en_IN] ||
                        dayDetails.basic.Nakshatra?.name_en_IN ||
                        'N/A'}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-4 fw-bold d-flex align-items-center">
                      <i className="fas fa-om text-success me-1" style={{ fontSize: '10px' }}></i>
                      Yoga:
                    </div>
                    <div className="col-8">
                      {(t.panchangam as any)[dayDetails.basic.Yoga?.name_en_IN] ||
                        dayDetails.basic.Yoga?.name_en_IN ||
                        'N/A'}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-4 fw-bold d-flex align-items-center">
                      <i
                        className="fas fa-yin-yang text-warning me-1"
                        style={{ fontSize: '10px' }}
                      ></i>
                      Karana:
                    </div>
                    <div className="col-8">
                      {(t.panchangam as any)[dayDetails.basic.Karna?.name_en_IN] ||
                        dayDetails.basic.Karna?.name_en_IN ||
                        'N/A'}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-4 fw-bold d-flex align-items-center">
                      <i
                        className="fas fa-circle text-secondary me-1"
                        style={{ fontSize: '10px' }}
                      ></i>
                      Paksha:
                    </div>
                    <div className="col-8">
                      {(t.panchangam as any)[dayDetails.basic.Paksha?.name_en_IN] ||
                        dayDetails.basic.Paksha?.name_en_IN ||
                        'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Information */}
              {dayDetails.calendar && (
                <div className="mb-3">
                  <h6 className="fw-bold text-primary mb-2">
                    <i className="fas fa-calendar-check text-success me-2"></i>
                    Calendar Info
                  </h6>
                  <div className="small">
                    {dayDetails.calendar.MoonMasa && (
                      <div className="row mb-2">
                        <div className="col-4 fw-bold d-flex align-items-center">
                          <i
                            className="fas fa-moon text-info me-1"
                            style={{ fontSize: '10px' }}
                          ></i>
                          Masa:
                        </div>
                        <div className="col-8">
                          {(t.panchangam as any)[dayDetails.calendar.MoonMasa.name_en_IN] ||
                            dayDetails.calendar.MoonMasa.name_en_IN}
                        </div>
                      </div>
                    )}
                    {dayDetails.calendar.TeluguYear && (
                      <div className="row mb-2">
                        <div className="col-4 fw-bold d-flex align-items-center">
                          <i
                            className="fas fa-calendar-alt text-primary me-1"
                            style={{ fontSize: '10px' }}
                          ></i>
                          Telugu Year:
                        </div>
                        <div className="col-8">
                          {(t.panchangam as any)[dayDetails.calendar.TeluguYear.name_en_IN] ||
                            dayDetails.calendar.TeluguYear.name_en_IN}
                        </div>
                      </div>
                    )}
                    {dayDetails.calendar.DrikRitu && (
                      <div className="row mb-2">
                        <div className="col-4 fw-bold d-flex align-items-center">
                          <i
                            className="fas fa-leaf text-success me-1"
                            style={{ fontSize: '10px' }}
                          ></i>
                          Ritu:
                        </div>
                        <div className="col-8">
                          {(t.panchangam as any)[dayDetails.calendar.DrikRitu.name_en_IN] ||
                            dayDetails.calendar.DrikRitu.name_en_IN}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted py-4 text-center">
              <i className="fa fa-exclamation-triangle fa-2x mb-2"></i>
              <p>Unable to load panchangam details</p>
              <small>Please check your location settings</small>
            </div>
          )}
        </div>
      </Col>

      <style jsx>{`
        /* Traditional Vertical Column Calendar (Telugu Panchangam Style) */
        .calendar-container {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-table-responsive {
          overflow-x: auto;
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
          width: 14.28%; /* 100% / 7 columns */
        }

        /* Weekday Header Row */
        .calendar-heading td {
          background: linear-gradient(135deg, #343a40 0%, #495057 100%);
          color: white;
          text-align: center;
          padding: 12px 8px;
          border-bottom: 2px solid #dee2e6;
        }

        .weekdays {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .weekday {
          font-size: 14px;
          font-weight: bold;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .day-info {
          font-size: 10px;
          margin-top: 8px;
          opacity: 0.9;
        }

        /* Calendar Day Cells */
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

        /* Main Day Number */
        .main-day {
          margin-bottom: 8px;
        }

        .main-day a {
          font-size: 24px;
          font-weight: bold;
          color: #000000;
          text-decoration: none;
          display: block;
        }

        .main-day a:hover {
          color: #007bff;
        }

        /* Day Information Container */
        .day-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 10px;
        }

        /* Tithi */
        .day-tithi {
          color: #dc3545;
          font-weight: 500;
          font-size: 10px;
        }

        /* Telugu Lunar Day Number */
        .sub-day {
          color: #dc3545;
          font-weight: bold;
          font-size: 12px;
          text-align: right;
          position: absolute;
          top: 8px;
          right: 8px;
        }

        /* Nakshatra */
        .day-nakshatra {
          color: #000000;
          font-size: 9px;
          font-weight: 400;
        }

        /* Sun Times */
        .day-sun-times {
          color: #666666;
          font-size: 8px;
          margin-top: 4px;
        }

        /* Festival Indicator */
        .festival-indicator {
          text-align: center;
          margin-top: 4px;
        }

        .festival-indicator i {
          font-size: 8px;
        }

        /* Calendar Day States */

        /* Inactive days (previous/next month) */
        .inactive-day {
          background-color: #f8f9fa;
          color: #cccccc;
        }

        .inactive-day .main-day a {
          color: #cccccc;
          font-weight: normal;
        }

        .inactive-day .day-tithi,
        .inactive-day .day-nakshatra,
        .inactive-day .day-sun-times,
        .inactive-day .sub-day {
          color: #cccccc;
        }

        /* Today - blue background */
        .table-info {
          background-color: #d1ecf1 !important;
          border-color: #bee5eb !important;
        }

        .table-info .main-day a {
          color: #0c5460 !important;
          font-weight: bold;
        }

        /* Selected date - primary blue */
        .table-primary {
          background-color: #007bff !important;
          color: white !important;
          border-color: #0056b3 !important;
        }

        .table-primary .main-day a {
          color: white !important;
          font-weight: bold;
        }

        .table-primary .day-tithi,
        .table-primary .day-nakshatra,
        .table-primary .day-sun-times,
        .table-primary .sub-day {
          color: white !important;
        }

        /* Festival days */
        .festival {
          border-left: 4px solid #dc3545 !important;
        }

        /* Footer */
        .tl.pad {
          background-color: #f8f9fa;
          border-top: 2px solid #dee2e6;
          padding: 12px;
          font-size: 11px;
          color: #666666;
          text-align: center;
        }

        /* Responsive Design */
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

          .weekday {
            font-size: 12px;
          }
        }
      `}</style>
    </Row>
  );
}
