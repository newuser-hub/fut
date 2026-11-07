# FUT — Lote operacional 3 — checkpoint (7 de novembro de 2026)

## Integrado e auditado
- Origem: GitHub `newuser-hub/fut` / branch `main`.
- Catálogos existentes antes do lote: 25 coleções, 16.793 posições.
- UEFA Champions League 2025/26 Topps (Cromos.pt ID 49): 584 posições, 44 secções, 574 imagens verificadas; 10 sem fotografia.
- Match Attax Extra 2025/26 Topps (Cromos.pt ID 51): 445 posições, 71 secções, 416 imagens verificadas; 29 sem fotografia.
- Resultado: **27 coleções, 17.822 posições**. Foram acrescentadas 1.029 cartas e 990 imagens auditadas, com 990 SHA-256 distintos e sem IDs ou números repetidos.
- A execução de integração de sucesso é https://github.com/newuser-hub/fut/actions/runs/42421482706; commit da biblioteca: `2d57d8d7b83849789353e74df71942908f99baa6`.
- A execução anterior https://github.com/newuser-hub/fut/actions/runs/42421359879 falhou antes da publicação, sem alterar os catálogos, porque o verificador exigia a sincronização do roteiro antes de validar. Corrigido com `scripts/sync_expansion_plan.py`.
- O manifesto existente, os ficheiros de todas as 25 coleções anteriores e a lógica de progresso local do frontend não foram modificados pela importação.

## Plano e seguintes
- `public/expansion-plan.json`: 6/20 integradas, 3 bloqueadas por falta de fotos e 11 pendentes. Registo editorial da importação no `executionLog`.
- FIFA 365 2024 (Cromos.pt 321) ficou bloqueada por 0/478 fotografias na fonte, conforme auditoria https://github.com/newuser-hub/fut/actions/runs/42419529030; manter a possibilidade de reabrir se surgir uma fonte idónea.
- Próximo lote operacional elegível **mediante autorização nova**: FIFA 365 2026 (Cromos.pt 44) e Liga Portugal 2023/24 (Cromos.pt 53). Verificar novamente `main`, Actions, fotografias e proteções antes de importar.
- A workflow `.github/workflows/ingest-roadmap-batch.yml` foi alterada para guardar também `public/expansion-plan.json` no commit transacional, evitando o problema deste lote.
- A publicação Vercel tem de ser confirmada para o SHA da `main` **após** este checkpoint e verificações; não presumir READY sem consulta. Projeto `fut` / `prj_AgqL0LPT5Zyan4XFmtmwiOrch1sH`, destino `production`.
- Verificar HTTP 401 sem credenciais em `/`, `/library.json` e ficheiros individuais novos; não consultar nem divulgar `FUT_ALBUM_PASSWORD`.

Este checkpoint existe para retoma sem repetir as auditorias e não autoriza trabalho assíncrono.
