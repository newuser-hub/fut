# FUT — Checkpoint do lote operacional 5

Data da auditoria: **8 de novembro de 2026**. Repositório oficial: `newuser-hub/fut`, branch `main`.

## Concluído
- Antes: **29 coleções**, **18.873 posições**.
- Depois: **31 coleções**, **20.013 posições**; acréscimo de **1.140**.
- **UEFA Champions League 2024/25 Topps**, Cromos.pt 77 (`ucl-topps-2024-25`): 663 posições, 531 principais, 132 extras, 46 secções. Fotografias verificadas: 531 principais + 22 extras = **553**. Sem fotografia: 110 extras.
- **Liga Portugal 2022/23 Panini**, Cromos.pt 58 (`liga-portugal-2022-23`): 477 posições principais, 41 secções, **476** imagens verificadas, 1 sem imagem.
- Total de **1.029 imagens HTTP/MIME/tamanho/SHA-256**, 1.029 hashes distintos, 0 IDs duplicados, 0 números duplicados após a desambiguação editorial, 0 nomes e secções vazios.
- Fotografias não verificáveis não foram inventadas, substituídas por outras edições nem removidas da checklist.
- [GitHub Actions — execução 42464829865](https://github.com/newuser-hub/fut/actions/runs/42464829865) **SUCCESS**.
- [Commit da integração a1f843d](https://github.com/newuser-hub/fut/commit/a1f843df696439b8e51b7b9158d38d1f80bb4298) alterou apenas os dois ficheiros de catálogos, `public/library.json` e `public/expansion-plan.json`. Todos os restantes catálogos, IDs e motor do progresso independente foram preservados. Alterações de autenticação/OAuth feitas em paralelo também não foram afetadas.
- Roteiro `public/expansion-plan.json`: **10/20 integradas**, **3 sem imagens** (FIFA 365 2027, FIFA 365 Adrenalyn XL 2027 e FIFA 365 2024), **7 pendentes**. Histórico `executionLog` preservado.
- Produção Vercel `fut` / `prj_AgqL0LPT5Zyan4XFmtmwiOrch1sH`: deployment do commit `a1f843df696439b8e51b7b9158d38d1f80bb4298` confirmado **READY** no ambiente production. Proteção Basic Auth `FUT_ALBUM_PASSWORD` e proteção Vercel mantidas; não consultar nem divulgar segredos.

## Verificações finais e manutenção
- A workflow de validação foi alargada para executar `scripts/verify_audited_batch.py`, que comprova IDs, posições, nomes, secções, valores disponíveis, hashes e consistência com o roteiro; a workflow de autenticação incluiu os dois novos ficheiros JSON.
- Verificar novamente `main` e deployments antes de qualquer próximo pedido; evitar reimportar coleções já ativas.
- A próxima autorização possível é o par elegível **FIFA 365 2025 Panini (Cromos.pt 320)** e **Mundial Coreia/Japão 2002 Panini (Cromos.pt 17)**. Cobertura de imagens ainda não certificada para essas origens nesta etapa. Se insuficiente, documentar e escolher a próxima candidata ainda não integrada (Mundial França 1998, ID 15, ou posterior).
- Preservar autorização explícita lote a lote. Não há execução agendada em segundo plano.
