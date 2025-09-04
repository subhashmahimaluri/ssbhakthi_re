'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateFestivalDates } from '@/lib/festivalData';
import { calculateVrathDates } from '@/lib/vrathData';
import { addDays, format, isWithinInterval } from 'date-fns';
import React, { useMemo } from 'react';

interface UpcomingEvent {
  date: Date;
  name: string;
  nameTelugu: string;
  type: 'festival' | 'vrath';
}

const UpcomingEvents: React.FC = () => {
  const { locale } = useTranslation();

  // Calculate upcoming events (next 30 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const endDate = addDays(today, 30);
    const currentYear = today.getFullYear();

    // Calculate festivals and vraths for current year
    const festivals = calculateFestivalDates(currentYear);
    const vraths = calculateVrathDates(currentYear);

    const events: UpcomingEvent[] = [];

    // Add festivals within date range
    festivals.forEach(festival => {
      if (isWithinInterval(festival.gregorianDate, { start: today, end: endDate })) {
        events.push({
          date: festival.gregorianDate,
          name: festival.nameEnglish,
          nameTelugu: festival.nameTelugu,
          type: 'festival',
        });
      }
    });

    // Add vraths within date range
    vraths.forEach(vrath => {
      vrath.upcomingOccurrences.forEach(occurrence => {
        if (isWithinInterval(occurrence, { start: today, end: endDate })) {
          events.push({
            date: occurrence,
            name: vrath.nameEnglish,
            nameTelugu: vrath.nameTelugu,
            type: 'vrath',
          });
        }
      });
    });

    // Sort by date
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, []);

  // Get day name in Telugu
  const getDayNameInTelugu = (date: Date): string => {
    const daysInTelugu = ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'];
    return daysInTelugu[date.getDay()];
  };

  // Get month name in Telugu
  const getMonthNameInTelugu = (date: Date): string => {
    const monthsInTelugu = [
      'జనవరి',
      'ఫిబ్రవరి',
      'మార్చి',
      'ఏప్రిల్',
      'మే',
      'జూన్',
      'జూలై',
      'ఆగస్టు',
      'సెప్టెంబర్',
      'అక్టోబర్',
      'నవంబర్',
      'డిసెంబర్',
    ];
    return monthsInTelugu[date.getMonth()];
  };

  return (
    <div className="px-4 py-3">
      <h3 className="mb-3">
        {locale === 'te' ? 'రాబోయే పండుగలు & వ్రతాలు' : 'Upcoming Festivals & Vraths'}
      </h3>
      {upcomingEvents.length === 0 ? (
        <p className="text-muted">
          {locale === 'te'
            ? 'తదుపరి 30 రోజుల్లో పండుగలు లేదా వ్రతాలు లేవు'
            : 'No festivals or vraths in the next 30 days'}
        </p>
      ) : (
        <ul className="list-unstyled">
          {upcomingEvents.map((event, index) => (
            <li key={index} className="border-bottom mb-2 pb-2">
              {locale === 'te' ? (
                <>
                  <span className="fw-bold text-primary">
                    {getMonthNameInTelugu(event.date)} {format(event.date, 'dd')},{' '}
                    {getDayNameInTelugu(event.date)}
                  </span>
                  <span className="mx-2">-</span>
                  <span>
                    {event.nameTelugu}
                    {event.type === 'vrath' && (
                      <span className="text-muted small ms-1">(వ్రతం)</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <span className="fw-bold text-primary">
                    {format(event.date, 'MMM dd')}, {format(event.date, 'EEEE')}
                  </span>
                  <span className="mx-2">-</span>
                  <span>
                    {event.name}
                    {event.type === 'vrath' && ' (Vrath)'}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingEvents;
