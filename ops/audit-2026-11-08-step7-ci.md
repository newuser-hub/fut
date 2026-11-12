# FUT — Auditoria 2026-11-08, etapa 7/10 — CI e publicação de catálogos

**Data:** 08/11/2026. **Branch exclusivamente de auditoria:** `audit/fut-2026-11-08`. **SHA de `main` de referência:** `d5fb60eec0801808ec2946385a14c8c9226df54d`. **Vercel em produção:** `dpl_6d5JncMTvFHF9XcuRc4wy957AaWA`, READY no SHA de `main`. **Nenhuma importação, merge ou solicitação de deploy nesta etapa.**

## 1. Problemas identificados

1. **CI não transversal:** as workflows anteriores eram acionadas sobretudo por `push main` e filtros dispersos, sem exigir um único teste obrigatório para PRs que alterem frontend, catálogos, proxy, API, Drive, configuração e scripts. Não havia `package-lock.json` nem instalação npm reproduzível.
2. **Concorrência fragmentada:** quatro escritoras de catálogos partilhavam três grupos (`fut-ingest-collections`, `fut-ingest-premier-league` e `fut-ingest-leagues`). Impedia-se apenas parte das corridas. Unificar simplesmente um `concurrency.group` fixo, mesmo com `cancel-in-progress: false`, é insuficiente porque GitHub Actions conserva normalmente uma execução pendente por grupo, podendo substituir outra ainda não iniciada.
3. **Publicação sem preflight comum ao lote exato:** a verificação antes do `git commit` variava entre workflows; havia `git push` sem recuperação por completo em parte delas e `git rebase` de resultados gerados noutras, potencialmente sobre alterações concurrentes. O lote autorizado inicial podia ser substituído por uma versão posterior do ficheiro de pedidos.
4. **Proteção de produção ambígua:** `verify-fut-access.yml` verificava `HTTP 401` nos domínios sem confirmar previamente que o deployment estava `READY` e correspondia ao **SHA pretendido**. Um deployment antigo ou uma autenticação imposta pela plataforma podia originar conclusões indevidas.

## 2. Nova CI transversal

**Ficheiro:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

- `on: pull_request` para abertura, atualização, reabertura ou passagem a pronto para revisão; `on: push` para `main` e `audit/fut-2026-11-08`; disparo manual opcional. Não depende de filtros de paths: abrange alterações isoladas de frontend, dados, documentação, scripts, API, proxy, Drive ou configuração.
- Job de nome estável **`FUT / validate`**, com `contents: read`, sem credenciais de publicação, Python 3.12 e Node 22.
- `package-lock.json` **lockfileVersion 3**, gerado no runner a partir do `package.json` e validado com `npm ci --ignore-scripts --no-audit --no-fund`; mantém `@vercel/functions` exatamente na versão `3.11.0` declarada.
- Executa `npm run build`; compara `src/index.html` e `public/index.html`; valida agrupamentos/anos/roteiro, HTML, 47 catálogos e 26.774 cromos; preserva `fut.album.<id>.progress.v1`.
- Executa testes Node de concorrência de progresso, proteção Basic do proxy/API, mocks OAuth/conta de serviço, preparação/retoma Drive e mock do deployment Vercel.
- Executa Python de auditoria editorial, scanner HTTP offline, gate transacional de lotes e concorrência de writers com um repositório Git **local sintético**.
- Faz `bash -n` nos dois novos scripts de escrita, `node --check` em JS e valida `vercel.json`.
- O `node scripts/migrate-drive.mjs --plan` usado pela CI é um **plano local sem rede**, sem escrita Drive; `FUT_STORAGE_BACKEND` está vazio.

**Evidência final do código:** [run #42501568304](https://github.com/newuser-hub/fut/actions/runs/42501568304), **COMPLETED/SUCCESS** sobre `8e0f47346f2f840772f05530611c79467088a35e`. Resultado: **60/60 testes Node**, **31/31 testes Python**, `npm ci`, build e verificações restantes PASS. Os estados intermédios falhados durante criação de novos testes foram corrigidos e sucedidos por esta execução.

**Limitação de cobertura comprovada:** a execução bem-sucedida foi um `push` da branch de auditoria, não uma execução de PR (não foi criado PR por não ter sido solicitado). A configuração para PR está pronta, mas a primeira execução efetiva em PR depende de abertura de um PR futuro.

## 3. Exclusão mútua que não elimina pedidos pendentes

**Workflows de escrita alteradas:**
- [`ingest-next-batch.yml`](../.github/workflows/ingest-next-batch.yml) — próximo par autorizado;
- [`ingest-roadmap-batch.yml`](../.github/workflows/ingest-roadmap-batch.yml) — par do roteiro autorizado;
- [`ingest-premier-league.yml`](../.github/workflows/ingest-premier-league.yml) — Premier League;
- [`audit-italia-franca.yml`](../.github/workflows/audit-italia-franca.yml) — Itália/França.

Todas chamam [`scripts/catalog-write-lock.sh`](../scripts/catalog-write-lock.sh), que cria atomicamente uma referência Git `refs/heads/ci/fut-catalog-write-lock` com um commit órfão exclusivo por `GITHUB_RUN_ID` + tentativa. Um commit diferente **não consegue fazer fast-forward** desta referência. A criação é por `git push` sem `--force`; uma execução que encontra a referência ocupada espera e tenta novamente.

- **Não há grupo `concurrency` partilhado**, evitando que o GitHub substitua silenciosamente o pedido pendente. Cada run mantém o SHA/evento próprio.
- O filho só inicia a importação **depois** da aquisição do lock; no fim, `trap` tenta libertar a referência e confirma antes que ainda pertence ao mesmo run.
- Se o runner terminar abruptamente ou o lock ficar inacessível, o script **falha fechado**; não apaga automaticamente a referência de um eventual proprietário ainda ativo. O pedido original continua identificável pelo SHA do evento e pelo histórico do run, para reexecução controlada.
- Timeout de espera: **90 minutos**; workflow com limite de **120 minutos**. Uma expiração não equivale a integração nem a descarte definitivo: é necessário inspecionar o lock e reexecutar a execução.
- Testes de integração `scripts/test_catalog_lock.py` criaram um repositório Git remoto *local descartável* e lançaram dois processos em competição. Verificaram a ordem `start A → end A → start B → end B`, ausência de push sobre `main` e remoção do lock no fim.
- **Limite operacional:** a referência Git exige permissão `contents: write` e permissão para criar/apagar a branch de lock. Proteções futuras de branch/rulesets não devem impedir inadvertidamente esta operação; se impedirem, o processo falha, sem contornar as proteções. Lock órfão requer inspeção do proprietário e das Actions em curso antes de remoção manual autorizada.

## 4. Validação exata, sem commits parciais

**Ficheiros:** [`scripts/catalog-publish-batch.sh`](../scripts/catalog-publish-batch.sh) e [`scripts/verify_catalog_transaction.py`](../scripts/verify_catalog_transaction.py).

- O pedido ``requests/next-batch.json`` ou ``requests/roadmap-batch.json`` é extraído do **SHA do evento `GITHUB_SHA`** via `git show` para um snapshot temporário. Quando outro run altera posteriormente o pedido na `main`, a execução original conserva os IDs e os `sourceId` inicialmente autorizados.
- **Depois de adquirir o lock**, refaz `fetch origin main` e parte da cabeça de `origin/main`. Executa o importador correspondente à workflow, seguida de build e de todos os verificadores.
- Antes do commit, o gate compara com `origin/main`: confirma **exatamente** os slugs autorizados, source IDs, 2 coleções nos lotes que o exigem, contagens, IDs de cromos, preservação das outras coleções, chave do progresso, lista restrita de paths alterados e inexistência de alterações tracked fora do staging.
- O roteiro exige coincidência `authorizedSourceIds` e `auditPipelineVersion`, `imageAudit=verified` e `auditSummary`, além de `verify_audited_batch.py` aplicado ao **snapshot inicial** do pedido.
- Só os ficheiros previstos são adicionados ao index; o commit Git publica o conjunto completo (manifesto e catálogos, e roteiro quando aplicável), **nunca checkpoints parciais**. Se não houver diferença, a execução termina sem commit.
- Se `main` avançar antes do push (ex.: ação humana independente do lock), o push sem force falha e o script **descarta o resultado gerado localmente e refaz a importação desde a nova `origin/main`**, com o mesmo pedido inicial e nova validação. Até 3 tentativas; depois falha com mensagem e permite reexecução do run. Não usa rebase de artefactos antigos nem força um push.
- Ações de importação têm triggers **apenas em `main` ou `workflow_dispatch`**, por isso editar os ficheiros na branch de auditoria **não desencadeou nenhuma nova importação**.

**Limites:** uma falha de runner, uma impossibilidade de descarregar imagens ou falta de permissão de push podem fazer o run falhar; nenhuma dessas situações transforma um pedido não verificado em sucesso. Retoma posterior usa o SHA do evento; pedidos imutáveis devem ser tratados individualmente. A exclusão não impede alterações humanas simultâneas em `main`, mas a verificação e o push não-forçado impedem que sejam silenciosamente sobrescritas.

## 5. Verificação rigorosa de produção

**Ficheiros:** [`verify-fut-access.yml`](../.github/workflows/verify-fut-access.yml), [`scripts/verify-fut-deployment.mjs`](../scripts/verify-fut-deployment.mjs), [`scripts/test-verify-fut-deployment.mjs`](../scripts/test-verify-fut-deployment.mjs).

A execução futura segue esta ordem obrigatória:

1. Determina o **SHA exato**: `github.sha` do evento, ou `expected_sha` indicado explicitamente em `workflow_dispatch`; valida 40 caracteres hexadecimais.
2. Usa **token Vercel de leitura** exposto apenas como `secrets.VERCEL_TOKEN`, caso esteja configurado, para consultar os metadados dos deployments apontados pelos dois domínios `fut-rosy.vercel.app` e `fut-pjr-s-projects.vercel.app`.
3. Exige para **cada** domínio `target=production`, `readyState=READY`, SHA igual ao solicitado e **o mesmo `deployment.id`**. Reconsulta por um período limitado enquanto o SHA ainda não estiver READY; se algum continuar a apontar para um deployment anterior, marca **PENDENTE/FAIL**. Jamais aceita o deployment antigo só porque esse devolve HTTP 401.
4. **Apenas depois** consulta, por GET anónimo, a página, manifesto, plano, catálogos e endpoints da API **em ambos os domínios**. A autenticação da aplicação só é confirmada com `HTTP 401`, `WWW-Authenticate: Basic realm="FUT - Cadernetas"` e `Cache-Control` com `no-store`.
5. Resposta/redirect de SSO, desafio Bearer ou outro indicador de proteção Vercel é distinguido de Basic Auth da aplicação; uma resposta 401 ambígua, 403 ou 200 também **não prova** o acesso privado à aplicação.
6. Se `VERCEL_TOKEN` não existir, se não for possível obter metadados, se o SHA não estiver READY ou se a resposta parecer protegida somente pela plataforma, a verificação termina **PENDENTE/FAIL**, sem inventar sucesso e sem testar credenciais reais.

O fluxo foi validado **com mocks** no CI. **Não se fez deploy do novo verificador**, nem se assumiu a existência de `VERCEL_TOKEN` na conta; a primeira execução com metadados reais depende de integração futura e de eventual configuração já autorizada. A workflow original em `main` não foi alterada nesta etapa.

## 6. Proposta de proteção de `main` — não aplicada

**Configuração proposta para revisão pelo titular do repositório:**

- Exigir PRs para alterações humanas e pelo menos **1 revisão de outro colaborador**, de preferência com `CODEOWNERS` para `.github/workflows/`, `proxy.js`, `api/`, `lib/` e `vercel.json`.
- Exigir o check estável **`FUT / validate`** em PRs, branch atualizada após mudanças significativas (`Require branches to be up to date`) e resolução das conversas antes do merge.
- Bloquear force-pushes, eliminação da `main` e bypass não autorizado; restringir administrativamente quem pode modificar as workflows que têm `contents: write`.
- **Compatibilidade importante:** as quatro importadoras acima ainda propõem `git push origin HEAD:main` após validar o lote. Uma regra que obrigue **todas** as alterações a `main` a vir de PR bloqueará esse mecanismo, incluindo `GITHUB_TOKEN`. Antes de aplicar esse nível de proteção, há duas vias: (a) alterar as importadoras para publicarem branches + PRs e aguardarem checks/revisão, opção preferida; ou (b) configurar exceção muito restrita para uma GitHub App de integração aprovada, com permissões específicas, mediante avaliação explícita dos controlos. Não declarar esta exceção existente e não a configurar nesta auditoria.
- A branch temporária `ci/fut-catalog-write-lock` deverá ser tratada na ruleset de modo a permitir apenas criação/eliminação pelo mecanismo autorizado, sem relaxar a proteção de `main`.
- O check `verify-production` valida o deployment **posteriormente** e é dependente da disponibilidade Vercel; deve ser **verificação pós-deploy**, não condição para aprovar um PR ainda não publicado.
- Proposta apenas documental. **Nenhuma regra, definição de conta, segredo, permissão de branch ou visibilidade do repositório foi alterada.**

## 7. Conservação e ponto de retoma

- `main`, PR #1 e deployment de produção estavam preservados no início da etapa. O PR #1 continua fora do âmbito das alterações de auditoria.
- **47 coleções, 26.774 posições, IDs, números, imagens e progresso independente preservados.** Sem alterações em `public/data/*`, `public/library.json`, `public/expansion-plan.json` ou HTML, e sem novas importações. `FUT_STORAGE_BACKEND` não foi ativado.
- O novo `package-lock.json` foi gerado e commitado **somente na branch de auditoria**. A workflow geradora `audit-fut-step7-lockfile.yml` está limitada a essa branch e não publica dados.
- Novas regras de execução de importadores **não foram exercitadas com serviços externos**, exceto o ensaio contra Git local. Não se pode declarar provada a integração futura na `main` sem a respetiva execução autorizada.
- **Etapa 7/10 concluída ao nível de código, testes e documentação. Etapa 8/10 NÃO INICIADA.** Reconfirmar SHA de `main`, PRs, Actions e Vercel antes do próximo passo.
