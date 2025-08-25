export interface PanchangamData {
  tithi?: string;
  tithiTime?: string;
  nakshatra?: string;
  nakshatraTime?: string;
  yoga?: string;
  karana?: string;
  yogaTime?: string;
  karanaTime?: string;
  moonMasa?: string;
  masa?: string;
  paksha?: string;
  day?: string;
  ayana?: string;
  ritu?: string;
  teluguYear?: string;
}

export interface SunTime {
  sunRise?: string;
  sunSet?: string;
}

export interface MoonTime {
  rise?: Date;
  set?: Date;
}
