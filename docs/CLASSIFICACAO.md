# Classificação dos ficheiros de origem

Uma categoria primária por ficheiro, mantendo a localização real; para temas partilhados criam-se **referências cruzadas**, não cópias. Registo enumerado: [source-map.json](source-map.json).

| Categoria | Ficheiros antes da reorganização | Fontes primárias |
|---|---:|---|
| 01 — Gestão do projeto | 4 | README e ops/ |
| 02 — Coleções de cromos | 30 | public/data/ e public/library.json |
| 03 — Catálogos e bases de dados | 7 | archives/ |
| 04 — Imagens e recursos | 0 | metadados dos catálogos, por referência |
| 05 — Funcionalidades | 3 | src/ e public/index.html/favicon |
| 06 — Desenvolvimento e arquitetura | 13 | scripts/ e package.json |
| 07 — Segurança e integridade | 2 | proxy.js e robots.txt |
| 08 — GitHub e Vercel | 9 | workflows e vercel.json |
| 09 — Auditorias e controlo | 0 | catálogos e Actions, por referência |
| 10 — Backlog e expansões | 8 | requests/ e expansion-plan.json |
| **Total** | **76** | **0 ficheiros originais por classificar** |

As categorias 04 e 09 têm zero ficheiros **primários independentes** porque as suas auditorias e metadados estão incorporados nos catálogos e nos registos de execução. Esta é a distribuição original, sem contar os ficheiros documentais acrescentados depois.

A categoria 06 inclui ainda `api/storage.js`, `lib/drive-store.js`, `scripts/migrate-drive.mjs`, `scripts/test-drive-storage.mjs` e `docs/GOOGLE_DRIVE_STORAGE.md`, acrescentados na main em paralelo.
