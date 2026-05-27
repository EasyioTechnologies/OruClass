# Commands

> Run everything from `F:\OruClass` root.

## Start

```bash
# Docker (postgres + redis) — run first
docker compose up postgres redis -d

# API on port 3001
bun run api

# Web on port 3000
bun run web

# Both at once
bun run dev
```

## Stop / Kill

```bash
# Stop docker
docker compose stop

# Kill port 3001 (if "port in use" error)
npx kill-port 3001

# Kill port 3000
npx kill-port 3000
```

## Database

```bash
bun run db:migrate
bun run db:generate
```

## Install

```bash
bun install
```
