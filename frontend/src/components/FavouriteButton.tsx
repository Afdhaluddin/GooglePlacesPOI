import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSaveFavourite } from '../hooks/useFavourites';
import type { RootState } from '../app/store';

/** Saves the currently selected place via a TanStack Query mutation. */
export default function FavouriteButton() {
  const place = useSelector((state: RootState) => state.places.currentSelectedPlace);
  const saveMutation = useSaveFavourite();

  const handleSave = useCallback(() => {
    if (place) saveMutation.mutate(place);
  }, [place, saveMutation]);

  if (!place) return null;

  return (
    <div className="mt-3">
      <button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {saveMutation.isPending ? 'Saving…' : '★ Mark as favourite'}
      </button>

      {saveMutation.isSuccess && (
        <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          ✅ Saved “{saveMutation.data.name}” to your favourites!
        </p>
      )}
      {saveMutation.isError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ❌ {saveMutation.error.message}
        </p>
      )}
    </div>
  );
}
