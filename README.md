# 📍 Google Places Favourites — Full-Stack Interview Assignment

**Cards IT — Java Backend + React Frontend assignment.**

A production-style full-stack app: search any place with **Google Places Autocomplete**,
see it on a map, and save favourites to a **Spring Boot + MSSQL** API — with JWT auth,
per-user data, pagination, resilience patterns, and observability.

```
GoogleMapPlace/
├── backend/    Spring Boot 3 · Java 17 · MSSQL (TESTDB) · JWT · Flyway · Resilience4j
└── frontend/   React 18 · TypeScript · Vite · Redux Toolkit (Thunk) · TanStack Query · Tailwind
```

---

## 🚀 Quickstart

### Option A — Docker Compose (backend + MSSQL in one command)

```bash
cd backend
export DB_PASSWORD='<pick-a-strong-sa-password>'   # used for both MSSQL and the app
docker compose up --build
```

The API starts on **http://localhost:8081** with the schema created by Flyway.

### Option B — Local run

**Prerequisites:** JDK 17+, Maven 3.9+, Node 18+, MSSQL running locally (or Docker).

```bash
# 1. MSSQL (Docker example)
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=<your-sa-password>" \
  -p 1433:1433 --name mssql-testdb -d mcr.microsoft.com/mssql/server:2022-latest
docker exec mssql-testdb /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P '<your-sa-password>' -C -Q "CREATE DATABASE TESTDB"

# 2. Backend (http://localhost:8081)
cd backend
export DB_PASSWORD='<your-sa-password>'
mvn spring-boot:run

# 3. Frontend (http://localhost:5173)
cd frontend
npm install
cp .env.example .env     # add your Google Maps API key
npm run dev
```

> **No MSSQL?** Run the backend with the H2 in-memory profile instead:
> `mvn spring-boot:run -Dspring-boot.run.profiles=local`

### First use

1. Open http://localhost:5173 → **Register** a user → you are logged in (JWT).
2. Type in the search box → pick a suggestion → marker drops on the map.
3. Click **★ Mark as favourite** → saved to MSSQL, scoped to your user.
4. Click any favourite to focus it on the map, or **🗺 Show all on map** for every marker.

---

## 🔑 Environment variables & secrets

No real credentials are committed. Configure via environment variables:

| Variable | Used by | Purpose |
|---|---|---|
| `DB_URL` | backend | JDBC URL (default: `localhost:1433`, DB `TESTDB`) |
| `DB_USERNAME` / `DB_PASSWORD` | backend | MSSQL credentials (**required** — no default password) |
| `JWT_SECRET` | backend | HMAC secret for signing tokens (dev default is clearly marked insecure; always set in any real deployment) |
| `SERVER_PORT` | backend | default `8081` |
| `VITE_GOOGLE_MAPS_API_KEY` | frontend | Google key with **Maps JavaScript API** + **Places API (New)** enabled — goes in `frontend/.env` (gitignored) |

---

## ✅ Assignment requirements coverage

### Backend

| Requirement | Implementation |
|---|---|
| Spring Boot application | Spring Boot 3.3.5 / Java 17 |
| Maintainable structure | `controller / service / repository / model / dto / config / filter / exception / security` |
| Postman collection | `backend/postman/FavouritePlaces.postman_collection.json` (import → run **Login** first; the token auto-saves to `{{token}}`) |
| Request & response logging to file | `RequestResponseLoggingFilter` → `logs/application.log` (structured JSON, correlation IDs) |
| MSSQL `TESTDB` | Docker / local MSSQL; H2 `local` profile as fallback |
| `@Transactional` (INSERT / UPDATE / GET) | `PlaceService` — `readOnly = true` on GETs |
| GET with pagination (10/page) | `GET /api/v1/places?page=0&size=10` (Spring `Pageable`) |
| Nested 3rd-party API call | `GET /api/v1/places/{id}/country-info` → calls `api.first.org` via WebClient (retry + circuit breaker + rate limit + cache) |
| Public git repo | this repository |

### Frontend

| Requirement | Implementation |
|---|---|
| Google Places autocomplete textbox | `usePlacesAutocomplete` custom hook — Places API (New) `PlaceAutocompleteElement` |
| Redux Toolkit + middleware | Redux Toolkit + **Redux Thunk** (`createAsyncThunk` — history persistence) |
| Show all searches tried | `SearchHistory` — every selection, persisted across reloads |
| Styling | Tailwind CSS |
| ES6+ / hooks / functional components / custom hooks | TypeScript, functional components throughout, custom hooks |
| Favourite via Spring Boot API → database | `POST /api/v1/places` → MSSQL `TESTDB.dbo.places` (per user) |

---

## 🏗 Scalability features (beyond the assignment)

**Backend**
- JWT stateless auth, per-user data isolation, BCrypt password hashing
- Flyway migrations + `ddl-auto=validate` (Hibernate never mutates the schema)
- HikariCP pool tuning, DB indexes, unique `(user_id, google_place_id)` constraint
- WebClient (non-blocking) + Resilience4j retry / circuit breaker / rate limiter
- Caffeine cache on external calls · Actuator + Prometheus metrics
- Structured JSON logs with `X-Correlation-ID` propagation

**Frontend**
- TypeScript strict mode; TanStack Query owns server state (cache, retry, invalidation)
- Infinite-scroll favourites (paginated 10/page, IntersectionObserver)
- Code splitting (lazy map chunk), `React.memo` / `useCallback`, error boundary
- Live autocomplete latency badge (Resource Timing API)

---

## 📚 More docs

- [backend/README.md](backend/README.md) — API reference, env vars, Docker details, curl examples
- [frontend/README.md](frontend/README.md) — architecture, folder structure, auth flow
