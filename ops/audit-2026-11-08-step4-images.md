# FUT — Auditoria 4/10: imagem de Salis, variantes e varrimento HTTP

**Data:** 8 de novembro de 2026; branch: `audit/fut-2026-11-08`. Referência de produção/`main`: `d5fb60eec0801808ec2946385a14c8c9226df54d`. Não publicar/mergir.

## 1. Correção factual de Salis Abdul Samed (PRIORIDADE FECHADA)

- Catálogo: `ligue-1-foot-2025-26`; cromo `ligue-1-foot-2025-26-1355840`, número `383`, `originalNumber=383`, jogador **Salis Abdul Samed**, OGC Nice.
- O URL anterior `https://www.stickersone.com/images/figurine/4380/1355840.jpg`, conforme GET e inspeção visual comunicada pelo utilizador em 08/11/2026, mostrava Kojo Peprah Oppong, cromo `1355839`. Um novo GET independente na execução [#42491632711](https://github.com/newuser-hub/fut/actions/runs/42491632711) obteve **HTTP 200, image/jpeg, 17.631 bytes, SHA-256 `333af17f87bbb8d3574bd001840f9faf69965f3dd5218373b1bb6eaa553d851b`**, igual ao hash registado para Kojo. O GET confirma identidade dos bytes, não por si identidade de pessoa; esta foi confirmada por inspeção visual prévia.
- **Decisão:** sem fotografia correta e comprovada, desassociar o URL errado e definir `image=null`, `available=false`, `bytes=0`, `sha256=null`. Preservados ID, nome, número, secção, ordem e `sourceDetail`, sem migração de progresso.
- Metadados de `imageAudit` desta coleção atualizados, **548→547 disponíveis, 8→9 indisponíveis**, com data e motivo. Commit de correção: `8d11f07da7fdcc5987d9cf8ee1ccfa4ff93a1179`.
- Nenhuma fotografia alternativa inventada; a imagem de Kojo mantém-se no registo correto, e Salis continua como posição sem fotografia.

## 2. Outros oito pares de hash repetido — REVISTOS, preservados

Todos os 16 URLs independentes do Mundial 2026 foram descarregados por GET na auditoria prioritária em 08/11/2026. Em cada par, os dois cromos correspondem **ao mesmo jogador**, com variantes de numeração e secção Coca-Cola Europa/América. Os novos SHA-256 e tamanhos são idênticos entre si e aos metadados existentes. A coincidência de imagens permanece um facto técnico, **não se pode inferir erro** sem checklist/inspeção visual oficial das variantes.

| Jogador | Números (Europa / América) | HTTP | Bytes por imagem | SHA-256 (prefixo) |
|---|---|---|---:|---|
| Lamine Yamal | `CC1-EU` / `CC1-AM` | 200 / 200 | 23716 | `2df4fb0862616e9b…` |
| Joshua Kimmich | `CC2-EU` / `CC2-AM` | 200 / 200 | 22665 | `980093a8dc1b338e…` |
| Josko Gvardiol | `CC4-EU` / `CC5-AM` | 200 / 200 | 23909 | `844ebbeecf7787ff…` |
| Federico Valverde | `CC5-EU` / `CC6-AM` | 200 / 200 | 19639 | `9aa8afaec61107c2…` |
| Virgil van Dijk | `CC6-EU` / `CC10-AM` | 200 / 200 | 23371 | `5c7394149f5d3f23…` |
| Raúl Jiménez | `CC8-EU` / `CC13-AM` | 200 / 200 | 21412 | `83e678df1f97fa8b…` |
| Lautaro Martínez | `CC10-EU` / `CC14-AM` | 200 / 200 | 23646 | `7a1eed4805b45d5d…` |
| Harry Kane | `CC11-EU` / `CC3-AM` | 200 / 200 | 23373 | `29d42482992497a5…` |

**Decisão:** preservar os oito pares e todos os 16 IDs, números, URLs e hashes. Uma edição regional pode legitimamente reutilizar a arte de outra.

## 3. Cinco pré-visualizações oficiais Topps — HTTP 403, sem falso sucesso

Os cinco links `https://images.topps.com/…` da coleção `premier-league-flagship-2026-27` foram GET em 08/11/2026 e responderam **403** (resposta `text/html`) no runner. Nenhum byte de imagem transferido, nenhum novo SHA-256 comprovado. Os links continuam categorizados como `official-preview-link`, com `sha256=null` e `bytes=0`, sem alteração dos nomes/IDs e **sem concluir que as imagens estejam erradas**.

| Número | Jogador | HTTP | Estado armazenado | Decisão |
|---|---|---:|---|---|
| `MA 3` | Evanilson | 403 | `official-preview-link` | Sem hash (não alterado) |
| `FF 24` | Pedro Porro | 403 | `official-preview-link` | Sem hash (não alterado) |
| `FSA-MD` | Max Dowman | 403 | `official-preview-link` | Sem hash (não alterado) |
| `8B 11` | Clint Dempsey | 403 | `official-preview-link` | Sem hash (não alterado) |
| `RT 21` | Ryan Giggs | 403 | `official-preview-link` | Sem hash (não alterado) |

A restrição 403 pode refletir bloqueio por CDN/ambiente; não equivale a imagem inexistente.

## 4. Cobertura contabilizada: inventário e execução

Inventário determinístico lido pelo script `scripts/audit_images_http.py` após correção de Salis:

- **26.774** posições no manifesto, **24.700** com URL de imagem, **2.074** sem URL, **47** URLs de capas.
- **24.747 URLs distintos** inventariados = 24.700 cromos + 47 capas. Entre as imagens dos cromos: **24.695 hashes antigos persistidos** e **5 ligações Topps não verificadas**.
- Auditoria prioritária: **69 pedidos** = 16 cromos regionais + cinco previews Topps + 47 capas + URL anteriormente errado de Salis. Resultado: 63 GET válidos, cinco 403 Topps e uma capa inicialmente bloqueada pelo filtro de host.
- A capa externa `blogger.googleusercontent.com` do Premier League Flagship foi auditada separadamente no [workflow #42491973748](https://github.com/newuser-hub/fut/actions/runs/42491973748): **200 / image/jpeg / 158.632 bytes / SHA-256 `bd7dbe8d14d30e9c95e78fe15214327a80bb92d3981fb9782ba9211280d52088`**, sem redirecionamento. O host foi autorizado especificamente no scanner; não se alterou a URL da capa.
- **Cobertura prioritária efetivamente comprovada para o inventário:** 63 URLs GET 200 (=16 regionais +47 capas), cinco URLs Topps 403; o GET extra da URL errada de Salis é uma prova separada, não é contado no inventário atual.

### Varrimento total, retoma e artefactos

- [GitHub Actions #42491632711](https://github.com/newuser-hub/fut/actions/runs/42491632711), workflow `.github/workflows/audit-fut-step4-images.yml`, executa dez shards de até **2.500 URLs** por ordem determinística, com `max-parallel:3` e **quatro workers por shard**, timeout 9s e até dois retries para falhas HTTP transitórias/rede. Limite de tempo de execução por shard e artefacto JSONL a cada lote.
- Cada linha de `results.jsonl` regista `key`, coleção, URL original, GET status, URL final, MIME, tamanho, hash SHA-256 da descarga, timestamp UTC, tempos e tentativas, divergências face aos metadados. `summary.json` regista estados e contagem concluída/pendente. Os ficheiros são publicados como `fut-etapa4-shard-0` … `-9`, retenção de 30 dias.
- **A existência de metadados SHA-256 do catálogo não é contada como novo GET.** 403/404/timeout não significam identidade incorreta; divergência binária necessita confirmação da origem.
- **Retoma:** descarregar o artefacto JSONL de um shard e correr `python3 scripts/audit_images_http.py --offset <N*2500> --limit 2500 --resume /caminho/results.jsonl --retry-transient --output /caminho/novo/results.jsonl`. O workflow define também `workflow_dispatch` com argumentos `shard` e `resume_run_id`, embora a disponibilidade do botão manual no GitHub dependa de o workflow existir na branch default. Nesta branch de auditoria isolada, o mecanismo CLI de retoma é o caminho garantido.
- **Estado do varrimento integral:** concluído em dez shards com sucesso; reconciliação com o GET complementar da capa externa. Totais oficiais da execução e divergências na secção 6.

## 5. Verificadores e fronteiras

- **PASS** build (`npm run build`), portal, catálogo (47/26.774), plano (30 candidatas), lote 13 (938 hashes registados) e suites de progresso e Drive com mocks.
- **PASS 12 testes Python** incluindo 6 do scanner HTTP (GET, redirecionamentos, URLs permitidas, 404/HTML, retoma e inventário) e 6 de duplicados.
- Não foram publicadas imagens de terceiros no repositório, não foram alteradas capas nem variantes, nem executadas migrações de estado. Nenhum merge, nova coleção ou pedido de deployment. Produção permanece na referência `main`.

**Pendências residuais:** obter fotografia verdadeira de Salis por fonte comprovada, revalidar os cinco links Topps por meio autorizado (403 no runner) e eventuais reauditorias futuras. Os 24.747 URLs foram processados, sem divergências binárias confirmadas. Etapa 5 **não iniciada**.


## 6. Fecho do varrimento integral — cobertura efetivamente executada

**Execução principal:** [#42491632711](https://github.com/newuser-hub/fut/actions/runs/42491632711) — **COMPLETED / SUCCESS**, commit `572c49334c815708c9ddb10853c341011aeffb23`. Job `validate`, `priority` e os dez shards `0..9` **SUCCESS**. **Execução complementar da capa externa:** [#42491973748](https://github.com/newuser-hub/fut/actions/runs/42491973748), **SUCCESS**.

**Conciliação:** o scanner original registou 24.741 GET 200 de imagem, cinco 403 da Topps e uma capa externa não tentada por política de host. A capa foi verificada por um segundo GET, HTTP 200, com MIME, bytes e SHA completos. O registo final dessa capa **substitui** o `invalid_url` da primeira tentativa (não duplica a contagem).

| Métrica final (valores observados, não estimativas) | Resultado |
|---|---:|
| Coleções / posições preservadas | **47 / 26.774** |
| URLs inventariados, todos distintos | **24.747** |
| URLs efetivamente tratados na auditoria, após conciliação | **24.747 / 24.747 (100%)** |
| GET 200 + MIME imagem + bytes + SHA-256 comprovados | **24.742** |
| Dos quais imagens de cromos com hash antigo igual ao novo | **24.695** |
| Dos quais capas com GET válido | **47 / 47** |
| URLs Topps respondendo 403, sem novo hash | **5** |
| URLs de cromos em falta (não há imagem para descarregar) | **2.074** |
| Divergências entre bytes/SHA-256 novos e persistidos | **0** |
| Redirecionamentos finais dos GET 200 | **0** |
| Tentativas adicionais decorrentes de retries nos shards | **42** |
| Percentagem de URLs com bytes de imagem verificados | **99,9798%** |
| Percentagem de posições com URL de imagem (incluindo cinco 403) | **92,2537%** |

**Cobertura por origem (GET 200):** `www.cromos.pt` 23.552; `www.stickersone.com` 549; `stickersone.com` 640; `blogger.googleusercontent.com` 1. `images.topps.com`: cinco HTTP 403, sem bytes de imagem recuperados pelo runner.

**Registos per-URL:** cada artefacto `fut-etapa4-shard-0` a `fut-etapa4-shard-9` contém resultados JSONL e sumário do lote. A consolidação independente abrange **24.747 chaves únicas**, sem repetição, e corrigiu por reconciliação o único URL de capa não autorizado na primeira execução. Evidência adicional: `fut-etapa4-priority` (incluindo o URL antigo de Salis) e artefacto da capa externa no run complementar.

**SHA-256 do consolidado JSONL (18.789.968 bytes):** `cbcf3c95fe946803de1e5274109e1f0e21c77566950bfe4818b5298169bdcb25`. Foi gerado também um ZIP com JSONL, CSV e resumo, anexado à conversa de auditoria, sem incorporar imagens binárias no repositório.

**Período registado nos dados reconciliados:** 08/11/2026, entre 14:49:02 UTC e 15:07:17 UTC. Registos de GET são evidências temporais e não garantias de disponibilidade futura.

### Interpretação e decisão final
- **Nenhuma correção de hashes/imagens em massa:** as 24.695 imagens anteriormente com hash continuaram idênticas quando obtidas por GET. Preservar os metadados existentes evita revisões sem necessidade.
- **Salis:** única imagem efetivamente corrigida nesta etapa, por prova combinada de GET/bytes idênticos ao cromo de Kojo e inspeção visual confirmada; posição 383 conservada, fotografia marcada indisponível.
- **Oito variantes regionais:** 16 GET 200 e hashes idênticos aos pares e ao histórico. Mesma identidade textual do jogador em ambos os números regionais; conservar variantes. Os hashes não garantem por si conformidade com todos os elementos gráficos do checklist oficial.
- **Topps 5×403:** quatro impossibilidades de acesso não seriam transformadas em erros de atribuição; no caso real são **cinco**, preservando os cinco URLs `official-preview-link` e a distinção entre foto sem hash e cromo sem foto.
- **Checkpoint de retoma:** **não há shards pendentes** na execução 2026-11-08; se houver necessidade de nova auditoria, utilizar `--resume` com JSONL e `--retry-transient` só para resultados não conclusivos. A execução manual `workflow_dispatch` pode depender da presença do ficheiro na branch default; a retoma pelo script e artefactos é independente dessa limitação.

**Etapa 4/10 concluída em auditoria, com pendência editorial Topps/Salis explicitamente registada. Etapa 5/10 não iniciada. Nenhuma coleção adicionada, nem merge nem pedido de deployment.**
