// utils/api.js
export async function api(url, options = {}) {
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

  try {
    const res = await fetch(`http://localhost:5001${url}`, fetchOptions);

    // If no content, return empty object
    if (res.status === 204) return {};

    // Try to parse JSON
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || data.message || "Unknown error" };
    }

    return data;
  } catch (err) {
    console.error(err.message);
    return { error: "Network or server error" };
  }
}