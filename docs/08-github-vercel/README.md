# 08 — GitHub e Vercel

## GitHub — snapshot 2026-11-08

- [Repositório](https://github.com/newuser-hub/fut), `main` `4fc739b7b425a62fbd3e80add57380405a86e607`.
- Na consulta inicial não existiam PRs abertos; as execuções recentes das Actions estavam concluídas.
- [Lote 4 — importação bem-sucedida](https://github.com/newuser-hub/fut/actions/runs/42422831409).
- [Validação do roteiro e 29 coleções — sucesso](https://github.com/newuser-hub/fut/actions/runs/42423109703).
- [Teste de acesso anónimo — sucesso](https://github.com/newuser-hub/fut/actions/runs/42423109689).

Falhas anteriores de ingestão do lote 3 foram corrigidas antes da conclusão; ver [checkpoint](../../ops/roadmap-lote3-checkpoint.md).

A main avançou com o backend Drive opcional (`4fc739b7`), mantendo a origem Vercel predefinida. Consultar [guia técnico](../GOOGLE_DRIVE_STORAGE.md).

## Vercel — estado confirmado diretamente

Deployment de **produção READY** associado exatamente a `4fc739b7b425a62fbd3e80add57380405a86e607`:

[https://fut-47351bvkp-pjr-s-projects.vercel.app](https://fut-n4tlbnjod-pjr-s-projects.vercel.app)

O [checkpoint do lote 4](../../ops/roadmap-lote4-checkpoint.md) descrevia uma tentativa anterior falhada por quota HTTP 402, quando o último READY tinha 27 coleções. Esse estado **já estava ultrapassado** na consulta de 2026-11-08, que encontrou 29 coleções no SHA de produção.

**Diferenças essenciais:** integração GitHub ≠ validação Actions ≠ deployment READY ≠ confirmação atual de segurança. Não inferir um estado dos restantes e verificar novamente antes de publicar.

A reorganização documental **não solicita deploy nem merge em main**.
