# Regras de manutenção documental e operacional

**Fonte de verdade:** coleções em [`public/library.json`](../public/library.json), cromos em [`public/data/`](../public/data/), prioridades em [`public/expansion-plan.json`](../public/expansion-plan.json), Git/Actions para código testado e Vercel para deployment `READY` com SHA exato. Documentação, README, índices e mapas **nunca** substituem esses ficheiros.

## Atualização documental

```bash
python3 scripts/refresh_documentation.py --write
python3 scripts/refresh_documentation.py --check
python3 -B -m unittest scripts.test_documentation -v
```

`--write` atualiza **apenas** `docs/02-colecoes/README.md`, `docs/04-imagens/README.md`, `docs/index.json` e `docs/metrics-current.json`. Verificar o diff, métricas e links; o comando **não altera catálogos**. Não executar pipelines de importação para atualizar um relatório.

Em cada expansão autorizada, atualizar manualmente README, gestão, segurança, CI/CD, backlog e decisões se a realidade mudar. Manter [HISTORICO.md](HISTORICO.md) append-only, assinalar limitações e defeitos por estado **resolvido / aceite / pendente**, e citar a execução/commit exatos. **Não converter números históricos em estado atual.**

## Classificação (vistas, sem mover ficheiros)

| Caminho | Categoria primária |
|---|---|
| `public/data/*`, `public/library.json` | 02 |
| `archives/*` | 03 |
| `src/*`, `public/index.html`, `public/favicon.svg` | 05 |
| `scripts/*`, `lib/*`, `api/*`, `package*.json`, `playwright.config.mjs` | 06 |
| `proxy.js`, `vercel.json`, `public/robots.txt` | 07, com links CI/CD à 08 |
| `.github/workflows/*` | 08 |
| `ops/*` e checkpoints | 01 e 09, conforme objetivo |
| `requests/*`, `public/expansion-plan.json` | 10 |

Imagens e auditorias pertencem a fontes transversais em 04 e 09. O [mapa source-map.json](source-map.json) é **apenas um snapshot histórico de 76 ficheiros** do PR #1, não uma classificação atual exaustiva.

## Checklist antes de importar ou publicar

1. Confirmar autorização, `main`, SHA esperado, PRs e Actions; **não** descartar pedidos pendentes.
2. Preservar IDs e chaves `fut.album.<id>.progress.v1`; manter backup de progresso local por coleção.
3. Se for um lote novo autorizado, usar lock dos quatro escritores, pedido imutável por SHA e gate de lote exato antes de commit. Não fazer rebase de resultados parciais nem `push --force`.
4. Validar JSON e roteiro; imagens por HTTP/MIME/bytes/SHA, com bloqueios explicitamente identificados. Não fabricar conteúdo nem inferir direito de reprodução.
5. Executar `npm ci`, build, suites Node/Python/Playwright quando aplicáveis, e gerar novos relatórios a partir dos JSON.
6. Se for autorizada publicação, provar `READY` do **SHA exato** nos dois domínios; distinguir Basic da aplicação de login Vercel. Não aceitar 401 de deployment antigo.
7. Registar estado e recuperação no checkpoint; não fazer merge, deploy, alterações de segredo/visibilidade ou ativação Drive sem autorização explícita.

## Recuperação

- **Dados:** recomeçar a importação desde o último `main` conhecido, reconciliando o pedido original e os catálogos; não publicar ficheiros incompletos.
- **Drive:** gerações preparadas separadamente; validação, promoção explícita e retoma, nunca sobrepor geração ativa. [Manual](GOOGLE_DRIVE_STORAGE.md).
- **Produção:** identificar deployment `READY` do SHA certo e reverter pelo processo aprovado, sem contornar quota Vercel. [CI/CD e rollback](08-github-vercel/README.md).
- **Progresso:** exportar/importar JSON por coleção; GitHub/Drive não contêm os progressos pessoais.

## Histórico separado

O [README arquivado do PR #1](01-gestao/README-original-2026-11-08.md) descreve 29 coleções; o README posterior mencionava 39. O estado vigente provém dos JSON de 47 catálogos. O roteiro de 30 tem 26 entradas integradas, quatro bloqueadas e nenhuma outra pendente, o que **não autoriza** novas importações.
