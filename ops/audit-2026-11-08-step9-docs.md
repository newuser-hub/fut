# FUT — Auditoria 9/10: consolidação documental e revisão do PR #1

**Data:** 08/11/2026. **Branch exclusiva:** `audit/fut-2026-11-08`. **`main`/produção a preservar:** `d5fb60eec0801808ec2946385a14c8c9226df54d`. **Âmbito:** apenas documentação, testes de consistência, gerador de inventário e PR de auditoria, sem importação, merge, encerramento de PR #1 ou deploy.

## 1. Revisão do PR #1 (não integrado)

[PR #1 — reorganização original em dez categorias](https://github.com/newuser-hub/fut/pull/1), head `88276ade9db577e9f81df9252f5adf56f85a163a`, base histórica `4fc739b7b425a62fbd3e80add57380405a86e607`. O PR estava **aberto e não integrado** em 08/11/2026; tinha 20 ficheiros alterados (**19 em `docs/` + `README.md`**), com foco documental e sem mudanças em catálogos, frontend ou autenticação.

**Material útil reaproveitado, sem merge:** índice de dez áreas, gestão, coleções, catálogos, imagens, funcionalidades, arquitetura, segurança, GitHub/Vercel, auditorias, backlog, mapa de fontes, decisões, manutenção e cronologia. O arquivo integral [`README-original-2026-11-08.md`](../docs/01-gestao/README-original-2026-11-08.md) foi preservado **byte a byte**, Git blob `bb0d548f9bb25bc5bc6131641016b5fcd8a8ecba`, porque é evidência do snapshot antigo. O [`source-map.json`](../docs/source-map.json) conserva as **76 entradas históricas** com a etiqueta `snapshotType=historical`; a classificação atual é feita por referências, sem mover arquivos.

**Divergência corrigida:** o PR #1 apresentava **29 coleções / 18.873 posições / 16.911 hashes / 5 links sem hash / 1.957 sem imagem**, com roteiro **8/20 integradas, 3 bloqueadas, 9 pendentes**. Esses valores **não eram atuais** no momento da etapa 9. O README que precedeu esta revisão começava por **39 coleções / 23.480 posições**; foi substituído por resumo do inventário atual, preservando a evolução no histórico Git.

## 2. Métricas recalculadas diretamente dos JSON (sem chamadas HTTP)

Origem única: `public/library.json` + **47 ficheiros** `public/data/<id>.json` + `public/expansion-plan.json`. Gerador verificável: [`scripts/refresh_documentation.py`](../scripts/refresh_documentation.py), `--write` para quatro saídas e `--check` para comparar byte a byte. [`docs/metrics-current.json`](../docs/metrics-current.json) identifica método, data e referência. Não se usa texto de README como fonte.

| Métrica | Valor comprovado no snapshot da branch |
|---|---:|
| Coleções ativas | **47** |
| Posições, incluindo as sem fotografia | **26.774** |
| Secções | **1.508** |
| URL de imagem + SHA-256 persistido + bytes positivos | **24.695** |
| Ligações com URL, sem hash verificável | **5** |
| Posições sem URL de imagem | **2.074** |
| URLs dos cromos | **24.700** |
| URLs de capa, separadas das posições | **47** |
| **URLs inventariados** | **24.747** |
| Coleções com pelo menos uma posição sem URL | **18** |
| Categorias Portugal / Seleções / Champions / Outros | **12 / 23 / 5 / 7** |
| Roteiro: candidatas / integradas / bloqueadas / restantes | **30 / 26 / 4 / 0** |

**Atenção às classes:** “com SHA” descreve metadados persistidos no JSON, não um GET de hoje. A [etapa 4](audit-2026-11-08-step4-images.md) fez o GET em 08/11/2026 para os 24.747 URLs: **24.742 GET 200** válidos (24.695 cromos com hash + 47 capas), **5 links Topps HTTP 403** e **0 divergências binárias confirmadas**. Os **2.074** sem URL não são URLs falhados e **não** estão incluídos no inventário HTTP. A data dos GET é histórica, não garantia de disponibilidade futura.

**Diferença PR #1 → atual:** +18 coleções, +7.901 posições, +7.784 cromos com hash e +117 posições sem URL; os cinco links Topps continuam uma classe distinta.

## 3. Documentação consolidada

| Tema exigido | Fonte atualizada | Ponto operacional |
|---|---|---|
| Arquitetura, instalação e testes | [06 — Arquitetura](../docs/06-arquitetura/README.md) + [README](../README.md) | Node 22/Python 3.12, `npm ci`, build, testes Node/Python/Playwright |
| Segurança/autenticação | [07 — Segurança](../docs/07-seguranca/README.md) | HTTP Basic no proxy/API, 401/503 e no-store, segredo privado; GitHub público não fica privado |
| Progresso e backup | [05 — Funcionalidades](../docs/05-funcionalidades/README.md) | `localStorage` `fut.album.<id>.progress.v1`, `revealed`/`favorites`, exportar/importar JSON por coleção |
| Qualidade de imagens | [04 — Imagens](../docs/04-imagens/README.md) + [Etapa 4](audit-2026-11-08-step4-images.md) | Hash vs link HTTP 403 vs sem URL, ID de Salis e oito pares legítimos |
| Drive e recuperação | [Google Drive](../docs/GOOGLE_DRIVE_STORAGE.md) + [Etapa 6](audit-2026-11-08-step6-drive.md) | `--plan/prepare/validate/promote/resume`, staging separado, **Drive não migrado/ativado** |
| CI/CD e deploy | [08 — GitHub/Vercel](../docs/08-github-vercel/README.md) + [Etapa 7](audit-2026-11-08-step7-ci.md) | CI para PR, lock global dos quatro writers, READY do SHA exato nos dois aliases |
| Recuperação/rollback | [08 — GitHub/Vercel](../docs/08-github-vercel/README.md) + [Manutenção](../docs/MANUTENCAO.md) | Reconstrução de lotes sobre main, lock órfão, quota Vercel, Drive staging e backup local |
| Estado, decisões e backlog | [01 — Gestão](../docs/01-gestao/CHECKPOINT.md), [Decisões](../docs/01-gestao/DECISOES.md), [10 — Backlog](../docs/10-backlog/README.md) | Snapshot vigente separado do PR #1 histórico |

A tabela [`docs/02-colecoes/README.md`](../docs/02-colecoes/README.md) é gerada por categoria e **ano decrescente**. As 47 entradas apontam para o JSON original, sem criar cópias. `docs/index.json` é atualizado a partir das mesmas fontes; `docs/source-map.json` continua explicitamente histórico e não foi usado para recalcular os números atuais.

## 4. Defeitos resolvidos, limites aceites e trabalho pendente

**Defeitos resolvidos na branch de auditoria (ainda sem publicação):**
- Salis Abdul Samed com URL de cromo errado: ligação retirada depois da comparação de bytes e validação visual, mantendo ID e posição.
- API sem validação independente de Basic; cabeçalhos de cache e erros informativos: corrigidos, com testes de segurança.
- Checkpoints Drive sobre catálogos ativos e reutilização de `driveFileId` sem conferir imagem: substituídos por gerações isoladas e SHA obrigatório.
- Concorrência entre quatro workflows escritoras e aceitação de deployment antigo como prova: lock global e check de `READY` do SHA pretendido.
- Modal sem foco inicial/contido/devolvido, estrelas com área tátil insuficiente e scroll a contrariar reduced-motion: corrigidos; Playwright **78/78 PASS**.
- README 39 e documentação PR #1 29 desatualizados: estado corrente separado de arquivo histórico, métricas reprodutíveis.

**Limitações aceites com classificação explícita:**
- Cinco pré-visualizações Topps oficiais com HTTP 403: ligação preservada sem SHA; não declarar verificadas.
- **2.074** posições sem foto em **18 coleções**, preservadas sem arte alternativa.
- Oito pares Coca-Cola legítimos partilham bytes e permanecem distintos.
- Basic Auth protege o site, **não os ficheiros do GitHub público**.
- GET/SHA de novembro é evidência temporal, não licença de distribuição ou disponibilidade futura.

**Pendente de autorização ou prova real:**
- Fotografia correta para Salis; novos acessos legais às cinco Topps; quatro candidatas bloqueadas por cobertura.
- Migração Drive real, direitos de alojamento, quotas, teste com credenciais autorizadas e decisão de ativação futura.
- Safari/iPhone físico e VoiceOver (os 78 testes foram Playwright Chromium/WebKit Linux).
- Revisão/integração de PRs e eventual deploy com verificação do SHA correto. **Não iniciar etapa 10 sem novo pedido**.

## 5. Evidências, CI e conservação

- As categorias e o material original foram obtidos do **head fixo do PR #1**, sem o integrar, por workflow isolada de documentação em `audit/fut-2026-11-08`.
- Os 47 JSON e o roteiro passaram nos validadores; o [gerador](../scripts/refresh_documentation.py) confirma as classes de imagem, secções, contagens, categorias e roteiro. O novo teste [`scripts/test_documentation.py`](../scripts/test_documentation.py) verifica métricas, links internos, README atual, guia Drive e o SHA byte a byte do README original histórico.
- A CI transversal continua a verificar frontend, progresso, API/proxy, Drive mocks, lotes e instalação reproduzível. A etapa 9 acrescenta `--check` e testes documentais para bloquear relatórios inconsistentes em PRs futuros.
- Escopo preservado: **nenhuma alteração** a `public/data/*`, `public/library.json`, `public/expansion-plan.json`, `src/index.html`, `public/index.html`, `proxy.js`, `api/storage.js`, `lib/*`, IDs ou progresso relativamente ao checkpoint da etapa 8 (`75b56532a4d95230366e68db3e7241029c7c1e52`).
- **`main` e produção não alterados**, PR #1 continua aberto. A consolidação destina-se a **um PR de auditoria separado, preferencialmente draft** para revisão, sem merge ou pedido de deployment.

**Etapa 9/10:** documentação atualizada, métricas e testes de consistência disponíveis; confirmar o estado final das Actions e o PR de auditoria antes de marcar como concluída. **Etapa 10/10 não iniciada.**
