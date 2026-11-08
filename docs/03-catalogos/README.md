# 03 — Catálogos e bases de dados

## Estrutura e origem

- [Manifesto](../../public/library.json): ID, título, época, estado, posições e secções.
- [Catálogos JSON](../../public/data/): cartões, secções, origem, número e número impresso original, imagens, hashes e auditoria.
- [Arquivo legado](../../archives/): blocos comprimidos para reconstrução, não catálogos duplicados ativos.
- [Roteiro](../../public/expansion-plan.json): candidatos, IDs externos, auditorias, substituições e histórico de execuções.

Os [validadores](../../scripts/verify_catalogs.py) exigem totais coerentes com o manifesto, IDs e números de navegação únicos, secções válidas e metadados de imagem consistentes. Quando um número impresso se repete, o importador preserva `originalNumber` e desambigua `number` usando o ID da origem.

A leitura efetuada em 2026-11-08 confirmou **zero IDs ou números de navegação duplicados dentro das 29 coleções**. Não se executou uma comparação semântica transversal entre todos os cromos.

**Evolução futura:** a [especificação de armazenamento privado Google Drive](../GOOGLE_DRIVE_STORAGE.md) prepara uma origem alternativa, dependente de migração integral e aprovação.

[Validar roteiro](../../scripts/verify_expansion_plan.py) · [Sincronizar roteiro](../../scripts/sync_expansion_plan.py). A fonte da verdade permanece nos ficheiros operacionais.
