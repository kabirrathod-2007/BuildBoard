import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import {
  submitProductFeedback,
  fetchProductFeedback,
  replyToFeedbackApi,
  toggleFeedbackHelpfulApi,
  fetchMyFeedback,
} from '../../lib/api.js'

// --- Async Thunks ---

export const fetchProductFeedbackThunk = createAsyncThunk(
  'feedback/fetchProductFeedback',
  async (slugOrId, { rejectWithValue }) => {
    try {
      const res = await fetchProductFeedback(slugOrId)
      return { slugOrId, feedback: res?.feedback || [] }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch product feedback')
    }
  },
)

export const fetchMyFeedbackThunk = createAsyncThunk(
  'feedback/fetchMyFeedback',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchMyFeedback()
      return res?.feedback || []
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch user feedback')
    }
  },
)

export const submitFeedbackThunk = createAsyncThunk(
  'feedback/submitFeedback',
  async ({ slugOrId, feedbackData }, { rejectWithValue }) => {
    try {
      const res = await submitProductFeedback(slugOrId, feedbackData)
      return res?.feedback
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to submit feedback')
    }
  },
)

export const replyFeedbackThunk = createAsyncThunk(
  'feedback/replyFeedback',
  async ({ feedbackId, replyText }, { rejectWithValue }) => {
    try {
      const res = await replyToFeedbackApi(feedbackId, replyText)
      return { feedbackId, reply: res?.reply }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to send reply')
    }
  },
)

export const toggleFeedbackHelpfulThunk = createAsyncThunk(
  'feedback/toggleHelpful',
  async (feedbackId, { rejectWithValue }) => {
    try {
      const res = await toggleFeedbackHelpfulApi(feedbackId)
      return {
        feedbackId,
        isHelpful: res?.isHelpful,
        helpfulMarkedAt: res?.helpfulMarkedAt,
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to toggle helpful mark')
    }
  },
)

// --- Slice Definition ---

const initialState = {
  items: [],
  loading: false,
  error: null,
}

export const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    setFeedbackList: (state, action) => {
      state.items = action.payload || []
    },
    addFeedbackLocal: (state, action) => {
      state.items.unshift(action.payload)
    },
    replyFeedbackLocal: (state, action) => {
      const { feedbackId, reply } = action.payload
      const item = state.items.find((fb) => String(fb.id) === String(feedbackId))
      if (item) {
        item.reply = reply
      }
    },
    toggleHelpfulLocal: (state, action) => {
      const { feedbackId, isHelpful, helpfulMarkedAt } = action.payload
      const item = state.items.find((fb) => String(fb.id) === String(feedbackId))
      if (item) {
        item.isHelpful = isHelpful
        item.helpfulMarkedAt = helpfulMarkedAt
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch product feedback
    builder
      .addCase(fetchProductFeedbackThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchProductFeedbackThunk.fulfilled, (state, action) => {
        state.loading = false
        const incoming = action.payload.feedback || []
        const incomingIds = new Set(incoming.map((f) => String(f.id)))
        const remaining = state.items.filter((f) => !incomingIds.has(String(f.id)))
        state.items = [...incoming, ...remaining]
      })
      .addCase(fetchProductFeedbackThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Fetch user feedback
    builder.addCase(fetchMyFeedbackThunk.fulfilled, (state, action) => {
      const incoming = action.payload || []
      const incomingIds = new Set(incoming.map((f) => String(f.id)))
      const remaining = state.items.filter((f) => !incomingIds.has(String(f.id)))
      state.items = [...incoming, ...remaining]
    })

    // Submit feedback
    builder.addCase(submitFeedbackThunk.fulfilled, (state, action) => {
      if (action.payload) {
        const item = action.payload
        state.items = [item, ...state.items.filter((f) => String(f.id) !== String(item.id))]
      }
    })

    // Reply to feedback
    builder.addCase(replyFeedbackThunk.fulfilled, (state, action) => {
      const { feedbackId, reply } = action.payload
      const item = state.items.find((fb) => String(fb.id) === String(feedbackId))
      if (item) {
        item.reply = reply
      }
    })

    // Toggle helpful
    builder.addCase(toggleFeedbackHelpfulThunk.fulfilled, (state, action) => {
      const { feedbackId, isHelpful, helpfulMarkedAt } = action.payload
      const item = state.items.find((fb) => String(fb.id) === String(feedbackId))
      if (item) {
        item.isHelpful = isHelpful
        item.helpfulMarkedAt = helpfulMarkedAt
      }
    })
  },
})

export const {
  setFeedbackList,
  addFeedbackLocal,
  replyFeedbackLocal,
  toggleHelpfulLocal,
} = feedbackSlice.actions

// --- Selectors ---

export const selectAllFeedback = (state) => state.feedback.items
export const selectFeedbackLoading = (state) => state.feedback.loading
export const selectFeedbackError = (state) => state.feedback.error

export const selectProductFeedback = createSelector(
  [selectAllFeedback, (_state, productId) => String(productId || '').trim()],
  (feedbackList, strId) => {
    if (!strId) return []
    return feedbackList.filter(
      (fb) => String(fb.productId) === strId || fb.productId === strId,
    )
  },
)

export const selectUserFeedback = createSelector(
  [selectAllFeedback, (_state, userEmail) => (userEmail || '').toLowerCase().trim()],
  (feedbackList, userEmail) => {
    if (!userEmail) return []
    return feedbackList
      .filter((fb) => fb.userEmail && fb.userEmail.toLowerCase().trim() === userEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },
)

export const selectTesterRecognition = createSelector(
  [selectAllFeedback, (_state, userEmail) => (userEmail || '').toLowerCase().trim()],
  (feedbackList, userEmail) => {
    if (!userEmail) return { totalPoints: 0, helpfulCount: 0, items: [] }
    const helpfulItems = feedbackList.filter(
      (fb) => fb.userEmail && fb.userEmail.toLowerCase().trim() === userEmail && fb.isHelpful,
    )
    return {
      totalPoints: helpfulItems.length,
      helpfulCount: helpfulItems.length,
      items: helpfulItems,
    }
  },
)

export default feedbackSlice.reducer
