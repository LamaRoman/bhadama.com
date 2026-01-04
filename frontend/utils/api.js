// utils/api.js
export async function api(url, options = {}) {
  console.log(`🌐 API call to: ${url}`, options.method || 'GET');
  
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Detect if the body is FormData
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` }),
    // Only set Content-Type if not FormData (browser sets it automatically for FormData)
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    // Only stringify if body exists and is not FormData
    body: isFormData 
      ? options.body 
      : (options.body ? JSON.stringify(options.body) : undefined),
    credentials: "include",
  };

  // Remove body for GET/HEAD requests
  if (["GET", "HEAD"].includes(fetchOptions.method)) {
    delete fetchOptions.body;
  }

  // Log request body for debugging (excluding FormData)
  if (fetchOptions.body && !isFormData) {
    console.log('📦 Request payload:', JSON.parse(fetchOptions.body));
  }

  try {
    console.log('⏳ Making request...');
    const res = await fetch(url, fetchOptions);
    console.log(`📡 Response status: ${res.status} ${res.statusText}`);

    // Handle no content
    if (res.status === 204) {
      console.log('✅ No content (204)');
      return {};
    }

    // Try to get response text first
    const responseText = await res.text();
    console.log('📄 Response text (first 500 chars):', responseText.substring(0, 500));

    // Handle HTTP errors
    if (!res.ok) {
      let errorData;
      try {
        errorData = responseText ? JSON.parse(responseText) : { error: `HTTP ${res.status}` };
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
        errorData = { error: `HTTP ${res.status}`, raw: responseText };
      }
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.error || errorData.message || "Request failed");
    }

    // Parse successful response
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
      console.log('✅ Response parsed successfully:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse success response:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Invalid JSON response from server');
    }

    return data;
  } catch (err) {
    console.error("❌ API Error caught:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    // Re-throw to allow component-level error handling
    throw err;
  }
}