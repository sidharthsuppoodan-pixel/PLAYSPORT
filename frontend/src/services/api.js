import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('playsport_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle auth expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear stale auth data if on protected endpoints
      // localStorage.removeItem('playsport_token');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  adminLogin: (email, password) => api.post('/auth/admin-login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  registerOwner: (ownerData) => api.post('/auth/register-owner', ownerData),
  getMe: () => api.get('/auth/me'),
};

export const turfsAPI = {
  getAll: (params) => api.get('/turfs', { params }),
  getMyTurfs: () => api.get('/turfs/my-turfs'),
  getPopular: (limit = 6) => api.get('/turfs/popular', { params: { limit } }),
  getByIdOrSlug: (idOrSlug) => api.get(`/turfs/${idOrSlug}`),
  create: (turfData) => api.post('/turfs', turfData),
  update: (id, turfData) => api.put(`/turfs/${id}`, turfData),
};

export const groundsAPI = {
  getByTurf: (turfId) => api.get(`/grounds/by-turf/${turfId}`),
  create: (groundData) => api.post('/grounds', groundData),
};

export const slotsAPI = {
  getByGround: (groundId, days = 7) => api.get(`/slots/by-ground/${groundId}`, { params: { days } }),
  batchGenerate: (data) => api.post('/slots/batch-generate', data),
};

export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings/create', bookingData),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
};

export const openMatchesAPI = {
  getAll: (params) => api.get('/open-matches', { params }),
  create: (matchData) => api.post('/open-matches', matchData),
  join: (id) => api.post(`/open-matches/${id}/join`),
  leave: (id) => api.post(`/open-matches/${id}/leave`),
};

export const tournamentsAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  create: (tournData) => api.post('/tournaments', tournData),
  registerTeam: (id, teamData) => api.post(`/tournaments/${id}/register-team`, teamData),
};

export const equipmentAPI = {
  getAll: (turfIdOrParams) => {
    if (typeof turfIdOrParams === 'number' || typeof turfIdOrParams === 'string') {
      return api.get('/equipment', { params: { turf_id: turfIdOrParams } });
    }
    return api.get('/equipment', { params: turfIdOrParams });
  },
  create: (eqData) => api.post('/equipment', eqData),
};

export const reviewsAPI = {
  getByTurf: (turfId) => api.get(`/reviews/by-turf/${turfId}`),
  submit: (reviewData) => api.post('/reviews', reviewData),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const adminAPI = {
  getMetrics: () => api.get('/admin/metrics'),
  getRevenueChart: (period = 'monthly') => api.get('/admin/revenue-chart', { params: { period } }),
  getPendingOwners: () => api.get('/admin/pending-owners'),
  approveOwner: (id) => api.post(`/admin/pending-owners/${id}/approve`),
  rejectOwner: (id) => api.post(`/admin/pending-owners/${id}/reject`),
  getUsers: (params) => api.get('/admin/users', { params }),
  getFacilities: () => api.get('/admin/facilities'),
  terminateFacility: (id) => api.delete(`/admin/facilities/${id}`),
  getBookings: () => api.get('/admin/bookings'),
  getSchedules: () => api.get('/admin/schedules'),
  getAnalytics: () => api.get('/admin/analytics'),
};

export const reportsAPI = {
  getOwnerDashboard: () => api.get('/reports/owner-dashboard'),
  getRecentBookings: () => api.get('/reports/recent-bookings'),
  getFacilityStatus: () => api.get('/reports/facility-status'),
};

export default api;
