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
- **Estado do varrimento integral:** em execução no momento do primeiro registo. A execução e respetivos totais efetivos são verificados no ponto de retoma/adição do fecho; não confundir trabalho iniciado com trabalho concluído.

## 5. Verificadores e fronteiras

- **PASS** build (`npm run build`), portal, catálogo (47/26.774), plano (30 candidatas), lote 13 (938 hashes registados) e suites de progresso e Drive com mocks.
- **PASS 12 testes Python** incluindo 6 do scanner HTTP (GET, redirecionamentos, URLs permitidas, 404/HTML, retoma e inventário) e 6 de duplicados.
- Não foram publicadas imagens de terceiros no repositório, não foram alteradas capas nem variantes, nem executadas migrações de estado. Nenhum merge, nova coleção ou pedido de deployment. Produção permanece na referência `main`.

**Pendências:** completar e agregar shards com resultados HTTP atuais; rever divergências genuínas com dados de origem; possível reposição de imagem de Salis somente se comprovada; Topps 403 continua sem hash. Etapa 5 **não iniciada**.
