import { YexaaPanchang_SuryaSiddhantam } from '../YexaaPanchang_SuryaSiddhantam';
import { YexaaLocalConstant } from '../yexaaLocalConstant';

/**
 * Surya Siddhanta Calculation Tests
 *
 * This file contains manual test cases for Surya Siddhanta panchangam calculations.
 * Run these tests manually in the browser console or by importing this module.
 */

// Test helper function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

// Helper to check if value is within range
function assertRange(value: number, min: number, max: number, message: string) {
  assert(value >= min && value < max, `${message} (expected ${min}-${max}, got ${value})`);
}

// Helper to check close values
function assertCloseTo(actual: number, expected: number, tolerance: number, message: string) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${message} (expected ~${expected}, got ${actual}, diff: ${diff})`);
}

export class SuryaSiddhantaTestSuite {
  private suryaSiddhanta: YexaaPanchang_SuryaSiddhantam;
  private yexaaConstant: YexaaLocalConstant;

  constructor() {
    this.yexaaConstant = new YexaaLocalConstant();
    this.suryaSiddhanta = new YexaaPanchang_SuryaSiddhantam(this.yexaaConstant);
  }

  // Test basic utility functions
  testBasicUtilities() {
    console.log('\n=== Testing Basic Utility Functions ===');

    // Test fix360
    assert(this.suryaSiddhanta.fix360(370) === 10, 'fix360(370) should return 10');
    assert(this.suryaSiddhanta.fix360(-10) === 350, 'fix360(-10) should return 350');
    assert(this.suryaSiddhanta.fix360(180) === 180, 'fix360(180) should return 180');
    assert(this.suryaSiddhanta.fix360(0) === 0, 'fix360(0) should return 0');

    // Test Julian Day conversions
    const jd2000 = this.suryaSiddhanta.mdy2julian(1, 1.5, 2000);
    assertCloseTo(jd2000, 2451545.0, 1, 'Julian Day for Jan 1, 2000 should be ~2451545.0');

    const jd1900 = this.suryaSiddhanta.mdy2julian(1, 1.5, 1900);
    assertCloseTo(jd1900, 2415021.0, 1, 'Julian Day for Jan 1, 1900 should be ~2415021.0');

    // Test calendar conversion
    const calResult = this.suryaSiddhanta.calData(2451545.0);
    assert(calResult.year === 2000, 'Calendar conversion year should be 2000');
    assert(calResult.month === 1, 'Calendar conversion month should be 1');
    assert(calResult.day === 1, 'Calendar conversion day should be 1');

    // Test week day
    const weekDay2000 = this.suryaSiddhanta.weekDay(2451545.0);
    assert(weekDay2000 === 6, 'Jan 1, 2000 should be Saturday (6)');

    console.log('✓ All basic utility tests passed');
  }

  // Test astronomical calculations
  testAstronomicalCalculations() {
    console.log('\n=== Testing Astronomical Calculations ===');

    const jd2000 = 2451545.0; // Jan 1, 2000

    // Test ayanamsa calculation
    const ayanamsa = this.suryaSiddhanta.calcayan(jd2000);
    assertRange(ayanamsa, 20, 30, 'Ayanamsa for year 2000 should be 20-30 degrees');

    // Test sun longitude
    const sunLong = this.suryaSiddhanta.sun(jd2000);
    assertRange(sunLong, 0, 360, 'Sun longitude should be 0-360 degrees');
    assertRange(sunLong, 270, 290, 'Sun should be in Capricorn (~280°) on Jan 1');

    // Test moon longitude
    const moonLong = this.suryaSiddhanta.moon(jd2000);
    assertRange(moonLong, 0, 360, 'Moon longitude should be 0-360 degrees');

    // Test moon angular velocity
    assertRange(
      this.suryaSiddhanta.skor,
      12,
      15,
      'Moon angular velocity should be ~13.176 deg/day'
    );

    console.log('✓ All astronomical calculation tests passed');
  }

  // Test comprehensive panchangam calculation
  testComprehensivePanchangam() {
    console.log('\n=== Testing Comprehensive Panchangam Calculation ===');

    const testDate = new Date('2025-10-02');
    const lat = 12.97; // Bangalore
    const lng = 77.59;

    const result = this.suryaSiddhanta.computePanchang({
      date: testDate,
      lat,
      lon: lng,
      tz: 'Asia/Kolkata',
    });

    // Verify structure
    assert(result.hasOwnProperty('tithi'), 'Result should have tithi property');
    assert(result.hasOwnProperty('nakshatra'), 'Result should have nakshatra property');
    assert(result.hasOwnProperty('yoga'), 'Result should have yoga property');
    assert(result.hasOwnProperty('karana'), 'Result should have karana property');
    assert(result.hasOwnProperty('sun'), 'Result should have sun property');
    assert(result.hasOwnProperty('moon'), 'Result should have moon property');
    assert(result.hasOwnProperty('ayanamsa'), 'Result should have ayanamsa property');

    // Verify tithi
    assertRange(result.tithi.number, 0, 30, 'Tithi number should be valid');
    assert(typeof result.tithi.name === 'string', 'Tithi name should be a string');
    assert(result.tithi.start instanceof Date, 'Tithi start should be a Date');
    assert(result.tithi.end instanceof Date, 'Tithi end should be a Date');

    // Verify nakshatra
    assertRange(result.nakshatra.number, 0, 27, 'Nakshatra number should be valid');
    assert(typeof result.nakshatra.name === 'string', 'Nakshatra name should be a string');

    // Verify celestial positions
    assertRange(result.sun.longitude, 0, 360, 'Sun longitude should be valid');
    assertRange(result.moon.longitude, 0, 360, 'Moon longitude should be valid');

    // October 2, 2025 expectations (Sun in Virgo)
    assertRange(result.sun.longitude, 150, 210, 'Sun should be in Virgo in October');

    console.log(`  Tithi: ${result.tithi.name} (${result.tithi.number})`);
    console.log(`  Nakshatra: ${result.nakshatra.name} (${result.nakshatra.number})`);
    console.log(`  Sun: ${result.sun.longitude.toFixed(2)}°`);
    console.log(`  Moon: ${result.moon.longitude.toFixed(2)}°`);

    console.log('✓ All comprehensive panchangam tests passed');
  }

  // Test performance requirements
  testPerformance() {
    console.log('\n=== Testing Performance Requirements ===');

    const testDate = new Date('2025-10-02');
    const lat = 12.97;
    const lng = 77.59;

    const startTime = performance.now();
    const result = this.suryaSiddhanta.computePanchang({
      date: testDate,
      lat,
      lon: lng,
      tz: 'Asia/Kolkata',
    });
    const endTime = performance.now();

    const executionTime = endTime - startTime;

    console.log(`  Execution time: ${executionTime.toFixed(2)}ms`);

    // Should complete within 250ms as per requirements
    assert(
      executionTime < 250,
      `Calculation should complete within 250ms (took ${executionTime.toFixed(2)}ms)`
    );
    assert(result !== null, 'Result should not be null');

    console.log('✓ Performance requirements met');
  }

  // Run all tests
  runAllTests() {
    console.log('Starting Surya Siddhanta Test Suite...');

    try {
      this.testBasicUtilities();
      this.testAstronomicalCalculations();
      this.testComprehensivePanchangam();
      this.testPerformance();

      console.log('\n🎉 All Surya Siddhanta tests passed successfully!');
      return true;
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      return false;
    }
  }

  // Manual validation helper for specific test case
  validateKnownDate() {
    console.log('\n=== Manual Validation for October 2, 2025 ===');

    const testDate = new Date('2025-10-02');
    const lat = 12.97; // Bangalore
    const lng = 77.59;

    const result = this.suryaSiddhanta.computePanchang({
      date: testDate,
      lat,
      lon: lng,
      tz: 'Asia/Kolkata',
    });

    console.log('Surya Siddhanta Calculation Results:');
    console.log(`Date: ${testDate.toDateString()}`);
    console.log(`Location: ${lat}, ${lng} (Bangalore)`);
    console.log(`Tithi: ${result.tithi.name} (${result.tithi.number})`);
    console.log(`Nakshatra: ${result.nakshatra.name} (${result.nakshatra.number})`);
    console.log(`Yoga: ${result.yoga.name} (${result.yoga.number})`);
    console.log(`Karana: ${result.karana.name} (${result.karana.number})`);
    console.log(`Sun Longitude: ${result.sun.longitude.toFixed(4)}°`);
    console.log(`Moon Longitude: ${result.moon.longitude.toFixed(4)}°`);
    console.log(`Ayanamsa: ${result.ayanamsa.toFixed(4)}°`);

    return result;
  }
}
