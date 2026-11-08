# FUT — Auditoria preliminar de fontes, lote operacional 6

Consulta técnica realizada em **8 de novembro de 2026**, antes da integração, diretamente às páginas Cromos.pt e a amostras dos respetivos ficheiros JPEG. O teste confirma caminhos de imagem declarados e faz GET, MIME, dimensão e SHA-256 de uma fotografia representativa por edição. **Não substitui a auditoria de todos os ficheiros** na workflow de importação.

| Cromos.pt ID | Edição | Registos no catálogo | Principais | Caminhos de imagem principais | Caminhos totais | HTTP/MIME de amostra |
|---|---|---:|---:|---:|---:|---|
| 320 | FIFA 365 2025 | 533 | 458 | **0** | **0** | Não existe fotografia para testar |
| 17 | Mundial Coreia/Japão 2002 | 581 | 581 | 581 | 581 | JPEG, HTTP 200, 37.994 bytes |
| 15 | Mundial França 1998 | 561 | 561 | 561 | 561 | JPEG, HTTP 200, 37.448 bytes |
| 16 | Euro 2000 | 358 | 358 | 358 | 358 | JPEG, HTTP 200, 18.786 bytes |
| 29 | Taça das Confederações 2017 | 301 | 301 | 301 | 301 | JPEG, HTTP 200, 19.546 bytes |
| 13 | Mundial EUA 1994 | 444 | 444 | 444 | 444 | JPEG, HTTP 200, 19.227 bytes |
| 14 | Euro 1996 | 354 | 354 | 354 | 354 | JPEG, HTTP 200, 19.798 bytes |

## Decisão

O pedido autorizou FIFA 365 2025 (ID 320) + Mundial 2002 (ID 17), com possibilidade de substituir a origem sem cobertura suficiente pela candidata seguinte ainda não integrada no plano.

1. **FIFA 365 2025**: rejeitada para importação devido a **0/458** imagens principais disponíveis; 75 extras também não têm caminhos de imagem. Manter a candidata histórica, os 533 registos conhecidos e o motivo de bloqueio documentados. Nenhuma fotografia inventada.
2. **Mundial 2002**: manter, sujeito a GET e SHA-256 de todas as 581 imagens.
3. **Mundial França 1998 (ID 15)**: próxima candidata elegível; substituir FIFA 365 2025, sujeito a GET e SHA-256 de todas as 561 imagens.

O lote operacional inclui **exatamente duas coleções**, `world-cup-2002` e `world-cup-1998`; as origens posteriores foram apenas consultadas para avaliar alternativas, não importadas. A workflow `.github/workflows/ingest-roadmap-batch.yml` deve proteger a operação de integrações concorrentes e atualizar `public/library.json`, `public/expansion-plan.json` e catálogos no mesmo commit, após validações.

O estado `blocked` da FIFA 365 2025 será registado no roteiro após o commit de importação, para manter a execução inicial da workflow de integridade coerente enquanto o lote ainda não está integrado.
