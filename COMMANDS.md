# Commands

> Run from `F:\OruClass` root.

## Run

```bash
docker compose up postgres redis -d   # infra first (postgres 5433, redis 6379)
bun run dev                           # backend + frontend together
bun run api                           # backend only (http://localhost:3001)
bun run web                           # frontend only (http://localhost:3000)
```

## Kill

```bash
npx kill-port 3001                    # backend
npx kill-port 3000                    # frontend
npx kill-port 3000 3001               # both
docker compose stop                   # postgres + redis
docker compose down                   # stop + remove containers
```

## Restart

```bash
docker compose down && docker compose up postgres redis -d && npx kill-port 3000 3001 && bun run dev
```
