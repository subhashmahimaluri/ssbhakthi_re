// Test the getRelativePath function
function getRelativePath(imageUrl) {
  if (!imageUrl) return "";

  // If already relative, return as is
  if (imageUrl.startsWith("/")) return imageUrl;

  try {
    const url = new URL(imageUrl);
    return url.pathname;
  } catch {
    return imageUrl;
  }
}

// Test with the imageUrl you provided
const testImageUrl =
  "http://localhost:3000/api/images/te/2025/10/raja-matangi-1759472337191-2pcjo1.webp";
const relativePath = getRelativePath(testImageUrl);

console.log("Original URL:", testImageUrl);
console.log("Relative path:", relativePath);

// Test backend format
const backendData = {
  contentType: "article",
  canonicalSlug: "shyamala-navratri-2022-dates",
  articleTitle: "Shyamala Navratri 2024 Dates",
  status: "draft",
  imageUrl: null,
  categories: {
    typeIds: [],
    devaIds: [],
    byNumberIds: [],
  },
  translations: {
    te: {
      title: "శ్యామల నవరాత్రి 2024 తేదీలు - Test Update",
      seoTitle: "శ్యామల నవరాత్రి 2024 తేదీలు",
      videoId: null,
      imageUrl: relativePath, // This is the key field
      stotra: null,
      stotraMeaning: null,
      body: "<p>Test body content with image update</p>",
      summary: "Test summary for image upload",
    },
  },
};

console.log("Backend payload:", JSON.stringify(backendData, null, 2));
