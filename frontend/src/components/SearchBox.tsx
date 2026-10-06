import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { placeSelected, persistSearchHistory } from '../features/places/placesSlice';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';
import type { AppDispatch } from '../app/store';
import type { SelectedPlace } from '../types';

export default function SearchBox() {
  const dispatch = useDispatch<AppDispatch>();
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Stable handlers so the autocomplete element isn't re-created per render
  const handlePlaceSelected = useCallback(
    (place: SelectedPlace) => {
      dispatch(placeSelected(place));
      // Redux Thunk: asynchronously persist the updated history
      dispatch(persistSearchHistory());
    },
    [dispatch]
  );
  const handleLatency = useCallback((ms: number) => setLatencyMs(ms), []);

  const { containerRef, isLoaded, error } = usePlacesAutocomplete(
    handlePlaceSelected,
    handleLatency
  );

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor="place-search" className="block text-sm font-medium text-gray-700">
          Search for a place
        </label>
        {latencyMs !== null && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              latencyMs < 300
                ? 'bg-green-100 text-green-700'
                : latencyMs < 800
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
            }`}
            title="Time from keystroke to suggestions appearing (Google API round-trip)"
          >
            ⚡ {latencyMs} ms
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className={`place-autocomplete-container w-full rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 ${error ? 'bg-gray-100' : ''}`}
      />
      {!isLoaded && !error && (
        <p className="mt-1 text-xs text-gray-400">Loading Google Places…</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">⚠ {error}</p>}
    </div>
  );
}
