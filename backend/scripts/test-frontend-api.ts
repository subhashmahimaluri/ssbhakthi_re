#!/usr/bin/env tsx

/**
 * Test the frontend API route for stotra creation
 */

async function testFrontendAPI() {
  try {
    console.log('🧪 Testing frontend API route...');

    const testData = {
      title: 'Test Frontend API Title',
      stotraTitle: 'Test Frontend API Stotra Title',
      canonicalSlug: 'test-frontend-api-creation',
      stotra: '<p>Test frontend API stotra content</p>',
      stotraMeaning: '<p>Test frontend API meaning</p>',
      status: 'draft',
      locale: 'en',
      seoTitle: 'Test SEO Title',
      categoryIds: [],
      devaIds: [],
      byNumberIds: [],
      tagIds: [],
    };

    console.log('📤 Sending data to frontend API:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/stotras/create', {
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
      console.log('✅ Frontend API call successful!');
    } else {
      console.log('❌ Frontend API call failed');
    }
  } catch (error) {
    console.error('❌ Error testing frontend API:', error);
  }
}

testFrontendAPI();
