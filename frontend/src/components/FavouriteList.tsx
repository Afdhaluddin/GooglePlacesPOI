import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useFavourites, useRemoveFavourite } from '../hooks/useFavourites';
import { favouriteFocused, allFavouritesShownOnMap } from '../features/places/placesSlice';
import type { Place, SelectedPlace } from '../types';

function toSelectedPlace(fav: Place): SelectedPlace {
  return {
    name: fav.name,
    address: fav.address,
    latitude: fav.latitude,
    longitude: fav.longitude,
    googlePlaceId: fav.googlePlaceId,
  };
}

/**
 * Favourites list backed by TanStack Query `useInfiniteQuery` (10 per page).
 * An IntersectionObserver sentinel at the bottom triggers the next page.
 * Clicking an item centers it on the map; "Show all" renders every favourite.
 */
export default function FavouriteList() {
  const dispatch = useDispatch();
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFavourites();
  const removeMutation = useRemoveFavourite();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: when the sentinel enters the viewport, load the next page.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void fetchNextPage();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  const handleRemove = useCallback(
    (id: number) => removeMutation.mutate(id),
    [removeMutation]
  );

  const handleFocus = useCallback(
    (fav: Place) => dispatch(favouriteFocused(toSelectedPlace(fav))),
    [dispatch]
  );

  const handleShowAll = useCallback(
    (all: Place[]) => dispatch(allFavouritesShownOnMap(all.map(toSelectedPlace))),
    [dispatch]
  );

  const favourites = data?.pages.flatMap((page) => page.content) ?? [];
  const total = data?.pages[0]?.totalElements ?? 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-800">
        ⭐ Favourites
        <span className="ml-2 text-xs font-normal text-gray-400">({total})</span>
      </h2>

      {isError && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          Could not load saved favourites: {error.message}
        </p>
      )}

      {isPending ? (
        <p className="text-sm text-gray-400">Loading favourites…</p>
      ) : favourites.length === 0 && !isError ? (
        <p className="text-sm text-gray-400">
          Nothing saved yet. Select a place and hit “Mark as favourite”.
        </p>
      ) : (
        <>
          <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {favourites.map((fav, idx) => (
              <li
                key={fav.id ?? `${fav.googlePlaceId}-${idx}`}
                className="flex items-start justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => handleFocus(fav)}
                  title="Show on map"
                >
                  <p className="text-sm font-medium text-gray-800 hover:text-indigo-700">
                    {fav.name}
                  </p>
                  <p className="text-xs text-gray-500">{fav.address}</p>
                  {fav.latitude != null && (
                    <p className="text-xs text-gray-400">
                      {fav.latitude}, {fav.longitude}
                    </p>
                  )}
                </div>
                {fav.id != null && (
                  <button
                    onClick={() => handleRemove(fav.id)}
                    disabled={removeMutation.isPending}
                    title="Remove from favourites"
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    🗑 Remove
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* IntersectionObserver sentinel — loads the next page when visible */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <p className="pt-2 text-center text-xs text-gray-400">Loading more…</p>
          )}
          {!hasNextPage && favourites.length > 0 && (
            <p className="pt-2 text-center text-xs text-gray-300">— end of list —</p>
          )}

          <button
            onClick={() => handleShowAll(favourites)}
            disabled={favourites.length === 0}
            className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            🗺 Show all on map
          </button>
        </>
      )}
    </section>
  );
}
