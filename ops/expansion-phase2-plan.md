# FUT — Nova fase de expansão (lotes 9–13)

Data de elaboração: **8 de novembro de 2026**. Repositório: `newuser-hub/fut`, branch `main`.

## Estado inicial

- **37 coleções ativas, 22.612 cromos** (lote 8 já terminado e publicado antes deste pedido).
- Roteiro histórico: **16 de 20** candidatas integradas; **4 bloqueadas** por inexistência de fotos. O histórico dos lotes 1–8 e os seus catálogos permanecem inalterados.
- O roteiro passa a 30 candidatas, agrupadas em 15 lotes. Os lotes 9–13 são novos, com duas coleções cada e autorização independente.

## Programa aprovado para planeamento

| Lote | Candidata A | Candidata B | Principais previstos |
|---|---|---|---:|
| 9 | Liga Portugal 2020/21 (ID 60) | Liga Portugal 2019/20 (ID 61) | 815 |
| 10 | Euro 2008 Áustria/Suíça (ID 20) | Taça das Confederações Brasil 2013 (ID 28) | 817 |
| 11 | Liga Portugal 2018/19 (ID 62) | Liga Portugal 2017/18 (ID 63) | 817 |
| 12 | Mundial Itália 1990 (ID 11) | Euro Suécia 1992 (ID 12) | 709 |
| 13 | Liga Portugal 2016/17 (ID 64) | Liga Portugal 2014/15 (ID 55) | 808 |

Total das dez candidatas: **3.966 posições principais** previstas; extras podem aumentar o total. A auditoria prévia confirmou caminhos de imagem para todos os principais, salvo Euro Suécia 1992 (257/261, mais de 98%) e Liga Portugal 2017/18 (395/395 principais, uma fotografia extra não disponível). Amostras JPEG responderam HTTP 200 nas origens verificadas. Isto não substitui a auditoria integral de cada lote.

## Política e alterações da interface

- Começar apenas pelo lote **9**, autorizando dois catálogos (IDs 60/61) e bloqueando importações concorrentes.
- Cada lote deve verificar nomes, números, secções, duplicados, imagens individuais por GET/MIME/bytes/SHA-256, IDs imutáveis e número exato de coleções anteriores.
- Não inventar imagens; substituições só após prova de cobertura insuficiente, com origem e motivo documentados.
- Manter os quatro bloqueios históricos, sem eliminá-los.
- Os botões na secção Roteiro passam a listar os quinze lotes, incluindo os lotes 10–13, apenas para copiar a respetiva autorização.
- Na página de entrada, criar categoria **Champions League**, separada de Outros. Classificar exclusivamente por metadados, sem modificar catálogos, progressos locais, OAuth ou palavra-passe.

## Exclusões documentadas

- FIFA 365 2023 Panini (Cromos.pt 322): 0/436 caminhos de imagem nos 436 principais; 448 posições totais. Excluída desta fase, elegível apenas depois de uma nova fonte verificável.
- Liga Portugal 2015/16 (Cromos.pt 54): 376/406 imagens principais declaradas; guardada para reavaliação, não acrescentada à fase corrente.

Após cada lote, atualizar checkpoint e validar o SHA efetivamente em READY no Vercel e HTTP 401 anónimo nos dados e na página inicial.


## Primeiro lote concluído — 9

- Auditoria integral: [GitHub Actions 42478834337](https://github.com/newuser-hub/fut/actions/runs/42478834337), **SUCCESS**.
- [Commit 7f2df3ee30c06ce16b448b131b9391ecff85d426](https://github.com/newuser-hub/fut/commit/7f2df3ee30c06ce16b448b131b9391ecff85d426): **Liga Portugal 2020/21**, 445/445 imagens em 19 secções; **Liga Portugal 2019/20**, 423/423 imagens em 22 secções. HTTP/MIME/bytes/SHA-256, 868 hashes distintos, IDs e numeração sem duplicações.
- Biblioteca: **39 coleções ativas e 23.480 cromos**. Plano: **18 integradas, quatro bloqueadas e oito pendentes** das 30 candidatas.
- Publicação no Vercel do commit de integração confirmada `READY`; as alterações posteriores de documentação requerem nova confirmação do SHA em produção.
- Próximo lote 10: **Euro 2008 (ID 20)** e **Taça das Confederações Brasil 2013 (ID 28)**, sujeito a autorização.


## Lote 10 concluído — Euro 2008 e Taça das Confederações 2013

- Autorização registada no [commit 55dbf1e](https://github.com/newuser-hub/fut/commit/55dbf1e4460bdfeaed9a7047de305b2dc63b390a); [auditoria e testes transacionais 42481102972](https://github.com/newuser-hub/fut/actions/runs/42481102972) concluídos com **SUCCESS**.
- [Commit de integração c2b6c008](https://github.com/newuser-hub/fut/commit/c2b6c008dac7fba437cfabfa5c361454c916f430), sem modificar os 39 catálogos anteriores: **Euro 2008** (ID Cromos.pt 20) com **568/568** imagens, 20 secções, zero faltas; **Confederações Brasil 2013** (ID 28) com **249/249** imagens, 11 secções, zero faltas.
- GET HTTP 200, MIME de imagem, tamanho mínimo e SHA-256 verificados para todas as **817 imagens**; **817 SHA-256 distintos** no lote, nenhum ID ou número de navegação duplicado, sem nomes ou secções vazios. Não foi necessária substituição de fonte.
- Biblioteca atual: **41 coleções e 24.297 cromos**. Roteiro: **20 integradas, 4 bloqueadas e 6 pendentes**, das 30 candidatas. Categoria Champions League, progresso independente, OAuth e autenticação preservados.
- Vercel: commit de integração `c2b6c008dac7fba437cfabfa5c361454c916f430` confirmado **READY** em produção (deployment `dpl_5TWfBafbXUZPgfmxtP8xo3LGYmcJ`). O commit de documentação e verificações posterior deve ser confirmado separadamente.
- Próximo lote **11**, apenas após autorização: Liga Portugal 2018/19 (ID 62) e Liga Portugal 2017/18 (ID 63). Os bloqueios e exclusões anteriores permanecem.
