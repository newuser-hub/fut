# FUT — Arquivo de Cadernetas Digitais

Portal privado de cadernetas digitais de futebol. No snapshot de 8 de novembro de 2026: **29 coleções ativas e 18.873 posições**.

**[Índice central da documentação por 10 categorias](docs/README.md)**

Consultas rápidas: [coleções](docs/02-colecoes/README.md) · [imagens](docs/04-imagens/README.md) · [checkpoint](docs/01-gestao/CHECKPOINT.md) · [backlog](docs/10-backlog/README.md) · [publicação](docs/08-github-vercel/README.md).

Os dados oficiais continuam em [`public/library.json`](public/library.json), [`public/data/`](public/data/) e [`public/expansion-plan.json`](public/expansion-plan.json).

O progresso de cada coleção é guardado no navegador (`localStorage`), com importação/exportação JSON, **sem sincronização entre dispositivos**. O portal está protegido por autenticação HTTP Basic, com segredo armazenado apenas no Vercel.

**Produção:** a consulta direta ao Vercel confirmou READY para o commit `4fc739b7b425a62fbd3e80add57380405a86e607` (29 coleções). Antes de futuras alterações, verificar novamente o deployment atual e os testes de acesso anónimo.

**Backend futuro:** a [migração privada Google Drive](docs/GOOGLE_DRIVE_STORAGE.md) está preparada mas não foi ativada por esta reorganização; a origem Vercel continua predefinida.

**Histórico preservado:** o [README anterior completo](docs/01-gestao/README-original-2026-11-08.md) foi arquivado integralmente, e os [checkpoints operacionais](ops/) continuam no local original. As notas de quota ou publicação pendente nesses documentos descrevem o momento da execução e não prevalecem sobre uma verificação de deployment posterior.

Esta reorganização é **apenas documental**. Não modifica catálogos, IDs, código de execução, progressos dos utilizadores, autenticação ou produção.
