#!/usr/bin/env bash
# Export the brain (all the learnings) into ONE readable report you can paste to review the training:
# stats, the evolved agent SKILLS (the distilled knowledge), top diary lessons, harvested modules,
# and a few sample exemplars (to judge code quality).
#   bash infra/brain-export.sh   →  writes /tmp/brain-export.md  +  prints it
P(){ PGPASSWORD=postgres psql -h localhost -U postgres -d puglit -tAc "$1" 2>/dev/null; }
OUT=/tmp/brain-export.md
{
  echo "# PUGLIT BRAIN EXPORT — $(date -u +%FT%TZ)"
  echo
  echo "## 1) Stats"
  echo "- exemplars (verified good code): $(P "SELECT count(*) FROM verified_exemplars")"
  echo "- builds: $(P "SELECT string_agg(status||'='||c,' ') FROM (SELECT status,count(*) c FROM puglit_jobs GROUP BY status) t")"
  echo "- clean rate (build_success): $(P "SELECT string_agg('val'||value||'×'||c,' ') FROM (SELECT value,count(*) c FROM puglit_metrics WHERE name='build_success' GROUP BY value) t")"
  echo "- agents: $(P "SELECT string_agg(team||' lvl'||lvl||'/'||xp||'xp/'||w||'w', '  ') FROM (SELECT team,max(level) lvl,sum(xp) xp,sum(wins) w FROM puglit_agents GROUP BY team) t")"
  echo "- skills evolved (v>1): $(P "SELECT count(*) FROM puglit_skills WHERE version>1")  ·  modules: $(P "SELECT count(*) FROM puglit_modules")  ·  diary entries: $(P "SELECT count(*) FROM puglit_agent_diary")"
  echo "- exemplars with SQL-injection pattern (should be 0): $(P "SELECT count(*) FROM verified_exemplars WHERE code LIKE '%query(\`%\${%'")"
  echo
  echo "## 2) Evolved agent SKILLS (the distilled knowledge — the most important to review)"
  P "SELECT E'\n### area='||area||'  (v'||version||', val_score='||round(coalesce(val_score,0)::numeric,2)||')'||E'\n'||doc FROM puglit_skills WHERE status='active' ORDER BY area, version DESC"
  echo
  echo "## 3) Top diary lessons (deduped)"
  P "SELECT DISTINCT '- ['||kind||'] '||left(entry,170) FROM puglit_agent_diary WHERE kind IN ('lesson','win','critique') ORDER BY 1 LIMIT 30"
  echo
  echo "## 4) Harvested / custom modules (genome growth)"
  P "SELECT '- '||name||' ['||category||', '||status||']: '||left(coalesce(description,''),90) FROM puglit_modules ORDER BY created_at DESC LIMIT 25"
  echo
  echo "## 5) Sample exemplars (judge the actual code quality — 4 most recent)"
  P "SELECT E'\n### '||kind||' — '||left(coalesce(task,''),70)||E'\n\`\`\`\n'||left(code,1400)||E'\n\`\`\`' FROM verified_exemplars ORDER BY created_at DESC LIMIT 4"
} > "$OUT"
echo "→ escrito en $OUT  ($(wc -l < "$OUT") líneas, $(wc -c < "$OUT") bytes)"
echo "   Para revisarlo:  cat $OUT     (o pegáselo a Claude)"
