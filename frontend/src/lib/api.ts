const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "http://localhost:4000/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiError {
  message: string;
  status?: number;
}

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  const statusMessages: Record<number, string> = {
    400: "Invalid request. Please check your input.",
    401: "Please sign in to continue.",
    403: "You don't have permission for this action.",
    404: "The requested resource was not found.",
    409: "This action conflicts with existing data.",
    500: "Server error. Please try again later.",
  };
  const messageDefault = statusMessages[res.status] ?? fallback;
  try {
    const text = await res.text();
    if (text) {
      const data = JSON.parse(text) as { message?: string };
      if (data?.message && typeof data.message === "string") {
        return data.message;
      }
    }
  } catch {
    // Use fallback
  }
  return messageDefault;
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

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw { message: `Cannot reach server. ${msg} Ensure backend is running at ${API_BASE_URL.replace("/api", "")}.`, status: 0 } as ApiError;
  }

  if (!res.ok) {
    const msg = await getErrorMessage(res, "An error occurred. Please try again.");
    throw { message: msg, status: res.status } as ApiError;
  }

  const text = await res.text();
  if (!text || text.trim() === "") {
    return undefined as TResponse;
  }
  try {
    return JSON.parse(text) as TResponse;
  } catch {
    throw { message: "Invalid response from server.", status: res.status } as ApiError;
  }
}
