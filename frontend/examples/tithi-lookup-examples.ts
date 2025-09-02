/**
 * Example usage of the YexaaPanchang reverse lookup functionality
 *
 * This script demonstrates how to find Gregorian dates based on
 * Telugu Panchangam details (Year + Masa + Paksha + Tithi).
 */

import { YexaaPanchang } from '../lib/panchangam';

// Example function to demonstrate the reverse lookup
export function exampleTithiLookup() {
  const panchang = new YexaaPanchang();

  // Hyderabad coordinates
  const lat = 17.385;
  const lng = 78.4867;

  console.log('=== YexaaPanchang Reverse Lookup Examples ===\\n');

  // Example 1: Find Bhadrapada Shukla Dashami 2025
  console.log('Example 1: Bhadrapada Shukla Dashami 2025');
  const date1 = panchang.findDateByTithi(
    2025, // year
    'badhrapada', // masa
    'shukla_paksha', // paksha
    'dasami', // tithi name
    lat, // latitude
    lng // longitude
  );

  if (date1) {
    console.log(`Result: ${date1.toDateString()}`);
    console.log(`ISO: ${date1.toISOString()}`);
  } else {
    console.log('No matching date found');
  }
  console.log('');

  // Example 2: Find all occurrences of Chaitra Shukla Pournami 2025
  console.log('Example 2: All occurrences of Chaitra Shukla Pournami 2025');
  const dates2 = panchang.findAllDatesByTithi(
    2025,
    'chaitra',
    'shukla_paksha',
    'pournami',
    lat,
    lng
  );

  console.log(`Found ${dates2.length} matching dates:`);
  dates2.forEach((date, index) => {
    console.log(`  ${index + 1}. ${date.toDateString()} (${date.toISOString()})`);
  });
  console.log('');

  // Example 3: Different spelling variations
  console.log('Example 3: Different spellings - "Bhadrapada" vs "badhrapada"');
  const date3a = panchang.findDateByTithi(2025, 'bhadrapada', 'shukla_paksha', 'dasami', lat, lng);
  const date3b = panchang.findDateByTithi(2025, 'badhrapada', 'shukla_paksha', 'dasami', lat, lng);

  console.log(`Bhadrapada: ${date3a ? date3a.toDateString() : 'Not found'}`);
  console.log(`Badhrapada: ${date3b ? date3b.toDateString() : 'Not found'}`);
  console.log('');

  // Example 4: Different paksha format variations
  console.log('Example 4: Different paksha formats');
  const date4a = panchang.findDateByTithi(2025, 'badhrapada', 'shukla_paksha', 'dasami', lat, lng);
  const date4b = panchang.findDateByTithi(2025, 'badhrapada', 'Shukla Paksha', 'dasami', lat, lng);

  console.log(`shukla_paksha: ${date4a ? date4a.toDateString() : 'Not found'}`);
  console.log(`Shukla Paksha: ${date4b ? date4b.toDateString() : 'Not found'}`);
  console.log('');

  // Example 5: Festival dates
  console.log('Example 5: Festival dates');

  // Diwali (Karthika Krishna Amavasya)
  const diwali = panchang.findDateByTithi(2025, 'karthika', 'krishna_paksha', 'amavasya', lat, lng);
  console.log(`Diwali 2025: ${diwali ? diwali.toDateString() : 'Not found'}`);

  // Holi (Phalguna Pournami)
  const holi = panchang.findDateByTithi(2025, 'phalguna', 'shukla_paksha', 'pournami', lat, lng);
  console.log(`Holi 2025: ${holi ? holi.toDateString() : 'Not found'}`);

  console.log('\\n=== Examples completed ===');
}

// Example of integrating with React component
export function useTithiLookup() {
  return {
    findDate: (year: number, masa: string, paksha: string, tithi: string) => {
      const panchang = new YexaaPanchang();
      // Default to Hyderabad coordinates if location not available
      return panchang.findDateByTithi(year, masa, paksha, tithi, 17.385, 78.4867);
    },

    findAllDates: (year: number, masa: string, paksha: string, tithi: string) => {
      const panchang = new YexaaPanchang();
      return panchang.findAllDatesByTithi(year, masa, paksha, tithi, 17.385, 78.4867);
    },
  };
}

// Usage in browser console:
// import { exampleTithiLookup } from './path/to/this/file';
// exampleTithiLookup();
