import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import tournamentReducer from './slices/tournamentSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tournaments: tournamentReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 