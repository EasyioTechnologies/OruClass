import axios from "axios";
import { getAccessToken, setTokens, clearTokens } from "./token-storage";

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
  // Send the httpOnly refresh-token cookie on auth requests (cross-origin, same-site).
  withCredentials: true,
});

// Attach Bearer token to every request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — attempt token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Let callers handle EMAIL_NOT_VERIFIED — don't redirect here to avoid loops
    if (error.response?.status === 403 && error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
      return Promise.reject(error);
    }

    // Don't retry auth endpoints or already-retried requests
    const isAuthTokenEndpoint = ["/api/auth/login", "/api/auth/signup", "/api/auth/refresh", "/api/auth/logout"].some(
      (ep) => originalRequest.url?.includes(ep),
    );
    if (error.response?.status !== 401 || originalRequest._retry || isAuthTokenEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh token is sent automatically via the httpOnly cookie.
      const { data } = await axios.post(`${getBaseUrl()}/api/auth/refresh`, {}, { withCredentials: true });
      setTokens(data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      processQueue(null, data.accessToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Only nuke the session + redirect when the refresh token is genuinely rejected (401).
      // Network errors / API restarts (no response, or 5xx) must NOT log out a live participant —
      // the original call fails this once and retries naturally once the API is back.
      if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function setWorkspaceHeader(workspaceId: string) {
  apiClient.defaults.headers.common["X-Workspace-ID"] = workspaceId;
}
