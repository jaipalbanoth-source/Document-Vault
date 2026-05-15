import { create } from 'zustand'
import { authApi, type User } from '../api/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),

  fetchMe: async () => {
    set({ isLoading: true })
    try {
      const res = await authApi.me()
      set({ user: res.data, isLoading: false, isInitialized: true })
    } catch {
      set({ user: null, isLoading: false, isInitialized: true })
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      set({ user: null })
      window.location.href = '/login'
    }
  },
}))
