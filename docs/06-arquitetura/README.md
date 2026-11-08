# 06 — Arquitetura, instalação e testes

## Componentes

```text
Cliente/browser
  ├── public/index.html ← build de src/index.html
  ├── localStorage[fut.album.<id>.progress.v1] (não sincronizado)
  └── /api/storage?... (proxy Basic, sempre)
         ├── backend Vercel predefinido → redirects para JSON estáticos
         └── backend Drive OPCIONAL → geração fut-active.json validada
              ├── library.json / expansion-plan.json / <slug>.json
              └── imagens/capas privadas, lidas por SHA-256
```

| Camada | Código | Função |
|---|---|---|
| Portal | [`src/index.html`](../../src/index.html) e [`public/index.html`](../../public/index.html) | Pesquisa, renderização, secções, cartões, backup local |
| Dados ativos | [`public/library.json`](../../public/library.json), [`public/data/`](../../public/data/), [`expansion-plan.json`](../../public/expansion-plan.json) | 47 coleções e roteiro de 30 |
| Segurança | [`proxy.js`](../../proxy.js), [`lib/access-control.js`](../../lib/access-control.js), [`api/storage.js`](../../api/storage.js) | Basic Auth, 401/503, validação e no-store |
| Drive | [`lib/drive-store.js`](../../lib/drive-store.js), [`lib/drive-migration.js`](../../lib/drive-migration.js), [`scripts/migrate-drive.mjs`](../../scripts/migrate-drive.mjs) | OAuth/SA, streaming limitado, staging/validação/promoção/retoma; não ativado |
| Importação | [`scripts/ingest_batch.py`](../../scripts/ingest_batch.py), [`scripts/ingest_premier_league.py`](../../scripts/ingest_premier_league.py), [`scripts/ingest_italia_franca.py`](../../scripts/ingest_italia_franca.py) | Dados/editorial, imagens e catálogos |
| Escrita consistente | [`scripts/catalog-write-lock.sh`](../../scripts/catalog-write-lock.sh), [`scripts/catalog-publish-batch.sh`](../../scripts/catalog-publish-batch.sh), [`scripts/verify_catalog_transaction.py`](../../scripts/verify_catalog_transaction.py) | Lock global de catálogos e gate do lote exato |
| CI | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [`playwright.config.mjs`](../../playwright.config.mjs) | npm ci, Node/Python, WebKit/Chromium automatizados |
| Publicação | [`vercel.json`](../../vercel.json), [`verify-fut-access.yml`](../../.github/workflows/verify-fut-access.yml) | Build e READY do SHA exato, sem confundir Basic/SSO |

## Instalação local (não faz deploy)

Node 22, Python 3.12 e npm são usados nas Actions. Na branch auditada:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run build
python3 scripts/verify_catalogs.py
python3 scripts/verify_expansion_plan.py
python3 scripts/refresh_documentation.py --check
node scripts/verify-portal-groups.mjs
```

`npm run build` chama `scripts/unpack-data.mjs`, que copia HTML editável e só expande dois legados se o respetivo JSON faltar. **Não corre importações reais**.

Testes de lógica e segurança:
```bash
node --test scripts/test-frontend-progress.mjs scripts/test-access-security.mjs \
  scripts/test-drive-storage.mjs scripts/test-drive-migration.mjs \
  scripts/test-drive-store-safety.mjs scripts/test-verify-fut-deployment.mjs
python3 -B -m unittest scripts.test_catalog_transaction scripts.test_catalog_lock \
  scripts.test_workflow_writers
```

Testes de browser automatizado (não Safari físico):
```bash
npx playwright install chromium webkit
npx playwright test scripts/test-portal-browser.spec.mjs
```

As suites de Drive usam **mocks**, chaves RSA efémeras e credenciais fictícias; não fazem uploads reais nem ativam o backend. A CI de PR e branch executa os verificadores sem segredos de produção.

## Backends e recuperação

O modo Vercel é o **único ativo em produção**. O protocolo Drive prepara uma geração isolada, valida todos os bytes, sela com `fut-ready.json` e só promove através de `fut-active.json`, sem catálogos parciais. A promoção compara o pointer anterior, mas **não é CAS distribuído**: exige serialização operacional. [Manual Drive](../GOOGLE_DRIVE_STORAGE.md).

O histórico e os mapas pessoais de `localStorage` são independentes da troca de backend. Para rollback de código, identificar o último commit/deployment válido e seguir [CI/CD e recuperação](../08-github-vercel/README.md). Não reescrever catálogos ativos para restaurar a documentação.
