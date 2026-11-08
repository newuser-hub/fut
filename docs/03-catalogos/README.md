# 03 — Catálogos e integridade dos dados

## Fontes de verdade

| Recurso | Ficheiro | Regra |
|---|---|---|
| Manifesto ativo | [`public/library.json`](../../public/library.json) | 47 IDs únicos, títulos, anos, categorias, contagens e secções |
| Catálogos | [`public/data/*.json`](../../public/data/) | Um JSON por coleção, preservando `id`, `number` e `originalNumber`, secção, ordem, imagem e SHA |
| Roteiro | [`public/expansion-plan.json`](../../public/expansion-plan.json) | 30 candidatas, 26 integradas, 4 bloqueadas; histórico de autorizações e alterações |
| Arquivos legados | [`archives/`](../../archives/) | Reconstrução seletiva dos primeiros dados; **não** constituem catálogos duplicados ativos |
| Pedidos históricos | [`requests/`](../../requests/) | Snapshot dos lotes, não autorização indefinida para executar |

**Snapshot gerado:** 47 catálogos, **26.774 posições e 1.508 secções**. [`docs/metrics-current.json`](../metrics-current.json) e [inventário das coleções](../02-colecoes/README.md) são derivados dos JSON, não dados de produção independentes.

## Contratos e preservação do progresso

Um cromo não deve perder a sua identidade ao ser reimportado, corrigido ou classificado. Os testes verificam cardinalidades, IDs e `number` de navegação; números impressos repetidos podem manter `originalNumber` e `sourceId` distintos, sem retirar posições.

Cada coleção mantém progresso local na chave `fut.album.<id>.progress.v1`; alterar IDs destruiria a associação ao backup existente. O arquivo JSON não contém progresso pessoal dos utilizadores.

```bash
npm ci --ignore-scripts
npm run build
python3 scripts/verify_catalogs.py
python3 scripts/verify_expansion_plan.py
python3 scripts/verify_audited_batch.py requests/roadmap-batch.json
node scripts/verify-portal-groups.mjs
python3 scripts/refresh_documentation.py --check
```

Os scripts de importação devem auditar apenas o **lote exato** autorizado e validar os seus JSON antes do commit, sob lock comum; a publicação de ficheiros parciais é proibida. [Implementação e testes](../08-github-vercel/README.md).

## Erros e recuperação

Se manifesto, JSON e roteiro divergirem, **não fazer deploy**. Comparar os IDs e os commits anteriores, reconstruir a partir do último `main` aprovado, executar os validadores e nunca corrigir um relatório manipulando os dados. A [etapa 7](../../ops/audit-2026-11-08-step7-ci.md) inclui repetição íntegra da importação quando `main` avança. A [etapa 6](../../ops/audit-2026-11-08-step6-drive.md) gere checkpoints de Drive em staging separado.

**Histórico:** a revisão original do PR #1 mencionava 29 coleções; o inventário atual é de 47. Não se reescreveram os antigos checkpoints para parecerem atuais.
