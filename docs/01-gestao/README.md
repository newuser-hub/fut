# 01 — Gestão do projeto e decisões

O FUT mantém **47 coleções e 26.774 posições**, quatro categorias de navegação e progresso local independente. A integração de dados faz-se por lotes autorizados e auditados, sem alteração de IDs. A arquitetura atual inclui Basic Auth no proxy e API e uma migração opcional Drive **preparada em código mas não executada**.

**Estado operativo:** [checkpoint principal da auditoria](../../ops/audit-2026-11-08.md), [snapshot das métricas](../metrics-current.json), [documentação do estado de produção](../08-github-vercel/README.md) e [decisões](DECISOES.md).

**Histórico de 29 coleções:** o [README original do PR #1](README-original-2026-11-08.md) foi arquivado integralmente. [Cronologia](../HISTORICO.md) e [checkpoints dos lotes](../../ops/) preservam estados temporais (incluindo quota Vercel ou coleções ainda não integradas naquele momento). **Não os interpretar como backlog atual.**

## Critérios de estado

- **No JSON:** consta do manifesto/catálogo do commit auditado; pode ainda não estar publicado.
- **Testado:** suite automatizada concluiu com sucesso sobre um SHA identificável.
- **Publicado:** deployment Vercel de produção `READY` para o **SHA exato**, verificado independentemente nos domínios.
- **Preparado/pendente:** implementação/roteiro existente, **não** autorização para importar ou ativar.
- **Histórico:** estado válido na data indicada, preservado para rastreabilidade.

A execução está segregada na branch `audit/fut-2026-11-08`. **Não integrar PR #1 nem a branch de auditoria sem revisão e autorização**, e não ativar Drive ou solicitar deployment por este documento.
