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
