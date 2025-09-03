import { addDays, format } from 'date-fns';

export interface VrathData {
  id: string;
  nameEnglish: string;
  nameTelugu: string;
  category: VrathCategory;
  frequency: VrathFrequency;
  descriptionEnglish: string;
  descriptionTelugu: string;
  significance: string;
  // Lunar calendar specifications
  month?: string; // Masa name (for specific month observances)
  tithi?: string; // Tithi name
  tithiNumber?: number; // Tithi number (1-30)
  paksha?: 'Shukla' | 'Krishna'; // Paksha
  // For weekly observances
  weekday?: number; // 0=Sunday, 1=Monday, etc.
  specialMonths?: string[]; // Specific months when weekly observance applies
  // For special cases
  isVariableDate: boolean;
  calculationType: 'tithi' | 'weekday' | 'special' | 'fixed';
  observanceTime: 'Sunrise' | 'Noon' | 'Midnight' | 'Sunset' | 'Night' | 'All Day';
}

export type VrathCategory =
  | 'Monthly Observances'
  | 'Weekly Observances'
  | 'Special Observances'
  | 'Navratri Festivals'
  | 'Ekadashi'
  | 'Pradosham';

export type VrathFrequency =
  | 'Monthly'
  | 'Bi-monthly'
  | 'Weekly'
  | 'Annual'
  | 'Seasonal'
  | '9 Days'
  | '6 Days'
  | '16 Days';

export interface CalculatedVrath extends VrathData {
  nextOccurrence: Date;
  nextOccurrenceFormatted: string;
  lunarDate: string;
  daysUntilNext: number;
  upcomingOccurrences: Date[]; // Next 3-6 occurrences
}

// Comprehensive Vrath & Upavas data
export const VRATH_DATA: VrathData[] = [
  // Monthly Observances
  {
    id: 'sankashti-chaturthi',
    nameEnglish: 'Sankashti Chaturthi',
    nameTelugu: 'సంకష్టి చతుర్థి',
    category: 'Monthly Observances',
    frequency: 'Monthly',
    month: '', // All months
    tithi: 'Chaturthi',
    tithiNumber: 4,
    paksha: 'Krishna',
    descriptionEnglish:
      'Monthly Krishna Paksha Chaturthi dedicated to Lord Ganesha for removing obstacles.',
    descriptionTelugu: 'గణేశుని ఆరాధన కోసం మాసిక కృష్ణ పక్ష చతుర్థి వ్రతం',
    significance: 'Removal of obstacles, prosperity, and success',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'Night',
  },
  {
    id: 'vinayaka-chaturthi-monthly',
    nameEnglish: 'Vinayaka Chaturthi (Monthly)',
    nameTelugu: 'వినాయక చతుర్థి (మాసిక)',
    category: 'Monthly Observances',
    frequency: 'Monthly',
    month: '', // All months
    tithi: 'Chaturthi',
    tithiNumber: 4,
    paksha: 'Shukla',
    descriptionEnglish: 'Monthly Shukla Paksha Chaturthi for Lord Ganesha worship.',
    descriptionTelugu: 'గణేశుని పూజ కోసం మాసిక శుక్ల పక్ష చతుర్థి వ్రతం',
    significance: 'New beginnings, wisdom, and obstacle removal',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'Sunrise',
  },
  {
    id: 'masik-shivaratri',
    nameEnglish: 'Masik Shivaratri',
    nameTelugu: 'మాసిక శివరాత్రి',
    category: 'Monthly Observances',
    frequency: 'Monthly',
    month: '', // All months
    tithi: 'Chaturdashi',
    tithiNumber: 14,
    paksha: 'Krishna',
    descriptionEnglish: 'Monthly Krishna Paksha Chaturdashi dedicated to Lord Shiva.',
    descriptionTelugu: 'శివుని ఆరాధన కోసం మాసిక కృష్ణ పక్ష చతుర్దశి వ్రతం',
    significance: 'Spiritual purification, devotion to Lord Shiva',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'Night',
  },
  {
    id: 'purnima-vrat',
    nameEnglish: 'Purnima Vrat',
    nameTelugu: 'పూర్ణిమ వ్రతం',
    category: 'Monthly Observances',
    frequency: 'Monthly',
    month: '', // All months
    tithi: 'Purnima',
    tithiNumber: 15,
    paksha: 'Shukla',
    descriptionEnglish: 'Monthly full moon fasting and worship for spiritual cleansing.',
    descriptionTelugu: 'ఆధ్యాత్మిక శుద్ధీకరణ కోసం మాసిక పూర్ణిమ వ్రతం',
    significance: 'Spiritual elevation, mental peace, divine blessings',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'All Day',
  },
  {
    id: 'amavasya-vrat',
    nameEnglish: 'Amavasya Vrat',
    nameTelugu: 'అమావాస్య వ్రతం',
    category: 'Monthly Observances',
    frequency: 'Monthly',
    month: '', // All months
    tithi: 'Amavasya',
    tithiNumber: 30,
    paksha: 'Krishna',
    descriptionEnglish: 'Monthly new moon observance for ancestor worship and spiritual practices.',
    descriptionTelugu: 'పిత్రు పూజ మరియు ఆధ్యాత్మిక సాధన కోసం మాసిక అమావాస్య వ్రతం',
    significance: 'Ancestor worship, spiritual introspection, inner peace',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'All Day',
  },

  // Ekadashi - Bi-monthly observances
  {
    id: 'ekadashi-shukla',
    nameEnglish: 'Shukla Ekadashi',
    nameTelugu: 'శుక్ల ఏకాదశి',
    category: 'Ekadashi',
    frequency: 'Bi-monthly',
    month: '', // All months
    tithi: 'Ekadashi',
    tithiNumber: 11,
    paksha: 'Shukla',
    descriptionEnglish: 'Bi-monthly Shukla Paksha Ekadashi fasting dedicated to Lord Vishnu.',
    descriptionTelugu: 'విష్ణువు ఆరాధన కోసం మాసిక శుక్ల పక్ష ఏకాదశి వ్రతం',
    significance: 'Spiritual purification, devotion to Lord Vishnu, moksha',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'All Day',
  },
  {
    id: 'ekadashi-krishna',
    nameEnglish: 'Krishna Ekadashi',
    nameTelugu: 'కృష్ణ ఏకాదశి',
    category: 'Ekadashi',
    frequency: 'Bi-monthly',
    month: '', // All months
    tithi: 'Ekadashi',
    tithiNumber: 11,
    paksha: 'Krishna',
    descriptionEnglish: 'Bi-monthly Krishna Paksha Ekadashi fasting dedicated to Lord Vishnu.',
    descriptionTelugu: 'విష్ణువు ఆరాధన కోసం మాసిక కృష్ణ పక్ష ఏకాదశి వ్రతం',
    significance: 'Spiritual purification, devotion to Lord Vishnu, liberation',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'All Day',
  },

  // Pradosham - Bi-monthly observances
  {
    id: 'pradosham-shukla',
    nameEnglish: 'Shukla Pradosham',
    nameTelugu: 'శుక్ల ప్రదోషం',
    category: 'Pradosham',
    frequency: 'Bi-monthly',
    month: '', // All months
    tithi: 'Trayodashi',
    tithiNumber: 13,
    paksha: 'Shukla',
    descriptionEnglish: 'Bi-monthly Shukla Paksha Trayodashi evening worship of Lord Shiva.',
    descriptionTelugu: 'శివుని సాయంత్ర పూజ కోసం మాసిక శుక్ల పక్ష త్రయోదశి ప్రదోషం',
    significance: 'Lord Shiva worship, removal of sins, spiritual blessings',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'Sunset',
  },
  {
    id: 'pradosham-krishna',
    nameEnglish: 'Krishna Pradosham',
    nameTelugu: 'కృష్ణ ప్రదోషం',
    category: 'Pradosham',
    frequency: 'Bi-monthly',
    month: '', // All months
    tithi: 'Trayodashi',
    tithiNumber: 13,
    paksha: 'Krishna',
    descriptionEnglish: 'Bi-monthly Krishna Paksha Trayodashi evening worship of Lord Shiva.',
    descriptionTelugu: 'శివుని సాయంత్ర పూజ కోసం మాసిక కృష్ణ పక్ష త్రయోదశి ప్రదోషం',
    significance: 'Lord Shiva worship, removal of obstacles, divine grace',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'Sunset',
  },

  // Weekly Observances
  {
    id: 'sawan-somwar',
    nameEnglish: 'Sawan Somwar',
    nameTelugu: 'శ్రావణ సోమవారం',
    category: 'Weekly Observances',
    frequency: 'Weekly',
    weekday: 1, // Monday
    specialMonths: ['Sravana'],
    descriptionEnglish: 'Mondays in Sawan month dedicated to Lord Shiva worship.',
    descriptionTelugu: 'శ్రావణ మాసంలో శివుని ఆరాధన కోసం సోమవార వ్రతం',
    significance: 'Lord Shiva worship, marital bliss, spiritual growth',
    isVariableDate: true,
    calculationType: 'weekday',
    observanceTime: 'All Day',
  },
  {
    id: 'mangala-gauri',
    nameEnglish: 'Mangala Gauri',
    nameTelugu: 'మంగళ గౌరి',
    category: 'Weekly Observances',
    frequency: 'Weekly',
    weekday: 2, // Tuesday
    specialMonths: ['Sravana'],
    descriptionEnglish: 'Tuesdays in Sawan month for married women to worship Goddess Parvati.',
    descriptionTelugu: 'వివాహిత స్త్రీలు పార్వతి దేవిని ఆరాధించే శ్రావణ మంగళవార వ్రతం',
    significance: 'Marital harmony, family welfare, goddess blessings',
    isVariableDate: true,
    calculationType: 'weekday',
    observanceTime: 'All Day',
  },

  // Special Observances
  {
    id: 'satyanarayana-vrat',
    nameEnglish: 'Satyanarayana Vrat',
    nameTelugu: 'సత్యనారాయణ వ్రతం',
    category: 'Special Observances',
    frequency: 'Monthly',
    descriptionEnglish: 'Lord Satyanarayana worship that can be observed monthly or as desired.',
    descriptionTelugu: 'మాసిక లేదా కోరిక మేరకు చేసే సత్యనారాయణ వ్రతం',
    significance: 'Truth, prosperity, fulfillment of desires',
    isVariableDate: false,
    calculationType: 'special',
    observanceTime: 'All Day',
  },
  {
    id: 'skanda-sashti',
    nameEnglish: 'Skanda Sashti',
    nameTelugu: 'స్కంద షష్టి',
    category: 'Special Observances',
    frequency: '6 Days',
    month: 'Karthika',
    tithi: 'Sashti',
    tithiNumber: 6,
    paksha: 'Shukla',
    descriptionEnglish: '6-day observance in Karthika month dedicated to Lord Murugan.',
    descriptionTelugu: 'కార్తిక మాసంలో మురుగుని ఆరాధన కోసం 6 రోజుల వ్రతం',
    significance: 'Victory over evil, courage, spiritual strength',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'All Day',
  },

  // Navratri Festivals
  {
    id: 'shardiya-navratri',
    nameEnglish: 'Shardiya Navratri',
    nameTelugu: 'శరద్ నవరాత్రి',
    category: 'Navratri Festivals',
    frequency: '9 Days',
    month: 'Aswija',
    tithi: 'Pratipada',
    tithiNumber: 1,
    paksha: 'Shukla',
    descriptionEnglish: '9 days of Goddess Durga worship in Ashwin month.',
    descriptionTelugu: 'ఆశ్వీజ మాసంలో దుర్గమ్మ ఆరాధన కోసం 9 రోజుల నవరాత్రి',
    significance: 'Divine feminine power, victory of good over evil',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'All Day',
  },
  {
    id: 'chaitra-navratri',
    nameEnglish: 'Chaitra Navratri',
    nameTelugu: 'చైత్ర నవరాత్రి',
    category: 'Navratri Festivals',
    frequency: '9 Days',
    month: 'Chaitra',
    tithi: 'Pratipada',
    tithiNumber: 1,
    paksha: 'Shukla',
    descriptionEnglish: '9 days of Goddess worship in Chaitra month.',
    descriptionTelugu: 'చైత్ర మాసంలో దేవీ ఆరాధన కోసం 9 రోజుల నవరాత్రి',
    significance: 'New beginnings, divine blessings, spiritual awakening',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'All Day',
  },

  // Additional Monthly Observances
  {
    id: 'chandra-darshan',
    nameEnglish: 'Chandra Darshan',
    nameTelugu: 'చంద్ర దర్శనం',
    category: 'Monthly Observances',
    frequency: 'Monthly',
    descriptionEnglish: 'Monthly moon sighting after Amavasya for new beginnings.',
    descriptionTelugu: 'అమావాస్య తర్వాత నూతన ఆరంభాలకు మాసిక చంద్ర దర్శనం',
    significance: 'New beginnings, mental peace, lunar blessings',
    isVariableDate: true,
    calculationType: 'special',
    observanceTime: 'Night',
  },
  {
    id: 'kalashtami',
    nameEnglish: 'Kalashtami',
    nameTelugu: 'కాలాష్టమి',
    category: 'Monthly Observances',
    frequency: 'Monthly',
    month: '', // All months
    tithi: 'Ashtami',
    tithiNumber: 8,
    paksha: 'Krishna',
    descriptionEnglish: 'Monthly Krishna Paksha Ashtami for Lord Bhairava worship.',
    descriptionTelugu: 'భైరవుని ఆరాధన కోసం మాసిక కృష్ణ పక్ష అష్టమి',
    significance: 'Protection from negativity, courage, spiritual strength',
    isVariableDate: true,
    calculationType: 'tithi',
    observanceTime: 'Night',
  },
];

// Helper functions for masa name conversions (similar to festival data)
const getMasaNameForApi = (masaDisplayName: string): string | null => {
  const masaMapping: { [key: string]: string } = {
    Chaitra: 'chaitra',
    Vaishakha: 'vaisakha',
    Jyeshtha: 'jyaistha',
    Ashadha: 'asadha',
    Sravana: 'sravana',
    Bhadrapada: 'badhrapada',
    Aswija: 'aswija',
    Karthika: 'karthika',
    Margashira: 'margasira',
    Pushya: 'pushya',
    Magha: 'magha',
    Phalguna: 'phalguna',
  };

  return masaMapping[masaDisplayName] || null;
};

const getPakshaNameForApi = (paksha: string): string | null => {
  const pakshaMapping: { [key: string]: string } = {
    Shukla: 'shukla_paksha',
    Krishna: 'krishna_paksha',
  };

  return pakshaMapping[paksha] || null;
};

const getTithiNameForApi = (tithiDisplayName: string): string | null => {
  const tithiMapping: { [key: string]: string } = {
    Pratipada: 'padyami',
    Dvitiya: 'vidiya',
    Tritiya: 'tadiya',
    Chaturthi: 'chavithi',
    Panchami: 'panchami',
    Sashti: 'sasthti',
    Saptami: 'sapthami',
    Ashtami: 'astami',
    Navami: 'navami',
    Dashami: 'dasami',
    Ekadashi: 'ekadasi',
    Dvadashi: 'dvadasi',
    Trayodashi: 'trayodasi',
    Chaturdashi: 'chaturdasi',
    Purnima: 'pournami',
    Amavasya: 'amavasya',
  };

  return tithiMapping[tithiDisplayName] || null;
};

// Calculate next occurrence for special cases
const getNextSpecialOccurrence = (vrath: VrathData, currentDate: Date): Date => {
  switch (vrath.id) {
    case 'satyanarayana-vrat':
      // Can be any auspicious day, default to next Purnima
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15); // Approximate Purnima

    case 'chandra-darshan':
      // Day after Amavasya when moon is first visible
      const nextMonthForChandra = new Date(currentDate);
      nextMonthForChandra.setMonth(nextMonthForChandra.getMonth() + 1);
      return new Date(nextMonthForChandra.getFullYear(), nextMonthForChandra.getMonth(), 2); // Day after Amavasya

    default:
      return addDays(currentDate, 30); // Default fallback
  }
};

// Calculate vrath dates for a given year (optimized lightweight version)
export const calculateVrathDates = (
  year: number,
  lat: number = 17.385,
  lng: number = 78.4867
): CalculatedVrath[] => {
  const calculatedVraths: CalculatedVrath[] = [];
  const currentDate = new Date();

  for (const vrath of VRATH_DATA) {
    try {
      let nextOccurrence: Date;
      let upcomingOccurrences: Date[] = [];
      let lunarDate = '';

      if (vrath.calculationType === 'tithi') {
        if (vrath.month && vrath.tithi && vrath.paksha) {
          // For specific month and tithi, use improved estimation
          nextOccurrence = getImprovedVrathDate(vrath, year, currentDate);
          lunarDate = `${vrath.month} ${vrath.paksha} ${vrath.tithi}`;

          // For multi-day events
          if (vrath.frequency === '9 Days') {
            upcomingOccurrences = Array.from({ length: 9 }, (_, i) => addDays(nextOccurrence, i));
          } else if (vrath.frequency === '6 Days') {
            upcomingOccurrences = Array.from({ length: 6 }, (_, i) => addDays(nextOccurrence, i));
          } else {
            upcomingOccurrences = [nextOccurrence];
          }
        } else {
          // For monthly observances without specific month
          nextOccurrence = getNextMonthlyOccurrence(vrath, currentDate);
          lunarDate = vrath.paksha && vrath.tithi ? `${vrath.paksha} ${vrath.tithi}` : '';
          upcomingOccurrences = [nextOccurrence];
        }
      } else if (vrath.calculationType === 'weekday') {
        nextOccurrence = getNextWeeklyOccurrence(vrath, currentDate);
        lunarDate = '';
        upcomingOccurrences = [nextOccurrence];
      } else {
        // For special and other types
        nextOccurrence = getNextSpecialOccurrence(vrath, currentDate);
        upcomingOccurrences = [nextOccurrence];
      }

      // Calculate days until next occurrence
      const daysUntilNext = Math.max(
        0,
        Math.ceil((nextOccurrence.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      const calculatedVrath: CalculatedVrath = {
        ...vrath,
        nextOccurrence,
        nextOccurrenceFormatted: format(nextOccurrence, 'EEEE, MMMM do, yyyy'),
        lunarDate,
        daysUntilNext,
        upcomingOccurrences,
      };

      calculatedVraths.push(calculatedVrath);
    } catch (err) {
      console.warn('Falling back to simple calculation for:', vrath.nameEnglish);

      // Simple fallback without any external dependencies
      const fallbackDate = getSimpleFallback(vrath, currentDate);
      const daysUntilNext = Math.max(
        0,
        Math.ceil((fallbackDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      const calculatedVrath: CalculatedVrath = {
        ...vrath,
        nextOccurrence: fallbackDate,
        nextOccurrenceFormatted: format(fallbackDate, 'EEEE, MMMM do, yyyy'),
        lunarDate: vrath.paksha && vrath.tithi ? `${vrath.paksha} ${vrath.tithi}` : '',
        daysUntilNext,
        upcomingOccurrences: [fallbackDate],
      };

      calculatedVraths.push(calculatedVrath);
    }
  }

  // Sort by next occurrence date
  return calculatedVraths.sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());
};

// Improved estimation functions for vrath dates (lightweight and accurate)
function getImprovedVrathDate(vrath: VrathData, year: number, currentDate: Date): Date {
  // More accurate lunar month to gregorian month mapping
  const monthEstimates: { [key: string]: { start: number; mid: number; end: number } } = {
    Chaitra: { start: 2, mid: 2, end: 3 }, // March-April
    Vaishakha: { start: 3, mid: 4, end: 4 }, // April-May
    Jyeshtha: { start: 4, mid: 5, end: 5 }, // May-June
    Ashadha: { start: 5, mid: 6, end: 6 }, // June-July
    Sravana: { start: 6, mid: 7, end: 7 }, // July-August
    Bhadrapada: { start: 7, mid: 8, end: 8 }, // August-September
    Aswija: { start: 8, mid: 9, end: 9 }, // September-October
    Karthika: { start: 9, mid: 10, end: 10 }, // October-November
    Margashira: { start: 10, mid: 11, end: 11 }, // November-December
    Pushya: { start: 11, mid: 0, end: 0 }, // December-January
    Magha: { start: 0, mid: 1, end: 1 }, // January-February
    Phalguna: { start: 1, mid: 2, end: 2 }, // February-March
  };

  const monthInfo = monthEstimates[vrath.month || ''];
  if (!monthInfo) {
    return getSimpleFallback(vrath, currentDate);
  }

  let estimatedMonth = monthInfo.mid;
  let estimatedDay = 15; // Default mid-month

  // Adjust day based on paksha and tithi
  if (vrath.paksha === 'Shukla') {
    // Shukla paksha: early to mid month
    estimatedDay = Math.min(30, (vrath.tithiNumber || 1) + 2);
    estimatedMonth = monthInfo.start;
  } else if (vrath.paksha === 'Krishna') {
    // Krishna paksha: mid to late month
    estimatedDay = Math.min(30, 15 + (vrath.tithiNumber || 1));
    estimatedMonth = monthInfo.end;
  }

  // Handle month overflow
  let targetYear = year;
  if (estimatedMonth < 0) {
    estimatedMonth = 11;
    targetYear = year - 1;
  } else if (estimatedMonth > 11) {
    estimatedMonth = 0;
    targetYear = year + 1;
  }

  const estimatedDate = new Date(targetYear, estimatedMonth, estimatedDay);

  // If the date is in the past, move to next occurrence
  if (estimatedDate < currentDate) {
    if (vrath.frequency === 'Annual') {
      return new Date(targetYear + 1, estimatedMonth, estimatedDay);
    } else {
      // Try next month or year
      let nextMonth = estimatedMonth + 1;
      let nextYear = targetYear;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      return new Date(nextYear, nextMonth, estimatedDay);
    }
  }

  return estimatedDate;
}

function getNextWeeklyOccurrence(vrath: VrathData, currentDate: Date): Date {
  if (vrath.weekday === undefined) {
    return getSimpleFallback(vrath, currentDate);
  }

  const currentDay = currentDate.getDay();
  const targetDay = vrath.weekday;

  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
  }

  const nextOccurrence = addDays(currentDate, daysUntilTarget);

  // Check if we're in the special month (like Sravana for Sawan Somwar)
  if (vrath.specialMonths && vrath.specialMonths.length > 0) {
    // For now, return next occurrence in current context
    // In future, can add month-specific logic
  }

  return nextOccurrence;
}

function getSimpleFallback(vrath: VrathData, currentDate: Date): Date {
  // Very simple fallback based on frequency
  const daysToAdd =
    {
      Monthly: 30,
      'Bi-monthly': 15,
      Weekly: 7,
      Annual: 365,
      Seasonal: 90,
      '9 Days': 30,
      '6 Days': 30,
      '16 Days': 30,
    }[vrath.frequency] || 30;

  return addDays(currentDate, daysToAdd);
}

function getNextMonthlyOccurrence(vrath: VrathData, currentDate: Date): Date {
  // For monthly observances, estimate next occurrence more accurately
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  let estimatedDay = 15; // Default mid-month

  if (vrath.paksha === 'Shukla') {
    // Shukla paksha: early to mid month (days 1-15)
    estimatedDay = Math.min(30, (vrath.tithiNumber || 1) + 2);
  } else if (vrath.paksha === 'Krishna') {
    // Krishna paksha: mid to late month (days 16-30)
    estimatedDay = Math.min(30, 15 + (vrath.tithiNumber || 1));
  }

  // Try current month first
  let nextDate = new Date(currentYear, currentMonth, estimatedDay);
  if (nextDate > currentDate) {
    return nextDate;
  }

  // Try next month
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear++;
  }

  nextDate = new Date(nextYear, nextMonth, estimatedDay);
  return nextDate;
}

// Helper function to get masa mapping
function getMasaMapping(): { [key: string]: string } {
  return {
    Chaitra: 'chaitra',
    Vaishakha: 'vaisakha',
    Jyeshtha: 'jyaistha',
    Ashadha: 'asadha',
    Sravana: 'sravana',
    Bhadrapada: 'badhrapada',
    Aswija: 'aswija',
    Karthika: 'karthika',
    Margashira: 'margasira',
    Pushya: 'pushya',
    Magha: 'magha',
    Phalguna: 'phalguna',
  };
}
