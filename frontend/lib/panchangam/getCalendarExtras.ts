/**
 * Helper to determine Ayana from solar longitude in degrees.
 * Makara Sankranti (~270°) and Karka Sankranti (~90°)
 */
export function getAyana(solarLongitudeDeg: number): string {
  if (solarLongitudeDeg >= 270 || solarLongitudeDeg < 90) {
    return 'uttarayana';
  } else {
    return 'dakshinayana';
  }
}

/**
 * Get Drik Ritu (season) from solar longitude in degrees.
 */
export function getDrikRitu(solarLongitudeDeg: number): string {
  const index = Math.floor(solarLongitudeDeg / 60) % 6;
  const rituList = ['vasanta', 'grishma', 'varsha', 'sharad', 'hemanta', 'shishira'];
  return rituList[index];
}

/**
 * Get Telugu year name from Saka year or any 60-year cycle number.
 * Cycle: Prabhava, Vibhava, etc. Wraps every 60 years.
 */
export function getTeluguYearName(sakaYear: number): string {
  const teluguYearNames = [
    'prabhava',
    'vibhava',
    'shukla',
    'pramoda',
    'prajothpatti',
    'aangirasa',
    'shrimukha',
    'bhava',
    'yuva',
    'dhathu',
    'eeshwara',
    'bahudhanya',
    'pramathi',
    'vikrama',
    'vrisha',
    'chitrabhanu',
    'subhanu',
    'taarana',
    'paarthiva',
    'vyaya',
    'sarvajit',
    'sarvadhari',
    'virodhi',
    'vikruti',
    'khara',
    'nandana',
    'vijaya',
    'jaya',
    'manmatha',
    'durmukhi',
    'hevilambi',
    'vilambi',
    'vikaari',
    'shaarvari',
    'plava',
    'shubhakrit',
    'shobhakrith',
    'krodhi',
    'vishwavasu',
    'parabhava',
    'plavanga',
    'keelaka',
    'saumya',
    'sadharana',
    'virodhikrith',
    'paridhavi',
    'pramadicha',
    'aananda',
    'rakshasa',
    'nala',
    'pingala',
    'kalayukthi',
    'siddharthi',
    'raudra',
    'durmathi',
    'dundubhi',
    'rudhirodgaari',
    'raktakshi',
    'krodhana',
    'akshaya',
  ];

  const index = (sakaYear - 1) % 60;
  return teluguYearNames[index];
}
