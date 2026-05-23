import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // send HTTP-only cookie automatically
  headers: { 'Content-Type': 'application/json' },
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthRoute =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register'
      if (!isAuthRoute) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
