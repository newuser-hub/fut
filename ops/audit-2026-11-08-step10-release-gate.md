# FUT — Auditoria etapa 10/10 — preflight final e bloqueio de publicação

**Data:** 08/11/2026. **Estado do gate:** **BLOQUEADO PARA MERGE/DEPLOY**, por impossibilidade de realizar/verificar a leitura **HTTP Basic autenticada real nos dois domínios de produção** sem acesso autorizado a um segredo de teste. **Nenhum merge, deployment, promoção, reversão, alteração de quotas, Vercel settings, Drive ou importação foi executado.**

**Referência exata antes da tentativa de integração:**
- Repositório: `newuser-hub/fut`.
- `main`/produção anterior: `d5fb60eec0801808ec2946385a14c8c9226df54d`.
- Branch auditada: `audit/fut-2026-11-08`, [PR #2](https://github.com/newuser-hub/fut/pull/2), **draft, aberto, não integrado**. O SHA candidato é o HEAD do PR; a execução do preflight iniciou no commit `f4e1a7756d2b9491db8a5d9e1a9671d53e90398b`, que contém a mesma aplicação da etapa 9, mais a workflow de preflight.
- PR documental [#1](https://github.com/newuser-hub/fut/pull/1) **continua aberto e não integrado**.
- Produção antiga: [deployment Vercel `dpl_6d5JncMTvFHF9XcuRc4wy957AaWA`](https://vercel.com), `target=production`, `READY`, metadados Git do SHA acima. Ambos os aliases `fut-rosy.vercel.app` e `fut-pjr-s-projects.vercel.app` foram inspecionados **independentemente** e devolvem o **mesmo deployment ID e SHA**.
- `FUT_STORAGE_BACKEND` não foi ativado em `drive`. A variável `FUT_ALBUM_PASSWORD` existe no Vercel como `sensitive`, mas o seu **valor não foi acedido, pedido, exportado ou registado**. Existência de configuração ≠ prova de sessão autenticada.

## A. Revisão do diff integral e da main

- No início do preflight, `main` foi relida, manteve `d5fb60...` sem alterações concorrentes. Comparação `main...audit/fut-2026-11-08`: branch **130 commits à frente / zero atrás**, **84 ficheiros alterados** antes da workflow de preflight (85 incluindo o preflight), com GitHub Actions, frontend, Basic Auth, API, Drive, scripts/testes, docs e um único JSON operacional.
- O patch integral de PR #2 foi obtido e percorrido para **todos os 84 caminhos**. A API GitHub omitiu o corpo do patch grande de `public/data/ligue-1-foot-2025-26.json`; por isso, os dois JSON foram relidos e comparados **recursivamente**. As únicas diferenças: `cards[382]`, imagem Salis anulada (URL removido, `available:false`, `bytes:0`, `sha256:null`) e metadados de auditoria (`available 548→547`, `missing 8→9`, motivo/data/ID); sem mudar ID, nome, número ou secção.
- Todos os outros `public/data/*.json`, `public/library.json`, `public/expansion-plan.json`, `requests/` e `archives/` permanecem iguais aos de `main`; cabeçalhos e fonte `src/index.html` coincidem byte a byte com `public/index.html`; chave `fut.album.<id>.progress.v1` preservada. **47 coleções / 26.774 posições / 1.508 secções**, quatro categorias originais, sem novas coleções nem migrar progresso.
- Nenhum credential literal foi identificado na revisão das linhas adicionadas, e os testes utilizam apenas credenciais sintéticas. O código exige `FUT_ALBUM_PASSWORD` em runtime mas não contém o segredo.

## B. Evidências da validação

**Preflight read-only e testes no código final:** [GitHub Actions #42515847075](https://github.com/newuser-hub/fut/actions/runs/42515847075), workflow [`audit-fut-step10-preflight.yml`](../.github/workflows/audit-fut-step10-preflight.yml), no SHA `f4e1a7756d2b9491db8a5d9e1a9671d53e90398b`:

| Componente | Ensaio | Resultado/documentação |
|---|---|---|
| Dados e progresso | Diff exato desde a main, Salis comparado campo a campo, IDs únicos; source/public idênticos | **PASS** no preflight |
| Build | Node 22, Python 3.12, `npm ci`, `npm run build`, sem alterações inesperadas | **PASS** no preflight |
| Catálogos e roteiro | `verify_catalogs.py`, `verify_expansion_plan.py`, lote exato e `verify-portal-groups.mjs` | **PASS** no preflight |
| Imagens | `audit_images_http.py --inventory-only` + testes Python; 24.747 URLs, 24.695 hashes de cromos, 5 Topps sem hash, 2.074 sem URL | **PASS** de inventário e mocks; **não** se fez novo GET de 24.747 imagens |
| Progresso, segurança, API, Drive | `node --test` das seis suites, com credenciais sintéticas/mocks OAuth e SA; `migrate-drive.mjs --plan` sem rede | **PASS: 60/60 testes Node e 38/38 testes Python** no preflight |
| Escritores, lock e documentação | Testes Python de transações, imagens, lock, workflows, índice e arquivo histórico | **PASS: 38/38 testes Python** no preflight |
| Interface | Playwright Chromium/WebKit Linux nas larguras 320, 390 e 768; foco, teclado, toques simulados, swipe, favoritos, exportação/importação, modal, reduced-motion | **PASS: 78/78 testes**, Chromium/WebKit Linux, 320/390/768 px, no SHA exato do preflight |
| Produção antiga — acesso anónimo | GET read-only sem Authorization para página/manif./API/catálogos em ambos os aliases, detetor de Basic vs proteção da plataforma | **PASS: 20/20 GET HTTP 401 Basic/no-store**, dez rotas × dois aliases, no SHA de produção **antigo** |
| Produção pretendida — leitura autenticada em ambos os aliases | Após deployment `READY` do SHA **novo**, GET com Basic autorizado em ambos os domínios, sem imprimir credenciais ou bodies privados | **NÃO EXECUTADO / BLOQUEANTE** |
| Produção pretendida — 401 anónimo em ambos os aliases | Exige confirmar primeiro que ambos os aliases apontam para deployment `READY` do **SHA novo** | **NÃO EXECUTADO**: ainda não publicado, não aceitar 401 do SHA anterior |

**Evidência anterior:** [etapa 4](audit-2026-11-08-step4-images.md) examinou 24.747 URLs em 08/11/2026: 24.742 GET 200 e cinco Topps HTTP 403; **zero divergências de hash confirmadas**. [Etapa 8](audit-2026-11-08-step8-ui.md) tinha 78/78 testes Playwright automatizados; a etapa 10 repetiu sobre o SHA do seu próprio preflight. [CI de PR](https://github.com/newuser-hub/fut/actions) executou `FUT / validate` com sucesso no HEAD após o checkpoint 9; os mocks não substituem autenticação real.


**Conclusão efetiva do run #42515847075:** job `FUT / final-preflight` `completed/success`. **60/60 testes Node**, **38/38 testes Python**, **78/78 testes de browser** e **20/20 GET anónimos 401 Basic** nos dois domínios da **produção antiga**; `npm ci`, build, comparação exata de Salis, inventário 24.747 URL, manifesto/roteiro e documentação também `PASS`. A exceção material é a **ausência de qualquer GET autenticado com credenciais reais**, por isso o gate de publicação continua bloqueado. Nenhuma prova deste run declara que o SHA novo esteja em produção.

## C. Razão explícita do BLOQUEIO de publicação

A validação exigida pelo utilizador inclui, **em ambos os domínios de produção**, leitura **autenticada** e HTTP 401 sem credenciais **no SHA exato acabado de publicar**. A palavra-passe Basic real está armazenada no Vercel como segredo `sensitive` e o preflight **não dispõe de uma credencial de teste através de um canal seguro de execução autorizado**. Não se deve recuperar, decifrar, imprimir, copiar ou colocar o segredo no GitHub/conversa para suprir esta falta. O teste de Basic com senha **sintética** em Node não é substituto.

O SHA de destino **ainda não está em produção**; por isso, seria falso atribuir-lhe os HTTP 401 ou READY observados na publicação antiga. Também não é aceitável fazer primeiro merge para descobrir depois que a condição essencial não pode ser comprovada: a integração em `main` pode iniciar automaticamente deployment pela ligação Git/Vercel.

**Decisão do gate:** PR #2 permanece em draft, `main` e aliases permanecem intactos. **NÃO MERGIR / NÃO PUBLICAR** nesta execução. Não houve alteração de plano/quota nem tentativa de contornar limites. A etapa 10 foi executada até ao preflight e fica **operacionalmente bloqueada** até existir um procedimento autorizado de teste autenticado e confirmação da versão.

## D. Ponto e plano de reversão, preparado, não executado

| Elemento | Valor de referência |
|---|---|
| Commit anterior seguro de `main` | `d5fb60eec0801808ec2946385a14c8c9226df54d` |
| Deployment anterior `production READY` | `dpl_6d5JncMTvFHF9XcuRc4wy957AaWA` |
| Projeto Vercel | `prj_AgqL0LPT5Zyan4XFmtmwiOrch1sH` |
| Aliases | `fut-rosy.vercel.app`, `fut-pjr-s-projects.vercel.app` |
| Progresso pessoal | `localStorage` por coleção, **nunca** alterar IDs/recriar chaves |

**Se uma integração/publicação FUT for futuramente autorizada e falhar:**
1. Registar o SHA do merge, ID e aliases da nova versão, erro e checks. Não alterar quotas, credenciais ou backend Drive.
2. Solicitar rollback Vercel **para o deployment exato acima** no projeto exato através do fluxo autorizado do Vercel, sem reconstruir a aplicação. O rollback pode suspender a atribuição automática de novos deployments; confirmar este estado antes de voltar a promover.
3. Para o GitHub, **reverter o commit de merge com um novo commit/PR**, em vez de `reset --hard`, eliminação de branch ou `push --force`; confirmar que a reversão só retira código alterado pelo PR de auditoria.
4. Confirmar **READY do deployment e SHA anteriores**, dois aliases, GET 401 Basic anónimo e **GET autenticado**, sem expor credenciais, e testes funcionais. A publicação é considerada recuperada só após provas positivas.
5. Conservar catálogos, arquivos, progressos por dispositivo e JSONs exportados. Não restaurar catálogo antigo removendo o registo de Salis; toda alteração de imagens exige auditoria/decisão própria.

**Situação efetiva agora:** não é necessário fazer rollback, porque **não foi feito merge nem deployment**. O rollback acima permanece apenas um procedimento documentado.

## E. Requisitos para reabrir o gate

- Estabelecer um **teste de autenticação Basic executado por ambiente protegido**, com segredo configurado diretamente no executor de teste, sem inclusão em repositório, conversas, outputs, screenshots, traces ou artefactos. Não transferir a palavra-passe do Vercel para um job de PR não fiável.
- Garantir mecanismo de publicar **uma única versão revisada** com rollout/retoma controlado e verificação imediata do SHA exato nos dois aliases; se faltar READY, quota ou prova real de autenticação, abortar/reverter pelo ponto documentado.
- Revalidar `main` e PR #2 antes de avançar e repetir os checks se o SHA candidato mudar.
- Não ativar Drive; não acrescentar coleções ou iniciar outra expansão.

**Conclusão:** preflight documental e técnico realizado, publicação **BLOQUEADA pela prova de leitura autenticada não disponível**. PR #1 inalterado. Nenhuma atualização de produção.
