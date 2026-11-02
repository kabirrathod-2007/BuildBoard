import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchUserProfile,
  saveUserProfile,
  fetchPublicProfile,
} from '../../lib/api.js'

// --- Async Thunks ---

export const fetchUserProfileThunk = createAsyncThunk(
  'profiles/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchUserProfile()
      return res?.profile
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch user profile')
    }
  },
)

export const saveUserProfileThunk = createAsyncThunk(
  'profiles/saveUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await saveUserProfile(profileData)
      return res?.profile
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to save user profile')
    }
  },
)

export const fetchPublicProfileThunk = createAsyncThunk(
  'profiles/fetchPublicProfile',
  async (username, { rejectWithValue }) => {
    try {
      const res = await fetchPublicProfile(username)
      return res?.profile
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch public profile')
    }
  },
)

// --- Slice Definition ---

const initialState = {
  // mapping email -> profile
  profilesByEmail: {},
  activeProfile: null,
  publicProfiles: {}, // username -> profile
  loading: false,
  error: null,
}

export const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setProfileLocal: (state, action) => {
      const { userEmail, profile } = action.payload
      if (!userEmail || !profile) return
      const normalized = userEmail.toLowerCase().trim()
      state.profilesByEmail[normalized] = {
        ...state.profilesByEmail[normalized],
        ...profile,
      }
      if (state.activeProfile && (state.activeProfile.email || '').toLowerCase().trim() === normalized) {
        state.activeProfile = { ...state.activeProfile, ...profile }
      }
    },
    setActiveProfile: (state, action) => {
      state.activeProfile = action.payload
      if (action.payload?.email) {
        state.profilesByEmail[action.payload.email.toLowerCase().trim()] = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchUserProfileThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserProfileThunk.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.activeProfile = action.payload
          if (action.payload.email) {
            state.profilesByEmail[action.payload.email.toLowerCase().trim()] = action.payload
          }
        }
      })
      .addCase(fetchUserProfileThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Save profile
    builder.addCase(saveUserProfileThunk.fulfilled, (state, action) => {
      if (action.payload) {
        state.activeProfile = action.payload
        if (action.payload.email) {
          state.profilesByEmail[action.payload.email.toLowerCase().trim()] = action.payload
        }
      }
    })

    // Public profile
    builder.addCase(fetchPublicProfileThunk.fulfilled, (state, action) => {
      if (action.payload?.username) {
        state.publicProfiles[action.payload.username.toLowerCase()] = action.payload
      }
    })
  },
})

export const { setProfileLocal, setActiveProfile } = profilesSlice.actions

// --- Selectors ---

export const selectAllProfiles = (state) => state.profiles.profilesByEmail
export const selectActiveProfile = (state) => state.profiles.activeProfile
export const selectProfileLoading = (state) => state.profiles.loading
export const selectProfileError = (state) => state.profiles.error

export const selectProfileByEmail = (state, email) => {
  if (!email) return null
  return state.profiles.profilesByEmail[email.toLowerCase().trim()] || null
}

export const selectPublicProfileByUsername = (state, username) => {
  if (!username) return null
  return state.profiles.publicProfiles[username.toLowerCase().trim()] || null
}

export default profilesSlice.reducer

