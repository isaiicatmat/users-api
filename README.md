# Users API

REST API to create, read, update and delete users, built with **Fastify 5**, **Prisma** and **PostgreSQL**, and structured with Clean Architecture so the HTTP layer, business rules and persistence can change independently.

Passwords are hashed with bcrypt and never returned by the API. Domain errors are typed and mapped to HTTP status codes in a single place.

## Endpoints

| Method | Path         | Description         | Success | Errors        |
|--------|--------------|---------------------|---------|---------------|
| POST   | `/users`     | Create a user       | 201     | 400, 409      |
| GET    | `/users`     | List users          | 200     |               |
| GET    | `/users/:id` | Get a user by id    | 200     | 400, 404      |
| PUT    | `/users/:id` | Update a user       | 200     | 400, 404, 409 |
| DELETE | `/users/:id` | Delete a user       | 204     | 400, 404      |

Interactive docs (Swagger UI) are served at `http://localhost:3000/docs`.

Error responses always have the shape `{ "error": "message" }`. Unexpected errors return a generic `500` and are logged server-side, so internals are not leaked to clients.

## Architecture

```
src/
  app.ts                     # buildApp(): Fastify instance, Swagger, error handler (no listen)
  server.ts                  # wires the Postgres repository and starts listening
  core/
    errors.ts                # ValidationError (400), NotFoundError (404), ConflictError (409)
    password.service.ts      # bcrypt hashing and password rules
  users/
    users.routes.ts          # routes + JSON schemas (request validation)
    user.controller.ts       # thin HTTP adapter
    user.service.ts          # use cases
    user.entity.ts           # domain entity and its invariants
    user.factory.ts          # builds new users with a hashed password
    user.presenter.ts        # strips the password from responses
    user.repository.ts       # repository port (interface)
    postgres-user.repository.ts  # Prisma adapter; maps P2002/P2025 to domain errors
prisma/
  schema.prisma
  migrations/                # versioned SQL migrations
test/
  user.service.test.ts       # use cases against an in-memory repository
  users.http.test.ts         # HTTP contract via fastify.inject()
  postgres-user.repository.int.test.ts  # adapter against a real Postgres
```

### Decisions

- **Clean Architecture with a repository port.** The service depends on `IUserRepository`, not on Prisma. That is what lets the HTTP and service tests run against an in-memory repository, while the Postgres adapter has its own integration test.
- **Errors mapped once.** Services and the repository throw typed domain errors; `app.ts` translates them to status codes. Controllers don't contain try/catch blocks.
- **Database constraints are the source of truth for uniqueness.** Username and email uniqueness is enforced by unique indexes; the repository translates Prisma's `P2002` into a `409`. A "check, then insert" in application code would be racy under concurrent requests.
- **Migrations instead of schema sync.** `prisma migrate deploy` applies versioned SQL, both in Docker and in CI.

## Running locally

Requirements: Docker with Compose, and ports `3000` and `5432` free.

```sh
cp .env.example .env.docker   # adjust values if needed
./up_dev.sh
```

The container generates the Prisma client, applies migrations and starts the API.

## Tests

```sh
npm test               # unit + HTTP tests, no database needed
./up_test.sh           # starts a throwaway Postgres on :5433, applies migrations, runs all suites
```

To run the integration suite against your own database:

```sh
export DATABASE_URL=postgresql://postgres@localhost:5433/users_test
npx prisma migrate deploy
npm run test:integration
```

CircleCI runs type checking, migrations and every test suite against a Postgres 16 service on each push.

## Tech

Node.js · TypeScript · Fastify 5 · Prisma 6 · PostgreSQL 16 · bcrypt · Vitest · Docker · CircleCI

## Areas to improve

- No authentication: any client can list, update or delete users. The next step would be JWT auth with ownership checks on `/users/:id`, as done in [notifications-system](https://github.com/isaiicatmat/notifications-system).
- `GET /users` has no pagination.
- Response schemas are duplicated across routes; they could reuse the TypeBox DTOs in `src/users/dto`.
- `PUT` behaves like a partial update; `PATCH` would describe it more accurately.
