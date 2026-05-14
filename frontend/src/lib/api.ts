const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem("token", token);
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

export function getUser(): any {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("user");
  return s ? JSON.parse(s) : null;
}

export function setUser(user: any) {
  if (typeof window !== "undefined") localStorage.setItem("user", JSON.stringify(user));
}

export async function api(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      typeof body === "object" && body?.detail
        ? typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail)
        : `Lỗi ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export const apiGet = (path: string) => api(path);
export const apiPost = (path: string, data?: any) =>
  api(path, { method: "POST", body: data ? JSON.stringify(data) : undefined });
export const apiPut = (path: string, data: any) =>
  api(path, { method: "PUT", body: JSON.stringify(data) });
export const apiDelete = (path: string) => api(path, { method: "DELETE" });

export function formatVND(n: number | string): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("vi-VN").format(Math.round(num)) + "đ";
}

export function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("vi-VN");
}

export function formatDateTime(s: string): string {
  return new Date(s).toLocaleString("vi-VN");
}
