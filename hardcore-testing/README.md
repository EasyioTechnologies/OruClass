# OruClass — Hardcore Load / Capacity Testing

Stress harness for the live-session socket pipeline. Kept **out** of the app build on
purpose — these are operator tools, not shipped code. Run them by hand against prod
(or staging) before a big live event.

> ⚠️ These scripts create **real guest accounts + participant rows** in whatever DB the
> target API points at. Against prod that pollutes the live DB — purge the bots after
> (see *Cleanup* below). Default target is `https://api.orulabs.in` (PROD).

---

## Scripts

### `load-test.mjs` — submission-storm test
Fixed N guests join one live session, then all submit in the same tick. Measures
connect / join / ack / broadcast latency, errors, rate-limits. Good for a quick
"is the storm path healthy" check.

```bash
# from repo root (socket.io-client is hoisted to root node_modules)
node hardcore-testing/load-test.mjs
N=50 GUEST_RATE=60 node hardcore-testing/load-test.mjs
```

### `capacity-test.mjs` — ramp-to-failure test
Adds bots in **stages**; every bot stays connected and in the training (cumulative
concurrency). Runs a full storm at each stage and snapshots live VPS `docker stats`
over SSH, so you see latency + CPU/mem climb and find the ceiling. Auto-stops on
connect-fail >10%, ack-fail >5%, or ack p95 > 4000ms.

```bash
node hardcore-testing/capacity-test.mjs                       # 50→600 in steps of 50
STEP=100 MAX=2000 node hardcore-testing/capacity-test.mjs
STAGES="700,900,1100,1300,1500" node hardcore-testing/capacity-test.mjs
SSH_HOST="" node hardcore-testing/capacity-test.mjs           # skip VPS stats (no ssh)
```

### Env knobs (both)
| var | default | meaning |
|---|---|---|
| `API` | `https://api.orulabs.in` | target API base |
| `TRAINER_EMAIL` / `TRAINER_PASS` | — | trainer login (resolves training+module) |
| `JOIN_TOKEN` | — | live session join token |
| `STEP` / `MAX` / `STAGES` | 50 / 600 / — | capacity ramp shape |
| `GUEST_RATE` | 380 | guest provisioning cap per 60s (server caps at 400) |
| `SSH_HOST` | `oru` | ssh alias for `docker stats`; empty = skip |

**Prereq:** an active live session with one unlocked module, and the `oru` SSH alias
(`root@195.35.22.110`) for VPS stats.

---

## Current status — last run 2026-06-05 (PROD, single test client)

Backend fixes deployed and verified (rate-limiter double-count, shared-IP login,
N² broadcast coalescing). All three hold under load.

### Capacity (cumulative concurrent bots, all staying in the room)

| bots | live | fail | ack p95 | storm | API mem | API cpu | postgres/redis |
|---:|---:|---:|---:|---:|---:|---:|---|
| 50 | 50 | 0 | 135ms | 139ms | 114MiB | <1% | idle |
| 200 | 200 | 0 | 219ms | 326ms | 137MiB | 7% | idle |
| 400 | 400 | 0 | 226ms | 826ms | 142MiB | 2% | idle |
| 600 | 600 | 0 | 461ms | 475ms | 188MiB | 3% | idle |
| 900 | 900 | 0 | 615ms | 2363ms | 185MiB | <1% | idle |
| 1300 | 1300 | 0 | 704ms | 1557ms | 195MiB | 15% | 2% |
| **1500** | 1496 | 4 | 1123ms | 7617ms | **205MiB** | 6% | idle |

### Reading the results
- **VPS is not the limit.** 1500 concurrent sockets cost only **+80MiB RAM**
  (126→205) of 7.7GB, CPU single-digit %, load avg ~1.3 on 8 cores (idle).
  Postgres/redis flat the whole way.
- **The ceiling is the single test client, not the server.** connect-p95 spiking to
  3-4s and the 4 timeouts at 1500 are one laptop choking on 1500 TLS sockets +
  Node event-loop contention. Real users arrive from 1500 separate phones/IPs, so
  that contention does not exist in the field. Pure server work (ack latency) only
  moved 250ms→1100ms across a **30× load increase**.
- **N² broadcast stays dead.** `data:aggregate` received per bot stayed ~1-4 even at
  1500 (coalescer flushes a few times during a multi-second storm) vs ~1500 each if
  unfixed (~2.2M messages). 300ms coalescing window confirmed working at scale.

### Bottom line
- **PIJAM (40-50 participants): <1% of capacity. 30×+ headroom. Do nothing.**
- True ceiling = Socket.IO single Node process (single-threaded). Only felt in the
  thousands. If ever needed: add Redis Socket.IO adapter + 2-3 `api` replicas behind
  Traefik. Not needed now.
- Shared-IP venues (whole class behind one router): bump `AUTH_RATE_MAX` /
  `GUEST_RATE_MAX` / `API_RATE_MAX` env vars — no redeploy required.

---

## Cleanup — purge test bots from the DB

Runs create guest users named `Cap-*`, `LoadBot-*`, and `probe-*` plus their
`trainingParticipants` rows. Purge them before a live event so they don't show in the
roster. (SQL template — verify table/column names against `apps/api/src/db/schema.ts`
before running, and run against the intended DB only.)

```sql
-- participants first (FK), then the guest users
DELETE FROM training_participants
  WHERE user_id IN (SELECT id FROM users WHERE name LIKE 'Cap-%' OR name LIKE 'LoadBot-%' OR name LIKE 'probe-%');
DELETE FROM users
  WHERE name LIKE 'Cap-%' OR name LIKE 'LoadBot-%' OR name LIKE 'probe-%';
```

On the VPS:
```bash
ssh oru "docker exec -i oruclass-postgres-1 psql -U <user> -d <db> -c \"<sql>\""
```
