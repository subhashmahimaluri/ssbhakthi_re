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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Row, Spinner } from 'react-bootstrap';
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
  fullPanchangData: any;
  sunTime: any;
  moonTime: any;
}

interface MonthlyCalendarProps {
  initialDate?: Date;
}

export default function MonthlyCalendar({ initialDate }: MonthlyCalendarProps) {
  const { t } = useTranslation();
  const { lat, lng, city, country } = useLocation();

  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [dayDetails, setDayDetails] = useState<DayDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Memoized panchang instance
  const panchang = useMemo(() => new YexaaPanchang(), []);

  // Calculate basic panchangam data for a single day
  const calculateDayPanchang = useCallback(
    (date: Date, lat: number, lng: number) => {
      try {
        const calculated = panchang.calculate(date);
        const sun = panchang.sunTimer(date, lat, lng);

        return {
          sunrise: formatTimeIST(sun.sunRise),
          sunset: formatTimeIST(sun.sunSet),
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
    },
    [panchang]
  );

  // Get month boundaries and calendar grid dates
  const getMonthDays = useCallback(
    (month: Date, lat: number, lng: number): CalendarDay[] => {
      const firstDay = startOfMonth(month);
      const lastDay = endOfMonth(month);
      const startDay = addDays(firstDay, -firstDay.getDay()); // Start from Sunday
      const endDay = addDays(startDay, 41); // 6 weeks * 7 days - 1

      const days: CalendarDay[] = [];
      const today = new Date();

      for (let date = new Date(startDay); date <= endDay; date = addDays(date, 1)) {
        const isCurrentMonth = isSameMonth(date, month);
        const isPrevMonth = date < firstDay;
        const isNextMonth = date > lastDay;
        const isToday = isSameDay(date, today);

        // Calculate basic panchangam data for each day
        const panchangData = calculateDayPanchang(new Date(date), lat, lng);

        days.push({
          date: new Date(date),
          isCurrentMonth,
          isPrevMonth,
          isNextMonth,
          isToday,
          panchangData,
        });
      }

      return days;
    },
    [calculateDayPanchang]
  );

  // Calculate detailed panchangam data for selected day
  const calculateDayDetails = useCallback(
    async (date: Date, lat: number, lng: number): Promise<DayDetails | null> => {
      try {
        const calendar = panchang.calendar(date, lat, lng);
        const calculated = panchang.calculate(date);
        const sun = panchang.sunTimer(date, lat, lng);
        const moonCoords = ITRFCoord.fromGeodeticDeg(lat, lng, 0);
        const moon = moonRiseSet(date, moonCoords);

        return {
          date,
          fullPanchangData: {
            ...calculated,
            calendar,
          },
          sunTime: sun,
          moonTime: moon,
        };
      } catch (error) {
        console.error('Error calculating detailed panchang for', date, error);
        return null;
      }
    },
    [panchang]
  );

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Load calendar data when month or location changes
  useEffect(() => {
    let isCancelled = false;

    const loadCalendarData = async () => {
      setLoading(true);
      try {
        const monthDays = await getMonthDays(currentDate, lat, lng);
        if (!isCancelled) {
          setCalendarDays(monthDays);
        }
      } catch (error) {
        console.error('Error loading calendar data:', error);
        if (!isCancelled) {
          setCalendarDays([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadCalendarData();

    return () => {
      isCancelled = true;
    };
  }, [currentDate, lat, lng, getMonthDays]);

  // Load day details when selected date changes
  useEffect(() => {
    setDetailsLoading(true);
    calculateDayDetails(selectedDate, lat, lng)
      .then(details => {
        setDayDetails(details);
      })
      .catch(error => {
        console.error('Error loading day details:', error);
        setDayDetails(null);
      })
      .finally(() => {
        setDetailsLoading(false);
      });
  }, [selectedDate, lat, lng, calculateDayDetails]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthYear = format(currentDate, 'MMMM yyyy');

  return (
    <Row className="monthly-calendar">
      {/* Calendar Grid - Left Side */}
      <Col xl="8" lg="8" md="12" className="calendar-grid-container">
        <div className="calendar-grid shadow-1 bg-white p-4">
          {/* Navigation Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">{monthYear}</h2>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={goToPreviousMonth}>
                <i className="fa fa-chevron-left"></i>
              </Button>
              <Button variant="primary" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline-primary" size="sm" onClick={goToNextMonth}>
                <i className="fa fa-chevron-right"></i>
              </Button>
            </div>
          </div>

          {/* Calendar Header - Weekdays */}
          <div className="calendar-header d-flex mb-2">
            {weekdays.map(day => (
              <div key={day} className="weekday-header fw-bold flex-fill p-2 text-center">
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
              {/* Render calendar in weeks */}
              {Array.from({ length: 6 }, (_, weekIndex) => (
                <div key={weekIndex} className="calendar-week d-flex">
                  {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`calendar-day flex-fill border p-2 ${
                        day.isCurrentMonth
                          ? 'current-month'
                          : day.isPrevMonth
                            ? 'prev-month'
                            : 'next-month'
                      } ${day.isToday ? 'today' : ''} ${
                        isSameDay(day.date, selectedDate) ? 'selected' : ''
                      }`}
                      onClick={() => handleDateClick(day.date)}
                      style={{ cursor: 'pointer', minHeight: '120px' }}
                    >
                      {/* Date Number */}
                      <div className="date-number fw-bold mb-1">{format(day.date, 'd')}</div>

                      {/* Panchangam Info */}
                      <div className="panchang-info small">
                        <div className="text-muted" style={{ fontSize: '10px' }}>
                          ↑{day.panchangData.sunrise} ↓{day.panchangData.sunset}
                        </div>
                        {day.panchangData.tithi && (
                          <div className="text-truncate" style={{ fontSize: '10px' }}>
                            <strong>T:</strong>{' '}
                            {(t.panchangam as any)[day.panchangData.tithi] ||
                              day.panchangData.tithi}
                          </div>
                        )}
                        {day.panchangData.nakshatra && (
                          <div className="text-truncate" style={{ fontSize: '10px' }}>
                            <strong>N:</strong>{' '}
                            {(t.panchangam as any)[day.panchangData.nakshatra] ||
                              day.panchangData.nakshatra}
                          </div>
                        )}
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
      <Col xl="4" lg="4" md="12" className="day-details-container">
        {/* Location Accordion */}
        <div className="shadow-1 mb-3 bg-white p-3">
          <LocationAccordion city={city} country={country} />
        </div>

        {/* Day Details */}
        <div className="day-details shadow-1 bg-white p-3">
          <h4 className="mb-3">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h4>

          {detailsLoading ? (
            <div className="py-4 text-center">
              <Spinner animation="border" size="sm" />
              <p className="mt-2">Loading details...</p>
            </div>
          ) : dayDetails ? (
            <div className="panchang-details">
              {/* Basic Info */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2">Basic Information</h6>
                <div className="row small">
                  <div className="col-6">
                    <strong>Tithi:</strong>
                    <br />
                    {(t.panchangam as any)[dayDetails.fullPanchangData.Tithi?.name_en_IN] ||
                      dayDetails.fullPanchangData.Tithi?.name_en_IN ||
                      'N/A'}
                  </div>
                  <div className="col-6">
                    <strong>Nakshatra:</strong>
                    <br />
                    {(t.panchangam as any)[dayDetails.fullPanchangData.Nakshatra?.name_en_IN] ||
                      dayDetails.fullPanchangData.Nakshatra?.name_en_IN ||
                      'N/A'}
                  </div>
                </div>
              </div>

              {/* Sun & Moon Times */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2">Sun & Moon Times</h6>
                <div className="row small">
                  <div className="col-6">
                    <div>
                      <strong>Sunrise:</strong> {formatTimeIST(dayDetails.sunTime.sunRise)}
                    </div>
                    <div>
                      <strong>Sunset:</strong> {formatTimeIST(dayDetails.sunTime.sunSet)}
                    </div>
                  </div>
                  <div className="col-6">
                    <div>
                      <strong>Moonrise:</strong> {formatTimeIST(dayDetails.moonTime.rise)}
                    </div>
                    <div>
                      <strong>Moonset:</strong> {formatTimeIST(dayDetails.moonTime.set)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="mb-3">
                <h6 className="fw-bold mb-2">Additional Details</h6>
                <div className="small">
                  <div>
                    <strong>Yoga:</strong>{' '}
                    {(t.panchangam as any)[dayDetails.fullPanchangData.Yoga?.name_en_IN] ||
                      dayDetails.fullPanchangData.Yoga?.name_en_IN ||
                      'N/A'}
                  </div>
                  <div>
                    <strong>Karana:</strong>{' '}
                    {(t.panchangam as any)[dayDetails.fullPanchangData.Karna?.name_en_IN] ||
                      dayDetails.fullPanchangData.Karna?.name_en_IN ||
                      'N/A'}
                  </div>
                  <div>
                    <strong>Paksha:</strong>{' '}
                    {(t.panchangam as any)[dayDetails.fullPanchangData.Paksha?.name_en_IN] ||
                      dayDetails.fullPanchangData.Paksha?.name_en_IN ||
                      'N/A'}
                  </div>
                  {dayDetails.fullPanchangData.calendar?.TeluguYear && (
                    <div>
                      <strong>Telugu Year:</strong>{' '}
                      {(t.panchangam as any)[
                        dayDetails.fullPanchangData.calendar.TeluguYear.name_en_IN
                      ] || dayDetails.fullPanchangData.calendar.TeluguYear.name_en_IN}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted py-4 text-center">
              <p>Unable to load panchangam details</p>
            </div>
          )}
        </div>
      </Col>

      <style jsx>{`
        .calendar-day {
          transition: all 0.2s ease;
        }

        .calendar-day:hover {
          background-color: #f8f9fa;
        }

        .calendar-day.current-month {
          background-color: white;
          color: #333;
        }

        .calendar-day.prev-month,
        .calendar-day.next-month {
          background-color: #f8f9fa;
          color: #6c757d;
        }

        .calendar-day.today {
          background-color: #e3f2fd;
          border: 2px solid #2196f3;
        }

        .calendar-day.selected {
          background-color: #1976d2;
          color: white;
        }

        .calendar-day.selected .text-muted {
          color: #bbdefb !important;
        }

        .weekday-header {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
        }

        .date-number {
          font-size: 18px;
        }

        .panchang-info div {
          line-height: 1.2;
          margin-bottom: 1px;
        }
      `}</style>
    </Row>
  );
}
