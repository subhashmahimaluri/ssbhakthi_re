// Quick validation script for Surya Siddhanta implementation
// Run this in the browser console to test basic functionality

import { YexaaPanchang_SuryaSiddhantam } from './YexaaPanchang_SuryaSiddhantam';
import { YexaaLocalConstant } from './yexaaLocalConstant';

// Test basic functionality
export function validateSuryaSiddhanta() {
  console.log('🧪 Testing Surya Siddhanta Implementation...');

  try {
    // Initialize
    const yexaaConstant = new YexaaLocalConstant();
    const suryaSiddhanta = new YexaaPanchang_SuryaSiddhantam(yexaaConstant);

    // Test date
    const testDate = new Date('2025-10-02');
    const lat = 12.97; // Bangalore
    const lng = 77.59;

    console.log(`Testing for: ${testDate.toDateString()}, Location: ${lat}, ${lng}`);

    // Performance test
    const startTime = performance.now();

    const result = suryaSiddhanta.computePanchang({
      date: testDate,
      lat,
      lon: lng,
      tz: 'Asia/Kolkata',
    });

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Validation
    console.log('\n📊 Results:');
    console.log(`Execution time: ${executionTime.toFixed(2)}ms`);
    console.log(`Performance target (<250ms): ${executionTime < 250 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n🌟 Panchangam Elements:');
    console.log(`Tithi: ${result.tithi.name} (${result.tithi.number})`);
    console.log(`Nakshatra: ${result.nakshatra.name} (${result.nakshatra.number})`);
    console.log(`Yoga: ${result.yoga.name} (${result.yoga.number})`);
    console.log(`Karana: ${result.karana.name} (${result.karana.number})`);

    console.log('\n🌍 Celestial Positions:');
    console.log(`Sun longitude: ${result.sun.longitude.toFixed(4)}°`);
    console.log(`Moon longitude: ${result.moon.longitude.toFixed(4)}°`);
    console.log(`Ayanamsa: ${result.ayanamsa.toFixed(4)}°`);

    // Basic validation checks
    const validations = [
      { test: result.tithi.number >= 0 && result.tithi.number < 30, name: 'Tithi range' },
      {
        test: result.nakshatra.number >= 0 && result.nakshatra.number < 27,
        name: 'Nakshatra range',
      },
      { test: result.yoga.number >= 0 && result.yoga.number < 27, name: 'Yoga range' },
      { test: result.karana.number >= 0 && result.karana.number < 11, name: 'Karana range' },
      {
        test: result.sun.longitude >= 0 && result.sun.longitude < 360,
        name: 'Sun longitude range',
      },
      {
        test: result.moon.longitude >= 0 && result.moon.longitude < 360,
        name: 'Moon longitude range',
      },
      { test: result.ayanamsa > 20 && result.ayanamsa < 30, name: 'Ayanamsa reasonable value' },
      { test: executionTime < 250, name: 'Performance requirement' },
    ];

    console.log('\n✅ Validation Results:');
    validations.forEach(validation => {
      console.log(`${validation.test ? '✅' : '❌'} ${validation.name}`);
    });

    const allPassed = validations.every(v => v.test);
    console.log(
      `\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`
    );

    return {
      success: allPassed,
      executionTime,
      result,
      validations,
    };
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Test URL access
export function testRouteAccess() {
  console.log('\n🌐 Route Access Test:');

  const testUrls = [
    '/panchangam-surya-siddhantam',
    '/panchangam-surya-siddhantam?date=2025-10-02',
    '/panchangam-surya-siddhantam?date=2025-10-02&lat=12.97&lon=77.59&tz=Asia/Kolkata',
  ];

  testUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
    console.log(`   → Navigate to test this URL manually`);
  });

  console.log('\nExpected behavior:');
  console.log('- Page loads without errors');
  console.log('- Form shows correct default/parameter values');
  console.log('- Calculation runs automatically');
  console.log('- Both Surya Siddhanta and Drik results display');
  console.log('- Comparison table shows differences');
  console.log('- Performance metrics are visible');
}

console.log('🚀 Surya Siddhanta validation functions loaded!');
console.log('Run validateSuryaSiddhanta() to test the implementation');
console.log('Run testRouteAccess() to get manual testing instructions');
