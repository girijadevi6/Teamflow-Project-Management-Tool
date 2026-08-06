import axios from 'axios'

// In production (Render), set VITE_API_URL at build time to the deployed
// backend URL, e.g. https://teamflow-backend.onrender.com
// Falls back to localhost for local development.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tf_token')
      localStorage.removeItem('tf_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
