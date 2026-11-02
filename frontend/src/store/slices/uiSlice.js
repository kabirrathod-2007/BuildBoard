import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  exploreViewMode: 'grid', // 'grid' | 'feed'
  toasts: [],
  activeModals: {},
  mobileNavOpen: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setExploreViewMode: (state, action) => {
      state.exploreViewMode = action.payload === 'list' || action.payload === 'feed' ? action.payload : 'grid'
    },
    addToast: (state, action) => {
      const { id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type = 'info', message, duration = 4000 } = action.payload
      state.toasts.push({ id, type, message, duration })
    },
    removeToast: (state, action) => {
      const id = action.payload
      state.toasts = state.toasts.filter((t) => t.id !== id)
    },
    openModal: (state, action) => {
      state.activeModals[action.payload] = true
    },
    closeModal: (state, action) => {
      state.activeModals[action.payload] = false
    },
    toggleMobileNav: (state, action) => {
      state.mobileNavOpen = typeof action.payload === 'boolean' ? action.payload : !state.mobileNavOpen
    },
  },
})

export const {
  setExploreViewMode,
  addToast,
  removeToast,
  openModal,
  closeModal,
  toggleMobileNav,
} = uiSlice.actions

export const selectExploreViewMode = (state) => state.ui.exploreViewMode
export const selectToasts = (state) => state.ui.toasts
export const selectIsModalOpen = (state, modalKey) => Boolean(state.ui.activeModals[modalKey])
export const selectMobileNavOpen = (state) => state.ui.mobileNavOpen

export default uiSlice.reducer
