# FUT — Auditoria UI, acessibilidade e desempenho — etapa 8/10

**Data:** 08/11/2026. **Repositório:** `newuser-hub/fut`. **Branch exclusiva de auditoria:** `audit/fut-2026-11-08`. **Base preservada `main`:** `d5fb60eec0801808ec2946385a14c8c9226df54d`. **Sem importação, merge ou deploy.**

**Conclusão:** etapa **8/10 concluída** em código, testes automatizados e documentação. **78/78 regressões de browser aprovadas** em seis projetos; **12/12 testes da baseline aprovados** antes da correção; testes existentes de Node/Python e CI de integridade preservados. Os resultados são exclusivamente **Chromium/WebKit automatizados num runner Linux com simulação de largura, media e toques**; não representam Safari real ou iPhone físico.

## 1. Ambiente, método e evidência

- Ficheiros reais testados: `src/index.html` sincronizado com `public/index.html`, manifesto real de **47 coleções** e os catálogos do repositório após `npm run build`.
- Serviço local `http://127.0.0.1:4173`; respostas da `/api/storage` controladas por fixtures locais, preservando os títulos/IDs reais e isolando os testes de qualquer conta Google Drive/Vercel. Imagens remotas foram bloqueadas deliberadamente; disponibilidade/legitimidade de fotografias continua a reger-se pela auditoria da etapa 4.
- Ferramentas fixadas em `package.json` e `package-lock.json`: `@playwright/test` **1.56.1**, `@axe-core/playwright` **4.10.2**, `@vercel/functions` **3.11.0**. Instalação reproduzível `npm ci`. A workflow de browser fixa o runner **Ubuntu 24.04**, pois a versão do Playwright não suporta dependências em Ubuntu 26.04.
- Projetos: **Chromium 320, 390, 768 px** e **WebKit 320, 390, 768 px**; altura de viewport 844 px, `hasTouch=true` e `deviceScaleFactor=1`; `isMobile=true` apenas nos projetos WebKit com largura inferior a 768 px. **Isto é emulação de viewport/touch no motor WebKit, não Safari de iOS.**
- Rede lenta: atrasos explícitos de **400 ms por resposta da API** via `page.route`, sem afirmar uma medição de throughput real. Não foram utilizadas credenciais; nenhum pedido autenticado à produção.
- Baseline antes das correções: [Actions #42503998781](https://github.com/newuser-hub/fut/actions/runs/42503998781), **12/12 PASS**, com logs `FUT_STAGE8_BASELINE_JSON` e `FUT_STAGE8_SLOW_BASELINE_JSON` e artefactos JSON.
- Regressão final com testes reforçados: [Actions #42505355709](https://github.com/newuser-hub/fut/actions/runs/42505355709), **78/78 PASS**, com logs `FUT_STAGE8_MATRIX_JSON`, `FUT_STAGE8_TOUCH_JSON` e `FUT_STAGE8_AFTER_SLOW_JSON`.
- Código de ensaio: [`playwright.config.mjs`](../playwright.config.mjs), [`scripts/test-portal-baseline.spec.mjs`](../scripts/test-portal-baseline.spec.mjs), [`scripts/test-portal-browser.spec.mjs`](../scripts/test-portal-browser.spec.mjs), [`scripts/portal-browser-fixture.mjs`](../scripts/portal-browser-fixture.mjs).
- CI do repositório `FUT / validate` permanece obrigatória na branch de auditoria; workflow antiga da etapa 2 foi ajustada para usar o snapshot concluído da etapa 7 como **baseline dos dados**, preservando a correção de Salis da etapa 4, sem bloquear a evolução autorizada do frontend/API/Drive.

## 2. Matriz de testes final — 78/78 aprovados

`C` = Chromium automatizado em Linux; `W` = WebKit automatizado em Linux, **não Safari real**. `PASS` = resultado demonstrado no runner. Cada projeto correu 13 cenários.

| Funcionalidade | C 320 | C 390 | C 768 | W 320 | W 390 | W 768 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Portal; Portugal 12, Seleções 23, Champions League 5, Outros 7; anos desc.; sem overflow horizontal | PASS | PASS | PASS | PASS | PASS | PASS |
| Pesquisa no portal normalizada (acentos/termos), foco e abertura de coleção | PASS | PASS | PASS | PASS | PASS | PASS |
| Índice, pesquisa de cromos, seleção de secção, paginação, setas do teclado | PASS | PASS | PASS | PASS | PASS | PASS |
| Clique simples, duplo clique, revelar/tapar e ampliação (rato/eventos de click) | PASS | PASS | PASS | PASS | PASS | PASS |
| Swipe horizontal de páginas com eventos `touchstart/touchend` **sintéticos** e sem virar cromo | PASS | PASS | PASS | PASS | PASS | PASS |
| Favoritos, `aria-pressed`, rótulo com identificação e progresso persistido | PASS | PASS | PASS | PASS | PASS | PASS |
| Exportar JSON e importar ficheiro da coleção correta, com confirmação | PASS | PASS | PASS | PASS | PASS | PASS |
| Modal: foco inicial, contenção de Tab/Shift+Tab, Escape, retorno do foco e nome acessível | PASS | PASS | PASS | PASS | PASS | PASS |
| Alvos de botões >=44×44, foco visível ao navegar com Tab e WCAG no álbum | PASS | PASS | PASS | PASS | PASS | PASS |
| `prefers-reduced-motion`, scroll `auto` e transições desativadas | PASS | PASS | PASS | PASS | PASS | PASS |
| API local com latência de 400 ms: carregamento/pesquisa e ausência de timeout | PASS | PASS | PASS | PASS | PASS | PASS |
| `Playwright touchscreen.tap`: toque gerado pelo motor, revelação e dois toques para tapar | PASS | PASS | PASS | PASS | PASS | PASS |
| axe-core WCAG 2.0/2.1 A/AA no portal e no modal aberto (sem violações **graves/críticas**) | PASS | PASS | PASS | PASS | PASS | PASS |

**Limites de interpretação:**
- O teste com `touchscreen.tap` injeta eventos táteis no motor de browser automatizado; não comprova latência, zoom de sistema, gestos físicos ou particularidades do Safari/iOS num dispositivo real.
- O swipe foi testado com objetos de evento sintéticos, pois o construtor nativo `Touch` não é disponibilizado pelo WebKit Linux dessa configuração. Não se apresenta esse teste como um swipe físico.
- O axe-core não substitui avaliação por tecnologias assistivas reais; o limiar de falha da regressão foi limitado a violações ``serious``/``critical`` das regras WCAG selecionadas. Não declarar auditoria WCAG manual completa ou zero advertências de qualquer severidade.
- A importação/exportação foi feita em contextos temporários Playwright (ficheiro JSON e localStorage **fictício**). Os testes Node da etapa 2 também cobrem cópias incompatíveis, IDs estranhos, conflitos de seleção e quota local, sem alterar o progresso existente do utilizador.

## 3. Medições prévias à otimização

**Baseline de carregamento com API local (sem atraso intencional, imagens externas bloqueadas):**

| Largura | Chromium | WebKit |
|---|---:|---:|
| 320 px | 352 ms | 744 ms |
| 390 px | 358 ms | 804 ms |
| 768 px | 348 ms | 444 ms |

**Baseline da resposta síncrona da pesquisa no portal**, medida em `performance.now()` entre `input.dispatchEvent` e a atualização do DOM (não inclui a escrita humana, a latência Playwright ou pintura futura): 

| Largura | Chromium | WebKit |
|---|---:|---:|
| 320 px | 21,9 ms | 10,0 ms |
| 390 px | 12,9 ms | 10,0 ms |
| 768 px | 10,5 ms | 6,0 ms |

**API com 400 ms de latência simulada por resposta**, carregamento até o browser da biblioteca estar visível:

| Largura | Chromium antes | Chromium depois | WebKit antes | WebKit depois |
|---|---:|---:|---:|---:|
| 320 px | 999 ms | 938 ms | 1.258 ms | 1.153 ms |
| 390 px | 976 ms | 945 ms | 1.237 ms | 1.101 ms |
| 768 px | 951 ms | 971 ms | 1.125 ms | 1.102 ms |

**Pesquisa após as correções, sob a mesma simulação de API lenta**:

| Largura | Chromium | WebKit |
|---|---:|---:|
| 320 px | 10,3 ms | 8,0 ms |
| 390 px | 12,2 ms | 11,0 ms |
| 768 px | 13,3 ms | 7,0 ms |

**Decisão:** o tempo de resposta medido antes das correções não justificou uma reescrita prematura da pesquisa. **Não foi feita otimização do algoritmo de pesquisa**. A comparação antes/depois mostra ausência de regressão relevante nas condições sintéticas, mas amostras únicas por combinação e variabilidade do runner **não sustentam afirmações de ganho estatisticamente significativo**. Não se mediu o carregamento autenticado da CDN de produção.

## 4. Falhas reproduzidas e correções

| Gravidade | Defeito demonstrado na baseline | Alteração validada |
|---|---|---|
| **Alta — acessibilidade e teclado** | Modal abria com foco ainda no cromo de fundo, Tab escapava do diálogo e Escape não devolvia o foco ao botão de origem nas seis configurações. | `zoom()` foca o botão Fechar; `aria-labelledby` identifica o título do cromo; `modalBackground()` aplica `inert` ao conteúdo, cabeçalho e rodapé; Tab/Shift+Tab circulam entre os controlos do modal; `closeModal()` devolve foco ao cromo anterior ou ao elemento correspondente se o DOM mudou. |
| **Moderada — toque** | Botão estrela de favoritos apenas **~21×22–23 px** em todas as larguras. | Alvo `.star` com **44×44 px** mínimos. Botões de navegação, ações de toolbar, categorias, subtrilho e modal têm altura mínima de **44 px**, sem substituição do estilo visual. |
| **Moderada — nomes/foco** | Botão favorito tinha apenas texto genérico “Adicionar aos favoritos” sem distinguir cromo, além de não ter estado `aria-pressed`. | Rótulo inclui número e nome do cromo e ação de adicionar/remover; expõe `aria-pressed`. `:focus-visible` acrescenta outline inequívoco para teclado. |
| **Moderada — movimento** | CSS já tinha `prefers-reduced-motion`, mas chamadas JavaScript ainda pediam `behavior:'smooth'`. | Nova função `scrollBehavior()` adapta `window.scrollTo` e `scrollIntoView` ao `matchMedia('(prefers-reduced-motion: reduce)')`; regressão confirmou `auto` após navegação assíncrona. |

As correções estão **apenas** em `src/index.html` e na sua cópia construída `public/index.html`. A estrutura do portal, as quatro categorias, o visual da caderneta, os slugs, IDs, catálogos e as chaves de `localStorage` foram mantidos.

**Falhas iniciais dos próprios testes:** após a primeira bateria de 66 cenários, 15 falhas da instrumentação foram corrigidas: dois handlers de confirmação concorrentes, uso de `new Touch()` não suportado no WebKit Linux e teste de `:focus-visible` com foco programático. A execução seguinte deu **66/66 PASS** [#42505059843](https://github.com/newuser-hub/fut/actions/runs/42505059843), e a matriz reforçada deu **78/78 PASS** [#42505355709](https://github.com/newuser-hub/fut/actions/runs/42505355709). A primeira tentativa de browsers em `ubuntu-latest` falhou devido a Ubuntu 26.04; foi corrigida fixando Ubuntu 24.04. Todas as falhas de teste foram investigadas; nenhuma indica modificação de catálogos ou progresso.

## 5. Segurança, dados e limites de produção

- **Nenhum dado de coleção foi alterado** em `public/data`, `public/library.json` ou `public/expansion-plan.json`; mantêm-se 47 coleções e **26.774 posições**.
- O progresso por coleção continua guardado em `fut.album.<id>.progress.v1` e **não foi migrado, apagado nem reescrito** na execução da auditoria. As importações reais de utilizadores não foram acionadas; apenas fixtures sintéticas em browser local.
- Não foram adicionadas coleções, imagens ou fotos de substituição. O cromo Salis Abdul Samed permanece com fotografia ausente, sem a imagem errada.
- Não se utilizou o site de produção para testar interações autenticadas: o portal está protegido por palavra-passe, que não foi disponibilizada nem procurada. Testes foram realizados localmente contra código da branch. Verificação de GET não autenticado à produção pertence à etapa 5.
- **Safari real em macOS: NÃO testado. Safari iOS/iPhone físico: NÃO testado. WebKit Linux automatizado: TESTADO (3 larguras). Chromium Linux automatizado: TESTADO (3 larguras). Emulação de viewport/touch: TESTADA.**
- A verificação de VoiceOver, tamanho dinâmico de texto em iOS, teclado físico Bluetooth, safe areas do Safari e gesto físico em iPhone permanece pendente se existir futura autorização e acesso a equipamento real.
- Regressões de browsers e Playwright não publicam site, não criam deploy, não ativam Drive, não usam credenciais reais. Os artefactos Actions são retidos temporariamente (14 dias na workflow).
- Nova versão só vigorará em produção após integração e deployment **expressamente autorizados noutra etapa**.

## 6. Retoma

**Etapa 8/10 CONCLUÍDA, etapa 9/10 NÃO INICIADA.** Antes de continuar, reler `ops/audit-2026-11-08.md`, reconfirmar `main`, PRs, Actions e deployment de Vercel; preservar todas as alterações concluídas e não repetir etapas. Sem merge e sem solicitação de deploy.
