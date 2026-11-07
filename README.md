# FUT — Arquivo de Cadernetas Digitais

Portal de coleções de futebol, com **seis coleções previstas**. Duas estão integradas:

| Coleção | Cromos | Secções | Estado |
|---|---:|---:|---|
| Mundial de Clubes 2025 (Panini) | 550 | 33 | Disponível |
| Euro Portugal 2004 (Panini) | 334 | 17 | Disponível |
| Mundial Qatar 2022 | — | — | Em preparação |
| Euro 2024 | — | — | Em preparação |
| Ídolos do Futebol Português 2025/26 | — | — | Em preparação |
| Liga Portugal 2024/25 | — | — | Em preparação |

## Funcionalidades

Herdadas do projeto i2627: índice por secções, páginas de 9 cromos, revelar individualmente, miniatura, um toque para ampliar, dois toques para tapar, deslizar para mudar de página, botões de página, setas do teclado, índice e regresso às coleções, revelar/tapar página, revelar todos, voltar a tapar todos, pesquisa, favoritos, surpresa, progresso em localStorage, exportação/importação JSON. **O estado é independente por coleção.** Tapar todos preserva os favoritos.

## Arquitetura

Código da aplicação e dados auditados em `archives/` como gzip repartido em blocos para garantir a integridade do transporte. O comando `npm run build` reconstrói `public/index.html` e `public/data/*.json`. A reconstrução utiliza apenas módulos Node, sem pedidos a fontes externas.

- `scripts/unpack-data.mjs`: reconstrução do HTML e catálogos a partir dos blocos comprimidos
- `scripts/verify_catalogs.py`: valida a completude, unicidade e verificações por imagem
- `proxy.js`: proteção HTTP Basic por middleware no Vercel
- `vercel.json`: configurações de construção e publicação
- `public/favicon.svg`, `public/robots.txt`: recursos do portal

Para uma edição textual do HTML, descomprimir `archives/index.html.gz.part00`, editar e voltar a compactar. Na expansão futura, recomenda-se a separação gradual dos módulos HTML/CSS/JS.

## Proveniência e auditoria

Metadados recolhidos em **7 de novembro de 2026**: [Mundial de Clubes 2025](https://www.cromos.pt/collection/41/fifa-club-world-cup-2025-panini) e [Euro Portugal 2004](https://www.cromos.pt/collection/18/uefa-euro-portugal-2004-panini), do Cromos.pt. As **884 imagens** foram verificadas por HTTP GET e por tipo e tamanho de ficheiro, sem falhas. Metadados incluem URL original, dimensão e hash SHA-256.

**As imagens são servidas pela origem Cromos.pt**, não são guardadas no repositório público. Um arquivo ZIP da auditoria foi produzido fora do GitHub; não está incluído neste repositório. Se a origem ficar indisponível, as miniaturas podem falhar.

## Segurança e direitos

Acesso com utilizador `fut` e palavra-passe configurada exclusivamente na variável sensível `FUT_ALBUM_PASSWORD` do Vercel. Sem palavra-passe, o middleware falha de forma fechada. Progresso e favoritos ficam apenas no dispositivo; não existem contas nem sincronização entre equipamentos.

Projeto independente, não oficial e não afiliado a Panini, FIFA, UEFA ou Cromos.pt. Imagens e marcas pertencem aos seus titulares. **A disponibilização pública das imagens não concede direitos de republicação.**
