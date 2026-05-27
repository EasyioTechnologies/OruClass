import axios from "axios";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return ""; // use relative path, Next.js will proxy it
  }
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
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function setWorkspaceHeader(workspaceId: string) {
  apiClient.defaults.headers.common["X-Workspace-ID"] = workspaceId;
}
