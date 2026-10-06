# Favourite Places API (backend)

Spring Boot 3.3.5 / Java 17 REST API for saving favourite Google Places — now
secured per-user with JWT, versioned under `/api/v1`, schema-managed by Flyway,
resilient external calls via WebClient + Resilience4j + Caffeine cache, and
observable via Actuator/Prometheus and structured JSON logs.

## Architecture

- **Spring MVC** REST API (`/api/v1/places`, `/api/v1/auth`) with consistent
  error JSON `{timestamp, status, error, message, path}`.
- **Security**: stateless JWT (jjwt 0.12.x, HS256, 24h expiry). BCrypt-hashed
  passwords. All place data is scoped to the authenticated user (`Place` has a
  `user` FK; unique constraint on `(user_id, google_place_id)`).
- **Persistence**: Spring Data JPA + HikariCP (explicitly tuned in
  `application.yml`). **Flyway** owns the schema (`ddl-auto=validate`,
  `baseline-on-migrate=true`); per-database migrations live in
  `src/main/resources/db/migration/{sqlserver,h2}`.
- **External call**: non-blocking `WebClient` to `api.first.org/data/v1/countries`
  (5s timeout), guarded by Resilience4j **retry + circuit breaker + rate
  limiter** with a graceful static-sample fallback, and cached per place id
  with **Caffeine** (10 min TTL).
- **Observability**: Actuator + Micrometer Prometheus registry
  (`/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`);
  structured JSON logs (logstash-logback-encoder) to `logs/application.log`
  with an `X-Correlation-ID` propagated through the MDC.

## Environment variables

| Variable       | Default                                                                                  | Purpose                |
|----------------|------------------------------------------------------------------------------------------|------------------------|
| `DB_URL`       | `jdbc:sqlserver://localhost:1433;databaseName=TESTDB;encrypt=false;trustServerCertificate=true` | JDBC URL               |
| `DB_USERNAME`  | `sa`                                                                                     | DB user                |
| `DB_PASSWORD`  | `<your-sa-password>`                                                                    | DB password            |
| `JWT_SECRET`   | dev-only insecure default                                                                | HMAC secret for JWTs   |
| `DB_POOL_MAX` / `DB_POOL_MIN_IDLE` | `20` / `5`                                                          | HikariCP pool sizing   |

## Run locally

```bash
# MSSQL (default profile) - TESTDB must exist
mvn spring-boot:run

# H2 in-memory fallback (no MSSQL needed)
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

> **Existing TESTDB note**: Flyway baselines the existing database
> (`baseline-on-migrate=true`), so `V1__init.sql` is skipped there. If the
> pre-existing schema predates the `users` table / `places.user_id` column,
> align it manually (create `users`, add `user_id` + indexes/constraint per
> `db/migration/sqlserver/V1__init.sql`) or recreate the database, since
> Hibernate runs with `ddl-auto=validate`.

## Run with Docker

```bash
docker compose up --build
```

This starts MSSQL 2022 and the app. Create `TESTDB` once if it does not exist:

```bash
docker exec <db-container> /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '<your-sa-password>' -C -Q "CREATE DATABASE TESTDB"
```

The app applies the Flyway migration itself on startup.

## API (v1)

### Auth

```bash
# Register → 201 {id, username}
curl -X POST http://localhost:8081/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"password123"}'

# Login → 200 {token}
TOKEN=$(curl -s -X POST http://localhost:8081/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"password123"}' | jq -r .token)
```

### Places (all require `Authorization: Bearer $TOKEN`)

```bash
# Create → 201 Place JSON
curl -X POST http://localhost:8081/api/v1/places \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"KLCC","address":"Kuala Lumpur, Malaysia","latitude":3.1579,"longitude":101.7116,"googlePlaceId":"ChIJ...","favourite":true}'

# Paginated list → Spring Page JSON (content[], totalElements, totalPages, number, size)
curl "http://localhost:8081/api/v1/places?page=0&size=10" -H "Authorization: Bearer $TOKEN"

# Get one
curl http://localhost:8081/api/v1/places/1 -H "Authorization: Bearer $TOKEN"

# Update
curl -X PUT http://localhost:8081/api/v1/places/1 -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"KLCC Park","address":"Kuala Lumpur, Malaysia","latitude":3.155,"longitude":101.714,"googlePlaceId":"ChIJ...","favourite":true}'

# Delete → 204
curl -X DELETE http://localhost:8081/api/v1/places/1 -H "Authorization: Bearer $TOKEN"

# Country info (resilient nested third-party call, cached 10 min)
curl http://localhost:8081/api/v1/places/1/country-info -H "Authorization: Bearer $TOKEN"
```

### Observability

- `GET /actuator/health` (public), `/actuator/metrics`, `/actuator/prometheus`
- Every response echoes `X-Correlation-ID`; send your own to correlate logs.
- JSON logs: `logs/application.log`.

## Postman

Import `postman/FavouritePlaces.postman_collection.json`. Run **Register** once,
then **Login** — a test script copies the returned token into the `{{token}}`
collection variable automatically. All secured requests use
`Authorization: Bearer {{token}}`.
