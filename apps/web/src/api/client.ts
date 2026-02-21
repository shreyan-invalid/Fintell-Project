import axios from "axios";
import { getAuthState } from "./authState";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api"
});

api.interceptors.request.use((request) => {
  const { token, tenant } = getAuthState();

  request.headers = request.headers ?? {};
  request.headers["x-tenant-id"] = tenant || "tenant-1";

  if (token) {
    request.headers.authorization = `Bearer ${token}`;
  } else {
    delete request.headers.authorization;
  }

  return request;
});
