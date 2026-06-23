#!/usr/bin/env bash
# Build a project from the TERMINAL — EXPRESS: just describe what you want, no Q&A.
# Designs (3 teams compete) → builds the winner to completion → tells you where it landed.
#
#   bash infra/build.sh                                   # interactive: prompts for title + description
#   bash infra/build.sh "Title" "full description here"  # one-shot
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="${1:-}"; WHAT="${2:-}"

if [ -z "$NAME" ]; then printf "\033[1;35m📛 Título del proyecto:\033[0m "; read -r NAME; fi
if [ -z "$WHAT" ]; then
  printf "\033[1;35m📝 Describí TODO de una\033[0m (entidades, acciones, lógica, a quién apunta — cuanto más completo, mejor):\n   > "
  read -r WHAT
fi
[ -n "$NAME" ] && [ -n "$WHAT" ] || { printf "  \033[1;31m✗\033[0m faltan título o descripción\n"; exit 1; }

# express = the description IS the spec; demo.sh designs + builds + reports end-to-end.
exec bash "$ROOT/infra/demo.sh" "$NAME" "$WHAT"
