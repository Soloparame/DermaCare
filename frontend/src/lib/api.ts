const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiError {
  message: string;
  status?: number;
}

export async function apiFetch<TResponse, TBody = unknown>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: TBody;
    token?: string | null;
  } = {}
): Promise<TResponse> {
  const { method = "GET", body, token } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    // For client components, this will use the browser fetch.
    // For server components you can customize caching here if needed.
  });

  if (!res.ok) {
    let message = "Unexpected error";
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore JSON parsing issues, keep default message
    }
    const error: ApiError = { message, status: res.status };
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (await res.json()) as TResponse;
}

