import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SelectedPlace } from '../../types';

const HISTORY_STORAGE_KEY = 'places.searchHistory';

/**
 * Redux Thunk middleware (createAsyncThunk) — async UI-state flows.
 * Server state (favourites) is owned by TanStack Query; these thunks handle
 * the asynchronous persistence of the search history to localStorage, which
 * is client state and belongs here.
 */
export const loadSearchHistory = createAsyncThunk('places/loadSearchHistory', async () => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SelectedPlace[]) : [];
  } catch {
    return [] as SelectedPlace[];
  }
});

export const persistSearchHistory = createAsyncThunk<
  void,
  void,
  { state: { places: PlacesState } }
>('places/persistSearchHistory', async (_, { getState }) => {
  const history = getState().places.searchHistory.slice(0, 50); // cap stored history
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
});

/**
 * UI state only — no server data here anymore.
 * Favourites (server state) are owned by TanStack Query; see api/places.ts
 * and the useFavourites/useSaveFavourite/useRemoveFavourite hooks.
 */
interface PlacesState {
  currentSelectedPlace: SelectedPlace | null;
  searchHistory: SelectedPlace[]; // every selected place, most recent first
  /** When non-empty, the map renders ALL these places as markers (fit to bounds). */
  mapPlaces: SelectedPlace[];
}

const initialState: PlacesState = {
  currentSelectedPlace: null,
  searchHistory: [],
  mapPlaces: [],
};

const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    placeSelected(state, action: PayloadAction<SelectedPlace>) {
      const place = action.payload;
      state.currentSelectedPlace = place;
      state.mapPlaces = [];
      // record in history, most recent first, avoid duplicates
      state.searchHistory = [
        place,
        ...state.searchHistory.filter((p) => p.googlePlaceId !== place.googlePlaceId),
      ];
    },
    /** Clicking a favourite in the list → show just that place on the map. */
    favouriteFocused(state, action: PayloadAction<SelectedPlace>) {
      state.currentSelectedPlace = action.payload;
      state.mapPlaces = [];
    },
    /** "Show all" → render every favourite as a marker on the map. */
    allFavouritesShownOnMap(state, action: PayloadAction<SelectedPlace[]>) {
      state.mapPlaces = action.payload;
    },
    mapPlacesCleared(state) {
      state.mapPlaces = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadSearchHistory.fulfilled, (state, action) => {
      state.searchHistory = action.payload;
    });
  },
});

export const { placeSelected, favouriteFocused, allFavouritesShownOnMap, mapPlacesCleared } =
  placesSlice.actions;
export default placesSlice.reducer;
