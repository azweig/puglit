#!/usr/bin/env bash
# Full end-to-end demo: DESIGN (3 teams compete) → BUILD the winner to completion → report where it
# landed + how to run it. Unlike test-tournament.sh (which only designs), this drives the build with a
# background sweep watchdog — so it works under plain `npm run dev` (which has no watchdog).
#
#   bash infra/demo.sh                          # default: a calculator
#   bash infra/demo.sh "MyApp" "what it does"   # your own idea
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
B="${BASE:-http://localhost:3000}"
NAME="${1:-DemoCalc}"
WHAT="${2:-a simple calculator: add/subtract/multiply/divide, calculation history, memory M+/M-/MR, keyboard + mouse input, clear, division-by-zero handling}"
CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ROOT/web/.env.local" 2>/dev/null | cut -d= -f2-)"
ok(){ printf "  \033[1;32m✓\033[0m %s\n" "$1"; }; err(){ printf "  \033[1;31m✗\033[0m %s\n" "$1"; }

command -v jq >/dev/null 2>&1 || { err "jq required (apt-get install -y jq)"; exit 1; }
curl -s -o /dev/null "$B/api/doctor" 2>/dev/null || { err "server not up at $B (start it: cd web && npm run dev)"; exit 1; }

# ── 1. DESIGN — the tournament ──────────────────────────────────────────────────
printf "\n\033[1;35m▶ 1/2  Designing — 3 teams compete\033[0m\n"
# jq-built payload (safe with quotes/newlines in the description) + optional COLOR=#RRGGBB
PAYLOAD="$(jq -nc --arg n "$NAME" --arg w "$WHAT" --arg c "${COLOR:-}" '{name:$n, what:$w, audience:"users", monetization:"free"} + (if $c != "" then {color:$c} else {} end)')"
JID="$(curl -s -X POST "$B/api/genetic/tournament" -H 'content-type: application/json' -d "$PAYLOAD" | jq -r '.jobId // empty')"
[ -z "$JID" ] && { err "couldn't launch tournament"; exit 1; }
while :; do
  S="$(curl -s "$B/api/genetic/tournament?status=$JID")"
  st="$(echo "$S" | jq -r '.status // "?"')"; ph="$(echo "$S" | jq -r '.phase // ""')"
  printf "\r  [%s] %-52s" "$st" "$ph"
  [ "$st" = "done" ] && break
  [ "$st" = "error" ] && { echo; err "tournament error: $(echo "$S" | jq -r '.error')"; exit 1; }
  sleep 4
done; echo
WIN="$(curl -s "$B/api/genetic/tournament?status=$JID" | jq -r '.result.winner // "?"')"
BJ="$(curl -s "$B/api/genetic/tournament?status=$JID" | jq -r '.result.buildJobId // empty')"
ok "winner: team $WIN"
[ -z "$BJ" ] && { err "no build job (build_del_ganador is null — reload web/sql/genetic.sql so puglit_jobs exists)"; exit 1; }
ok "build job: $BJ"

# ── 2. BUILD — drive the winner to completion ───────────────────────────────────
printf "\n\033[1;35m▶ 2/2  Building the winner (the swarm assembles + tests it)\033[0m\n"
# background sweep watchdog: advances queued jobs (npm run dev has none of its own)
( while true; do curl -s -o /dev/null --max-time 280 "$B/api/cron/sweep${CRON_SECRET:+?key=$CRON_SECRET}" 2>/dev/null; sleep 20; done ) &
SWEEP=$!; trap 'kill $SWEEP 2>/dev/null' EXIT
for i in $(seq 1 360); do
  J="$(curl -s "$B/api/job/$BJ")"
  s="$(echo "$J" | jq -r '.status // "queued"')"; c="$(echo "$J" | jq -r '.completion // 0')"
  d="$(echo "$J" | jq -r '(.steps // [] | map(select(.status==\"done\")) | length) as $x | $x' 2>/dev/null || echo '')"
  printf "\r  [%s] %s%%   " "$s" "$c"
  [ "$s" = "done" ] && break
  [ "$s" = "error" ] && { echo; err "build error: $(echo "$J" | jq -r '.error')"; break; }
  sleep 5
done; echo
kill $SWEEP 2>/dev/null; trap - EXIT

# ── report ──────────────────────────────────────────────────────────────────────
J="$(curl -s "$B/api/job/$BJ")"
FILES="$(echo "$J" | jq -r '.files | length')"
PATHD="$(echo "$J" | jq -r '.localPath // empty')"
echo
printf "\033[1;36m──────── Demo result ────────\033[0m\n"
ok "status: $(echo "$J" | jq -r '.status')  ·  files generated: $FILES"
[ -n "$PATHD" ] && { ok "on disk: $PATHD"; echo "    review:  ls $PATHD/app   ·   cat $PATHD/app/page.tsx"; echo "    run it:  cd $PATHD && npm install && npm run dev"; }
echo "    in the browser:  $B/build/$BJ"
echo
