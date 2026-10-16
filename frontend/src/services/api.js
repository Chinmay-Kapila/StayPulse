import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staypulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Hotel APIs
export const getHotels = async (params = {}) => {
  const response = await api.get('/hotels/search', { params });
  return response.data;
};

export const getCities = async () => {
  const response = await api.get('/hotels/cities');
  return response.data;
};

export const getChains = async () => {
  const response = await api.get('/hotels/chains');
  return response.data;
};

export const getHotelDetail = async (id) => {
  const response = await api.get(`/hotels/${id}`);
  return response.data;
};

export const getHotelRooms = async (id) => {
  const response = await api.get(`/hotels/${id}/rooms`);
  return response.data;
};

// Reservation APIs
export const createReservation = async (data) => {
  const response = await api.post('/reservations', data);
  return response.data;
};

export const getReservation = async (bookingId, email = null) => {
  const response = await api.get(`/reservations/${bookingId}`, {
    params: email ? { email } : {},
  });
  return response.data;
};

export const requestLateHold = async (bookingId, data) => {
  const response = await api.put(`/reservations/${bookingId}/hold`, data);
  return response.data;
};

export const cancelReservation = async (bookingId, reason = "Change of travel plans") => {
  const response = await api.post(`/reservations/${bookingId}/cancel`, { reason });
  return response.data;
};

// Payment APIs
export const verifyPayment = async (data) => {
  const response = await api.post('/payments/verify', data);
  return response.data;
};

export const mockPayment = async (bookingId) => {
  const response = await api.post(`/payments/mock-pay/${bookingId}`);
  return response.data;
};

// Auth APIs
export const googleAuth = async (credential) => {
  const response = await api.post('/auth/google', { credential });
  return response.data;
};

export const signInWithEmail = async (email, name = null) => {
  const response = await api.post('/auth/signin-email', { email, name });
  return response.data;
};

export const generateDevToken = async (email, name = 'Developer', role = 'admin') => {
  const response = await api.post('/auth/dev-token', { email, name, role });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Admin APIs
export const adminListHotels = async () => {
  const response = await api.get('/admin/hotels');
  return response.data;
};

export const adminCreateHotel = async (data) => {
  const response = await api.post('/admin/hotels', data);
  return response.data;
};

export const adminUpdateHotel = async (id, data) => {
  const response = await api.put(`/admin/hotels/${id}`, data);
  return response.data;
};

export const adminDeleteHotel = async (id) => {
  const response = await api.delete(`/admin/hotels/${id}`);
  return response.data;
};

export const adminCreateRoom = async (hotelId, data) => {
  const response = await api.post(`/admin/hotels/${hotelId}/rooms`, data);
  return response.data;
};

export const adminUpdateRoom = async (roomId, data) => {
  const response = await api.put(`/admin/rooms/${roomId}`, data);
  return response.data;
};

export const adminDeleteRoom = async (roomId) => {
  const response = await api.delete(`/admin/rooms/${roomId}`);
  return response.data;
};

export const adminListReservations = async (status = null) => {
  const response = await api.get('/admin/reservations', {
    params: status ? { status } : {},
  });
  return response.data;
};

export const adminUpdateReservationStatus = async (id, status, notes = '') => {
  const response = await api.put(`/admin/reservations/${id}/status`, { status, notes });
  return response.data;
};

export const adminCancelReservation = async (id, reason = 'Cancelled by Administrator') => {
  const response = await api.post(`/admin/reservations/${id}/cancel`, { reason });
  return response.data;
};

export const adminResetSeed = async () => {
  const response = await api.post('/admin/seed/reset');
  return response.data;
};

export default api;
