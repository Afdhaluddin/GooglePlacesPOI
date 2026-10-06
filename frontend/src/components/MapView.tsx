import { memo, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { loadGoogleMaps } from '../hooks/usePlacesAutocomplete';
import type { RootState } from '../app/store';

/**
 * Renders a Google Map centered on the currently selected place with a marker.
 * Falls back to a static lat/lng card + Google Maps link if the JS API failed to load.
 *
 * Wrapped in React.memo: it re-renders only when the selected place in the
 * Redux store actually changes.
 *
 * EXTENSION POINT — marker clustering:
 * If favourites are ever rendered on the map as markers, install
 * `@googlemaps/markerclusterer` and create a `MarkerClusterer` around the
 * marker list in the place-change effect below (clear + addMarkers on data
 * change) instead of adding markers one by one.
 */
function MapView() {
  const place = useSelector((state: RootState) => state.places.currentSelectedPlace);
  const mapPlaces = useSelector((state: RootState) => state.places.mapPlaces);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const multiMarkersRef = useRef<google.maps.Marker[]>([]);
  const [mapsError, setMapsError] = useState<string | null>(null);

  // Initialize the map once the Google script is available
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !mapContainerRef.current || mapRef.current) return;
        mapRef.current = new g.maps.Map(mapContainerRef.current, {
          center: { lat: 1.3521, lng: 103.8198 }, // default: Singapore
          zoom: 11,
        });
      })
      .catch((err: Error) => !cancelled && setMapsError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Multi-marker mode: render every favourite and fit the viewport to them
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    multiMarkersRef.current.forEach((m) => m.setMap(null));
    multiMarkersRef.current = [];
    if (mapPlaces.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    mapPlaces.forEach((p) => {
      const position = { lat: p.latitude, lng: p.longitude };
      bounds.extend(position);
      multiMarkersRef.current.push(
        new window.google.maps.Marker({ map: mapRef.current, position, title: p.name })
      );
    });
    mapRef.current.fitBounds(bounds, 60);
    // Single favourite → fitBounds zooms too far in; cap it
    if (mapPlaces.length === 1) mapRef.current.setZoom(13);
  }, [mapPlaces]);

  // Re-center + marker when the selected place changes (single-place mode)
  useEffect(() => {
    if (!place || !mapRef.current || !window.google || mapPlaces.length > 0) return;
    const position = { lat: place.latitude, lng: place.longitude };
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(15);
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      map: mapRef.current,
      position,
      title: place.name,
    });
  }, [place, mapPlaces]);

  if (mapsError) {
    // Fallback: no interactive map, still show coordinates + link
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm text-red-600 mb-3">⚠ Map unavailable: {mapsError}</p>
        {place && (
          <div className="text-sm text-gray-700">
            <p className="font-semibold">{place.name}</p>
            <p>
              Lat: {place.latitude}, Lng: {place.longitude}
            </p>
            <a
              className="mt-2 inline-block text-indigo-600 underline"
              href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps ↗
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <div ref={mapContainerRef} className="h-full min-h-[320px] w-full" />
      {!place && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60">
          <p className="rounded-lg bg-white px-4 py-2 text-sm text-gray-600 shadow">
            Search and select a place to see it on the map 📍
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(MapView);
