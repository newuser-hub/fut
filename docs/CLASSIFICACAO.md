# Classificação documental FUT — atual e histórica

A organização de **dez categorias** deriva do [PR #1](https://github.com/newuser-hub/fut/pull/1) e foi reutilizada na etapa 9 para o estado de **47 coleções**. As categorias 04 (imagens) e 09 (auditoria) são vistas transversais dos JSON e evidências; não constituem catálogos independentes.

## Estado atual — referências primárias

| Categoria | Fonte de verdade | Documento atualizado |
|---|---|---|
| 01 — Gestão | `ops/audit-2026-11-08.md`, checkpoints, decisões | [Gestão](01-gestao/README.md) |
| 02 — Coleções | `public/library.json` e `public/data/*.json` | [47 coleções / 26.774 posições](02-colecoes/README.md) |
| 03 — Catálogos | JSON, arquivos legados e verificadores | [Catálogos](03-catalogos/README.md) |
| 04 — Imagens | Metadados SHA/URL dos JSON, GET HTTP e artefactos de auditoria | [24.695+5+2.074](04-imagens/README.md) |
| 05 — Funcionalidades | `src/index.html`, `public/index.html`, progresso local | [Portal e backup](05-funcionalidades/README.md) |
| 06 — Arquitetura | `scripts/`, `lib/`, `api/`, `package.json`, lockfile, Playwright | [Arquitetura](06-arquitetura/README.md) |
| 07 — Segurança | `proxy.js`, `lib/access-control.js`, `api/storage.js`, `vercel.json` | [Segurança](07-seguranca/README.md) |
| 08 — CI/CD | `.github/workflows/`, Vercel e SHA de deploy | [Publicação e rollback](08-github-vercel/README.md) |
| 09 — Qualidade | Scripts `verify_*.py`, `test_*` e relatórios `ops/` | [Auditorias](09-auditorias/README.md) |
| 10 — Backlog | `public/expansion-plan.json`, pedidos de lote | [30 candidatas](10-backlog/README.md) |

As métricas atuais são geradas em [`metrics-current.json`](metrics-current.json) a partir dos JSON de fonte e validadas por `python3 scripts/refresh_documentation.py --check`. Os ficheiros não foram fisicamente movidos: a classificação é **por referências**, sem duplicar dados ou quebrar URLs/caminhos da aplicação.

## Histórico preservado — classificação original PR #1

A tabela seguinte e o ficheiro [`source-map.json`](source-map.json) correspondem **exclusivamente ao snapshot do PR #1**, quando a `main` tinha 29 coleções e **76 ficheiros de origem**. Os números não descrevem o repositório atual, que acrescentou coleções, scripts de auditoria, workflows e documentação:

| Categoria | Número de ficheiros no PR #1 (histórico) |
|---|---:|
| 01 — Gestão | 4 |
| 02 — Coleções | 30 |
| 03 — Catálogos | 7 |
| 04 — Imagens | 0 |
| 05 — Funcionalidades | 3 |
| 06 — Arquitetura | 13 |
| 07 — Segurança | 2 |
| 08 — GitHub/Vercel | 9 |
| 09 — Auditorias | 0 |
| 10 — Backlog | 8 |
| **Total do snapshot antigo** | **76** |

Preservar o mapa antigo para rastreabilidade; **não** apresentá-lo como inventário atual nem alterar os ficheiros operacionais para coincidir com ele.
