// frontend/utils/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export async function api(endpoint, options = {}) {
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
  
  try {
    const url = `${API_URL}${endpoint}`;
    const res = await fetch(url, fetchOptions);
    
    // Handle no content
    if (res.status === 204) {
      return {};
    }
    
    // Handle HTTP errors
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: `HTTP ${res.status}` };
      }
      throw new Error(errorData.error || errorData.message || "Request failed");
    }
    
    // Parse successful response
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("API Error:", err);
    // Re-throw to allow component-level error handling
    throw err;
  }
}