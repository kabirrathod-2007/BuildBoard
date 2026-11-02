import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import {
  enrollInProductApi,
  unenrollFromProductApi,
  fetchMyEnrollments,
} from '../../lib/api.js'

// --- Async Thunks ---

export const fetchMyEnrollmentsThunk = createAsyncThunk(
  'enrollments/fetchMyEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchMyEnrollments()
      return res?.enrollments || []
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch enrollments')
    }
  },
)

export const enrollInProductThunk = createAsyncThunk(
  'enrollments/enrollInProduct',
  async ({ slugOrId, userEmail }, { rejectWithValue }) => {
    try {
      const res = await enrollInProductApi(slugOrId)
      return {
        slugOrId,
        userEmail,
        enrolled: res?.enrolled,
        enrolledAt: res?.enrolledAt || new Date().toISOString(),
        productUrl: res?.productUrl,
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to enroll in prototype')
    }
  },
)

export const unenrollFromProductThunk = createAsyncThunk(
  'enrollments/unenrollFromProduct',
  async ({ slugOrId, userEmail }, { rejectWithValue }) => {
    try {
      await unenrollFromProductApi(slugOrId)
      return { slugOrId, userEmail }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to unenroll from prototype')
    }
  },
)

// --- Slice Definition ---

const initialState = {
  // key: "userEmail:productId", value: enrolledAt ISO string
  items: {},
  reminderDismissals: {},
  loading: false,
  error: null,
}

export const enrollmentsSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {
    setEnrollments: (state, action) => {
      state.items = action.payload || {}
    },
    setEnrollmentLocal: (state, action) => {
      const { userEmail, productId, enrolledAt = new Date().toISOString() } = action.payload
      if (!userEmail || !productId) return
      const key = `${userEmail.toLowerCase().trim()}:${productId}`
      state.items[key] = enrolledAt
    },
    removeEnrollmentLocal: (state, action) => {
      const { userEmail, productId } = action.payload
      if (!userEmail || !productId) return
      const key = `${userEmail.toLowerCase().trim()}:${productId}`
      delete state.items[key]
    },
    dismissReminderLocal: (state, action) => {
      const { userEmail, productId, dismissedAt = new Date().toISOString() } = action.payload
      if (!userEmail || !productId) return
      const key = `${userEmail.toLowerCase().trim()}:${productId}`
      state.reminderDismissals[key] = dismissedAt
    },
    setReminderDismissals: (state, action) => {
      state.reminderDismissals = action.payload || {}
    },
  },
  extraReducers: (builder) => {
    // Fetch my enrollments
    builder
      .addCase(fetchMyEnrollmentsThunk.fulfilled, (state, action) => {
        const enrollments = action.payload || []
        for (const item of enrollments) {
          if (item.userEmail && item.productId) {
            const key = `${item.userEmail.toLowerCase().trim()}:${item.productId}`
            state.items[key] = item.enrolledAt || new Date().toISOString()
          }
        }
      })

    // Enroll in product
    builder.addCase(enrollInProductThunk.fulfilled, (state, action) => {
      const { slugOrId, userEmail, enrolledAt } = action.payload
      if (userEmail && slugOrId) {
        const key = `${userEmail.toLowerCase().trim()}:${slugOrId}`
        state.items[key] = enrolledAt
      }
    })

    // Unenroll
    builder.addCase(unenrollFromProductThunk.fulfilled, (state, action) => {
      const { slugOrId, userEmail } = action.payload
      if (userEmail && slugOrId) {
        const key = `${userEmail.toLowerCase().trim()}:${slugOrId}`
        delete state.items[key]
      }
    })
  },
})

export const {
  setEnrollments,
  setEnrollmentLocal,
  removeEnrollmentLocal,
  dismissReminderLocal,
  setReminderDismissals,
} = enrollmentsSlice.actions

// --- Selectors ---

export const selectEnrollments = (state) => state.enrollments.items
export const selectReminderDismissals = (state) => state.enrollments.reminderDismissals

export const selectIsEnrolledInProduct = createSelector(
  [selectEnrollments, (_state, productId) => productId, (_state, _productId, userEmail) => userEmail],
  (enrollments, productId, userEmail) => {
    if (!productId || !userEmail) return false
    const key = `${userEmail.toLowerCase().trim()}:${productId}`
    return Boolean(enrollments[key])
  },
)

export const selectProductEnrollmentCount = createSelector(
  [selectEnrollments, (_state, productId) => productId],
  (enrollments, productId) => {
    if (!productId) return 0
    const strId = String(productId)
    return Object.keys(enrollments).filter((k) => k.endsWith(`:${strId}`)).length
  },
)

export default enrollmentsSlice.reducer

