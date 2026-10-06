import type { ApiErrorBody } from '../types';

/**
 * Central fetch wrapper for the Spring Boot backend.
 *
 * - Resolves the base URL from env (see below).
 * - Attaches `Authorization: Bearer <token>` when a token is stored.
 * - Parses the backend error JSON ({timestamp,status,error,message,path})
 *   and throws an {@link ApiError} carrying the backend `message`.
 * - On HTTP 401 it notifies the registered handler (used to force logout).
 */

const TOKEN_KEY = 'places.auth.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Called whenever the API answers 401 — wired up by the AuthProvider. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

/**
 * Base URL resolution:
 * - `VITE_API_BASE_URL` set   → used as-is (e.g. "https://api.example.com/api/v1").
 * - unset                     → "/api/v1", which Vite proxies to http://localhost:8080 in dev.
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function request<T>(
  path: string,
  options: RequestInit = {},
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    // Backend down / CORS / connection refused etc.
    throw new ApiError(
      0,
      'Could not reach the backend server (http://localhost:8080). Please make sure the Spring Boot API is running.'
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Token missing/expired/invalid → force the app back to the login screen.
      onUnauthorized?.();
      throw new ApiError(401, 'Your session has expired. Please log in again.');
    }

    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      /* non-JSON error body — fall through */
    }
    throw new ApiError(
      response.status,
      body?.message || `Request failed (${response.status})`,
      body
    );
  }

  // 204 No Content (e.g. DELETE) → nothing to parse
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}
