const fetch = require("node-fetch");

async function debugStotraUpdate() {
  console.log("🔍 Debugging stotra update...");

  // Test direct update to backend
  const testData = {
    status: "published",
    stotraTitle: "Test Update",
    translations: {
      en: {
        title: "Updated Test Stotra",
        stotra: "Updated test content",
      },
    },
  };

  console.log(
    "📤 Sending request to:",
    "http://localhost:4000/rest/stotras/annapurna-ashtottara-shatanamavali"
  );
  console.log("📦 Request data:", JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(
      "http://localhost:4000/rest/stotras/annapurna-ashtottara-shatanamavali",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      }
    );

    console.log("📥 Response status:", response.status);
    console.log("📥 Response headers:", Object.fromEntries(response.headers));

    const responseText = await response.text();
    console.log("📥 Response body:", responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log("📥 Parsed response:", JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log("⚠️  Could not parse response as JSON");
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
}

debugStotraUpdate();
