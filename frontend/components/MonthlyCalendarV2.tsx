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

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isPrevMonth: boolean;
  isNextMonth: boolean;
  isToday: boolean;
  panchangData: {
    sunrise: string;
    sunset: string;
    tithi: string;
    nakshatra: string;
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
  const { t } = useTranslation();
  const { lat, lng, city, country } = useLocation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
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

      return {
        sunrise: formatTimeIST(sun.sunRise) || '--:--',
        sunset: formatTimeIST(sun.sunSet) || '--:--',
        tithi: calculated.Tithi?.name_en_IN || '',
        nakshatra: calculated.Nakshatra?.name_en_IN || '',
      };
    } catch (error) {
      console.error('Error calculating panchang for', date, error);
      return {
        sunrise: '--:--',
        sunset: '--:--',
        tithi: '',
        nakshatra: '',
      };
    }
  };

  // Generate calendar days for the month
  const generateCalendarDays = (month: Date): CalendarDay[] => {
    const firstDay = startOfMonth(month);
    const lastDay = endOfMonth(month);
    const startDay = addDays(firstDay, -firstDay.getDay()); // Start from Sunday
    const endDay = addDays(startDay, 41); // 6 weeks × 7 days - 1

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let date = new Date(startDay); date <= endDay; date = addDays(date, 1)) {
      const currentDateCopy = new Date(date);

      days.push({
        date: currentDateCopy,
        isCurrentMonth: isSameMonth(currentDateCopy, month),
        isPrevMonth: currentDateCopy < firstDay,
        isNextMonth: currentDateCopy > lastDay,
        isToday: isSameDay(currentDateCopy, today),
        panchangData: calculateDayPanchang(currentDateCopy),
      });
    }

    return days;
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

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthYear = format(currentDate, 'MMMM yyyy');

  return (
    <Row className="monthly-calendar g-4">
      {/* Calendar Grid - Left Side */}
      <Col xl={8} lg={8} md={12}>
        <div className="calendar-grid rounded bg-white p-4 shadow">
          {/* Navigation Header */}
          <div className="calendar-nav d-flex justify-content-between align-items-center mb-4 rounded p-3">
            <h2 className="calendar-title text-primary fw-bold mb-0">
              <i className="fas fa-calendar-alt me-2"></i>
              {monthYear}
            </h2>
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

          {/* Calendar Header - Weekdays */}
          <div className="calendar-header d-flex mb-2">
            {weekdays.map(day => (
              <div
                key={day}
                className="weekday-header fw-bold flex-fill bg-light border p-2 text-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          {loading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" />
              <p className="mt-2">Loading calendar...</p>
            </div>
          ) : (
            <div className="calendar-body">
              {/* Render 6 weeks */}
              {Array.from({ length: 6 }, (_, weekIndex) => (
                <div key={weekIndex} className="calendar-week d-flex">
                  {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`calendar-day flex-fill position-relative d-flex flex-column cursor-pointer border ${
                        day.isCurrentMonth
                          ? 'current-month'
                          : day.isPrevMonth
                            ? 'prev-month'
                            : 'next-month'
                      } ${day.isToday ? 'today' : ''} ${isSameDay(day.date, selectedDate) ? 'selected' : ''}`}
                      onClick={() => handleDateClick(day.date)}
                      style={{ minHeight: '120px', cursor: 'pointer' }}
                    >
                      {/* Date Number */}
                      <div className="date-number fw-bold mb-1 text-center">
                        {format(day.date, 'd')}
                      </div>

                      {/* Panchangam Info */}
                      <div className="panchang-info flex-grow-1 d-flex flex-column justify-content-between">
                        {/* Sun Times */}
                        <div className="sun-times mb-1">
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="time-item">
                              <i
                                className="fas fa-sun text-warning"
                                style={{ fontSize: '8px' }}
                              ></i>
                              <span className="time-text">{day.panchangData.sunrise}</span>
                            </span>
                            <span className="time-item">
                              <i
                                className="fas fa-moon text-secondary"
                                style={{ fontSize: '8px' }}
                              ></i>
                              <span className="time-text">{day.panchangData.sunset}</span>
                            </span>
                          </div>
                        </div>

                        {/* Panchangam Details */}
                        <div className="panchang-details">
                          {day.panchangData.tithi && (
                            <div className="detail-row">
                              <i
                                className="fas fa-calendar-alt text-primary"
                                style={{ fontSize: '8px' }}
                              ></i>
                              <span className="detail-text">
                                {(t.panchangam as any)[day.panchangData.tithi] ||
                                  day.panchangData.tithi}
                              </span>
                            </div>
                          )}
                          {day.panchangData.nakshatra && (
                            <div className="detail-row">
                              <i className="fas fa-star text-info" style={{ fontSize: '8px' }}></i>
                              <span className="detail-text">
                                {(t.panchangam as any)[day.panchangData.nakshatra] ||
                                  day.panchangData.nakshatra}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </Col>

      {/* Day Details Panel - Right Side */}
      <Col xl={4} lg={4} md={12}>
        {/* Location Accordion */}
        <div className="mb-3 rounded bg-white p-3 shadow">
          <LocationAccordion city={city} country={country} />
        </div>

        {/* Day Details */}
        <div className="day-details rounded bg-white p-3 shadow">
          <h4 className="border-bottom mb-3 pb-2">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h4>

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
        .calendar-day {
          transition: all 0.3s ease;
          padding: 8px;
          border: 1px solid #e9ecef !important;
          position: relative;
        }

        .calendar-day:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .calendar-day.current-month {
          background-color: #ffffff;
          color: #333;
          border-color: #dee2e6 !important;
        }

        .calendar-day.prev-month,
        .calendar-day.next-month {
          background-color: #f8f9fa;
          color: #6c757d;
          opacity: 0.6;
        }

        .calendar-day.today {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border: 2px solid #f39c12 !important;
          box-shadow: 0 0 10px rgba(243, 156, 18, 0.3);
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, #4dabf7 0%, #339af0 100%);
          color: white;
          border: 2px solid #228be6 !important;
          box-shadow: 0 4px 12px rgba(52, 144, 220, 0.4);
        }

        .calendar-day.selected .text-muted {
          color: #e3f2fd !important;
        }

        .date-number {
          font-size: 20px;
          font-weight: 700;
          color: #495057;
          text-align: center;
          margin-bottom: 4px;
        }

        .calendar-day.today .date-number {
          color: #e67e22;
        }

        .calendar-day.selected .date-number {
          color: white;
        }

        .panchang-info {
          font-size: 10px;
          line-height: 1.2;
        }

        .time-item {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .time-text {
          font-size: 9px;
          font-weight: 500;
          color: #495057;
        }

        .calendar-day.selected .time-text {
          color: #e3f2fd;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-bottom: 2px;
          padding: 1px 0;
        }

        .detail-text {
          font-size: 8px;
          font-weight: 500;
          color: #495057;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .calendar-day.selected .detail-text {
          color: #e3f2fd;
        }

        .calendar-grid {
          border-radius: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .weekday-header {
          background: linear-gradient(135deg, #495057 0%, #343a40 100%);
          color: white;
          border: 1px solid #dee2e6;
          font-weight: 600;
          padding: 12px 8px;
          text-align: center;
        }

        .day-details {
          border-radius: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .calendar-nav {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .calendar-title {
          color: #495057;
          font-size: 1.5rem;
        }

        .nav-btn {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
        }

        .today-btn {
          border-radius: 8px;
          font-weight: 600;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border: none;
          transition: all 0.3s ease;
        }

        .today-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
        }
      `}</style>
    </Row>
  );
}
