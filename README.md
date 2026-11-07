# FUT — Arquivo de Cadernetas Digitais

Portal de cadernetas virtuais de futebol, inicialmente com **seis coleções previstas**, extensível em lotes sucessivos de duas coleções.

## Coleções

| Coleção | Cromos disponíveis | Secções | Estado |
|---|---:|---:|---|
| Mundial de Clubes 2025 — Panini | 550 | 33 | Integrada |
| Euro Portugal 2004 — Panini | 334 | 17 | Integrada |
| Mundial Qatar 2022 — Panini | 750 (670 principais + 80 extras) | 37 | Integrada no lote 2 |
| Euro 2024 — Topps | 707 | 43 | Integrada no lote 2 |
| Ídolos do Futebol Português 2025/26 | — | — | Próximo lote |
| Liga Portugal 2024/25 | — | — | Próximo lote |

**Total após o segundo lote: 2.341 cromos em quatro coleções.**

## Funcionalidades

O motor foi adaptado da caderneta `i2627`:

- Índice por secções e pesquisa por nome, clube ou número;
- Páginas de até nove cromos e navegação por botões, setas e gestos horizontais;
- Um toque revela, um toque num cromo revelado amplia e dois toques rápidos voltam a tapar;
- Revelar/tapar página, revelar todos e repor toda a coleção;
- Favoritos, descoberta aleatória, progresso local independente por coleção;
- Exportar/importar JSON do progresso de cada coleção;
- Portal com seis capas e botão **Copiar pedido para próximas duas** para continuar a expansão.

Os dados ficam no `localStorage` do navegador, sem sincronização entre equipamentos. O pedido para avançar para o próximo lote é **copiado para a área de transferência**: a pessoa deve submetê-lo numa conversa ChatGPT. Não existe execução infinita em segundo plano nem exposição de credenciais GitHub no browser.

## Integração de novos lotes

A integração é preparada pelo ficheiro `requests/next-batch.json`, que contém exatamente dois candidatos com IDs de coleção Cromos.pt, títulos, anos e metadados editoriais.

A workflow `.github/workflows/ingest-next-batch.yml` executa-se quando esse ficheiro muda na branch `main` (ou por `workflow_dispatch`). A execução:

1. Recupera o motor original e os dois catálogos históricos dos blocos `archives/`;
2. Recolhe os novos catálogos da origem;
3. Audita individualmente **todas** as imagens (HTTP GET, MIME, dimensão, SHA-256);
4. Rejeita lotes com posições/IDs repetidos, imagens ausentes ou fonte inesperada;
5. Atualiza `public/library.json`, `public/data/*.json` e a aplicação;
6. Executa verificações estruturais e valida a sintaxe JavaScript;
7. Só após sucesso efetua commit para `main`, para permitir nova publicação Vercel.

O site tem uma única fonte HTML editável, `src/index.html`, criada na primeira integração. `npm run build` copia-a para `public/index.html` e restaura os catálogos legados quando necessário. O portal usa o manifesto `public/library.json`, pelo que novos lotes não exigem reescrever o motor.

Depois das seis coleções iniciais, os lotes seguintes podem usar novas coleções identificadas e auditadas, sem limite fixo de coleções.

## Fontes

- [Mundial de Clubes 2025](https://www.cromos.pt/collection/41/fifa-club-world-cup-2025-panini)
- [Euro Portugal 2004](https://www.cromos.pt/collection/18/uefa-euro-portugal-2004-panini)
- [Mundial Qatar 2022](https://www.cromos.pt/collection/27/fifa-world-cup-qatar-2022-panini)
- [Euro 2024](https://www.cromos.pt/collection/33/uefa-euro-2024-topps)

Auditados em novembro de 2026. Os cromos são **referenciados por URL**, alojados no Cromos.pt, e **não** são guardados no repositório público. A disponibilidade atual de imagens não assegura que a origem as mantenha para sempre.

## Segurança e direitos

O Vercel protege o portal com autenticação HTTP Basic. O utilizador é `fut`; a palavra-passe fica exclusivamente na variável sensível `FUT_ALBUM_PASSWORD`. Não colocar o segredo em commits, issues ou publicações.

Projeto independente, não oficial e não afiliado à Panini, Topps, FIFA, UEFA ou Cromos.pt. Imagens, marcas e cromos pertencem aos respetivos titulares. A acessibilidade pública **não** equivale a licença de reprodução ou distribuição; confirmar permissões antes de promover publicamente o portal.
