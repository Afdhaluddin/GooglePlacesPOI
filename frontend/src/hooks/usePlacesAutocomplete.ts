import { useEffect, useRef, useState } from 'react';
import type { SelectedPlace } from '../types';

let googleMapsPromise: Promise<typeof google> | null = null;

/**
 * Loads the Google Maps JavaScript API exactly once.
 * Uses the Places API (New) — the legacy Places Autocomplete class is not
 * available to newer Google Cloud projects.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google);
      return;
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!apiKey) {
      reject(
        new Error('Missing VITE_GOOGLE_MAPS_API_KEY. Copy .env.example to .env and add your key.')
      );
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () =>
      reject(new Error('Failed to load the Google Maps script. Check your API key and network.'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

interface UsePlacesAutocompleteResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isLoaded: boolean;
  error: string | null;
}

/**
 * Manages the full lifecycle of a Places API (New) PlaceAutocompleteElement
 * rendered into a container div.
 *
 * @param onPlaceSelected called with a normalized {@link SelectedPlace}.
 */
export function usePlacesAutocomplete(
  onPlaceSelected: (place: SelectedPlace) => void,
  onLatency?: (ms: number) => void
): UsePlacesAutocompleteResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackRef = useRef(onPlaceSelected);
  callbackRef.current = onPlaceSelected;
  const onLatencyRef = useRef(onLatency);
  onLatencyRef.current = onLatency;

  useEffect(() => {
    // The PlaceAutocompleteElement is a Web Component; its event payloads
    // aren't covered by @types/google.maps, so we use small local types.
    interface PlacePredictionLike {
      toPlace(): google.maps.places.Place;
    }
    type SelectEvent = Event & { placePrediction?: PlacePredictionLike };

    let autocompleteElement: HTMLElement | null = null;
    let latencyTimer: number | null = null;
    let cancelled = false;

    (async () => {
      try {
        const g = await loadGoogleMaps();
        const { PlaceAutocompleteElement } = (await g.maps.importLibrary(
          'places'
        )) as google.maps.PlacesLibrary & {
          PlaceAutocompleteElement: new () => HTMLElement;
        };
        if (cancelled || !containerRef.current) return;

        autocompleteElement = new PlaceAutocompleteElement();
        autocompleteElement.id = 'place-search';
        autocompleteElement.setAttribute('placeholder', 'Start typing a place name or address…');

        const handleSelect = async (place: google.maps.places.Place | undefined) => {
          if (!place) return;
          try {
            await place.fetchFields({
              fields: ['id', 'displayName', 'formattedAddress', 'location'],
            });
            if (!place.location) return;

            callbackRef.current({
              name: place.displayName ?? place.formattedAddress ?? 'Unknown place',
              address: place.formattedAddress ?? '',
              latitude: place.location.lat(),
              longitude: place.location.lng(),
              googlePlaceId: place.id ?? '',
            });
          } catch {
            setError('Could not fetch place details. Check that "Places API (New)" is enabled.');
          }
        };

        // Newer API versions fire 'gmp-select' with a placePrediction;
        // older versions fire 'gmp-placeselect' with a Place. Support both.
        autocompleteElement.addEventListener('gmp-select', (event) => {
          const e = event as SelectEvent;
          void handleSelect(e.placePrediction ? e.placePrediction.toPlace() : undefined);
        });
        autocompleteElement.addEventListener('gmp-placeselect', (event) => {
          const e = event as Event & { place?: google.maps.places.Place };
          void handleSelect(e.place);
        });

        containerRef.current.appendChild(autocompleteElement);

        // Latency measurement: watch the browser's Resource Timing entries for
        // calls to Google's Places endpoints and report each request's real
        // round-trip duration. Works regardless of the widget's shadow DOM.
        const latencyCb = onLatencyRef.current;
        if (latencyCb) {
          let lastSeen = performance.now();
          latencyTimer = window.setInterval(() => {
            const entries = performance
              .getEntriesByType('resource')
              .filter(
                (e) =>
                  e.startTime > lastSeen &&
                  /(places\.googleapis\.com|maps\.googleapis\.com).*([Aa]utocomplete|[Ss]earch|[Pp]lace)/.test(
                    e.name
                  )
              );
            for (const e of entries) {
              lastSeen = Math.max(lastSeen, e.startTime + 1);
              latencyCb(Math.round(e.duration));
            }
          }, 400);
        }

        setIsLoaded(true);
      } catch {
        if (!cancelled) {
          setError(
            'Failed to initialise Places Autocomplete. Make sure "Places API (New)" and ' +
              '"Maps JavaScript API" are enabled for your key, then restart the dev server.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (latencyTimer !== null) window.clearInterval(latencyTimer);
      if (autocompleteElement) autocompleteElement.remove();
    };
  }, []);

  return { containerRef, isLoaded, error };
}
