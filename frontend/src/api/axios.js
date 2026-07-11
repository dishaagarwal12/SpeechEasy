// src/api/axios.js
//
// One shared axios instance for the whole app. Every page imports THIS
// instead of calling axios directly — so the backend URL only lives in
// one place, and we can automatically attach the JWT token to every
// request without repeating that logic everywhere.

import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Before every request, automatically attach the JWT token (if we have one)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
