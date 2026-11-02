import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../lib/api.js'

// --- Async Thunks ---

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchNotifications()
      return {
        notifications: res?.notifications || [],
        unreadCount: res?.unreadCount || 0,
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch notifications')
    }
  },
)

export const markNotificationReadThunk = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await markNotificationRead(notificationId)
      return notificationId
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark notification as read')
    }
  },
)

export const markAllNotificationsReadThunk = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await markAllNotificationsRead()
      return true
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark all notifications as read')
    }
  },
)

// --- Slice Definition ---

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
}

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload || []
      state.unreadCount = state.items.filter((n) => !n.isRead).length
    },
    markReadLocal: (state, action) => {
      const id = String(action.payload)
      const target = state.items.find((n) => String(n.id) === id)
      if (target && !target.isRead) {
        target.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllReadLocal: (state) => {
      state.items.forEach((n) => {
        n.isRead = true
      })
      state.unreadCount = 0
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.notifications || []
        state.unreadCount = action.payload.unreadCount || 0
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Mark single notification read
    builder.addCase(markNotificationReadThunk.fulfilled, (state, action) => {
      const id = String(action.payload)
      const target = state.items.find((n) => String(n.id) === id)
      if (target && !target.isRead) {
        target.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    })

    // Mark all read
    builder.addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
      state.items.forEach((n) => {
        n.isRead = true
      })
      state.unreadCount = 0
    })
  },
})

export const {
  setNotifications,
  markReadLocal,
  markAllReadLocal,
} = notificationsSlice.actions

// --- Selectors ---

export const selectAllNotifications = (state) => state.notifications.items
export const selectUnreadNotificationsCount = (state) => state.notifications.unreadCount
export const selectNotificationsLoading = (state) => state.notifications.loading

export default notificationsSlice.reducer

