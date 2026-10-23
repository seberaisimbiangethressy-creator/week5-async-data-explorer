
import "./style.css"
import { getProducts, getCategories, getProduct } from "./api.js"
import { render } from "./render.js"
import { debounce } from "./utils.js"

// The ONE source of truth for the whole UI.
const state = {
  items: [], // products from the API (never mutated after loading)
  categoryNames: {}, // { slug: "Display Name" } from the categories endpoint
  status: "loading", // "loading" | "success" | "error"
  error: null,
  query: "",
  filter: "all",
  sort: "default",
  details: { status: "idle", product: null, error: null }, // the modal
}

const dialog = document.querySelector("#details")

// ---------- Loading data ----------

async function load() {
  state.status = "loading"
  state.error = null
  render(state)

  try {
    // Parallel requests: both start at the same time instead of one after the other.
    // allSettled never rejects; it reports each result, so a failed categories
    // request does NOT break the app (categories are only nice-to-have names).
    const [productsResult, categoriesResult] = await Promise.allSettled([
      getProducts(),
      getCategories(),
    ])

    // Products are required: if they failed, rethrow so catch shows the error state.
    if (productsResult.status === "rejected") throw productsResult.reason

    state.items = productsResult.value.products

    // Categories are optional: use them if they arrived, otherwise fall back to {}.
    state.categoryNames =
      categoriesResult.status === "fulfilled"
        ? Object.fromEntries(categoriesResult.value.map(({ slug, name }) => [slug, name]))
        : {}

    state.status = "success"
  } catch (err) {
    state.status = "error"
    state.error = err.message
  } finally {
    render(state) // runs on success AND on error
  }
}

// ---------- Details modal ----------

async function openDetails(id) {
  state.details = { status: "loading", product: null, error: null }
  render(state)
  dialog.showModal()

  try {
    // Fetch the single item by id, as the brief requires for DummyJSON.
    state.details = { status: "success", product: await getProduct(id), error: null }
  } catch (err) {
    state.details = { status: "error", product: null, error: err.message }
  }
  render(state)
}

// ---------- Events ----------

// Debounce (bonus): wait 300 ms after the user stops typing before filtering.
const onSearch = debounce((value) => {
  state.query = value
  render(state)
}, 300)

document.querySelector("#search").addEventListener("input", (e) => onSearch(e.target.value))

document.querySelector("#filter").addEventListener("change", (e) => {
  state.filter = e.target.value
  render(state)
})

document.querySelector("#sort").addEventListener("change", (e) => {
  state.sort = e.target.value
  render(state)
})

// Event delegation: one listener on the grid handles clicks on every card,
// including cards that are created later by render().
document.querySelector("#grid").addEventListener("click", (e) => {
  const card = e.target.closest("[data-id]")
  if (card) openDetails(card.dataset.id)
})

// The Retry button is created by render(), so we also delegate from its parent.
document.querySelector("#status").addEventListener("click", (e) => {
  if (e.target.closest("#retry")) load()
})

// Reset the modal state when it closes (Close button or Esc key).
dialog.addEventListener("close", () => {
  state.details = { status: "idle", product: null, error: null }
})

load() // fetch on page open
