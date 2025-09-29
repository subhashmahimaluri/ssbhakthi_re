#!/usr/bin/env tsx

/**
 * Test the actual backend API endpoint for stotra creation
 */

async function testBackendAPI() {
  try {
    console.log('🧪 Testing backend API endpoint...');

    const testData = {
      contentType: 'stotra',
      canonicalSlug: 'test-api-creation',
      stotraTitle: 'Test API Stotra Title',
      status: 'draft',
      imageUrl: null,
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      translations: {
        en: {
          title: 'Test API English Title',
          seoTitle: null,
          videoId: null,
          stotra: '<p>Test API stotra content</p>',
          stotraMeaning: '<p>Test API meaning</p>',
          body: null,
        },
      },
    };

    console.log('📤 Sending data to backend:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:4000/rest/stotras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed');
    }
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testBackendAPI();
