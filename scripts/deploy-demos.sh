#!/usr/bin/env bash
# Deploy each example config as its own live Vercel project (the showcase demos).
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

for slug in mesa pulso lumi cancha boleta; do
  if [ "$slug" = "mesa" ]; then project="puglit-spine"; else project="puglit-demo-$slug"; fi
  echo "════════ $slug → $project ════════"
  node scripts/materialize-config.mjs "$slug"
  cd "$ROOT/spine"
  npx vercel link --yes --project "$project" >/dev/null 2>&1
  npx vercel pull --yes --environment production >/dev/null 2>&1
  VERCEL=1 npx vercel build --prod >/dev/null 2>&1
  npx vercel deploy --prebuilt --prod --yes >/dev/null 2>&1
  echo "  deployed: https://$project.vercel.app"
  cd "$ROOT"
done

# restore default config (mesa) so the checked-in spine builds Mesa
node scripts/materialize-config.mjs mesa
echo "ALL DEMOS DEPLOYED"
