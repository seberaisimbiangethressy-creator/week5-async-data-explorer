// src/utils.js — pure helper functions (no DOM, no fetch, no state mutation).
// "Pure" = same input always gives the same output and nothing outside is changed.
// That makes them easy to test and easy to explain.

/** Escape characters that have special meaning in HTML, so API text can never inject markup. */
export const escapeHTML = (str) =>
  String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  )

/** Sorting strategies keyed by the <option> values in index.html. */
const sorters = {
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  name: (a, b) => a.title.localeCompare(b.title),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
}

/**
 * Search + filter + sort in one place, built only from what is already in state.
 * filter() returns a NEW array, and toSorted() returns a NEW array too,
 * so the fetched data in state.items is never mutated and we never re-fetch.
 */
export function getVisibleItems({ items, query, filter, sort }) {
  const q = query.trim().toLowerCase()

  const filtered = items
    .filter(({ title }) => title.toLowerCase().includes(q))
    .filter(({ category }) => filter === "all" || category === filter)

  return sorters[sort] ? filtered.toSorted(sorters[sort]) : filtered
}

/** Unique category values from the data, sorted A–Z (Set removes duplicates). */
export const getUniqueCategories = (items) =>
  [...new Set(items.map(({ category }) => category))].toSorted()

/** Turn "home-decoration" into "Home Decoration" when the API gives no display name. */
export const prettify = (slug) =>
  String(slug)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

/** Stats computed with reduce: how many, average price, total stock. */
export function getStats(items) {
  const { totalPrice, totalStock } = items.reduce(
    (acc, { price, stock }) => ({
      totalPrice: acc.totalPrice + (price ?? 0),
      totalStock: acc.totalStock + (stock ?? 0),
    }),
    { totalPrice: 0, totalStock: 0 }, // starting value of the accumulator
  )
  return {
    count: items.length,
    averagePrice: items.length ? totalPrice / items.length : 0,
    totalStock,
  }
}

/** Wait `delay` ms after the LAST call before running fn (used for the search input). */
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
