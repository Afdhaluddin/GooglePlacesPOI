# Places Favourites — Frontend

React 18 + TypeScript + Vite 5 + Tailwind CSS v3 frontend for the Places
Favourites assignment. Search places with Google Places Autocomplete (New),
view them on a Google Map, and save favourites to the Spring Boot backend
behind JWT authentication.

## Quick start

```bash
cp .env.example .env   # add your VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check (tsc -b) + production build
```

## Architecture

### State split: React Query (server) vs Redux (UI)

```
┌──────────────────────────── Server state ────────────────────────────┐
│  TanStack Query                                                       │
│    useFavourites()        useInfiniteQuery  → GET /places (paged)     │
│    useSaveFavourite()     useMutation       → POST /places            │
│    useRemoveFavourite()   useMutation       → DELETE /places/{id}     │
│  (mutations invalidate/optimistically update the favourites cache)    │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────── UI state ───────────────────────────────┐
│  Redux Toolkit (src/app/store.ts, src/features/places/placesSlice.ts) │
│    currentSelectedPlace   place picked in the autocomplete            │
│    searchHistory          local list of picked places                 │
└───────────────────────────────────────────────────────────────────────┘
```

Server data (the favourites list) is never stored in Redux; TanStack Query
owns fetching, caching, pagination, and mutation lifecycle. Redux stays for
pure client-side UI state, per the assignment requirements.

### Auth flow

```
AuthCard ── login/register ──► POST /api/v1/auth/{login,register}
                                   │ {token}
                                   ▼
                     localStorage ("places.auth.token")
                                   │
                                   ▼
              api/client.ts attaches "Authorization: Bearer <token>"
              to every /places request
                                   │
              401 response ───────► token cleared → back to AuthCard
```

- If a token exists on page load, the app skips the login screen.
- The header **Log out** button clears the token and resets the query cache.
- `api/client.ts` parses the backend error JSON
  (`{timestamp,status,error,message,path}`) and surfaces `message` in the UI.

## Environment configuration

| Variable | Purpose | Dev | Staging/Prod |
|---|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS + Places (New) key | required in `.env` | required |
| `VITE_API_BASE_URL` | Backend base URL | **leave unset** — requests hit `/api/v1` and Vite proxies `/api → http://localhost:8080` (`vite.config.ts`) | set explicitly, e.g. `https://api.example.com/api/v1` |

Use Vite env files per environment: `.env` (local), `.env.staging`,
`.env.production`, selected via `vite --mode staging` / `vite build --mode prod`.

## Performance & quality

- **Code splitting** — `MapView` (heavy Google Maps JS) is loaded with
  `React.lazy` + `Suspense` with a skeleton fallback.
- **Memoization** — `React.memo` on `MapView`/`SearchHistory`, `useCallback`
  for stable handlers.
- **Infinite scroll** — favourites load 10 per page via `useInfiniteQuery` +
  an IntersectionObserver sentinel.
- **ErrorBoundary** wraps the whole app with a friendly reload fallback.
- **Marker clustering extension point** — see the comment in
  `src/components/MapView.tsx` (`@googlemaps/markerclusterer`).

## Folder structure

```
src/
├── api/                  # server access layer
│   ├── client.ts         # fetch wrapper: base URL, Bearer token, error parsing, 401 handling
│   ├── auth.ts           # POST /auth/register, /auth/login
│   └── places.ts         # GET/POST/DELETE /places
├── app/
│   └── store.ts          # Redux store (UI state only)
├── auth/
│   └── AuthContext.tsx   # token state, login/logout, 401 handler wiring
├── components/
│   ├── AuthCard.tsx      # login/register card
│   ├── ErrorBoundary.tsx # app crash fallback
│   ├── SearchBox.tsx     # Google Places autocomplete input
│   ├── MapView.tsx       # Google Map (lazy-loaded, memoized)
│   ├── SearchHistory.tsx # local search history (Redux, memoized)
│   ├── FavouriteList.tsx # paginated favourites (React Query, infinite scroll)
│   └── FavouriteButton.tsx
├── features/places/
│   └── placesSlice.ts    # currentSelectedPlace + searchHistory
├── hooks/
│   ├── usePlacesAutocomplete.ts  # Google script loader + autocomplete lifecycle
│   └── useFavourites.ts          # React Query hooks for favourites
├── types.ts              # Place, Page<T>, AuthResponse, ApiErrorBody, …
├── App.tsx               # auth gate + layout
└── main.tsx              # QueryClientProvider + Redux Provider + ErrorBoundary
```

## Backend contract

- `POST /api/v1/auth/register` `{username,password}` → 201 `{id,username}`
- `POST /api/v1/auth/login` `{username,password}` → 200 `{token}`
- `GET /api/v1/places?page=0&size=10` (Bearer) → Spring `Page<Place>`
- `POST /api/v1/places` (Bearer) → 201 `Place`
- `DELETE /api/v1/places/{id}` (Bearer) → 204
- Errors: `{timestamp,status,error,message,path}`
