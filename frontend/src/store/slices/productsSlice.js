import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import {
  fetchProducts,
  createProductListing,
  updateProductListing,
  toggleProductPause,
  deleteProductListing,
  recordProductViewApi,
} from '../../lib/api.js'

// --- Async Thunks ---

export const fetchProductsThunk = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchProducts(params)
      return res?.products || []
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch products')
    }
  },
)

export const createProductThunk = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const res = await createProductListing(productData)
      return res?.product
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create product listing')
    }
  },
)

export const updateProductThunk = createAsyncThunk(
  'products/updateProduct',
  async ({ slugOrId, productData }, { rejectWithValue }) => {
    try {
      const res = await updateProductListing(slugOrId, productData)
      return res?.product
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update product listing')
    }
  },
)

export const toggleProductPauseThunk = createAsyncThunk(
  'products/toggleProductPause',
  async ({ slugOrId, enrollmentPaused }, { rejectWithValue }) => {
    try {
      const res = await toggleProductPause(slugOrId, enrollmentPaused)
      return { slugOrId, enrollmentPaused: res?.enrollmentPaused ?? enrollmentPaused }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to toggle product enrollment pause')
    }
  },
)

export const deleteProductThunk = createAsyncThunk(
  'products/deleteProduct',
  async (slugOrId, { rejectWithValue }) => {
    try {
      await deleteProductListing(slugOrId)
      return slugOrId
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete product listing')
    }
  },
)

export const recordProductViewThunk = createAsyncThunk(
  'products/recordProductView',
  async (productId, { rejectWithValue }) => {
    try {
      await recordProductViewApi(productId)
      return productId
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

// --- Slice Definition ---

const initialState = {
  items: [],
  loading: false,
  error: null,
  views: {},
  filters: {
    search: '',
    category: 'All',
    stage: 'All',
    role: 'All',
    industry: 'All',
    technology: 'All',
    sort: 'recommended',
  },
}

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload || []
    },
    addProductLocal: (state, action) => {
      const item = action.payload
      const existsIndex = state.items.findIndex(
        (p) => p.id === item.id || (item.slug && p.slug === item.slug),
      )
      if (existsIndex >= 0) {
        state.items[existsIndex] = { ...state.items[existsIndex], ...item }
      } else {
        state.items.unshift(item)
      }
    },
    updateProductLocal: (state, action) => {
      const updated = action.payload
      const index = state.items.findIndex(
        (p) => p.id === updated.id || (updated.slug && p.slug === updated.slug),
      )
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...updated }
      }
    },
    removeProductLocal: (state, action) => {
      const idOrSlug = String(action.payload)
      state.items = state.items.filter(
        (p) => String(p.id) !== idOrSlug && p.slug !== idOrSlug,
      )
    },
    togglePauseLocal: (state, action) => {
      const { productId, paused } = action.payload
      const product = state.items.find(
        (p) => String(p.id) === String(productId) || p.slug === productId,
      )
      if (product) {
        product.enrollmentPaused =
          typeof paused === 'boolean' ? paused : !product.enrollmentPaused
      }
    },
    incrementViewLocal: (state, action) => {
      const productId = action.payload
      if (!productId) return
      state.views[productId] = (state.views[productId] || 0) + 1
      const prod = state.items.find(
        (p) => String(p.id) === String(productId) || p.slug === productId,
      )
      if (prod) {
        prod.viewsCount = (prod.viewsCount || 0) + 1
      }
    },
    setProductsFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetProductsFilter: (state) => {
      state.filters = initialState.filters
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchProductsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.loading = false
        const incoming = (action.payload || []).map((p) => ({ ...p, isServerSynced: true }))
        // Retain any purely local demo products that aren't on server yet
        const serverKeys = new Set(incoming.flatMap((p) => [String(p.id), p.slug].filter(Boolean)))
        const localOnly = state.items.filter(
          (p) => p.isLocalDemo && !serverKeys.has(String(p.id)) && (!p.slug || !serverKeys.has(p.slug)),
        )
        state.items = [...incoming, ...localOnly]
      })
      .addCase(fetchProductsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch products'
      })

    // Create product
    builder.addCase(createProductThunk.fulfilled, (state, action) => {
      if (action.payload) {
        const product = { ...action.payload, isServerSynced: true }
        state.items = [product, ...state.items.filter((p) => p.id !== product.id)]
      }
    })

    // Update product
    builder.addCase(updateProductThunk.fulfilled, (state, action) => {
      if (action.payload) {
        const updated = { ...action.payload, isServerSynced: true }
        const index = state.items.findIndex(
          (p) => p.id === updated.id || (updated.slug && p.slug === updated.slug),
        )
        if (index >= 0) {
          state.items[index] = { ...state.items[index], ...updated }
        }
      }
    })

    // Toggle pause
    builder.addCase(toggleProductPauseThunk.fulfilled, (state, action) => {
      const { slugOrId, enrollmentPaused } = action.payload
      const product = state.items.find(
        (p) => String(p.id) === String(slugOrId) || p.slug === slugOrId,
      )
      if (product) {
        product.enrollmentPaused = enrollmentPaused
      }
    })

    // Delete product
    builder.addCase(deleteProductThunk.fulfilled, (state, action) => {
      const idOrSlug = String(action.payload)
      state.items = state.items.filter(
        (p) => String(p.id) !== idOrSlug && p.slug !== idOrSlug,
      )
    })

    // Record view
    builder.addCase(recordProductViewThunk.fulfilled, (state, action) => {
      const productId = action.payload
      if (!productId) return
      state.views[productId] = (state.views[productId] || 0) + 1
      const prod = state.items.find(
        (p) => String(p.id) === String(productId) || p.slug === productId,
      )
      if (prod) {
        prod.viewsCount = (prod.viewsCount || 0) + 1
      }
    })
  },
})

export const {
  setProducts,
  addProductLocal,
  updateProductLocal,
  removeProductLocal,
  togglePauseLocal,
  incrementViewLocal,
  setProductsFilter,
  resetProductsFilter,
} = productsSlice.actions

// --- Selectors ---

export const selectAllProducts = (state) => state.products.items
export const selectProductsLoading = (state) => state.products.loading
export const selectProductsError = (state) => state.products.error
export const selectProductsViews = (state) => state.products.views
export const selectProductsFilters = (state) => state.products.filters

export const selectProductByIdOrSlug = (state, idOrSlug) => {
  if (!idOrSlug) return null
  const str = String(idOrSlug).toLowerCase().trim()
  return (
    state.products.items.find(
      (p) => String(p.id).toLowerCase() === str || (p.slug && p.slug.toLowerCase() === str),
    ) || null
  )
}

export const selectUserProducts = createSelector(
  [selectAllProducts, (_state, userEmail) => (userEmail || '').toLowerCase().trim()],
  (products, userEmail) => {
    if (!userEmail) return []
    return products.filter(
      (p) => p.creatorEmail && p.creatorEmail.toLowerCase().trim() === userEmail,
    )
  },
)

export const selectProductViewCount = (state, productId) => {
  if (!productId) return 0
  const product = selectProductByIdOrSlug(state, productId)
  if (product && typeof product.viewsCount === 'number' && product.viewsCount > 0) {
    return product.viewsCount
  }
  return state.products.views[productId] || 0
}

export default productsSlice.reducer

