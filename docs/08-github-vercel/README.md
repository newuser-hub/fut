# 08 — GitHub, CI/CD, publicação e recuperação

## Estado comprovado (08/11/2026)

- Repositório [`newuser-hub/fut`](https://github.com/newuser-hub/fut), `main` `d5fb60eec0801808ec2946385a14c8c9226df54d`, **não alterada pela auditoria**.
- Branch de auditoria: `audit/fut-2026-11-08`, separada da produção; código das etapas 1–9 sujeito a revisão.
- [PR #1](https://github.com/newuser-hub/fut/pull/1): organização documental baseada em **29 coleções**, **continua aberto e não integrado**. Os seus conteúdos foram aproveitados e atualizados nesta branch, sem executar merge do PR #1.
- Produção Vercel: **READY** para o SHA exato de `main`, deployment `dpl_6d5JncMTvFHF9XcuRc4wy957AaWA`, aliases `fut-rosy.vercel.app` e `fut-pjr-s-projects.vercel.app`. Não serve como prova de que o código da branch de auditoria está publicado.

## Fluxo CI

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) executa em `pull_request`, `push main`, `push audit/fut-2026-11-08` e acionamento manual. Job **`FUT / validate`**, apenas leitura: Node 22, Python 3.12, `npm ci` e `package-lock.json` v3, build, progresso frontend, Basic Auth no proxy/API, mocks Drive, testes de deployment, verificadores de catálogos e plano. Em auditoria, Playwright com Chromium e WebKit Linux nas larguras 320/390/768 px tem [78/78 PASS](../../ops/audit-2026-11-08-step8-ui.md); **não equivale a Safari iOS real**.

A documentação gerada pode ser atualizada de forma controlada com `python3 scripts/refresh_documentation.py --write` e validada sem alterações com `--check`; o inventário não altera os JSON. Não inserir credenciais no ambiente de CI.

## As quatro workflows que publicam catálogos

[Próximo lote](../../.github/workflows/ingest-next-batch.yml), [lote do roteiro](../../.github/workflows/ingest-roadmap-batch.yml), [Premier League](../../.github/workflows/ingest-premier-league.yml) e [Itália/França](../../.github/workflows/audit-italia-franca.yml) utilizam:

1. Um lock exclusivo por referência Git `ci/fut-catalog-write-lock`, adquirida por push **sem force** e libertada após verificar o titular; não usar grupo fixo de `concurrency` que substitua um run ainda pendente.
2. O **pedido original do SHA que disparou a execução**, imutável mesmo que outro PR altere posteriormente `requests/*.json`.
3. Obtenção da última `main` sob lock; importação e auditoria integral do lote; `verify_catalog_transaction.py` verifica os slugs/IDs e ficheiros exatos **depois do git add e antes do commit**.
4. `git push` não forçado; se `main` avançou, refazer o lote a partir de `origin/main`, **sem rebase de catálogos parcialmente gerados**. A falha não produz commit parcial.

**Limites:** crash do runner pode deixar um lock órfão; inspecionar proprietário/Actions antes de o remover manualmente. As workflows ainda fazem push direto a `main`: uma regra universal que exija PR irá bloqueá-las. Preferir evolução para branches + PRs, com aprovação, antes de ativar proteção estrita; nenhuma configuração foi alterada nesta auditoria. [Análise de etapa 7](../../ops/audit-2026-11-08-step7-ci.md).

## Validação de deploy e segurança

[`verify-fut-access.yml`](../../.github/workflows/verify-fut-access.yml) e [`scripts/verify-fut-deployment.mjs`](../../scripts/verify-fut-deployment.mjs) exigem metadados Vercel confirmando **`production` + `READY` + SHA pretendido** nos **dois aliases e no mesmo deployment ID**, antes de GET anónimo à página, manifesto, plano, catálogos e API.

- `401` com `WWW-Authenticate: Basic realm="FUT - Cadernetas"` e `no-store` comprova desafio da **aplicação** no SHA publicado;
- `401`/`403` com `Bearer`, SSO ou redirect `/_vercel/` aponta para **proteção da plataforma**, não autenticação Basic da aplicação;
- token Vercel de leitura ausente, SHA não READY ou aliases em versões diferentes ⇒ **PENDENTE/FAIL**, não aceitar deployment antigo como prova.

**Importante:** a workflow está na branch de auditoria; não foi aplicada a produção nesta etapa. Não criar tokens Vercel nem pedir deploy por estes documentos.

## Recuperação: procedimento sequencial

1. Identificar o **SHA exato** de `main`, o HEAD da branch de auditoria, PRs abertos, Actions a decorrer e a versão `READY` real dos dois aliases.
2. Se um lote falhou antes do commit, conservar `main` e os ficheiros ativos; inspecionar o lock. Não eliminar a fila/renovar o lote sem confirmar autorização e origem.
3. Se `main` mudou durante importação, executar novo ciclo desde a `main` recente com o **mesmo pedido autorizado**, validar catálogo/manifesto/roteiro no mesmo commit e não fazer force-push.
4. Se um deploy falhou por quota, **não alegar publicação**: último READY continua ativo até Vercel confirmar outra versão; registar impedimento e SHA pendente. Não contornar quotas.
5. Se for necessária reversão **autorizada**, escolher o último commit/artefacto validado, recuperar a versão através do fluxo Git e Vercel controlado, confirmar `READY` e testar a aplicação. Não apagar IDs de cromos, chaves de progresso nem backups.
6. Se Drive futuro falhar, não ativar backend incompleto; staging e promoção são operações separadas e não fazem fallback externo. [Recuperação por geração](../GOOGLE_DRIVE_STORAGE.md).
7. Se um dispositivo perder progresso, restaurar do JSON exportado da **mesma coleção**, não dos catálogos em GitHub.

## Histórico identificado

O [PR #1](https://github.com/newuser-hub/fut/pull/1) referia o SHA `4fc739b7` e 29 coleções; os antigos erros de quota `HTTP 402` e o deployment de 29 são **história**, não diagnóstico de hoje. O [checkpoint de cada lote](../../ops/) preserva esses eventos sem os reescrever. Esta documentação não faz merge nem envia deploy.

## Seguimento de 09/11/2026

O [checkpoint corrente](../../ops/followup-2026-11-09.md) regista a continuação da release. Browser e auditoria profunda são agora verificações permanentes de PR/main. Os quatro importadores exigem execução explícita (`workflow_dispatch`); mudanças de código/workflow não lançam importações. A prova autenticada de release usa exclusivamente o ambiente protegido do próprio projeto Vercel, com destinos limitados e sem registar segredos.
