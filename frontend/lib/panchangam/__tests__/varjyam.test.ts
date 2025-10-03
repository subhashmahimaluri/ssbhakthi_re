import { calculateVarjyam, formatVarjyamTime } from '../varjyamCalculations';

/**
 * Varjyam Calculation Tests
 *
 * Manual test suite for Varjyam timing calculations.
 * Run these tests manually in the browser console or by importing this module.
 */

// Test helper function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

// Helper to check if value is close to expected
function assertCloseTo(actual: number, expected: number, tolerance: number, message: string) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${message} (expected ~${expected}, got ${actual}, diff: ${diff})`);
}

export class VarjyamTestSuite {
  // Test basic Varjyam calculation for Ashwini nakshatra
  testAshwiniVarjyam() {
    console.log('\n=== Testing Ashwini Varjyam Calculation ===');

    const nakshatraStart = new Date('2025-10-02T06:00:00+05:30');
    const nakshatraEnd = new Date('2025-10-03T06:00:00+05:30'); // 24 hours

    const result = calculateVarjyam('ashwini', nakshatraStart, nakshatraEnd);

    assert(result !== null, 'Ashwini Varjyam calculation should not be null');
    assert(result!.periods.length === 1, 'Should have exactly one Varjyam period');

    // Ashwini fraction is 5/6 = 0.8333
    // Expected start: 6:00 AM + (24 * 60 * 0.8333) = 6:00 AM + 20 hours = 2:00 AM next day
    const expectedStartHour = (6 + 20) % 24; // 2 AM
    assert(
      result!.periods[0].start.getHours() === expectedStartHour,
      `Start hour should be ${expectedStartHour} but got ${result!.periods[0].start.getHours()}`
    );

    // Duration should be 96 minutes (1.6 hours)
    const duration =
      (result!.periods[0].end.getTime() - result!.periods[0].start.getTime()) / (1000 * 60);
    assertCloseTo(duration, 96, 1, 'Duration should be approximately 96 minutes');

    console.log(`  Start: ${result!.periods[0].start.toLocaleString()}`);
    console.log(`  End: ${result!.periods[0].end.toLocaleString()}`);
    console.log(`  Duration: ${duration.toFixed(1)} minutes`);

    console.log('✓ Ashwini Varjyam test passed');
  }

  // Test Bharani nakshatra calculation
  testBharaniVarjyam() {
    console.log('\n=== Testing Bharani Varjyam Calculation ===');

    const nakshatraStart = new Date('2025-10-02T08:00:00+05:30');
    const nakshatraEnd = new Date('2025-10-03T08:00:00+05:30'); // 24 hours

    const result = calculateVarjyam('bharani', nakshatraStart, nakshatraEnd);

    assert(result !== null, 'Bharani Varjyam calculation should not be null');
    assert(result!.periods.length === 1, 'Should have exactly one Varjyam period');

    // Bharani fraction is 2/5 = 0.4
    // Expected start: 8:00 AM + (24 * 60 * 0.4) = 8:00 AM + 9.6 hours = 5:36 PM
    const expectedStartTime = new Date(nakshatraStart.getTime() + 24 * 60 * 60 * 1000 * 0.4);
    assert(
      result!.periods[0].start.getHours() === expectedStartTime.getHours(),
      `Start hour should be ${expectedStartTime.getHours()} but got ${result!.periods[0].start.getHours()}`
    );
    assert(
      result!.periods[0].start.getMinutes() === expectedStartTime.getMinutes(),
      `Start minute should be ${expectedStartTime.getMinutes()} but got ${result!.periods[0].start.getMinutes()}`
    );

    console.log(`  Start: ${result!.periods[0].start.toLocaleString()}`);
    console.log(`  End: ${result!.periods[0].end.toLocaleString()}`);

    console.log('✓ Bharani Varjyam test passed');
  }

  // Test error handling
  testErrorHandling() {
    console.log('\n=== Testing Error Handling ===');

    // Test unknown nakshatra
    let result = calculateVarjyam('unknown_nakshatra', new Date(), new Date());
    assert(result === null, 'Unknown nakshatra should return null');

    // Test invalid dates
    result = calculateVarjyam(
      'ashwini',
      new Date('invalid'),
      new Date('2025-10-03T06:00:00+05:30')
    );
    assert(result === null, 'Invalid start date should return null');

    // Test negative duration
    const laterDate = new Date('2025-10-03T06:00:00+05:30');
    const earlierDate = new Date('2025-10-02T06:00:00+05:30');
    result = calculateVarjyam('ashwini', laterDate, earlierDate);
    assert(result === null, 'Negative duration should return null');

    console.log('✓ Error handling tests passed');
  }

  // Test time formatting
  testTimeFormatting() {
    console.log('\n=== Testing Time Formatting ===');

    const period = {
      start: new Date('2025-10-02T14:30:00+05:30'),
      end: new Date('2025-10-02T16:06:00+05:30'),
    };

    const formatted = formatVarjyamTime(period);

    assert(formatted.includes('2:30'), 'Should contain start time 2:30');
    assert(formatted.includes('4:06'), 'Should contain end time 4:06');
    assert(formatted.includes('PM'), 'Should contain PM indicator');
    assert(formatted.includes(' - '), 'Should contain time separator');

    console.log(`  Formatted time: ${formatted}`);
    console.log('✓ Time formatting test passed');
  }

  // Test proportional duration calculation
  testProportionalDuration() {
    console.log('\n=== Testing Proportional Duration ===');

    // Test with 12-hour nakshatra
    const nakshatraStart = new Date('2025-10-02T06:00:00+05:30');
    const nakshatraEnd = new Date('2025-10-02T18:00:00+05:30'); // 12 hours

    const result = calculateVarjyam('ashwini', nakshatraStart, nakshatraEnd);

    assert(result !== null, 'Proportional duration calculation should not be null');

    // Duration should be proportional: (12/24) * 96 = 48 minutes
    const duration =
      (result!.periods[0].end.getTime() - result!.periods[0].start.getTime()) / (1000 * 60);
    assertCloseTo(
      duration,
      48,
      1,
      'Duration should be approximately 48 minutes for 12-hour nakshatra'
    );

    console.log(`  12-hour nakshatra duration: ${duration.toFixed(1)} minutes`);
    console.log('✓ Proportional duration test passed');
  }

  // Test boundary conditions
  testBoundaryConditions() {
    console.log('\n=== Testing Boundary Conditions ===');

    // Test with very short nakshatra and large fraction
    const nakshatraStart = new Date('2025-10-02T06:00:00+05:30');
    const nakshatraEnd = new Date('2025-10-02T08:00:00+05:30'); // 2 hours

    const result = calculateVarjyam('shatabhisha', nakshatraStart, nakshatraEnd); // fraction 0.8

    assert(result !== null, 'Boundary condition calculation should not be null');
    assert(
      result!.periods[0].end.getTime() <= nakshatraEnd.getTime(),
      'Varjyam end should not exceed nakshatra end time'
    );

    console.log(`  Short nakshatra Varjyam: ${formatVarjyamTime(result!.periods[0])}`);
    console.log('✓ Boundary conditions test passed');
  }

  // Test all defined nakshatras
  testAllNakshatras() {
    console.log('\n=== Testing All Nakshatra Calculations ===');

    const nakshatraNames = [
      'ashwini',
      'bharani',
      'krithika',
      'rohini',
      'mrigashirsha',
      'ardra',
      'punarvasu',
      'pushya',
      'ashlesha',
      'makha',
      'purva_phalguni',
      'uttara_phalguni',
      'hasta',
      'chitra',
      'swati',
      'vishaka',
      'anuradha',
      'jyeshta',
      'moola',
      'purva_ashadha',
      'uttara_ashadha',
      'shravana',
      'dhanishta',
      'shatabhisha',
      'purva_bhadrapada',
      'uttara_bhadrapada',
      'revati',
    ];

    const nakshatraStart = new Date('2025-10-02T06:00:00+05:30');
    const nakshatraEnd = new Date('2025-10-03T06:00:00+05:30');

    let successCount = 0;
    nakshatraNames.forEach(name => {
      const result = calculateVarjyam(name, nakshatraStart, nakshatraEnd);
      if (result !== null && result.periods.length === 1) {
        assert(
          result.periods[0].start.getTime() >= nakshatraStart.getTime(),
          `${name}: Varjyam start should be after nakshatra start`
        );
        assert(
          result.periods[0].end.getTime() <= nakshatraEnd.getTime(),
          `${name}: Varjyam end should be before nakshatra end`
        );
        successCount++;
      }
    });

    assert(
      successCount === nakshatraNames.length,
      `All ${nakshatraNames.length} nakshatras should calculate successfully`
    );

    console.log(`  Successfully calculated Varjyam for all ${successCount} nakshatras`);
    console.log('✓ All nakshatra calculations test passed');
  }

  // Run all tests
  runAllTests() {
    console.log('Starting Varjyam Test Suite...');

    try {
      this.testAshwiniVarjyam();
      this.testBharaniVarjyam();
      this.testErrorHandling();
      this.testTimeFormatting();
      this.testProportionalDuration();
      this.testBoundaryConditions();
      this.testAllNakshatras();

      console.log('\n🎉 All Varjyam tests passed successfully!');
      return true;
    } catch (error) {
      console.error('\n❌ Varjyam test failed:', error);
      return false;
    }
  }

  // Quick validation test for debugging
  quickValidation() {
    console.log('\n=== Quick Varjyam Validation ===');

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    console.log('Testing with sample nakshatras:');

    ['ashwini', 'bharani', 'rohini', 'makha', 'chitra'].forEach(name => {
      const result = calculateVarjyam(name, today, tomorrow);
      if (result) {
        console.log(
          `  ${name}: ${formatVarjyamTime(result.periods[0])} (${result.totalDuration.toFixed(1)} min)`
        );
      } else {
        console.log(`  ${name}: Failed to calculate`);
      }
    });

    console.log('✓ Quick validation completed');
  }
}

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).VarjyamTestSuite = VarjyamTestSuite;
}
