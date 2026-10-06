import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { deleteFavourite, fetchFavouritesPage, saveFavourite } from '../api/places';
import type { Page, Place, SelectedPlace } from '../types';

export const FAVOURITES_QUERY_KEY = ['favourites'] as const;
const PAGE_SIZE = 10;

/**
 * Infinite query over the paginated favourites endpoint (10 per page).
 * Use together with an IntersectionObserver sentinel (see FavouriteList).
 */
export function useFavourites() {
  return useInfiniteQuery({
    queryKey: FAVOURITES_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchFavouritesPage(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page<Place>) =>
      lastPage.number + 1 < lastPage.totalPages ? lastPage.number + 1 : undefined,
  });
}

/** Save the currently selected place as a favourite, then refresh the list. */
export function useSaveFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (place: SelectedPlace) => saveFavourite(place),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FAVOURITES_QUERY_KEY });
    },
  });
}

/** Remove a favourite, then refresh the list. */
export function useRemoveFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFavourite(id),
    // Optimistic update: drop the item from every cached page immediately.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: FAVOURITES_QUERY_KEY });
      const previous = queryClient.getQueryData<InfiniteData<Page<Place>>>(FAVOURITES_QUERY_KEY);
      queryClient.setQueryData<InfiniteData<Page<Place>>>(FAVOURITES_QUERY_KEY, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                content: page.content.filter((p) => p.id !== id),
              })),
            }
          : old
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVOURITES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVOURITES_QUERY_KEY });
    },
  });
}
