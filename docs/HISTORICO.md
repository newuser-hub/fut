# Histórico de marcos — FUT

| Data | Marco | Referência |
|---|---|---|
| 2026-11-07 | Lote 2 atinge 25 coleções e 16.793 posições | [Checkpoint do lote 2](../ops/roadmap-lote2-checkpoint.md) |
| 2026-11-07 | Lote 3 atinge 27 coleções e 17.822 posições; sincronizador corrigido | [Checkpoint do lote 3](../ops/roadmap-lote3-checkpoint.md) |
| 2026-11-07 | Lote 4 atinge 29 coleções e 18.873 posições, com duas sem imagem no lote | [Checkpoint do lote 4](../ops/roadmap-lote4-checkpoint.md) |
| 2026-11-07 | Tentativa de publicação do lote 4 recebe HTTP 402 por quota; último READY nessa altura tinha 27 | [Checkpoint do lote 4](../ops/roadmap-lote4-checkpoint.md) |
| 2026-11-08 | Consulta posterior confirma READY para o SHA da main com 29 coleções | [GitHub e Vercel](08-github-vercel/README.md) |
| 2026-11-08 | Main incorpora backend opcional Google Drive, mantendo origem Vercel por defeito | [Guia técnico](GOOGLE_DRIVE_STORAGE.md) |
| 2026-11-08 | Reorganização documental em dez categorias; README anterior preservado integralmente | [Checkpoint](01-gestao/CHECKPOINT.md) |

Manter a cronologia append-only: acontecimentos passados não devem ser apagados porque a situação evoluiu.


## Eventos posteriores ao snapshot original do PR #1 — histórico adicional (08/11/2026)

| Data | Marco | Referência |
|---|---|---|
| 2026-11-08 | Expansões posteriores completam 47 coleções / 26.774 posições; quatro categorias no portal | [Manifesto](../public/library.json) · [Checkpoint da auditoria](../ops/audit-2026-11-08.md) |
| 2026-11-08 | Etapa 4: GET para 24.747 URLs, 24.742 validadas; corrigida fotografia errada de Salis; cinco Topps sem hash | [Relatório imagens](../ops/audit-2026-11-08-step4-images.md) |
| 2026-11-08 | Etapa 5: API e proxy reforçados com Basic Auth, no-store e testes anónimos de 11 recursos | [Relatório segurança](../ops/audit-2026-11-08-step5-security.md) |
| 2026-11-08 | Etapa 6: migração Drive transformada em staging/validação/promoção/retoma; **sem migração real** | [Relatório Drive](../ops/audit-2026-11-08-step6-drive.md) |
| 2026-11-08 | Etapa 7: CI para PR, lock único de escritores e verificação de READY no SHA exato | [Relatório CI](../ops/audit-2026-11-08-step7-ci.md) |
| 2026-11-08 | Etapa 8: correções de foco e alvos táteis, 78/78 testes Chromium e WebKit Linux, sem Safari/iPhone físico | [Relatório UI](../ops/audit-2026-11-08-step8-ui.md) |
| 2026-11-08 | Etapa 9: documentação de PR #1 (29 coleções) adaptada aos 47 catálogos atuais; arquivo histórico intacto | [Relatório documentação](../ops/audit-2026-11-08-step9-docs.md) |

**Esta secção é cronológica, não uma lista de funcionalidades já publicadas.** A produção continua no SHA de `main`; as mudanças da auditoria aguardam revisão. As linhas anteriores à secção mantêm os eventos e a linguagem do PR #1 tal como foram escritos.
