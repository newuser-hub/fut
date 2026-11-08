# FUT — Auditoria dos catálogos e duplicados: etapa 3/10

**Data:** 08/11/2026. **Repositório:** `newuser-hub/fut`. **Branch:** `audit/fut-2026-11-08`. **Base `main`:** `d5fb60eec0801808ec2946385a14c8c9226df54d`.

**Evidência:** [GitHub Actions #42490428941](https://github.com/newuser-hub/fut/actions/runs/42490428941), **SUCCESS**, commit `daeb2d86c8794d1c9c945231ec80c95b7a7a6358`; artefacto `fut-etapa3-auditoria-json` (ID `13620844461`, retenção 30 dias). Código-fonte dos verificadores: `scripts/audit_catalogues_deep.py` e `scripts/test_audit_catalogues.py`. **Auditoria somente de leitura.**

## Indicadores e severidade

| Dimensão | Total | Leitura |
|---|---:|---|
| Catálogos ativos / JSON | 47 / 47 | Cobertura integral |
| Cromos examinados | 26 774 | Cobertura integral |
| Violações críticas de estrutura | **0** | Nenhum bloqueador |
| Sinalizações editoriais | **1010** | Não são erros confirmados |
| Grupos de nomes iguais na mesma secção | 455 | P3: verificar variantes legítimas |
| Grupos de nomes semanticamente equivalentes | 190 | P3: inserts e variantes |
| Pares de nomes muito semelhantes | 267 | P3: heurística, não prova |
| Grupos com mesma imagem/hash na mesma coleção | 9 | P1: revisão visual |
| Grupos com imagem/hash partilhada entre coleções | 0 | Informativo |
| Nomes presentes em edições diferentes | 4149 | Informativo e normalmente legítimo |
| `originalNumber` igual a `number` | 24 429 | Preservado |
| `originalNumber` ausente | 2341 | Legado; não inventar |
| `originalNumber` diferente | 4 | Desambiguação; preservar |

**Distribuição exata dos 1010 alertas:**

| Tipo | Alertas |
|---|---:|
| `duplicate_original_number` | 2 |
| `duplicate_section` | 1 |
| `nonsequential_order` | 72 |
| `original_number_differs` | 4 |
| `same_image_within_catalogue` | 9 |
| `same_section_exact_name` | 455 |
| `same_section_near_name` | 267 |
| `same_section_semantic_name` | 190 |
| `suspicious_title_suffix` | 10 |

**Critério:** Unicode NFKD, caixa e pontuação normalizadas; nomes agrupados apenas dentro da mesma coleção/secção; aproximação por `SequenceMatcher>=0.94` no mesmo primeiro token e secção; grupos acima de 110 itens não foram comparados dois-a-dois, evitando falsos positivos/custo. É triagem determinística, não validação semântica humana. `sha256` refere-se a **metadados anteriores**, não a novo GET de imagens.

## Evidências concretas e decisão editorial

### P1 — Nove hashes de imagem repetidos dentro da mesma coleção

Um SHA idêntico indica ficheiro de imagem idêntico nos metadados, mas pode ser variante regional legítima (por exemplo `CC1-EU` versus `CC1-AM`). Exemplos:

- `ligue-1-foot-2025-26`, cromo `—` (`—`), "" — SHA-256=333af17f87bbb8d357… usado em 2 posições; relacionados: [{"catalogue":"ligue-1-foot-2025-26","id":"ligue-1-foot-2025-26-1355839","number":"382"},{"catalogue":"ligue-1-foot-2025-26","id":"ligue-1-foot-2025-26-1355840","number":"383"}]
- `world-cup-2026`, cromo `—` (`—`), "" — SHA-256=2df4fb0862616e9be9… usado em 2 posições; relacionados: [{"catalogue":"world-cup-2026","id":"world-cup-2026-14954","number":"CC1-EU"},{"catalogue":"world-cup-2026","id":"world-cup-2026-20961","number":"CC1-AM"}]
- `world-cup-2026`, cromo `—` (`—`), "" — SHA-256=980093a8dc1b338e19… usado em 2 posições; relacionados: [{"catalogue":"world-cup-2026","id":"world-cup-2026-14955","number":"CC2-EU"},{"catalogue":"world-cup-2026","id":"world-cup-2026-20960","number":"CC2-AM"}]

**Decisão:** não remover nem substituir imagens; comparar fonte e checklist na etapa específica de imagens, se autorizada.

### P1 — Dez títulos com sufixos numéricos suspeitos

- `ucl-topps-2025-26`, cromo `RS1` (`ucl-topps-2025-26-21536`), "Cody Gakpo (Liverpool FC)200" — Algarismos imediatamente após parênteses; verificar fonte antes de alterar
- `ucl-topps-2025-26`, cromo `RS2` (`ucl-topps-2025-26-21537`), "Phil Foden (Manchester City)200" — Algarismos imediatamente após parênteses; verificar fonte antes de alterar
- `ucl-topps-2025-26`, cromo `RS3` (`ucl-topps-2025-26-21538`), "Enzo Fernandez (Chelsea FC)200" — Algarismos imediatamente após parênteses; verificar fonte antes de alterar

O sufixo `200` após nomes entre parênteses no catálogo `ucl-topps-2025-26` é potencial resíduo de scraping, mas não foi confirmado contra a origem. Sem correção automática.

### P2 — Quatro números originais com desambiguação intencional de navegação

No catálogo `laliga-este-2026-27`, duas entradas `CEL 14BIS` e duas `DEP 14BIS` usam `number` com `(ref. ID)` distinto, mantendo o `originalNumber` igual entre os pares. Reverter `number` para o valor bruto criaria colisões.

- `laliga-este-2026-27`, cromo `CEL 14BIS (ref. 85892)` (`laliga-este-2026-27-85892`), "Matías Vecino" — originalNumber='CEL 14BIS'
- `laliga-este-2026-27`, cromo `CEL 14BIS (ref. 85893)` (`laliga-este-2026-27-85893`), "Burcio" — originalNumber='CEL 14BIS'
- `laliga-este-2026-27`, cromo `DEP 14BIS (ref. 85919)` (`laliga-este-2026-27-85919`), "Gijselhat" — originalNumber='DEP 14BIS'

As duas sinalizações de `duplicate_original_number` refletem estes mesmos pares e **não são ocorrências independentes**.

### P2 — Uma colisão no nome normalizado de secções

`premier-league-flagship-2026-27`: **Golden Boot On-Card Autographs** e **Golden Boot On Card Autographs**. Nome normalizado idêntico; a distinção do checklist oficial não foi validada. Não fundir sem evidência.

### P2 — Setenta e duas posições com `order` diferente da posição no array

Todas em `euro-2020-tournament`, após a posição física 678; exemplo: posição 679, `order=693`, cartão `23x` de Matteo Pessina. A diferença mantém-se até posição 750/`order=764`. Podem representar atualização da fonte com índice histórico. Não corrigir ordem nem números sem confirmação.

- `euro-2020-tournament`, cromo `23x` (`euro-2020-tournament-12084`), "Matteo Pessina" — index=679, order=693
- `euro-2020-tournament`, cromo `31x` (`euro-2020-tournament-12085`), "Giacomo Raspadori" — index=680, order=694
- `euro-2020-tournament`, cromo `57x` (`euro-2020-tournament-12086`), "Ruben Vargas" — index=681, order=695

### P3 — Nomes repetidos e variantes potencialmente legítimas

Nomes iguais e números distintos:

- `euro-2004`, cromo `2` (`euro-2004-6323`), "Official Mascot" — 2 posições, secção=introduction; possíveis variantes legítimas; relacionados: [{"id":"euro-2004-6324","number":"3"}]
- `liga-2021-22`, cromo `239` (`liga-2021-22-26197`), "Pepe" — 2 posições, secção=porto; possíveis variantes legítimas; relacionados: [{"id":"liga-2021-22-26208","number":"248"}]
- `match-attax-2025-26`, cromo `CA1` (`match-attax-2025-26-22014`), "Raphinha" — 2 posições, secção=chrome award winner; possíveis variantes legítimas; relacionados: [{"id":"match-attax-2025-26-22024","number":"CA11"}]

Variante de nome por insert ou sufixo entre parênteses:

- `club-world-cup-2025`, cromo `6` (`club-world-cup-2025-18179`), "Weverton" — 2 posições, nome base=weverton; verificar variante; relacionados: [{"id":"club-world-cup-2025-18189","number":"16","name":"Weverton (The Emblem)"}]
- `club-world-cup-2025`, cromo `9` (`club-world-cup-2025-18182`), "Gustavo Gómez" — 2 posições, nome base=gustavo gomez; verificar variante; relacionados: [{"id":"club-world-cup-2025-18195","number":"22","name":"Gustavo Gómez (The Crowd Hero)"}]
- `club-world-cup-2025`, cromo `18` (`club-world-cup-2025-18191`), "Estêvão" — 2 posições, nome base=estevao; verificar variante; relacionados: [{"id":"club-world-cup-2025-18192","number":"19","name":"Estêvão (The Chosen One)"}]

Pares quase iguais (frequentemente cartões numerados em partes):

- `qatar-2022`, cromo `FWC2` (`qatar-2022-12158`), "Official Trophy\n1" — Similaridade >=0.94; hipótese editorial, não eliminação; relacionados: {"id":"qatar-2022-12159","number":"FWC3","name":"Official Trophy\n2"}
- `qatar-2022`, cromo `FWC4` (`qatar-2022-12160`), "Official Mascot\n1" — Similaridade >=0.94; hipótese editorial, não eliminação; relacionados: {"id":"qatar-2022-12161","number":"FWC5","name":"Official Mascot\n2"}
- `qatar-2022`, cromo `FWC6` (`qatar-2022-12162`), "Official Emblem\n1" — Similaridade >=0.94; hipótese editorial, não eliminação; relacionados: {"id":"qatar-2022-12163","number":"FWC7","name":"Official Emblem\n2"}

**Decisão:** não aplicar deduplicação automática a nomes; cromos especiais, partes numeradas e repetições entre edições são esperados.

### Quatro catálogos legados sem `originalNumber`

`qatar-2022`: 750; `euro-2024`: 707; `club-world-cup-2025`: 550; `euro-2004`: 334. Total 2341. Já possuem `number` e IDs estáveis; ausência de campo opcional, não defeito de navegação.

## Inventário exaustivo por coleção

Colunas: posições, secções, `originalNumber` ausentes, divergentes, grupos de nomes iguais e variantes semânticas **na mesma secção**.

| Catálogo | Cromos | Secções | Original ausente | Original diferente | Grupos iguais | Grupos variantes |
|---|---:|---:|---:|---:|---:|---:|
| `club-world-cup-2025` | 550 | 33 | 550 | 0 | 0 | 86 |
| `euro-2004` | 334 | 17 | 334 | 0 | 1 | 0 |
| `qatar-2022` | 750 | 37 | 750 | 0 | 0 | 0 |
| `euro-2024` | 707 | 43 | 707 | 0 | 0 | 0 |
| `liga-2021-22` | 438 | 23 | 0 | 0 | 1 | 1 |
| `liga-2024-25` | 528 | 27 | 0 | 0 | 0 | 1 |
| `match-attax-2025-26` | 738 | 77 | 0 | 0 | 1 | 0 |
| `match-attax-2026-27` | 558 | 42 | 0 | 0 | 62 | 0 |
| `euro-france-2016` | 767 | 25 | 0 | 0 | 24 | 0 |
| `world-cup-russia-2018` | 787 | 37 | 0 | 0 | 9 | 0 |
| `laliga-este-2026-27` | 743 | 34 | 0 | 4 | 2 | 1 |
| `laliga-megacracks-2026-27` | 534 | 33 | 0 | 0 | 0 | 0 |
| `world-cup-brazil-2014` | 746 | 35 | 0 | 0 | 1 | 0 |
| `copa-america-2024` | 430 | 22 | 0 | 0 | 0 | 0 |
| `premier-league-flagship-2026-27` | 1138 | 63 | 0 | 0 | 0 | 0 |
| `euro-2020-tournament` | 750 | 31 | 0 | 0 | 0 | 0 |
| `world-cup-south-africa-2010` | 717 | 35 | 0 | 0 | 0 | 0 |
| `serie-a-calciatori-2026-27` | 827 | 35 | 0 | 0 | 37 | 0 |
| `ligue-1-foot-2025-26` | 556 | 20 | 0 | 0 | 40 | 53 |
| `euro-poland-ukraine-2012` | 555 | 20 | 0 | 0 | 62 | 0 |
| `world-cup-germany-2006` | 605 | 35 | 0 | 0 | 1 | 1 |
| `world-cup-2026` | 1206 | 59 | 0 | 0 | 0 | 0 |
| `liga-portugal-2025-26` | 497 | 26 | 0 | 0 | 0 | 0 |
| `idolos-pt-2026-27` | 313 | 29 | 0 | 0 | 0 | 0 |
| `world-cup-adrenalyn-2026` | 1019 | 67 | 0 | 0 | 108 | 0 |
| `ucl-topps-2025-26` | 584 | 44 | 0 | 0 | 0 | 0 |
| `match-attax-extra-2025-26` | 445 | 71 | 0 | 0 | 2 | 0 |
| `fifa-365-2026` | 524 | 31 | 0 | 0 | 0 | 44 |
| `liga-portugal-2023-24` | 527 | 26 | 0 | 0 | 1 | 0 |
| `ucl-topps-2024-25` | 663 | 46 | 0 | 0 | 25 | 0 |
| `liga-portugal-2022-23` | 477 | 41 | 0 | 0 | 3 | 0 |
| `world-cup-2002` | 581 | 34 | 0 | 0 | 0 | 0 |
| `world-cup-1998` | 561 | 34 | 0 | 0 | 0 | 0 |
| `euro-2000` | 358 | 17 | 0 | 0 | 0 | 0 |
| `confederations-2017` | 301 | 14 | 0 | 0 | 15 | 0 |
| `world-cup-1994` | 444 | 26 | 0 | 0 | 0 | 0 |
| `euro-1996` | 354 | 18 | 0 | 0 | 0 | 0 |
| `liga-portugal-2020-21` | 445 | 19 | 0 | 0 | 24 | 0 |
| `liga-portugal-2019-20` | 423 | 22 | 0 | 0 | 0 | 0 |
| `euro-2008` | 568 | 20 | 0 | 0 | 2 | 0 |
| `confederations-2013` | 249 | 11 | 0 | 0 | 6 | 0 |
| `liga-portugal-2018-19` | 432 | 23 | 0 | 0 | 0 | 0 |
| `liga-portugal-2017-18` | 398 | 22 | 0 | 0 | 0 | 0 |
| `world-cup-1990` | 448 | 27 | 0 | 0 | 0 | 0 |
| `euro-1992` | 261 | 12 | 0 | 0 | 12 | 0 |
| `liga-portugal-2016-17` | 442 | 20 | 0 | 0 | 16 | 3 |
| `liga-portugal-2014-15` | 496 | 25 | 0 | 0 | 0 | 0 |

## Testes e preservação

- **PASS** build (`npm run build`) e igualdade `src/index.html` / `public/index.html` sem modificações adicionais.
- **PASS 6/6** testes sintéticos: erros críticos inventados são detetados; nomes partilhados entre edições e variantes permanecem alertas editoriais; dados nunca são mutados.
- **PASS** auditoria profunda real (`python3 scripts/audit_catalogues_deep.py --strict --output /tmp/fut-deep-catalogue-report.json`) sobre 47 catálogos; zero falhas críticas.
- **PASS** `verify_catalogs.py`, `verify_expansion_plan.py`, `verify_audited_batch.py`; **PASS 10/10** testes de progresso; **PASS** agrupamento/portal; **PASS 4/4** testes Drive com mocks.
- A primeira execução [#42490337099](https://github.com/newuser-hub/fut/actions/runs/42490337099) teve **FAIL apenas no teste final que exigia ausência de ficheiros auxiliares não rastreados**; auditoria, build e verificadores haviam passado. Depois de restringir a asserção a ficheiros rastreados e ausência de novos catálogos, [#42490428941](https://github.com/newuser-hub/fut/actions/runs/42490428941) terminou **SUCCESS**, incluindo artefacto JSON.
- `git diff` contra a baseline confirma **nenhuma alteração** de catálogo, manifesto, expansão, arquivos, pedidos, backend, autenticação, Vercel ou progresso. Não foi feito merge, nenhuma coleção adicionada, nenhum deploy solicitado.

**Limitações:** verificações editoriais por heurística sem comparação humana com checklists externos; imagens não descarregadas de novo; testes Drive com mocks e frontend em Node, sem Safari/iPhone real. **Não afirmar que os alertas estão resolvidos.**

**Checkpoint:** etapa 3/10 concluída; **etapa 4/10 não iniciada**. Revisões editoriais futuras exigem evidência de origem e autorização separada; manter os mesmos 47 catálogos, 26.774 posições, IDs, `originalNumber`, progresso independente e autenticação.
