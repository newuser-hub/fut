# FUT — Checkpoint do lote 13 e fecho da fase 2 (8 de novembro de 2026)

## Autorização e ponto de partida

- Pedido autorizado para apenas as coleções **Liga Portugal 2016/17** (Cromos.pt ID 64) e **Liga Portugal 2014/15** (ID 55); registado em `requests/roadmap-batch.json` com `batch=roadmap-13` e `authorizedSourceIds=[64,55]`, commit [1000cca6](https://github.com/newuser-hub/fut/commit/1000cca672c97ba909f38ac69d795131b0fc9943).
- Base: `main` no commit `c512b91373af1d6bafdab3ff07455abdfced77d9`, **45 coleções ativas, 25.836 cromos**. As verificações do lote 12 (integridade/frontend e proteção HTTP 401) estavam em **SUCCESS** e o SHA correspondente em Vercel `production READY`.
- Pré-auditoria: 442 caminhos de imagem para 442 posições na edição de 2016/17 e 496 caminhos para 496 posições na edição de 2014/15. A cobertura foi novamente verificada individualmente na importação.

## Auditoria e integração transacional

- [GitHub Actions 42482442878](https://github.com/newuser-hub/fut/actions/runs/42482442878): **SUCCESS** em validação inicial, auditoria e importação das duas coleções, sincronização do roteiro, testes de todos os catálogos e do frontend, commit e push.
- [Commit de integração bd4765ce](https://github.com/newuser-hub/fut/commit/bd4765ce94864f53a66444655f75f446a156c722): novos ficheiros `public/data/liga-portugal-2016-17.json` e `public/data/liga-portugal-2014-15.json` e atualizações transacionais de `public/library.json` e `public/expansion-plan.json`. O pedido `requests/roadmap-batch.json` tinha sido atualizado no commit de autorização.
- **Liga Portugal 2016/17 Panini** (origem 64): **442 posições = 402 principais + 40 extras**, **442/442 imagens verificadas**, 20 secções, zero imagens em falta.
- **Liga Portugal 2014/15 Panini** (origem 55): **496 posições = 406 principais + 90 extras**, **496/496 imagens verificadas**, 25 secções, zero imagens em falta.
- Total **938 posições**, **938 imagens auditadas individualmente** com GET HTTP, MIME `image/*`, tamanho e SHA-256; **938 hashes distintos** no lote. Nenhuma duplicação de IDs ou números de navegação, nenhum nome ou secção em branco, e secções compatíveis com os índices dos catálogos. Nenhuma substituição de fotografia ou de origem foi necessária.
- Comparação do manifesto entre os commits `c512b913` e `bd4765ce`: as **45 entradas anteriores são idênticas**. O diff mostra apenas os dois JSON novos, manifesto, roteiro e pedido; não foram alterados catálogos anteriores, OAuth, autenticação, código de progresso independente ou categoria Champions League.

## Resultado final e fecho do roteiro

- **47 coleções ativas, 26.774 cromos**; +2 coleções e +938 cromos face ao ponto de partida.
- Roteiro de **30 candidatas** em 15 lotes: **26 integradas, 4 bloqueadas e 0 pendentes**. Os quatro bloqueios históricos permanecem documentados; nenhuma coleção bloqueada foi incluída artificialmente.
- A fase 2 planeada nos lotes **9–13** está totalmente executada. Qualquer expansão futura ou reabertura dos bloqueios fica sujeita a pedido e autorização próprios.

## Publicação e segurança

- O commit de integração `bd4765ce94864f53a66444655f75f446a156c722` foi confirmado no Vercel em ambiente `production`, com estado **READY**, deployment `dpl_9fSLQfxqXiAt7Hau9rn6xftQ7wBK`.
- A workflow `.github/workflows/verify-fut-access.yml` inclui as rotas `/data/liga-portugal-2016-17.json` e `/data/liga-portugal-2014-15.json` nos dois domínios de produção `fut-rosy.vercel.app` e `fut-pjr-s-projects.vercel.app`. Exige **HTTP 401 exato** sem credenciais para a página inicial, manifesto, roteiro e dados.
- A workflow `.github/workflows/verify-expansion-plan.yml` passa a vigiar os dois novos JSON. Continuam ativos os testes de auditoria, manifesto, grupos e frontend.
- Após o commit de documentação, validar **separadamente** a conclusão em SUCCESS de ambas as workflows e o Vercel production READY com o SHA final de `main`.

## Estado de retoma

- Lote 13 concluído; nenhuma outra importação autorizada. Futuras tarefas devem começar por ler este checkpoint e o roteiro, revalidar `main`, Vercel, Actions, dados, autenticação e bloqueios. Não iniciar novas importações sem autorização explícita.
