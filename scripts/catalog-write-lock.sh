#!/usr/bin/env bash
# Exclusão mútua entre todas as workflows que publicam catálogos.
# Não usar grupo de concurrency fixo: GitHub Actions substitui o run pendente.
# Cada execução conserva o seu run_id e aguarda um lock criado sem --force.
set -euo pipefail
if [[ "${1:-}" != "--" || "$#" -lt 2 ]]; then
  echo "::error::Uso: bash scripts/catalog-write-lock.sh -- comando [args]" >&2
  exit 2
fi
shift
if [[ "${GITHUB_REF:-}" != "refs/heads/main" || -z "${GITHUB_RUN_ID:-}" ||
      -z "${GITHUB_RUN_ATTEMPT:-}" ]]; then
  echo "::error::Escrita de catálogos apenas em main sob GitHub Actions" >&2
  exit 2
fi
LOCK_REF='refs/heads/ci/fut-catalog-write-lock'
OWNER="${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
# Commit órfão e único: concorrentes nunca são fast-forward do lock.
tree=$(git mktree </dev/null)
commit=$(printf 'FUT catalog lock owner=%s workflow=%s\n' "$OWNER" "${GITHUB_WORKFLOW:-unknown}" |
  GIT_AUTHOR_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  GIT_COMMITTER_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" git commit-tree "$tree")
acquired=0
release() {
  if [[ "$acquired" -ne 1 ]]; then return 0; fi
  local current
  current=$(git ls-remote origin "$LOCK_REF" | awk '{print $1}')
  if [[ "$current" != "$commit" ]]; then
    echo "::error::Lock alterado; não remover ref de outro proprietário" >&2
    return 1
  fi
  if git push origin ":$LOCK_REF"; then
    echo "Lock de catálogos libertado; owner=$OWNER"
  else
    echo "::error::Não foi possível libertar lock; verificar antes de novo lote" >&2
    return 1
  fi
}
trap release EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
for ((attempt=1; attempt<=180; attempt++)); do
  if git push --quiet origin "$commit:$LOCK_REF" 2>/dev/null; then
    acquired=1
    echo "Lock de catálogos adquirido; owner=$OWNER"
    break
  fi
  current=$(git ls-remote origin "$LOCK_REF" | awk '{print $1}')
  if [[ "$current" == "$commit" ]]; then
    acquired=1
    break
  fi
  if [[ -z "$current" ]]; then
    echo "::error::Falha ao criar lock remoto; verificar contents:write e proteções" >&2
    exit 1
  fi
  if (( attempt==180 )); then
    echo "::error::Lock ocupado por mais de 90 minutos; pedido recuperável pelo SHA do evento" >&2
    exit 1
  fi
  sleep 30
done
# Sem lock não existe importação. Trap liberta o lock, mesmo com erro do filho.
"$@"
