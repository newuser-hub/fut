# FUT — Arquivo de Cadernetas Digitais

Portal de cadernetas virtuais de futebol, com **doze coleções ativas** e uma expansão autorizada por lotes sucessivos de duas coleções, sem um limite predefinido.

## Coleções

| Coleção | Cromos disponíveis | Secções | Estado |
|---|---:|---:|---|
| Mundial de Clubes 2025 — Panini | 550 | 33 | Integrada |
| Euro Portugal 2004 — Panini | 334 | 17 | Integrada |
| Mundial Qatar 2022 — Panini | 750 (670 principais + 80 extras) | 37 | Integrada no lote 2 |
| Euro 2024 — Topps | 707 | 43 | Integrada no lote 2 |
| Liga Portugal 2021/22 — Panini | 438 (421 principais + 17 extras) | 23 | Integrada — substitui Ídolos 2025/26 |
| Liga Portugal 2024/25 — Panini | 528 (497 principais + 31 extras) | 27 | Integrada neste lote |
| Champions League Match Attax 2025/26 — Topps | 738 (662 com fotografia) | 77 | Integrada no lote 3 |
| Champions League & Europa League Match Attax 2026/27 — Topps | 558 (491 principais + 67 extras; 522 com fotografia) | 42 | Integrada no lote 3 |
| LaLiga ESTE 2026/27 — Panini | 743 (640 principais + 103 extras; 623 com fotografia) | 34 | Integrada no lote 5 |
| LaLiga Megacracks 2026/27 — Panini | 534 (450 principais + 84 extras; 451 com fotografia) | 33 | Integrada no lote 5 |
| UEFA Euro França 2016 — Panini | 767 (680 principais + 87 extras) | 25 | Integrada neste lote |
| Mundial Rússia 2018 — Panini | 787 (686 principais + 101 extras) | 37 | Integrada neste lote |
| Mundial Brasil 2014 — Panini | — | — | Candidata ao próximo lote; imagens por auditar |
| Copa América 2024 — Panini | — | — | Candidata ao próximo lote; imagens por auditar |

**Total atual: 7.434 posições em doze coleções ativas.** As novas cadernetas Euro França 2016 e Mundial Rússia 2018 acrescentaram **1.554 cromos (767 + 787), todos com imagens verificadas por HTTP GET, MIME, tamanho e SHA-256**.  As duas coleções espanholas acrescentaram 1.277 posições em 67 secções, das quais **1.074 têm imagem verificada e 203 não têm fotografia acessível** na fonte em 7 de novembro de 2026. O catálogo ESTE apresenta quatro entradas com numeração impressa coincidente (dois pares); os números originais foram mantidos e cada posição recebeu uma referência inequívoca da origem para navegação. As duas cadernetas portuguesas acrescentadas neste lote têm **966 imagens verificadas em 966 posições** (438 na edição 2021/22 e 528 na edição 2024/25). Ídolos 2025/26 foi substituída por ter quatro cartas de autógrafos sem fotografia no catálogo de referência. As edições Match Attax de 2025/26 e 2026/27 foram integradas e publicadas em 7 de novembro de 2026, preservando as quatro coleções anteriores. Das 1.296 novas cartas, 1.184 têm imagem verificada por HTTP GET, MIME, dimensão e SHA-256 (662 e 522, respetivamente). As restantes 112 posições mantêm-se navegáveis com a indicação de imagem indisponível. Nenhuma fotografia foi inventada.

## Funcionalidades

O motor foi adaptado da caderneta `i2627`:

- Índice por secções e pesquisa por nome, clube ou número;
- Páginas de até nove cromos e navegação por botões, setas e gestos horizontais;
- Um toque revela, um toque num cromo revelado amplia e dois toques rápidos voltam a tapar;
- Revelar/tapar página, revelar todos e repor toda a coleção;
- Favoritos, descoberta aleatória, progresso local independente por coleção;
- Exportar/importar JSON do progresso de cada coleção;
- Portal com capas de todas as coleções e botão **Copiar pedido para próximas duas**, que prepara o próximo pedido de autorização no ChatGPT.

Os dados ficam no `localStorage` do navegador, sem sincronização entre equipamentos. O pedido para avançar para o próximo lote é **copiado para a área de transferência**: a pessoa deve submetê-lo numa conversa ChatGPT. Não existe execução infinita em segundo plano nem exposição de credenciais GitHub no browser.

## Integração de novos lotes

A integração é preparada pelo ficheiro `requests/next-batch.json`, que contém exatamente dois candidatos com IDs de coleção Cromos.pt, títulos, anos e metadados editoriais.

A workflow `.github/workflows/ingest-next-batch.yml` executa-se quando esse ficheiro muda na branch `main` (ou por `workflow_dispatch`). A execução:

1. Recupera o motor original e os dois catálogos históricos dos blocos `archives/`;
2. Recolhe os novos catálogos da origem;
3. Audita individualmente as imagens disponíveis (HTTP GET, MIME, dimensão, SHA-256) e assinala posições sem fotografia na origem;
4. Rejeita lotes com IDs de origem repetidos, fonte inesperada ou cobertura das imagens principais inferior a 80%; quando há números impressos repetidos, preserva-os em `originalNumber` e desambigua cada posição pelo `sourceId`, sem perder entradas. A opção `requireAllImages` exige **100% das imagens**, e `replaces` permite substituir um lugar reservado incompleto sem duplicar entradas;
5. Atualiza `public/library.json`, `public/data/*.json` e a aplicação;
6. Executa verificações estruturais e valida a sintaxe JavaScript;
7. Só após sucesso efetua commit para `main`, para permitir nova publicação Vercel.

O site tem uma única fonte HTML editável, `src/index.html`, criada na primeira integração. `npm run build` copia-a para `public/index.html` e restaura os catálogos legados quando necessário. O portal usa o manifesto `public/library.json`, pelo que novos lotes não exigem reescrever o motor.

Concluídas as dez cadernetas atuais, os lotes seguintes podem usar novas coleções identificadas e auditadas, **sem limite fixo de coleções**. Os candidatos seguintes são Euro França 2016 e Mundial Rússia 2018; a inclusão dependerá de nova auditoria completa e da autorização do utilizador.

## Fontes

- [Mundial de Clubes 2025](https://www.cromos.pt/collection/41/fifa-club-world-cup-2025-panini)
- [Euro Portugal 2004](https://www.cromos.pt/collection/18/uefa-euro-portugal-2004-panini)
- [Mundial Qatar 2022](https://www.cromos.pt/collection/27/fifa-world-cup-qatar-2022-panini)
- [Euro 2024](https://www.cromos.pt/collection/33/uefa-euro-2024-topps)
- [Futebol 2021/22](https://www.cromos.pt/collection/59/futebol-2021-2022-panini)
- [Futebol 2024/25](https://www.cromos.pt/collection/52/futebol-2024-2025-panini)
- [Euro França 2016](https://www.cromos.pt/collection/24/uefa-euro-france-2016-panini)
- [Mundial Rússia 2018](https://www.cromos.pt/collection/25/fifa-world-cup-russia-2018-panini)
- [Mundial Brasil 2014 — candidato](https://www.cromos.pt/collection/23/fifa-world-cup-brazil-2014-panini)
- [Copa América 2024 — candidata](https://www.cromos.pt/collection/42/copa-america-2024-panini)
- [Match Attax 2025/26](https://www.cromos.pt/collection/50/match-attax-2025-2026-topps)
- [Match Attax 2026/27](https://www.cromos.pt/collection/81/topps-uefa-champions-league-europa-league-2026-2027-match-attax)
- [LaLiga ESTE 2026/27](https://www.cromos.pt/collection/337/laliga-2026-2027-este-panini)
- [LaLiga Megacracks 2026/27](https://www.cromos.pt/collection/80/laliga-2026-2027-megacracks-panini)

Auditados em novembro de 2026. Os cromos e cartas com fotografia são **referenciados por URL**, alojados no Cromos.pt, e **não** são guardados no repositório público. A disponibilidade atual de imagens não assegura que a origem as mantenha para sempre.

## Segurança e direitos

O Vercel protege o portal com autenticação HTTP Basic. O utilizador é `fut`; a palavra-passe fica exclusivamente na variável sensível `FUT_ALBUM_PASSWORD`. Não colocar o segredo em commits, issues ou publicações.

Projeto independente, não oficial e não afiliado à Panini, Topps, FIFA, UEFA ou Cromos.pt. Imagens, marcas e cromos pertencem aos respetivos titulares. A acessibilidade pública **não** equivale a licença de reprodução ou distribuição; confirmar permissões antes de promover publicamente o portal.
