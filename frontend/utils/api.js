// utils/api.js

// ✅ FIXED: Add API base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export async function api(url, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  // ✅ FIXED: Prepend API_BASE_URL if url doesn't start with http
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  console.log('📤 Sending to:', fullUrl);
console.log('📤 Body:', options.body);
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
  
  try {
    const res = await fetch(fullUrl, fetchOptions);
    
    // Handle no content
    if (res.status === 204) {
      return {};
    }
    
    // Try to get response text first
    const responseText = await res.text();
    
    // Handle HTTP errors
    if (!res.ok) {
      let errorData;
      try {
        errorData = responseText ? JSON.parse(responseText) : { error: `HTTP ${res.status}` };
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorData = { error: `HTTP ${res.status}`, raw: responseText };
      }
      console.error('API Error:', errorData);
      throw new Error(errorData.error || errorData.message || "Request failed");
    }
    
    // Parse successful response
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Invalid JSON response from server');
    }
    
    return data;
  } catch (err) {
    console.error("API Error:", err.message);
    // Re-throw to allow component-level error handling
    throw err;
  }
}