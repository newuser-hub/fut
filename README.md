# FUT — Arquivo de Cadernetas Digitais

Portal de cadernetas virtuais de futebol, com **vinte e três coleções ativas** e uma expansão autorizada por lotes sucessivos de duas coleções, sem um limite predefinido.

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
| Mundial Brasil 2014 — Panini | 746 (643 principais + 103 extras) | 35 | Integrada; 746/746 imagens verificadas |
| Copa América 2024 — Panini | 430 | 22 | Integrada; 430/430 imagens verificadas |
| Premier League Flagship 2026/27 — Topps | 1.138 (5 ligações oficiais não verificadas por SHA-256) | 63 | Integrada em paralelo |
| Serie A Calciatori 2026/27 — Panini | 827 (589 principais + 238 extras; 640 imagens auditadas) | 35 | Integrada — imagens de referência StickersOne |
| Ligue 1 Foot 2025/26 — Panini | 556 (548 imagens auditadas) | 20 | Integrada — imagens de referência StickersOne |
| Euro 2020 Tournament Edition — Panini | 750 | 31 | Integrada; 750/750 imagens verificadas |
| Mundial África do Sul 2010 — Panini | 717 (640 principais + 77 extras) | 35 | Integrada; 717/717 imagens verificadas |
| Euro 2012 Polónia/Ucrânia — Panini | 555 (540 principais + 15 extras) | 20 | Integrada; 555/555 imagens auditadas |
| Mundial Alemanha 2006 — Panini | 605 (597 principais + 8 extras) | 35 | Integrada; 605/605 imagens auditadas |
| Mundial FIFA 2026 — Panini | 1.206 (980 principais + 226 extras; 1.046 fotografias verificadas) | 59 | Lote 1 do roteiro |
| Liga Portugal 2025/26 — Panini | 497 (486 principais + 11 extras; 486 fotografias verificadas) | 26 | Lote 1 do roteiro |

**Total atual: 15.461 posições em vinte e três coleções ativas.** Este lote Euro Polónia/Ucrânia 2012 e Mundial Alemanha 2006 acrescentou **1.160 cromos, em 55 secções, com 1.160/1.160 imagens verificadas** por HTTP GET, MIME, tamanho e SHA-256. Uma execução paralela integrou ainda Mundial FIFA 2026 (1.206 posições) e Liga Portugal 2025/26 (497 posições), sem modificar o nosso lote.  Euro 2020 Tournament Edition e Mundial África do Sul 2010 acrescentaram **1.467 cromos em 66 secções (750 + 717), com 1.467/1.467 imagens verificadas** por HTTP GET, MIME, tamanho e SHA-256.  Foram integrados 827 cromos da Serie A Calciatori 2026/27 e 556 da Ligue 1 Foot 2025/26. A auditoria verificou **1.188 imagens individuais** (640 + 548), incluindo 588 de 589 cromos principais italianos e 548 de 556 franceses. Os restantes 195 registos mantêm-se navegáveis, assinalados sem fotografia.  Mundial Brasil 2014 e Copa América 2024 acrescentaram **1.176 cromos em 57 secções, com 1.176/1.176 imagens verificadas**. Uma execução paralela adicionou também a Premier League Flagship 2026/27 (1.138 posições, 63 secções), com cinco ligações a pré-visualizações oficiais Topps que não puderam ser verificadas por hash (HTTP 403 na origem).  As novas cadernetas Euro França 2016 e Mundial Rússia 2018 acrescentaram **1.554 cromos (767 + 787), todos com imagens verificadas por HTTP GET, MIME, tamanho e SHA-256**.  As duas coleções espanholas acrescentaram 1.277 posições em 67 secções, das quais **1.074 têm imagem verificada e 203 não têm fotografia acessível** na fonte em 7 de novembro de 2026. O catálogo ESTE apresenta quatro entradas com numeração impressa coincidente (dois pares); os números originais foram mantidos e cada posição recebeu uma referência inequívoca da origem para navegação. As duas cadernetas portuguesas acrescentadas neste lote têm **966 imagens verificadas em 966 posições** (438 na edição 2021/22 e 528 na edição 2024/25). Ídolos 2025/26 foi substituída por ter quatro cartas de autógrafos sem fotografia no catálogo de referência. As edições Match Attax de 2025/26 e 2026/27 foram integradas e publicadas em 7 de novembro de 2026, preservando as quatro coleções anteriores. Das 1.296 novas cartas, 1.184 têm imagem verificada por HTTP GET, MIME, dimensão e SHA-256 (662 e 522, respetivamente). As restantes 112 posições mantêm-se navegáveis com a indicação de imagem indisponível. Nenhuma fotografia foi inventada.

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
- [Mundial Brasil 2014](https://www.cromos.pt/collection/23/fifa-world-cup-brazil-2014-panini)
- [Copa América 2024](https://www.cromos.pt/collection/42/copa-america-2024-panini)
- [Euro 2020 Tournament Edition](https://www.cromos.pt/collection/26/uefa-euro-2020-tournament-edition-panini)
- [Mundial África do Sul 2010](https://www.cromos.pt/collection/21/fifa-world-cup-south-africa-2010-panini)
- [Euro 2012 Polónia/Ucrânia](https://www.cromos.pt/collection/22/uefa-euro-poland-ukraine-2012-panini)
- [Mundial Alemanha 2006](https://www.cromos.pt/collection/19/fifa-world-cup-germany-2006-panini)
- [Mundial FIFA 2026](https://www.cromos.pt/collection/31/fifa-world-cup-2026-panini)
- [Liga Portugal 2025/26](https://www.cromos.pt/collection/30/futebol-2025-2026-panini)
- [Match Attax 2025/26](https://www.cromos.pt/collection/50/match-attax-2025-2026-topps)
- [Match Attax 2026/27](https://www.cromos.pt/collection/81/topps-uefa-champions-league-europa-league-2026-2027-match-attax)
- [Serie A Calciatori 2026/27 — StickersOne](https://stickersone.com/it/albumgrid-calciatori-2026-2027-panini-4689)
- [Ligue 1 Foot 2025/26 — StickersOne](https://www.stickersone.com/it/albumgrid-foot-ligue-1-2025-2026-panini-4380)
- [LaLiga ESTE 2026/27](https://www.cromos.pt/collection/337/laliga-2026-2027-este-panini)
- [LaLiga Megacracks 2026/27](https://www.cromos.pt/collection/80/laliga-2026-2027-megacracks-panini)

Auditados em novembro de 2026. Os cromos e cartas com fotografia são **referenciados por URL**, alojados no Cromos.pt, e **não** são guardados no repositório público. A disponibilidade atual de imagens não assegura que a origem as mantenha para sempre.

## Segurança e direitos

O Vercel protege o portal com autenticação HTTP Basic. O utilizador é `fut`; a palavra-passe fica exclusivamente na variável sensível `FUT_ALBUM_PASSWORD`. Não colocar o segredo em commits, issues ou publicações.

Projeto independente, não oficial e não afiliado à Panini, Topps, FIFA, UEFA ou Cromos.pt. Imagens, marcas e cromos pertencem aos respetivos titulares. A acessibilidade pública **não** equivale a licença de reprodução ou distribuição; confirmar permissões antes de promover publicamente o portal.

## Premier League Flagship 2026/27 — Topps

Importação através de `scripts/ingest_premier_league.py` e da workflow `.github/workflows/ingest-premier-league.yml`, independente da fila de dois lotes. Fonte de verdade: [checklist PDF oficial Topps](https://cdn.shopify.com/s/files/1/0739/2015/1805/files/26_27_Topps_Flagship_Premier_League_Checklist_2.pdf?v=1784890627). O importador só publica quando reconcilia exatamente **1.138 referências** e identifica a correspondência de todas. O servidor de imagens Topps devolve HTTP 403 aos runners GitHub; por isso, as cinco pré-visualizações associadas inequivocamente às cartas corretas são guardadas como **ligações oficiais não auditadas por checksum**, podendo não carregar em todos os navegadores. O catálogo não inventa bytes, SHA-256 nem fotografias. Todas as restantes posições têm imagem indisponível assinalada. O progresso é independente e mantém a lógica das outras coleções.

## Expansão Itália e França — 7 de novembro de 2026

Foi criado o importador auditado `scripts/ingest_italia_franca.py`, executado pela workflow `.github/workflows/audit-italia-franca.yml` (sem alterar o mecanismo histórico dos lotes de duas coleções). A importação foi transacional: ambos os catálogos foram lidos e todos os URLs de cromos candidatos foram verificados por GET, MIME, dimensão e SHA-256 antes de modificar o manifesto ou publicar. Mantiveram-se os identificadores originais, secções e progresso local independente. A fonte dos ficheiros de imagem continua a ser o StickersOne; os ficheiros não foram copiados para o repositório. A acessibilidade e os direitos de reprodução futuros dependem dos titulares.

Escolha editorial: Itália utiliza a edição **2026/27**, mais recente, com 827 posições (589 principais e 238 adicionais). A edição francesa **2025/26** foi preferida à Adrenalyn XL 2026/27 porque tem 548 fotografias verificáveis de 556 cromos, enquanto os 522 registos da edição francesa 2026/27 consultada apresentavam apenas imagens genéricas de substituição. Esta seleção dá prioridade à experiência visual exigida pelo FUT, sem apresentar uma coleção sem imagens como completa em termos visuais.

## Plano de expansão — 20 coleções, 10 lotes

O roteiro ativo está em [`public/expansion-plan.json`](public/expansion-plan.json) e é mostrado na página inicial do FUT. São **20 coleções candidatas adicionais**, não o limite do arquivo. As contagens abaixo correspondem aos **cromos principais declarados pela origem**; extras e disponibilidade de fotografias só são apurados na auditoria. A ordem é prioritária, mas pode ser ajustada se a origem tiver imagens incompletas ou se outros pedidos integrarem alguma caderneta em paralelo. O botão **Copiar próximo pedido** e os dez botões individuais produzem um texto de autorização para submeter no ChatGPT; não escrevem no GitHub nem executam tarefas por conta própria.

| Lote | Coleção A | Principais | Coleção B | Principais |
|---|---|---:|---|---:|
| 1 | Mundial FIFA 2026 ([origem](https://www.cromos.pt/collection/31/fifa-world-cup-2026-panini)) | 980 | Liga Portugal 2025/26 ([origem](https://www.cromos.pt/collection/30/futebol-2025-2026-panini)) | 486 |
| 2 | FIFA 365 2027 ([origem](https://www.cromos.pt/collection/340/fifa-365-2027-panini)) | 496 | Ídolos do Futebol Português 2026/27 ([origem](https://www.cromos.pt/collection/335/idolos-do-futebol-portugues-2026-2027-panini)) | 252 |
| 3 | FIFA 365 Adrenalyn XL 2027 ([origem](https://www.cromos.pt/collection/99/fifa-365-2027-adrenalyn-xl-panini)) | 451 | Mundial FIFA 2026 — Adrenalyn XL ([origem](https://www.cromos.pt/collection/34/fifa-world-cup-2026-adrenalyn-xl-panini)) | 700 |
| 4 | Champions League 2025/26 — Topps ([origem](https://www.cromos.pt/collection/49/uefa-champions-league-2025-2026-topps)) | 584 | Match Attax Extra 2025/26 ([origem](https://www.cromos.pt/collection/51/match-attax-extra-2025-2026-topps)) | 445 |
| 5 | FIFA 365 2026 ([origem](https://www.cromos.pt/collection/44/fifa-365-2026-panini)) | 524 | FIFA 365 2024 ([origem](https://www.cromos.pt/collection/321/fifa-365-2024-panini)) | 478 |
| 6 | Liga Portugal 2023/24 ([origem](https://www.cromos.pt/collection/53/futebol-2023-2024-panini)) | 527 | Champions League 2024/25 — Topps ([origem](https://www.cromos.pt/collection/77/uefa-champions-league-2024-2025-topps)) | 531 |
| 7 | Liga Portugal 2022/23 ([origem](https://www.cromos.pt/collection/58/futebol-2022-2023-panini)) | 477 | FIFA 365 2025 ([origem](https://www.cromos.pt/collection/320/fifa-365-2025-panini)) | 458 |
| 8 | Mundial Coreia/Japão 2002 ([origem](https://www.cromos.pt/collection/17/fifa-world-cup-korea-japan-2002-panini)) | 581 | Mundial França 1998 ([origem](https://www.cromos.pt/collection/15/fifa-world-cup-france-1998-panini)) | 561 |
| 9 | Euro 2000 — Bélgica/Países Baixos ([origem](https://www.cromos.pt/collection/16/uefa-euro-belgium-netherlands-2000-panini)) | 358 | Taça das Confederações 2017 ([origem](https://www.cromos.pt/collection/29/fifa-confederations-cup-russia-2017)) | 301 |
| 10 | Mundial EUA 1994 ([origem](https://www.cromos.pt/collection/13/fifa-world-cup-usa-1994-panini)) | 444 | Euro Inglaterra 1996 ([origem](https://www.cromos.pt/collection/14/uefa-euro-england-1996-panini)) | 354 |

Total indicativo: **9.988 posições principais** nas 20 candidatas. Critérios de conclusão de cada lote: fonte identificada, IDs e numeração sem duplicados, secções preservadas, imagens individuais HTTP/MIME/tamanho/SHA-256, ausência de imagens inventadas, testes JavaScript e integridade global, publicação Vercel e verificação da proteção por palavra-passe. Casos sem imagens suficientes ficam pendentes ou são substituídos por outra candidata autorizada. O avanço para cada lote requer um novo pedido explícito; a interface não inicia processos em segundo plano.


### Primeiro lote do roteiro — concluído

A integração em `requests/roadmap-batch.json` concluiu-se com sucesso, preservando o lote Euro 2012 + Mundial 2006 que correu em paralelo. Foram acrescentadas **1.703 posições**: 1.206 no Mundial FIFA 2026 e 497 na Liga Portugal 2025/26. A auditoria validou individualmente **1.532 fotografias (1.046 + 486)**. A cobertura das cartas principais é de **100% nas duas coleções** (980/980 e 486/486); permanecem 160 extras do Mundial e 11 extras portugueses sem imagem, com fallback explícito. As duas workflows partilham a fila `fut-ingest-collections`, para evitar escritas simultâneas, e a versão publicada passou nas verificações estruturais e sintáticas. **O roteiro está em 2 de 20 coleções integradas**, faltando nove lotes sujeitos a autorização.
