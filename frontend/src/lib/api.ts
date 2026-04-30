import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Relative proxy paths — Next.js rewrites route them to the correct backend service.
// This works identically in dev (→ localhost:3001/3002) and in Docker (→ auth-service:6001, master-service:6002).
const AUTH_API   = '/proxy/auth';
const MASTER_API = '/proxy/master';

function createClient(baseURL: string) {
  const client = axios.create({ baseURL, timeout: 15000 });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-DB-Type'] = Cookies.get('db_type') || 'postgres';
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        const refresh = Cookies.get('refresh_token');
        if (refresh) {
          try {
            const { data } = await axios.post(`/proxy/auth/auth/refresh`, { refreshToken: refresh });
            const newToken = data?.data?.accessToken;
            if (newToken) {
              Cookies.set('access_token', newToken, { expires: 1 });
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return client(error.config);
              }
            }
          } catch {
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            if (typeof window !== 'undefined') window.location.href = '/login';
          }
        } else {
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const authApi   = createClient(AUTH_API);
export const masterApi = createClient(MASTER_API);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  return String(error);
}
