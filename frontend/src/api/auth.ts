import api from './client'

export interface User {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
}

export interface RegisterPayload {
  email: string
  password: string
  full_name?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<User>('/auth/register', data),

  login: (data: LoginPayload) =>
    api.post<{ message: string; user: User }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/auth/me'),
}
