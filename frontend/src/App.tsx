import { Suspense, lazy, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SearchBox from './components/SearchBox';
import SearchHistory from './components/SearchHistory';
import FavouriteList from './components/FavouriteList';
import FavouriteButton from './components/FavouriteButton';
import AuthCard from './components/AuthCard';
import { useAuth } from './auth/AuthContext';
import { loadSearchHistory } from './features/places/placesSlice';
import type { AppDispatch, RootState } from './app/store';

// Code splitting: the map pulls in the heavy Google Maps JS, so it ships
// as a separate chunk and loads on demand.
const MapView = lazy(() => import('./components/MapView'));

function MapSkeleton() {
  return (
    <div className="flex h-full min-h-[320px] w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
      <p className="flex items-center gap-2 text-sm text-gray-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
        Loading map…
      </p>
    </div>
  );
}

function AuthenticatedApp() {
  const place = useSelector((state: RootState) => state.places.currentSelectedPlace);
  const { logout } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  // Redux Thunk: restore the persisted search history on startup
  useEffect(() => {
    void dispatch(loadSearchHistory());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-start justify-between px-4 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📍 Places Favourites</h1>
            <p className="text-sm text-gray-500">
              Search a place, view it on the map, and save your favourites.
            </p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Search box (top) */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <SearchBox />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Map + selected place (center) */}
          <div className="lg:col-span-2">
            <Suspense fallback={<MapSkeleton />}>
              <MapView />
            </Suspense>

            {place && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">{place.name}</h2>
                <p className="text-sm text-gray-600">{place.address}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {place.latitude}, {place.longitude} · Place ID: {place.googlePlaceId}
                </p>
                <FavouriteButton />
              </div>
            )}
          </div>

          {/* Sidebar: history + favourites */}
          <aside className="space-y-6">
            <SearchHistory />
            <FavouriteList />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedApp /> : <AuthCard />;
}
