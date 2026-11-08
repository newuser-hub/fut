# FUT — Auditoria de segurança e controlo de acesso — etapa 5/10

**Data:** 08/11/2026. **Repositório:** `newuser-hub/fut`. **Branch isolada:** `audit/fut-2026-11-08`. **Base de produção:** `main` no commit `d5fb60eec0801808ec2946385a14c8c9226df54d`. **Sem merge nem deployment.**

## 1. Âmbito e conclusão

Ficheiros auditados e corrigidos: `proxy.js`, `api/storage.js` e `vercel.json`. Autenticação partilhada em `lib/access-control.js`; testes adicionados em `scripts/test-access-security.mjs` e `scripts/check-production-unauth.mjs`; compatibilidade dos mocks antigos em `scripts/test-drive-storage.mjs`.

**Resultado:** a autenticação no proxy e na API passou a falhar fechada quando falta a palavra-passe; o backend tem verificação independente, rejeita métodos inesperados e parâmetros ambíguos, evita cache de conteúdos privados e não regista mensagens internas de erro. O frontend e os dados das coleções ficaram inalterados.

**Evidência de execução:** [GitHub Actions #42495312895](https://github.com/newuser-hub/fut/actions/runs/42495312895), `COMPLETED/SUCCESS`, executada no commit `6ccf29ba4a3fb92e5cce93829ad2712751d2305a`. Testes locais em runner com credenciais **sintéticas e efémeras**; nenhuma palavra-passe real foi escrita, impressa ou utilizada.

## 2. Achados, gravidade e decisão

| Gravidade | Evidência observada na versão anterior | Correção na branch | Limitação |
|---|---|---|---|
| **Elevada — defesa em profundidade** | `api/storage.js` não verificava `Authorization`: confiava exclusivamente no `proxy.js` para bloquear pedidos diretos. Não foi demonstrado bypass em produção. | API agora exige a mesma autenticação Basic, também em `status`, manifesto, roteiro, catálogos, imagem e capa. | Exige integração/publicação futura autorizada antes de vigorar em produção. |
| **Moderada — higiene de logs** | O `catch` de Drive escrevia `e.message` truncada; alguns erros da biblioteca incluem nomes/IDs internos. | Logging substituído por código fixo `FUT storage: backend_read_failure`, resposta genérica HTTP 502. | Não demonstra que tenham ocorrido fugas anteriores; evita esse risco futuro. |
| **Moderada — validação de pedidos** | `kind`, `id` e `card` admitiam parâmetros extras/duplicados e alguns campos não exigidos; forma canónica não era verificada. | Apenas combinações permitidas; identificadores limitados; duplicados, extras, paths e traversal => HTTP 400. | Não altera os URLs emitidos pelo frontend. |
| **Moderada — retenção no browser** | Imagens/capas do Drive podiam ser retidas por `private, max-age=3600` após autenticação, por exemplo numa sessão partilhada. | `private, no-store` em todas as respostas de imagem, JSON, redirecionamento e erro; configuração estática igual. | Mais acessos à origem podem aumentar latência/consumo; não bloqueia imagens externas. |
| **Baixa — métodos HTTP** | Proxy deixava métodos inesperados prosseguir após autenticação; a API já recusava não-GET. | Proxy admite GET/HEAD, rejeita POST/PUT/PATCH/DELETE/OPTIONS/TRACE com 405; API permanece apenas GET (405 + `Allow: GET`). | HEAD para `/api/storage` termina 405; GET das páginas continua operacional. |
| **Baixa — cabeçalhos** | `vercel.json` tinha nosniff, X-Frame-Options, Referrer/Permissions; faltavam política de cache global, CSP mínima e noindex. | `Cache-Control: private, no-store`, `Vary: Authorization`, CSP `frame-ancestors 'none'; base-uri 'none'; object-src 'none'` e `X-Robots-Tag`. | CSP deliberadamente não limita `img-src`, `script-src`, `style-src` ou `connect-src` para não quebrar imagens externas, scripts inline ou funcionalidades existentes. |

**Sem alteração da configuração de segredos, permissões ou visibilidade do GitHub.** O nome de utilizador público do Basic Auth não deve ser confundido com a palavra-passe; a palavra-passe permanece exclusivamente na variável de ambiente de Vercel.

### Comportamentos esperados e cobertura

| Situação | Proxy (mock do `next()`) | API independente |
|---|---|---|
| Palavra-passe não configurada | **503**, `no-store`, sem executar `next()` | **503**, `no-store` |
| Credenciais ausentes | **401**, desafio Basic, `no-store` | **401**, desafio Basic, `no-store` |
| Credenciais erradas, utilizador errado ou esquema Bearer | **401** | **401** |
| Credenciais corretas | Continua para o encaminhamento em GET/HEAD | GET permitido; status/redirect e Drive conforme modo |
| Métodos inesperados após autenticação | **405**, `Allow: GET, HEAD` | **405**, `Allow: GET` |
| Query inválida, extra, duplicada, path ou ID com traversal | Autenticação obrigatória antes do encaminhamento | **400**, sem redirect |
| Modo Vercel, `kind=library/plan/catalog` autenticado | Passa pelo proxy | **307** para path **relativo e interno**, `no-store` |
| Modo Drive sem configuração, autenticado | Passa pelo proxy | **503**, sem fallback para URLs externos |
| Modo Drive ativo, autorizado | Passa pelo proxy | Dados e imagens servidos sem cache de browser, com MIME verificado no `readImage()` |
| Erro de leitura Drive | Não aplicável | **502** genérico; mensagem detalhada não entra em logs nem na resposta |

**Redirecionamentos:** os únicos Location configurados em modo local são `/library.json`, `/expansion-plan.json` e `/data/<slug>.json`, todos relativos. Os pedidos malformados não produzem redirecionamento para domínio externo. O proxy não envia `Location` nos 401/503.

**Cache:** não são produzidas respostas HTTP 401/503 cacheáveis; conteúdos autenticados locais e Drive na branch de auditoria usam `private, no-store`. A diretiva `Vary: Authorization` é uma proteção adicional. Esta política foi escolhida em detrimento do cache de navegador de imagens Drive, pois o site utiliza autenticação partilhada. Referência: [documentação Vercel sobre Cache-Control](https://vercel.com/docs/caching/cache-control-headers).

## 3. Testes automatizados e regressões

[Execução #42495312895](https://github.com/newuser-hub/fut/actions/runs/42495312895):

- **PASS 32/32 testes Node**, zero falhas: 18 casos da nova suite de segurança (`scripts/test-access-security.mjs`), quatro regressões existentes de Drive, dez regressões de seleção/progresso do frontend.
- **PASS 12/12 testes Python** das auditorias anteriores, incluindo invariantes de coleções, duplicados, scanner de imagens HTTP e retoma.
- **PASS** `npm run build`, comparação exata `src/index.html` ↔ `public/index.html`, agrupamentos do portal, `verify_catalogs.py`, `verify_expansion_plan.py`, `verify_audited_batch.py` e inventário de imagens.
- **PASS** preservação dos 47 catálogos, 26.774 posições, IDs, chave de progresso `fut.album.<id>.progress.v1` e correção anterior do cromo 383 de Salis Abdul Samed.
- Testes cobrem o mesmo código de autenticação partilhado entre proxy e API; `proxy.js` é exercitado com `next()` simulado, `api/storage.js` é importado diretamente no modo Vercel e é exercitado com Drive simulado para impedir operações reais sobre dados e contas.
- Nenhuma tentativa de login em massa ou ataque de força bruta; não se conhece nem se tentou descobrir a palavra-passe de produção.

## 4. Produção — apenas leitura, sem credenciais

O job `production-readonly` fez **11 pedidos GET** a `https://fut-rosy.vercel.app`, sem `Authorization`, sem seguir redirecionamentos e sem guardar corpos privados:

| Grupo | Rotas | Resultado |
|---|---|---|
| Página e favicon | `/`, `/index.html`, `/favicon.svg` | **3 × 401**, desafio Basic, `no-store` |
| Manifesto e roteiro | `/library.json`, `/expansion-plan.json` | **2 × 401**, desafio Basic, `no-store` |
| Catálogos | `/data/euro-2004.json`, `/data/ligue-1-foot-2025-26.json` | **2 × 401**, desafio Basic, `no-store` |
| API | `kind=library`, `kind=plan`, `kind=catalog&id=euro-2004`, `kind=status` | **4 × 401**, desafio Basic, `no-store` |
| **Total** | **11 rotas** | **11/11 bloqueadas sem autenticação** |

**Verificações em produção intencionalmente pendentes:** credenciais corretas, métodos não-GET, modos de Drive e cabeçalhos da versão corrigida, porque **o código da etapa 5 não foi publicado**. O facto de produção negar GETs sem credenciais confirma apenas a proteção desse cenário, não prova cobertura de todos os possíveis métodos, hosts ou caminhos.

## 5. Limites essenciais: repositório público ≠ site privado

**A proteção com palavra-passe na Vercel não torna privados os ficheiros do repositório público do GitHub.** Quem tiver acesso à versão pública de `newuser-hub/fut` pode continuar a consultar o código-fonte, manifestos, catálogos e outros ficheiros versionados, independentemente da autenticação do site. O conteúdo referenciado por domínios terceiros também não se torna privado devido à proteção do portal.

O cabeçalho `X-Robots-Tag` é apenas orientação de indexação do site e não é controlo de acesso aos ficheiros do GitHub. Não foi alterada a visibilidade do repositório, a configuração de segredos, os controlos de acesso nem as permissões.

## 6. Estado, limites e retoma

- **Correções limitadas à branch `audit/fut-2026-11-08`.** A produção continua no SHA `d5fb60eec0801808ec2946385a14c8c9226df54d` e **não inclui** as alterações da etapa 5.
- Os testes de produção são observacionais de GET não autenticado; não foi possível testar um login real porque não se usaram credenciais reais. A integração de `@vercel/functions` e o encaminhamento pós-autenticação real devem ser revalidados futuramente numa publicação explicitamente autorizada.
- As verificações de cabeçalhos/rotas na branch são automatizadas; sem deploy não se consegue afirmar a sua aplicação na CDN de produção.
- **Sem merge, sem deployment solicitado**, sem coleção nova, sem alteração dos IDs, números, progresso, fonte, imagens ou catálogos. O trabalho da etapa 4, incluindo Salis e hashes das imagens, foi preservado.
- **Etapa 5/10 concluída; etapa 6/10 não iniciada.** Antes de retomar, confirmar SHA de `main`, branch, PR #1, workflows e produção; seguir as prioridades do checkpoint sem repetir as etapas concluídas.
