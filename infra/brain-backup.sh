#!/usr/bin/env bash
# Back up the WHOLE brain (agents/skills/modules/diary/exemplars/metrics/rounds) to ONE portable .sql
# file BEFORE deleting a pod. Purges corrupted exemplars first. Restore on a new pod (after the schema
# exists) with:  PGPASSWORD=postgres psql -h localhost -U postgres -d puglit -f brain-backup.sql
set -uo pipefail
P(){ PGPASSWORD=postgres psql -h localhost -U postgres -d puglit -tAc "$1"; }
OUT="${1:-/workspace/brain-backup.sql}"

echo "▶ purging corrupted exemplars (curly quotes → won't compile)…"
BAD="$(P "WITH d AS (DELETE FROM verified_exemplars WHERE code LIKE '%“%' OR code LIKE '%”%' OR code LIKE '%‘%' OR code LIKE '%’%' RETURNING 1) SELECT count(*) FROM d")"
echo "  removed $BAD broken exemplars"

echo "▶ dumping the brain → $OUT"
PGPASSWORD=postgres pg_dump -h localhost -U postgres -d puglit --clean --if-exists \
  -t puglit_teams -t puglit_agents -t puglit_agent_diary -t puglit_skills -t puglit_skill_rejects \
  -t puglit_modules -t puglit_metrics -t verified_exemplars -t puglit_rounds > "$OUT"
gzip -kf "$OUT"   # also a compressed copy (easier to download/move)

echo ""
echo "✅ BRAIN BACKED UP:"
echo "   $OUT        ($(du -h "$OUT" | cut -f1))"
echo "   $OUT.gz     ($(du -h "$OUT.gz" | cut -f1))   ← más chico para descargar"
echo "   contiene: exemplars=$(P "SELECT count(*) FROM verified_exemplars") · agents=$(P "SELECT count(*) FROM puglit_agents") · skills=$(P "SELECT count(*) FROM puglit_skills") · modules=$(P "SELECT count(*) FROM puglit_modules") · diary=$(P "SELECT count(*) FROM puglit_agent_diary")"
echo ""
echo "⚠️  SACALO DEL POD antes de borrarlo (elegí una):"
echo "   a) descargá $OUT.gz por el file-browser de Jupyter/RunPod"
echo "   b) o pushealo a git:   bash infra/brain-backup.sh && cd \$BRAIN_REPO && git add brain-backup.sql && git commit -m brain && git push"
echo ""
echo "   RESTAURAR en el pod nuevo (después de cargar web/sql/genetic.sql):"
echo "     PGPASSWORD=postgres psql -h localhost -U postgres -d puglit -f brain-backup.sql"
