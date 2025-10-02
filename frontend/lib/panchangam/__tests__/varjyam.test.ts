import { YexaaCalculateFunc } from '../yexaaCalculateFunc';
import { YexaaCalendar } from '../yexaaCalendar';
import { YexaaLocalConstant } from '../yexaaLocalConstant';

/**
 * Varjyam Calculation Tests
 *
 * This file contains manual test cases for Varjyam calculation functionality.
 * Run these tests manually in the browser console or by importing this module.
 */

// Test helper function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

// Test data and expected results
const testCases = [
  {
    name: 'Ashwini Nakshatra Varjyam',
    sunrise: new Date('2025-10-02T06:05:00.000Z'),
    nakshatraEnd: new Date('2025-10-02T14:30:00.000Z'),
    nakshatra: 'ashwini',
    expectedStartGhati: 20,
    expectedDurationGhati: 44,
  },
  {
    name: 'Bharani Nakshatra Varjyam',
    sunrise: new Date('2025-10-02T06:05:00.000Z'),
    nakshatraEnd: new Date('2025-10-02T15:45:00.000Z'),
    nakshatra: 'bharani',
    expectedStartGhati: 32,
    expectedDurationGhati: 42,
  },
  {
    name: 'Revati Nakshatra Varjyam',
    sunrise: new Date('2025-10-02T06:05:00.000Z'),
    nakshatraEnd: new Date('2025-10-02T16:30:00.000Z'),
    nakshatra: 'revati',
    expectedStartGhati: 22,
    expectedDurationGhati: 40,
  },
];

export class VarjyamTestSuite {
  private calculateFunc: YexaaCalculateFunc;
  private calendar: YexaaCalendar;
  private constants: YexaaLocalConstant;

  constructor() {
    this.calculateFunc = new YexaaCalculateFunc();
    this.calendar = new YexaaCalendar();
    this.constants = new YexaaLocalConstant();
  }

  // Test individual Varjyam calculation
  testCalculateVarjyam() {
    console.log('\n=== Testing calculateVarjyam function ===');

    testCases.forEach(testCase => {
      console.log(`\nTesting: ${testCase.name}`);

      const result = this.calculateFunc.calculateVarjyam(
        testCase.sunrise,
        testCase.nakshatra,
        testCase.nakshatraEnd
      );

      assert(result !== null, `Result should not be null for ${testCase.nakshatra}`);
      assert(result!.start instanceof Date, 'Start time should be a Date object');
      assert(result!.end instanceof Date, 'End time should be a Date object');
      assert(
        !!result!.startFormatted.match(/\d{1,2}:\d{2} (AM|PM)/),
        'Start time should be formatted correctly'
      );
      assert(
        !!result!.endFormatted.match(/\d{1,2}:\d{2} (AM|PM)/),
        'End time should be formatted correctly'
      );

      // Verify timing calculations
      const expectedStartMinutes = testCase.expectedStartGhati * 24;
      const expectedStartTime = new Date(
        testCase.sunrise.getTime() + expectedStartMinutes * 60 * 1000
      );
      const actualStartDiff =
        Math.abs(result!.start.getTime() - expectedStartTime.getTime()) / (1000 * 60);

      assert(
        actualStartDiff < 1,
        `Start time should be within 1 minute of expected time (diff: ${actualStartDiff.toFixed(2)} minutes)`
      );

      console.log(`  Start: ${result!.startFormatted}`);
      console.log(`  End: ${result!.endFormatted}`);
    });
  }

  // Test edge cases
  testEdgeCases() {
    console.log('\n=== Testing Edge Cases ===');

    // Unknown nakshatra
    const unknownResult = this.calculateFunc.calculateVarjyam(
      new Date('2025-10-02T06:05:00.000Z'),
      'unknown_nakshatra',
      new Date('2025-10-02T14:30:00.000Z')
    );
    assert(unknownResult === null, 'Should return null for unknown nakshatra');

    // Varjyam starts after nakshatra ends
    const shortNakshatraResult = this.calculateFunc.calculateVarjyam(
      new Date('2025-10-02T06:05:00.000Z'),
      'ashwini', // Starts at 20 ghatikas = 8 hours after sunrise
      new Date('2025-10-02T07:00:00.000Z') // Very short nakshatra
    );
    assert(
      shortNakshatraResult === null,
      'Should return null if varjyam starts after nakshatra ends'
    );

    // Varjyam truncated by nakshatra boundary
    const truncatedResult = this.calculateFunc.calculateVarjyam(
      new Date('2025-10-02T06:05:00.000Z'),
      'rohini', // Starts at 18 ghatikas with 36 ghatikas duration
      new Date('2025-10-02T10:00:00.000Z') // Ends early
    );
    if (truncatedResult) {
      assert(
        truncatedResult.end.getTime() <= new Date('2025-10-02T10:00:00.000Z').getTime(),
        'Varjyam end should be truncated to nakshatra boundary'
      );
    }

    console.log('✓ All edge cases passed');
  }

  // Test calendar integration
  testCalendarIntegration() {
    console.log('\n=== Testing Calendar Integration ===');

    const testDate = new Date('2025-10-02');
    const lat = 17.385; // Hyderabad
    const lng = 78.4867;

    try {
      const result = this.calendar.calendar(this.constants, testDate, lat, lng);

      assert('Varjyam' in result, 'Calendar result should include Varjyam property');

      if (result.Varjyam) {
        assert(typeof result.Varjyam.start === 'string', 'Varjyam start should be a string');
        assert(typeof result.Varjyam.end === 'string', 'Varjyam end should be a string');
        assert(result.Varjyam.name_en_IN === 'varjyam', 'Varjyam should have correct English name');
        assert(result.Varjyam.name === 'వర్జ్యం', 'Varjyam should have correct Telugu name');

        console.log(`  Varjyam: ${result.Varjyam.start} – ${result.Varjyam.end}`);
      } else {
        console.log('  Varjyam: Not available for this date/nakshatra');
      }

      console.log('✓ Calendar integration test passed');
    } catch (error) {
      console.error('Calendar integration test failed:', error);
      throw error;
    }
  }

  // Run all tests
  runAllTests() {
    console.log('Starting Varjyam Test Suite...');

    try {
      this.testCalculateVarjyam();
      this.testEdgeCases();
      this.testCalendarIntegration();

      console.log('\n🎉 All tests passed successfully!');
      return true;
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      return false;
    }
  }

  // Manual validation helper
  validateSampleCalculation() {
    console.log('\n=== Manual Validation Sample ===');

    const sunrise = new Date('2025-10-02T06:05:00.000Z'); // 6:05 AM IST
    const nakshatraEnd = new Date('2025-10-02T14:30:00.000Z'); // 2:30 PM IST
    const nakshatra = 'ashwini';

    console.log(`Sunrise: ${sunrise.toISOString()}`);
    console.log(`Nakshatra: ${nakshatra}`);
    console.log(`Nakshatra End: ${nakshatraEnd.toISOString()}`);

    const result = this.calculateFunc.calculateVarjyam(sunrise, nakshatra, nakshatraEnd);

    if (result) {
      console.log(`\nVarjyam Calculation Results:`);
      console.log(`Start Time: ${result.startFormatted} (ISO: ${result.startISO})`);
      console.log(`End Time: ${result.endFormatted} (ISO: ${result.endISO})`);

      // Expected calculation:
      // Ashwini starts at 20 ghatikas = 20 * 24 = 480 minutes = 8 hours after sunrise
      // Duration is 44 ghatikas = 44 * 24 = 1056 minutes = 17.6 hours
      // So it should start around 2:05 PM (6:05 + 8:00) and end around 7:41 AM next day

      const expectedStart = new Date(sunrise.getTime() + 20 * 24 * 60 * 1000);
      const expectedEnd = new Date(expectedStart.getTime() + 44 * 24 * 60 * 1000);

      console.log(`\nExpected Start: ${expectedStart.toISOString()}`);
      console.log(`Expected End: ${expectedEnd.toISOString()}`);

      const startDiff = Math.abs(result.start.getTime() - expectedStart.getTime()) / (1000 * 60);
      console.log(`Start time difference: ${startDiff.toFixed(2)} minutes`);
    } else {
      console.log('No Varjyam calculated for this nakshatra');
    }
  }
}

// Export for manual testing
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for console testing
  (window as any).VarjyamTestSuite = VarjyamTestSuite;
  console.log('VarjyamTestSuite available in console. Run: new VarjyamTestSuite().runAllTests()');
}

export default VarjyamTestSuite;
