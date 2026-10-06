import { memo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

/** Local search history (Redux UI state). Memoized — only re-renders when history changes. */
function SearchHistory() {
  const history = useSelector((state: RootState) => state.places.searchHistory);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-800">
        🔎 Search History
        <span className="ml-2 text-xs font-normal text-gray-400">({history.length})</span>
      </h2>
      {history.length === 0 ? (
        <p className="text-sm text-gray-400">No searches yet — try the search box above.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {history.map((place, idx) => (
            <li
              key={`${place.googlePlaceId}-${idx}`}
              className="rounded-lg bg-gray-50 px-3 py-2"
            >
              <p className="text-sm font-medium text-gray-800">{place.name}</p>
              <p className="text-xs text-gray-500">{place.address}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default memo(SearchHistory);
