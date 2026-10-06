/** Shared domain types for the Places Favourites frontend. */

/** A place as selected from Google Places (before saving). */
export interface SelectedPlace {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string;
}

/** A favourite place persisted by the backend (has a server id). */
export interface Place extends SelectedPlace {
  id: number;
}

/** Spring Data `Page` JSON shape. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index (0-based)
  size: number;
}

/** POST /api/v1/auth/register → 201 */
export interface RegisterResponse {
  id: number;
  username: string;
}

/** POST /api/v1/auth/login → 200 */
export interface AuthResponse {
  token: string;
}

/** Backend error payload (Spring-style). */
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
