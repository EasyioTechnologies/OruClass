import axios from "axios";

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    // We intentionally do NOT force a redirect to /login on 401 here.
    // It causes unexpected logouts if an API endpoint throws a 401 for permission reasons.
    return Promise.reject(error);
  },
);

export function setWorkspaceHeader(workspaceId: string) {
  apiClient.defaults.headers.common["X-Workspace-ID"] = workspaceId;
}
