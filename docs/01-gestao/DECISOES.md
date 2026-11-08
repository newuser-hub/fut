# Registo de decisões e políticas

| Ref. | Data | Decisão | Fonte | Situação |
|---|---|---|---|---|
| D-01 | 2026-11-07 | Progresso independente por coleção no navegador, com exportação/importação JSON | [Frontend](../../src/index.html) | Implementado |
| D-02 | 2026-11-07 | Autenticação HTTP Basic; segredo apenas em variável Vercel | [Proxy](../../proxy.js) | Implementado |
| D-03 | 2026-11-07 | Preservar posições legítimas sem fotografia; nunca inventar imagens | [Validador](../../scripts/verify_catalogs.py) | Política |
| D-04 | 2026-11-07 | Substituir FIFA 365 2027 por Mundial Adrenalyn XL 2026 na expansão, após bloqueio por falta de imagens | [Lote 2](../../ops/roadmap-lote2-checkpoint.md) | Histórico concluído |
| D-05 | 2026-11-07 | Sincronizar o plano na mesma transação de importação antes de validar | [Script](../../scripts/sync_expansion_plan.py) | Implementado |
| D-06 | 2026-11-07 | Integrar FIFA 365 2026 e Liga Portugal 2023/24 | [Lote 4](../../ops/roadmap-lote4-checkpoint.md) | Concluído |
| D-07 | 2026-11-08 | Separar histórico de bloqueios Vercel do READY posteriormente confirmado | [Publicação](../08-github-vercel/README.md) | Documentado |
| D-08 | 2026-11-08 | Reorganizar documentação numa branch distinta; preservar README integral | [Checkpoint](CHECKPOINT.md) | Proposta de PR |

Anotar decisões novas com data, fonte, motivos e estado; **não apagar nem reescrever o histórico**. O plano operativo mantém-se em [`public/expansion-plan.json`](../../public/expansion-plan.json).
