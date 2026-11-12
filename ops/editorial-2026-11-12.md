# Revisão editorial e de imagens — 12/11/2026

Produção da auditoria confirmada no [PR #2](https://github.com/newuser-hub/fut/pull/2), SHA `7b51023f6767a807786ecf2d03fcf7086a39712c`. Os dois domínios passaram as 400 verificações de acesso. Este documento descreve as alterações editoriais posteriores à publicação.

| Coleção | Evidência e decisão |
|---|---|
| Champions Topps 2025/26 | Nos dez cromos Jersey Relic RS1–RS10, o título mostrava «200» colado ao nome do clube. Corrigida a apresentação e preservado o título literal em `sourceName`. A [ficha da coleção](https://www.figuriniamoci.com/topps-uefa-champions-league-2025-2026-scheda-album/) confirma os dez nomes e números. A grafia da fonte original pode ser consultada no próprio JSON. |
| Premier League Flagship 2026/27 | A [checklist oficial](https://cdn.shopify.com/s/files/1/0739/2015/1805/files/26_27_Topps_Flagship_Premier_League_Checklist_2.pdf?v=1784890627) agrupa os dez autógrafos Golden Boot sob um único título. GK-HK é o código impresso de Harry Kane. A correção do importador e do catálogo reúne as dez cartas e conserva todos os códigos e IDs. |
| Premier League, fotografias | Os cinco links oficiais responderam com JPEG verificável. A leitura visual encontrou quatro correspondências e uma associação errada. A imagem Mayhem apresenta Haji Wright, do Coventry City. Passou de Evanilson (MA 3) para Haji Wright (MA 20). MA 3 conserva o seu lugar sem fotografia. As cinco imagens são promocionais, podendo representar variantes da carta. |
| Ligue 1 Foot 2025/26 | As nove posições em falta (117, 180, 198, 287, 328, 354, 383, 409, 430) receberam scans conferidos com nome, clube e [checklist da edição](https://www.laststicker.com/cards/panini_foot_2025-2026/). As nove imagens são distintas. Os antigos URLs de Oppong e Salis ainda devolviam exatamente o mesmo JPEG. A nova [imagem de Salis](https://www.laststicker.com/cards/panini_foot_2025-2026/383/) tem bytes diferentes e mostra o jogador com a camisola de Nice. A coleção passa a 556/556. |
| Ídolos do Futebol Português 2026/27 | A fonte passou a fornecer uma imagem para AU1. Conferidos ID 86867, número, jogador, imagem do autógrafo e SHA. O roteiro e a coleção passam a 302 imagens em 313 posições. |

As 15 imagens tiveram dois GET com bytes concordantes. Um deles incluiu o domínio da aplicação no cabeçalho Referer. [Registo com resultados, bytes e SHA-256](editorial-images-2026-11-12.json).

A auditoria profunda passou de 1.009 para 998 alertas de revisão, eliminando dez títulos e uma secção duplicada, sem novos alertas nem erros críticos. Os 455 grupos de nomes iguais, 190 grupos semânticos e 267 pares de nomes próximos continuam a exigir decisão por posição. Os oito grupos de imagens partilhadas de variantes regionais, 72 ocorrências de ordem descontínua, quatro diferenças de número original e dois grupos com número original repetido permanecem registados. A numeração, os IDs, as posições e as chaves de progresso foram preservados.

A revisão abrangeu as lacunas dos catálogos ativos com identificador Cromos.pt e os casos de imagens acima. O inventário passa a 24.710 cromos com hash e 2.064 sem imagem. A Premier League concentra 1.133 dessas lacunas. O varrimento completo anterior e esta revisão dirigida têm âmbitos diferentes.

[Plano e prompts das próximas expansões](next-expansions-2026-11-12.md).
