import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * One axios instance for the whole app.
 *
 * The access token lives in a module variable, NOT localStorage. localStorage is
 * readable by any script on the page, so an XSS bug there hands an attacker a
 * valid session. Keeping it in memory means a refresh loses it, which is exactly
 * why the refresh token exists as an httpOnly cookie.
 */
let accessToken = null;
export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// --- silent refresh -------------------------------------------------------
// When a request 401s because the 15-minute access token expired, retry it once
// after refreshing. Concurrent 401s share a single refresh call via this promise,
// otherwise five parallel requests would fire five refreshes.
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retried && !original.url.includes('/auth/')) {
      original._retried = true;
      try {
        refreshing = refreshing || api.post('/auth/refresh').finally(() => { refreshing = null; });
        const { data } = await refreshing;
        setAccessToken(data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:expired'));
      }
    }

    // Normalise every failure into a plain Error with the server's message,
    // so components never dig through error.response.data themselves.
    const message = error.response?.data?.message || error.message || 'Network error';
    const wrapped = new Error(message);
    wrapped.status = status;
    wrapped.details = error.response?.data?.details;
    return Promise.reject(wrapped);
  }
);