# FUT — Arquivo de Cadernetas Digitais

Portal privado de cromos de futebol. **Estado dos JSON em 08/11/2026: 47 coleções ativas, 26.774 posições e quatro categorias — Portugal, Seleções, Champions League e Outros.** A [contagem é calculada diretamente](docs/metrics-current.json) dos ficheiros do repositório, não de um README histórico.

**[Documentação por dez categorias](docs/README.md)** · [Inventário das 47 coleções](docs/02-colecoes/README.md) · [Imagens e auditoria](docs/04-imagens/README.md) · [Operação e recuperação](docs/08-github-vercel/README.md) · [Checkpoint da auditoria](ops/audit-2026-11-08.md).

## Estado dos dados e imagens

| Indicador | Valor |
|---|---:|
| Coleções ativas / posições | **47 / 26.774** |
| Secções | **1.508** |
| Cromos com URL, bytes e SHA-256 persistidos | **24.695** |
| Ligações oficiais Topps sem hash validado | **5** |
| Posições sem URL de imagem | **2.074** |
| Capas (URLs separadas dos cromos) | **47** |
| Roteiro editorial | **30 candidatas; 26 integradas, 4 bloqueadas, 0 outras pendentes** |

A [auditoria HTTP da etapa 4](ops/audit-2026-11-08-step4-images.md) confirmou **24.742 URLs de imagem** por GET/MIME/bytes/SHA-256 em 08/11/2026 (24.695 cromos e 47 capas). Os cinco links Topps responderam HTTP 403 no runner. Uma imagem com hash histórico não está necessariamente disponível hoje; não inventar fotografias nem apagar posições incompletas.

## Instalação e desenvolvimento local

Requer **Node.js 22**, **Python 3.12** e npm. A instalação usa lockfile npm v3; os browsers de teste automatizado são opcionais.

```bash
git clone https://github.com/newuser-hub/fut.git
cd fut
npm ci --ignore-scripts
npm run build
python3 scripts/verify_catalogs.py
python3 scripts/verify_expansion_plan.py
node scripts/verify-portal-groups.mjs
```

Para testar a **branch de auditoria** e as suas correções ainda não publicadas, mudar explicitamente para `audit/fut-2026-11-08` antes de instalar e compilar. O comando `npm run build` sincroniza `src/index.html` para `public/index.html` e reconstrói os dois arquivos legados apenas se faltarem.

```bash
node --test scripts/test-frontend-progress.mjs scripts/test-access-security.mjs \
  scripts/test-drive-storage.mjs scripts/test-drive-migration.mjs \
  scripts/test-drive-store-safety.mjs scripts/test-verify-fut-deployment.mjs
python3 -B -m unittest scripts.test_catalog_transaction scripts.test_catalog_lock scripts.test_workflow_writers
python3 scripts/refresh_documentation.py --check
npx playwright install chromium webkit
npx playwright test scripts/test-portal-browser.spec.mjs
```

Os testes de browser usam um servidor local e uma API simulada, sem credenciais e sem imagens externas; **WebKit Linux automatizado não equivale a Safari real ou iPhone físico**. [Matriz 78/78 da etapa 8](ops/audit-2026-11-08-step8-ui.md).

## Arquitetura

- **Frontend:** `src/index.html`, compilado em `public/index.html`; portal, índice, pesquisa, páginas, revelação e favoritos.
- **Dados:** `public/library.json` (manifesto), `public/data/*.json` (47 catálogos), `public/expansion-plan.json` (roteiro de 30 candidatas). Não editar IDs para adaptar documentação.
- **Autenticação:** `proxy.js` e `lib/access-control.js` exigem HTTP Basic com `FUT_ALBUM_PASSWORD` no ambiente; a API `api/storage.js` verifica a autorização independentemente. Na ausência de configuração, falha fechado. **A proteção do site não torna privados os ficheiros de um repositório GitHub público.**
- **Armazenamento:** Vercel/JSON estáticos por defeito; `lib/drive-store.js`, `lib/drive-migration.js` e `scripts/migrate-drive.mjs` preparam um backend Google Drive **não ativado e sem migração real**. [Procedimento e limites](docs/GOOGLE_DRIVE_STORAGE.md).
- **Publicação:** Vercel com `vercel.json` e GitHub Actions. As alterações desta auditoria estão na branch isolada; o último deployment de produção revalidado corresponde a `main` em `d5fb60eec0801808ec2946385a14c8c9226df54d`, **READY**. Não aceitar READY de outro SHA como prova de publicação nova.

## Progresso pessoal, backup e recuperação

`revealed` e `favorites` ficam **exclusivamente no `localStorage` deste browser**, na chave `fut.album.<id>.progress.v1`. Cada coleção tem progresso próprio, sem conta de utilizador ou sincronização automática. Para cópia de segurança, abrir a coleção, selecionar **Exportar** e conservar o JSON; para repor, usar **Importar** na **mesma coleção**, confirmando a substituição. Antes de trocar de dispositivo, limpar dados do browser ou mexer em IDs, exportar cada coleção separadamente. Um deploy normal não transfere nem garante a persistência do armazenamento local.

Se uma publicação ou importação de catálogos falhar: verificar o SHA e estado da Actions, preservar o manifesto e os catálogos intactos, confirmar a publicação `READY` do SHA certo nos **dois domínios**, e reverter para o último commit válido pelo fluxo Git/Vercel autorizado. Nunca concluir um lote parcial nem fazer `push --force`. O [guia operacional](docs/08-github-vercel/README.md) documenta a sequência e o lock entre as quatro workflows escritoras.

## Regras de segurança, qualidade e integração

A CI [`FUT / validate`](.github/workflows/ci.yml) cobre PRs, scripts, frontend, dados, proxy/API e Drive, usando `npm ci`, testes Node/Python e fixtures isoladas. Os pipelines de importação só devem avançar com pedidos autorizados e validação do lote exato antes do commit; não estão autorizadas novas importações por esta auditoria.

Não colocar palavras-passe, refresh tokens, contas de serviço ou credenciais no GitHub. Não assumir que um URL de cromo dá licença para redistribuir imagens. Este é um projeto independente, não afiliado aos titulares das marcas.

## Histórico, PRs e situação da auditoria

A [documentação de dez categorias proveniente do PR #1](https://github.com/newuser-hub/fut/pull/1) nasceu quando havia **29 coleções / 18.873 posições**. O [README original dessa época foi arquivado integralmente](docs/01-gestao/README-original-2026-11-08.md) e o [mapa de 76 ficheiros](docs/source-map.json) permanece identificado como histórico. O README anteriormente publicado com **39 coleções** também não representava o estado atual e foi substituído por este resumo derivado dos JSON.

A auditoria é sequencial e está registada em [`ops/audit-2026-11-08.md`](ops/audit-2026-11-08.md). **Não foi executado merge, migração Drive ou deploy nesta etapa documental.** O PR #1 continua aberto para revisão própria.
