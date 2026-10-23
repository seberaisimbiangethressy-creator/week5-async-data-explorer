// src/render.js — everything that touches the DOM.
// render(state) reads the state and draws the page. It never changes state
// and never fetches. Every API value is passed through escapeHTML before
// going into innerHTML.

import { escapeHTML, getVisibleItems, getUniqueCategories, getStats, prettify } from "./utils.js"

const $ = (selector) => document.querySelector(selector)
const money = (n) => `$${Number(n ?? 0).toFixed(2)}`

// ---------- Cards ----------

// Destructuring in the parameter list pulls out only the fields we need.
// `brand` is missing on some products, so we use ?? to give a fallback.
const cardTemplate = ({ id, title, price, rating, category, thumbnail, brand }, categoryNames) => `
  <li>
    <button
      type="button"
      data-id="${escapeHTML(id)}"
      class="flex h-full w-full flex-col rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md focus:outline-2 focus:outline-indigo-500"
    >
      <img
        src="${escapeHTML(thumbnail)}"
        alt="${escapeHTML(title)}"
        loading="lazy"
        class="aspect-square w-full rounded-lg bg-slate-100 object-contain"
      />
      <span class="mt-3 text-xs font-medium uppercase tracking-wide text-indigo-600">
        ${escapeHTML(categoryNames[category] ?? prettify(category))}
      </span>
      <span class="mt-1 font-semibold">${escapeHTML(title)}</span>
      <span class="text-sm text-slate-500">${escapeHTML(brand ?? "No brand")}</span>
      <span class="mt-auto flex items-center justify-between pt-3">
        <span class="text-lg font-bold">${money(price)}</span>
        <span class="text-sm text-amber-600">★ ${Number(rating ?? 0).toFixed(1)}</span>
      </span>
    </button>
  </li>`

const skeletonCard = () => `
  <li class="animate-pulse rounded-xl border border-slate-200 bg-white p-3" aria-hidden="true">
    <div class="aspect-square w-full rounded-lg bg-slate-200"></div>
    <div class="mt-3 h-3 w-1/3 rounded bg-slate-200"></div>
    <div class="mt-2 h-4 w-3/4 rounded bg-slate-200"></div>
    <div class="mt-4 h-5 w-1/4 rounded bg-slate-200"></div>
  </li>`

// ---------- Page sections ----------

function renderStatus({ status, error, items }, visible) {
  const box = $("#status")

  if (status === "loading") {
    box.innerHTML = `<p class="text-slate-600">Loading products…</p>`
  } else if (status === "error") {
    box.innerHTML = `
      <div class="rounded-xl border border-red-200 bg-red-50 p-4">
        <p class="font-semibold text-red-800">Oops, we couldn't load the products.</p>
        <p class="text-sm text-red-700">${escapeHTML(error)}. Check your connection and try again.</p>
        <button id="retry" type="button"
          class="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-2 focus:outline-offset-2 focus:outline-red-600">
          Retry
        </button>
      </div>`
  } else if (visible.length === 0) {
    box.innerHTML = `
      <div class="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <p class="font-semibold">No products match your search.</p>
        <p class="text-sm text-slate-600">Try a different word or choose "All categories".</p>
      </div>`
  } else {
    // Short live message so screen-reader users hear how many results there are.
    box.innerHTML = `<p class="text-sm text-slate-600">Showing ${visible.length} of ${items.length} products.</p>`
  }
}

function renderControls({ items, filter, sort, categoryNames }) {
  const select = $("#filter")
  // The options are built from the data (unique values), not hard-coded.
  const options = getUniqueCategories(items).map(
    (c) =>
      `<option value="${escapeHTML(c)}">${escapeHTML(categoryNames[c] ?? prettify(c))}</option>`,
  )
  select.innerHTML = [`<option value="all">All categories</option>`, ...options].join("")
  select.value = filter
  $("#sort").value = sort
}

function renderStats(state, visible) {
  const { count, averagePrice, totalStock } = getStats(visible)
  const stat = (label, value) => `
    <div class="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <p class="text-xs uppercase tracking-wide text-slate-500">${label}</p>
      <p class="text-xl font-bold">${value}</p>
    </div>`

  $("#stats").innerHTML =
    state.status === "success"
      ? stat("Shown", count) + stat("Average price", money(averagePrice)) + stat("Total stock", totalStock)
      : ""
}

function renderGrid(state, visible) {
  const grid = $("#grid")
  if (state.status === "loading") {
    grid.innerHTML = Array.from({ length: 8 }, skeletonCard).join("")
  } else if (state.status === "success") {
    grid.innerHTML = visible.map((item) => cardTemplate(item, state.categoryNames)).join("")
  } else {
    grid.innerHTML = ""
  }
}

function renderDetails({ details }) {
  const box = $("#details-content")
  const closeBtn = `
    <form method="dialog" class="flex justify-end p-3">
      <button class="rounded-lg bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200 focus:outline-2 focus:outline-indigo-500">Close</button>
    </form>`

  if (details.status === "loading") {
    box.innerHTML = `${closeBtn}<p id="details-title" class="animate-pulse p-6 text-slate-600">Loading details…</p>`
  } else if (details.status === "error") {
    box.innerHTML = `${closeBtn}<p id="details-title" class="p-6 text-red-700">Could not load details: ${escapeHTML(details.error)}</p>`
  } else if (details.status === "success") {
    // Optional chaining (?.) and ?? protect us when a field is missing.
    const { title, description, price, discountPercentage, brand, category, stock, rating, thumbnail, reviews } =
      details.product
    const reviewItems = (reviews ?? [])
      .slice(0, 3)
      .map(
        ({ reviewerName, rating: r, comment }) =>
          `<li class="rounded-lg bg-slate-50 p-3 text-sm"><span class="font-medium">${escapeHTML(reviewerName)}</span> · ★ ${escapeHTML(r)}<br />${escapeHTML(comment)}</li>`,
      )
      .join("")

    box.innerHTML = `
      ${closeBtn}
      <div class="grid gap-4 p-6 pt-0 sm:grid-cols-2">
        <img src="${escapeHTML(thumbnail)}" alt="${escapeHTML(title)}" class="w-full rounded-lg bg-slate-100 object-contain" />
        <div>
          <h2 id="details-title" class="text-xl font-bold">${escapeHTML(title)}</h2>
          <p class="text-sm text-slate-500">${escapeHTML(brand ?? "No brand")} · ${escapeHTML(prettify(category))}</p>
          <p class="mt-2 text-2xl font-bold">${money(price)}
            <span class="text-sm font-normal text-green-700">${Number(discountPercentage ?? 0).toFixed(0)}% off</span></p>
          <p class="mt-1 text-sm">★ ${Number(rating ?? 0).toFixed(1)} · ${escapeHTML(stock ?? 0)} in stock</p>
          <p class="mt-3 text-sm text-slate-700">${escapeHTML(description)}</p>
        </div>
      </div>
      ${reviewItems ? `<ul class="grid gap-2 p-6 pt-0">${reviewItems}</ul>` : ""}`
  }
}

// ---------- Public entry point ----------

export function render(state) {
  const visible = getVisibleItems(state) // pure function, computed fresh on each render
  renderStatus(state, visible)
  renderControls(state)
  renderStats(state, visible)
  renderGrid(state, visible)
  renderDetails(state)
}
