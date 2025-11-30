export async function api(url, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    body: options.body && typeof options.body === "object" ? JSON.stringify(options.body) : options.body,
  };

  const res = await fetch(`http://localhost:5001${url}`, fetchOptions);
  const data = await res.json();
  return data;
}
