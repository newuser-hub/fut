# 07 — Autenticação, segurança e integridade

## Acesso ao portal

`proxy.js` aplica **HTTP Basic**, exigindo `FUT_ALBUM_PASSWORD` (somente ambiente do Vercel). Sem segredo configurado: **503 fail-closed**. Sem autorização ou senha errada: **401** com `WWW-Authenticate: Basic realm="FUT - Cadernetas"`. Credenciais válidas apenas permitem os métodos autorizados. A API `api/storage.js` revalida a autenticação de forma independente, recusa parâmetros inválidos e métodos não admitidos e devolve mensagens genéricas sem IDs internos ou tokens.

A [etapa 5](../../ops/audit-2026-11-08-step5-security.md) confirmou com GET anónimo em produção HTTP 401 para 11 recursos (página, manifesto, roteiro, catálogos e API), mantendo **teste autenticado real pendente**. Esta prova refere-se ao SHA da produção naquela data, não às alterações posteriores da branch de auditoria.

`vercel.json` acrescenta `Cache-Control: private, no-store`, `Vary: Authorization`, `nosniff`, política para impedir framing, e robots `noindex`. A CSP foi escolhida para não quebrar scripts inline e fotos externas existentes; não a confundir com uma CSP de bloqueio de todos os recursos remotos.

**Limite incontornável:** **um repositório GitHub público expõe os JSON e URLs dos catálogos independentemente do Basic Auth do Vercel**. A proteção da interface não cria privacidade dos dados na origem pública. Não publicar segredos no repositório, logs, issues, PRs ou relatórios.

## Modo Drive opcional — ainda desligado

- Só autenticação servidor via OAuth de utilizador ou conta de serviço numa Shared Drive; tokens nunca enviados ao browser.
- Só uma geração validada por SHA é servida; a API não faz fallback de imagens ou JSON para hosts externos se a Drive API falhar.
- Limites de streaming, verificação do SHA de todas as imagens e recuperação de checkpoints antes de promoção; nunca copiar conteúdo sem direitos de reprodução.
- Nenhuma credencial real, permissão, segredo ou migração foi usada nesta auditoria. [Procedimento da etapa 6](../GOOGLE_DRIVE_STORAGE.md).

## GitHub, branches e CI

A [CI transversal](../../.github/workflows/ci.yml) testa PRs sem credenciais de escrita. As workflows de importação possuem `contents: write` e usam lock Git único e gate do lote exato, mas continuam a propor push direto a `main`; por isso, **não ativar regra de PR obrigatório para todos sem adaptar os writers a branches/PRs ou aprovar uma exceção estritamente limitada**. [Proposta não aplicada](../../ops/audit-2026-11-08-step7-ci.md).

A verificação de produção exige deployment `production READY` do **SHA pretendido nos dois aliases** antes de testar os HTTP 401. Um login SSO/`Bearer` do Vercel não é prova do `Basic` da aplicação. Se faltar token de leitura ou o SHA não estiver READY, o resultado é **PENDENTE/FAIL**, nunca sucesso presumido.

## Recuperação

Na dúvida, não contornar autenticação; restaurar o último commit conhecido e verificar READY, mantendo backups dos cromos/progressos. Inspecionar logs resumidos, não mensagens que possam revelar tokens. [Operação e rollback](../08-github-vercel/README.md).
