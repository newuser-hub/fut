#!/usr/bin/env bash
# Invocado apenas dentro de scripts/catalog-write-lock.sh. Não gera importações
# durante CI de PR ou auditoria: é a operação futura de um lote autorizado.
set -euo pipefail
mode="${1:-}"
case "$mode" in next|roadmap|premier|leagues) ;; *)
  echo "::error::Modo de lote desconhecido" >&2; exit 2;; esac
if [[ "${GITHUB_REF:-}" != "refs/heads/main" ||
      -z "${GITHUB_SHA:-}" || -z "${GITHUB_RUN_ID:-}" ]]; then
  echo "::error::Só é permitida execução de evento main autorizado" >&2
  exit 2
fi
sha="$GITHUB_SHA"
if ! [[ "$sha" =~ ^[a-f0-9]{40}$ ]]; then
  echo "::error::SHA original do pedido inválido" >&2; exit 2
fi
# O pedido é o da revisão EXATA que disparou a execução, não o ficheiro
# eventualmente alterado por uma execução concorrente posterior.
snapshot=""
if [[ "$mode" == "next" || "$mode" == "roadmap" ]]; then
  path="requests/next-batch.json"
  if [[ "$mode" == "roadmap" ]]; then path="requests/roadmap-batch.json"; fi
  snapshot="$(mktemp /tmp/fut-authorized-${GITHUB_RUN_ID}-XXXXXXXX.json)"
  if ! git show "$sha:$path" >"$snapshot"; then
    echo "::error::Pedido não existe no commit do evento; abortar" >&2
    exit 1
  fi
  python3 -m json.tool "$snapshot" >/dev/null
fi
cleanup() {
  if [[ -n "$snapshot" ]]; then rm -f "$snapshot"; fi
}
trap cleanup EXIT
for round in 1 2 3; do
  # Recomeçar SEM rebase de artefactos gerados: a última main é a base real.
  git fetch --no-tags origin main
  git reset --hard
  git checkout -B fut-ci-catalog-writer origin/main
  npm ci --ignore-scripts --no-audit --no-fund
  node scripts/unpack-data.mjs

  case "$mode" in
    next)
      python3 -u scripts/ingest_batch.py "$snapshot"
      ;;
    roadmap)
      python3 scripts/verify_expansion_plan.py
      python3 -u scripts/ingest_batch.py "$snapshot"
      python3 scripts/sync_expansion_plan.py "$snapshot"
      ;;
    premier)
      python3 -m pip install --quiet pymupdf
      python3 -u scripts/ingest_premier_league.py
      ;;
    leagues)
      python3 -m pip install --quiet beautifulsoup4
      python3 -u scripts/ingest_italia_franca.py
      ;;
  esac

  node scripts/unpack-data.mjs
  python3 scripts/verify_catalogs.py
  python3 scripts/verify_expansion_plan.py
  node scripts/verify-portal-groups.mjs
  node --test scripts/test-frontend-progress.mjs \
    scripts/test-access-security.mjs \
    scripts/test-drive-storage.mjs \
    scripts/test-drive-migration.mjs \
    scripts/test-drive-store-safety.mjs

  if [[ "$mode" == "roadmap" ]]; then
    python3 scripts/verify_audited_batch.py "$snapshot"
  else
    python3 scripts/verify_audited_batch.py requests/roadmap-batch.json
  fi
  # Só podem entrar no commit os dois catálogos do pedido (ou slug dedicado).
  case "$mode" in
    next|roadmap)
      mapfile -t slugs < <(python3 -c \
        'import json,sys; print("\n".join(x["id"] for x in json.load(open(sys.argv[1]))["collections"]))' \
        "$snapshot")
      ;;
    premier) slugs=("premier-league-flagship-2026-27");;
    leagues) slugs=("serie-a-calciatori-2026-27" "ligue-1-foot-2025-26");;
  esac
  git add public/library.json public/index.html src/index.html
  if [[ "$mode" == "roadmap" ]]; then git add public/expansion-plan.json; fi
  for slug in "${slugs[@]}"; do git add "public/data/$slug.json"; done
  extra=()
  if [[ -n "$snapshot" ]]; then extra=(--request "$snapshot"); fi
  # Validação do lote EXACTO APÓS git add e ANTES do commit.
  python3 scripts/verify_catalog_transaction.py --mode "$mode" "${extra[@]}"
  if git diff --cached --quiet; then
    echo "Lote já integrado; nenhuma escrita remota"
    exit 0
  fi
  git commit -m "Integrar lote FUT $mode validado pelo evento $sha [skip ci]"
  if git push origin HEAD:refs/heads/main; then
    echo "Lote validado publicado no novo HEAD de main"
    exit 0
  fi
  echo "::warning::A main avançou durante a execução; refazer a importação integral sobre main atual (tentativa $round/3)"
  if (( round==3 )); then
    echo "::error::Não há push forçado nem rebase de resultados. Reexecutar o run pelo mesmo SHA e pedido autorizado."
    exit 1
  fi
done
