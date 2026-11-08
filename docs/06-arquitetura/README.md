# 06 — Desenvolvimento e arquitetura

| Ficheiro | Responsabilidade |
|---|---|
| [`src/index.html`](../../src/index.html) | Fonte editável do frontend |
| [`public/index.html`](../../public/index.html) | HTML de produção |
| [`public/library.json`](../../public/library.json) | Manifesto ativo |
| [`public/data/`](../../public/data/) | Dados por coleção |
| [`public/expansion-plan.json`](../../public/expansion-plan.json) | Plano editorial |
| [`scripts/ingest_batch.py`](../../scripts/ingest_batch.py) | Importação com auditoria de imagens |
| [`scripts/ingest_italia_franca.py`](../../scripts/ingest_italia_franca.py) | Importação específica Itália/França |
| [`scripts/ingest_premier_league.py`](../../scripts/ingest_premier_league.py) | Checklist Premier League |
| [`scripts/sync_expansion_plan.py`](../../scripts/sync_expansion_plan.py) | Sincronização transacional |
| [`scripts/unpack-data.mjs`](../../scripts/unpack-data.mjs) | Build/recuperação dos legados |
| [`scripts/verify_catalogs.py`](../../scripts/verify_catalogs.py) | Invariantes de catálogos |
| [`scripts/verify_expansion_plan.py`](../../scripts/verify_expansion_plan.py) | Validação do roteiro |
| [`package.json`](../../package.json) | Build e testes |
| [`proxy.js`](../../proxy.js) · [`vercel.json`](../../vercel.json) | Acesso e publicação |

**Fluxo:** pedido de lote autorizado → recolha e auditoria → commit transacional dos dados → testes de estrutura/sintaxe → GitHub atualizado → publicação Vercel → confirmação READY e testes anónimos de segurança.

O ficheiro [`requests/roadmap-batch.json`](../../requests/roadmap-batch.json) pode acionar ingestão ao ser alterado na `main`. Não o modificar numa reorganização documental. Ver também [workflows](../../.github/workflows/).
