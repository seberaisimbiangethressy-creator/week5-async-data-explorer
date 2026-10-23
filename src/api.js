// src/api.js — everything that talks to the network lives here.
// No DOM code in this file, and no state: it only fetches and returns data.

// Demo helper for the video: opening the app with ?broken in the URL
// points the API at a wrong address so you can show the error + Retry state
// without editing the code.
const BASE = new URLSearchParams(location.search).has("broken")
  ? "https://dummyjson.com/this-url-is-broken"
  : "https://dummyjson.com"

/**
 * Reusable fetch helper.
 * - fetch() only rejects on network failure; a 404 or 500 still "succeeds".
 *   That is why we must check response.ok ourselves and throw an Error.
 * - Because this is an async function, a thrown Error becomes a rejected
 *   Promise, which the caller handles with try/catch.
 */
export async function getJSON(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.json()
}

export const getProducts = () => getJSON(`${BASE}/products?limit=100`)
export const getCategories = () => getJSON(`${BASE}/products/categories`)
export const getProduct = (id) => getJSON(`${BASE}/products/${id}`)
