#!/usr/bin/env bash
# Synchronisation CIBLÉE entre dépôts jumeaux (core <-> projets métier).
#   bash tools/sync-shared.sh setup <remote> <url>   # déclare l autre dépôt (une fois)
#   bash tools/sync-shared.sh list  <remote>         # commits de <remote>/main absents d ici, touchant les chemins partagés
#   bash tools/sync-shared.sh pick  <remote> <sha…>  # cherry-pick précis (commits limités aux chemins partagés)
#   bash tools/sync-shared.sh paths <remote>         # aligne les chemins de tools/shared-paths.txt sur <remote>/main
#   bash tools/sync-shared.sh diff  <remote>         # écart actuel sur les chemins partagés
# Les dépendances (rspack, carbon…) se mettent à jour dans CHAQUE dépôt via : yarn deps:egen
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
cmd="${1:-}"; remote="${2:-core}"
mapfile -t PATHS < <(grep -v -e "^#" -e "^\s*$" tools/shared-paths.txt)
case "$cmd" in
  setup) git remote get-url "$remote" >/dev/null 2>&1 || git remote add "$remote" "${3:?url requise}"; git fetch "$remote" ;;
  list)  git fetch -q "$remote"; git log --oneline --no-merges "HEAD..$remote/main" -- "${PATHS[@]}" ;;
  pick)  git fetch -q "$remote"; shift 2; git cherry-pick -x "$@" ;;
  paths) git fetch -q "$remote"
         for p in "${PATHS[@]}"; do git cat-file -e "$remote/main:$p" 2>/dev/null && git checkout "$remote/main" -- "$p"; done
         git status --short -- "${PATHS[@]}" ;;
  diff)  git fetch -q "$remote"; git diff --stat "HEAD" "$remote/main" -- "${PATHS[@]}" ;;
  *) sed -n "2,9p" "$0"; exit 1 ;;
esac
