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
 * Get Telugu year name from Gregorian year.
 * Based on 60-year cycle starting from 1867 (Prabhava).
 * Telugu calendar year starts on Chaitra Shukla Padyami.
 */
export function getTeluguYearName(gregorianYear: number): string {
  const teluguYearNames = [
    'prabhava', // 1867, 1927, 1987, 2047
    'vibhava', // 1868, 1928, 1988, 2048
    'shukla', // 1869, 1929, 1989, 2049
    'pramoda', // 1870, 1930, 1990, 2050
    'prajothpatti', // 1871, 1931, 1991, 2051
    'aangirasa', // 1872, 1932, 1992, 2052
    'shrimukha', // 1873, 1933, 1993, 2053
    'bhava', // 1874, 1934, 1994, 2054
    'yuva', // 1875, 1935, 1995, 2055
    'dhathu', // 1876, 1936, 1996, 2056
    'eeshwara', // 1877, 1937, 1997, 2057
    'bahudhanya', // 1878, 1938, 1998, 2058
    'pramathi', // 1879, 1939, 1999, 2059
    'vikrama', // 1880, 1940, 2000, 2060
    'vrisha', // 1881, 1941, 2001, 2061
    'chitrabhanu', // 1882, 1942, 2002, 2062
    'subhanu', // 1883, 1943, 2003, 2063
    'taarana', // 1884, 1944, 2004, 2064
    'paarthiva', // 1885, 1945, 2005, 2065
    'vyaya', // 1886, 1946, 2006, 2066
    'sarvajit', // 1887, 1947, 2007, 2067
    'sarvadhari', // 1888, 1948, 2008, 2068
    'virodhi', // 1889, 1949, 2009, 2069
    'vikruti', // 1890, 1950, 2010, 2070
    'khara', // 1891, 1951, 2011, 2071
    'nandana', // 1892, 1952, 2012, 2072
    'vijaya', // 1893, 1953, 2013, 2073
    'jaya', // 1894, 1954, 2014, 2074
    'manmatha', // 1895, 1955, 2015, 2075
    'durmukhi', // 1896, 1956, 2016, 2076
    'hevilambi', // 1897, 1957, 2017, 2077
    'vilambi', // 1898, 1958, 2018, 2078
    'vikaari', // 1899, 1959, 2019, 2079
    'shaarvari', // 1900, 1960, 2020, 2080
    'plava', // 1901, 1961, 2021, 2081
    'shubhakrit', // 1902, 1962, 2022, 2082
    'shobhakrith', // 1903, 1963, 2023, 2083
    'krodhi', // 1904, 1964, 2024, 2084
    'vishwavasu', // 1905, 1965, 2025, 2085
    'parabhava', // 1906, 1966, 2026, 2086
    'plavanga', // 1907, 1967, 2027, 2087
    'keelaka', // 1908, 1968, 2028, 2088
    'saumya', // 1909, 1969, 2029, 2089
    'sadharana', // 1910, 1970, 2030, 2090
    'virodhikrith', // 1911, 1971, 2031, 2091
    'paridhavi', // 1912, 1972, 2032, 2092
    'pramadicha', // 1913, 1973, 2033, 2093
    'aananda', // 1914, 1974, 2034, 2094
    'rakshasa', // 1915, 1975, 2035, 2095
    'nala', // 1916, 1976, 2036, 2096
    'pingala', // 1917, 1977, 2037, 2097
    'kalayukthi', // 1918, 1978, 2038, 2098
    'siddharthi', // 1919, 1979, 2039, 2099
    'raudra', // 1920, 1980, 2040, 2100
    'durmathi', // 1921, 1981, 2041, 2101
    'dundubhi', // 1922, 1982, 2042, 2102
    'rudhirodgaari', // 1923, 1983, 2043, 2103
    'raktakshi', // 1924, 1984, 2044, 2104
    'krodhana', // 1925, 1985, 2045, 2105
    'akshaya', // 1926, 1986, 2046, 2106
  ];

  // Calculate index based on Gregorian year with 1867 as base (Prabhava)
  const index = (gregorianYear - 1867) % 60;

  // Handle negative years (before 1867) by wrapping around
  const normalizedIndex = index < 0 ? index + 60 : index;

  return teluguYearNames[normalizedIndex];
}
