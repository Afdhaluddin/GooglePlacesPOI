import { request } from './client';
import type { Page, Place, SelectedPlace } from '../types';

/** GET /places?page=&size= (Bearer) → Spring Page<Place> */
export function fetchFavouritesPage(page: number, size = 10): Promise<Page<Place>> {
  return request<Page<Place>>(`/places?page=${page}&size=${size}`);
}

/** POST /places (Bearer) → 201 Place */
export function saveFavourite(place: SelectedPlace): Promise<Place> {
  return request<Place>('/places', {
    method: 'POST',
    body: JSON.stringify(place),
  });
}

/** DELETE /places/{id} (Bearer) → 204 */
export function deleteFavourite(id: number): Promise<null> {
  return request<null>(`/places/${id}`, { method: 'DELETE' });
}
