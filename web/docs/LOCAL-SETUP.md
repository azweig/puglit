# Run Puglit 100% locally (Ollama + Gemma, no paid keys)

These are the exact, tested steps to mount the **whole** system — the interview agent, the
spec agent, the generation swarm and the 3 stakeholder supervisions — on local open models.

> Quality note: small local models (e.g. `gemma2:2b`) run the full pipeline but write
> **low-quality / often non-compiling** code and produce empty supervisions — they're too weak
> for correct Next.js. Use a **bigger local model** (`gemma2:27b`, `llama3.3:70b`,
> `qwen2.5-coder`) or point the `premium` tier at a cloud model (see `docs/PROVIDERS.md`).
> Pick a model that fits your RAM (a 2b model ≈ needs ~3-4 GB free; 27b needs a strong GPU).

## 1. Ollama + a model

```bash
brew install ollama                 # or https://ollama.com
ollama serve &                      # starts the local API on :11434
ollama pull gemma2:2b               # fits ~8 GB RAM (low quality)
# better code on a modest machine:  ollama pull qwen2.5-coder:7b
# best quality (needs a big GPU):   ollama pull gemma2:27b
```

## 2. Postgres (jobs + generated projects)

Any local Postgres works. Quick ephemeral cluster:

```bash
initdb -D /tmp/puglit_pg -U postgres --auth=trust       # LANG=C if locale errors
pg_ctl -D /tmp/puglit_pg -o "-p 5433 -k /tmp" -l /tmp/puglit_pg.log start
createdb -h localhost -p 5433 -U postgres puglit
# create the tables (puglit_projects / puglit_waitlist / puglit_jobs):
psql -h localhost -p 5433 -U postgres -d puglit -f web/sql/puglit.sql
```

> In dev (`NODE_ENV != production`) `ensureSchema()` also creates the tables on first query;
> running `sql/puglit.sql` is the explicit/prod path.

## 3. Env — `web/.env.local`

```bash
PUGLIT_PROVIDER=ollama
PUGLIT_MODEL_PREMIUM=gemma2:2b      # bump these for real quality
PUGLIT_MODEL_BALANCED=gemma2:2b
PUGLIT_MODEL_CHEAP=gemma2:2b
PUGLIT_VISION=never                 # gemma2:2b is text-only

POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=puglit
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres          # any value with trust auth
POSTGRES_SSL=disable
CRON_SECRET=local-dev-secret
```

## 4. Run

```bash
cd web && npm install && PORT=3100 npm run dev
```

Verify the brain is wired: `curl 'http://localhost:3100/api/doctor?ping=1'`
→ `{"defaultProvider":"ollama", ..., "ping":{"ok":true,"model":"gemma2:2b"}}`

## 5. Generate a project (the full agent process)

The build advances one bounded unit per `POST /api/job/[id]/advance` (so it survives serverless
limits) — locally you just poll it in a loop. Full interview → spec → build:

```bash
# (a) interview agent (multi-turn Q&A) → POST /api/interview { messages, productName }
#     loop, answering as the founder, until step.done; or send { finish:true } to wrap up.
# (b) spec agent → POST /api/spec { messages, productName }
# (c) start the build → POST /api/job/create { name, what, benefits, monetization, languages }
# (d) drive it:
ID=...; while :; do
  curl -s -X POST "http://localhost:3100/api/job/$ID/advance" | python3 -c "import sys,json;j=json.load(sys.stdin);print(sum(s['status']=='done' for s in j['steps']),'/',len(j['steps']),j['status'])"
  sleep 3
done
```

The generated project lands in `job.artifacts.appFiles` (extract from the DB) and, if
`GITHUB_TOKEN`/`GITHUB_REPO` are set, is also pushed to GitHub by the `deliver` step. Without
them, `deliver` is skipped/fails locally — extract the files from Postgres:

```bash
psql -h localhost -p 5433 -U postgres -d puglit -t -A \
  -c "SELECT artifacts->'appFiles' FROM puglit_jobs WHERE id='$ID'" > files.json
```
