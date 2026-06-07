const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.your-domain.com/v1";

function getToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("riprint-user-store");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? "";
  } catch {
    return "";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...rest } = options;
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = await res.json();
      message = err.message ?? err.error ?? message;
    } catch { /* ignore */ }
    throw Object.assign(new Error(message), { status: res.status });
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string, opts?: RequestOptions) => request<T>(path, { method: "GET",    ...opts }),
  post:   <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>(path, { method: "POST",   body, ...opts }),
  patch:  <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>(path, { method: "PATCH",  body, ...opts }),
  put:    <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>(path, { method: "PUT",    body, ...opts }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { method: "DELETE", ...opts }),
};
