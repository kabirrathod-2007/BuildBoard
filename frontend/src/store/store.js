import { configureStore } from '@reduxjs/toolkit'
import productsReducer from './slices/productsSlice.js'
import problemsReducer from './slices/problemsSlice.js'
import feedbackReducer from './slices/feedbackSlice.js'
import enrollmentsReducer from './slices/enrollmentsSlice.js'
import notificationsReducer from './slices/notificationsSlice.js'
import profilesReducer from './slices/profilesSlice.js'
import uiReducer from './slices/uiSlice.js'

export const store = configureStore({
  reducer: {
    products: productsReducer,
    problems: problemsReducer,
    feedback: feedbackReducer,
    enrollments: enrollmentsReducer,
    notifications: notificationsReducer,
    profiles: profilesReducer,
    ui: uiReducer,
  },
  devTools: import.meta.env.DEV,
})

export default store
