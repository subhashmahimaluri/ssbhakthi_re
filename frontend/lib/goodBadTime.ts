import { addMinutes, differenceInMinutes, format, parse, subMinutes } from 'date-fns';

// Define types
type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
type Nakshatra = 'makha' | string;

interface GoodBadTimes {
  rahu: string;
  gulika: string;
  yamaganda: string;
}

// Helper function to format time slots
const fetchTime = (startTime: Date, endTime: Date): string => {
  const start = format(startTime, 'hh:mm a');
  const end = format(endTime, 'hh:mm a');
  return `${start} - ${end}`;
};

// Generate time slots based on start time, end time, and number of slots
const generateTimeSlots = (startTime: string, endTime: string, slots: number): Date[] => {
  const start = parse(startTime, 'hh:mm a', new Date());
  const end = parse(endTime, 'hh:mm a', new Date());

  const totalMinutes = differenceInMinutes(end, start);
  const interval = totalMinutes / slots;

  const timeSlots: Date[] = [];
  for (let i = 0; i <= slots; i++) {
    timeSlots.push(addMinutes(start, interval * i));
  }

  return timeSlots;
};

export const pradoshaTime = (sunset: string, nextSunrise: string): string => {
  const timeSlots = generateTimeSlots(sunset, nextSunrise, 5);
  return fetchTime(timeSlots[0], timeSlots[1]);
};

export const getRahuKalam = (sunrise: string, sunset: string, weekDay: WeekDay): GoodBadTimes => {
  const timeSlots = generateTimeSlots(sunrise, sunset, 8);

  let startR: number;
  let endR: number;
  let startG: number;
  let endG: number;
  let starty: number;
  let endY: number;

  switch (weekDay) {
    case 'Monday':
      startR = 1;
      endR = 2;
      startG = 5;
      endG = 6;
      starty = 3;
      endY = 4;
      break;
    case 'Saturday':
      startR = 2;
      endR = 3;
      startG = 0;
      endG = 1;
      starty = 5;
      endY = 6;
      break;
    case 'Friday':
      startR = 3;
      endR = 4;
      startG = 1;
      endG = 2;
      starty = 6;
      endY = 7;
      break;
    case 'Wednesday':
      startR = 4;
      endR = 5;
      startG = 3;
      endG = 4;
      starty = 1;
      endY = 2;
      break;
    case 'Thursday':
      startR = 5;
      endR = 6;
      startG = 2;
      endG = 3;
      starty = 0;
      endY = 1;
      break;
    case 'Tuesday':
      startR = 6;
      endR = 7;
      startG = 4;
      endG = 5;
      starty = 2;
      endY = 3;
      break;
    case 'Sunday':
      startR = 7;
      endR = 8;
      startG = 6;
      endG = 7;
      starty = 4;
      endY = 5;
      break;
    default:
      startR = 1;
      endR = 2;
      startG = 5;
      endG = 6;
      starty = 3;
      endY = 4;
  }

  const rahuKalam = fetchTime(timeSlots[startR], timeSlots[endR]);
  const gulika = fetchTime(timeSlots[startG], timeSlots[endG]);
  const yamaganda = fetchTime(timeSlots[starty], timeSlots[endY]);

  return { rahu: rahuKalam, gulika: gulika, yamaganda: yamaganda };
};

export const abhijitMuhurth = (sunrise: string, sunset: string): string => {
  const timeSlots = generateTimeSlots(sunrise, sunset, 15);
  return fetchTime(timeSlots[7], timeSlots[8]);
};

export const brahmaMuhurtham = (sunrise: string): string => {
  const sunriseTime = parse(sunrise, 'hh:mm a', new Date());
  const from = subMinutes(sunriseTime, 96);
  const to = addMinutes(from, 48);
  return fetchTime(from, to);
};

export const durMuhurtham = (sunrise: string, sunset: string, week: WeekDay): string => {
  const timeSlots = generateTimeSlots(sunrise, sunset, 15);

  let dur_muhurth: string;

  switch (week) {
    case 'Monday':
      dur_muhurth = fetchTime(timeSlots[8], timeSlots[9]);
      dur_muhurth += ', ' + fetchTime(timeSlots[11], timeSlots[12]);
      break;
    case 'Saturday':
      dur_muhurth = fetchTime(timeSlots[2], timeSlots[3]);
      break;
    case 'Friday':
      dur_muhurth = fetchTime(timeSlots[3], timeSlots[4]);
      dur_muhurth += ', ' + fetchTime(timeSlots[8], timeSlots[9]);
      break;
    case 'Wednesday':
      dur_muhurth = fetchTime(timeSlots[7], timeSlots[8]);
      break;
    case 'Thursday':
      dur_muhurth = fetchTime(timeSlots[5], timeSlots[6]);
      dur_muhurth += ', ' + fetchTime(timeSlots[11], timeSlots[12]);
      break;
    case 'Tuesday':
      dur_muhurth = fetchTime(timeSlots[3], timeSlots[4]);
      dur_muhurth += ', ' + fetchTime(timeSlots[6], timeSlots[7]);
      break;
    case 'Sunday':
      dur_muhurth = fetchTime(timeSlots[13], timeSlots[14]);
      break;
    default:
      dur_muhurth = fetchTime(timeSlots[5], timeSlots[6]);
  }

  return dur_muhurth;
};

export const varjyam = (sunrise: string, sunset: string, nk: Nakshatra): string => {
  const timeSlots = generateTimeSlots(sunrise, sunset, 30);

  let varjyam_rime: string;

  switch (nk) {
    case 'makha':
      varjyam_rime = fetchTime(timeSlots[8], timeSlots[9]);
      break;
    default:
      varjyam_rime = fetchTime(timeSlots[5], timeSlots[6]);
  }

  return varjyam_rime;
};
