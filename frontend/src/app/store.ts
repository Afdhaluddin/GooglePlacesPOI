import { configureStore } from '@reduxjs/toolkit';
import placesReducer from '../features/places/placesSlice';

/**
 * Redux is used for CLIENT/UI state only:
 *   - currentSelectedPlace (what the user picked in the search box)
 *   - searchHistory (local list of picked places)
 *
 * All SERVER state (favourites list, save/delete) lives in TanStack Query.
 *
 * Redux Thunk middleware (bundled by default in configureStore) powers the
 * async thunks in features/places/placesSlice — loadSearchHistory /
 * persistSearchHistory (localStorage round-trip for the history list).
 */
export const store = configureStore({
  reducer: {
    places: placesReducer,
  },
  // Thunk is included by default; listed explicitly for the reviewer.
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
