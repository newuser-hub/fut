# Registo de decisões e políticas

| Ref. | Data | Decisão | Fonte | Situação |
|---|---|---|---|---|
| D-01 | 2026-11-07 | Progresso independente por coleção no navegador, com exportação/importação JSON | [Frontend](../../src/index.html) | Implementado |
| D-02 | 2026-11-07 | Autenticação HTTP Basic; segredo apenas em variável Vercel | [Proxy](../../proxy.js) | Implementado |
| D-03 | 2026-11-07 | Preservar posições legítimas sem fotografia; nunca inventar imagens | [Validador](../../scripts/verify_catalogs.py) | Política |
| D-04 | 2026-11-07 | Substituir FIFA 365 2027 por Mundial Adrenalyn XL 2026 na expansão, após bloqueio por falta de imagens | [Lote 2](../../ops/roadmap-lote2-checkpoint.md) | Histórico concluído |
| D-05 | 2026-11-07 | Sincronizar o plano na mesma transação de importação antes de validar | [Script](../../scripts/sync_expansion_plan.py) | Implementado |
| D-06 | 2026-11-07 | Integrar FIFA 365 2026 e Liga Portugal 2023/24 | [Lote 4](../../ops/roadmap-lote4-checkpoint.md) | Concluído |
| D-07 | 2026-11-08 | Separar histórico de bloqueios Vercel do READY posteriormente confirmado | [Publicação](../08-github-vercel/README.md) | Documentado |
| D-08 | 2026-11-08 | Reorganizar documentação numa branch distinta; preservar README integral | [Checkpoint](CHECKPOINT.md) | Proposta de PR |

| D-09 | 2026-11-08 | Preparar backend privado Google Drive opcional, sem o ativar | [Guia técnico](../GOOGLE_DRIVE_STORAGE.md) | Preparado, migração pendente |

Anotar decisões novas com data, fonte, motivos e estado; **não apagar nem reescrever o histórico**. O plano operativo mantém-se em [`public/expansion-plan.json`](../../public/expansion-plan.json).

| D-10 | 2026-11-08 | Remover a ligação de imagem incorreta de Salis sem alterar o cromo; preservar 8 pares legítimos | [Auditoria imagens](../../ops/audit-2026-11-08-step4-images.md) | **Resolvido em branch** |
| D-11 | 2026-11-08 | Tratar 5 previews Topps como URLs sem hash (HTTP 403 no runner), não como imagens comprovadas nem posições sem URL | [Cobertura](../04-imagens/README.md) | **Limitação aceite, revalidação pendente** |
| D-12 | 2026-11-08 | Exigir Basic Auth independente na API, 401 sem credenciais e falha fechada sem password | [Etapa 5](../../ops/audit-2026-11-08-step5-security.md) | **Resolvido em branch** |
| D-13 | 2026-11-08 | Drive apenas por geração preparada, validada e promovida com apontador; nunca reutilizar driveFileId sem validação | [Etapa 6](../../ops/audit-2026-11-08-step6-drive.md) | **Preparado com mocks; real pendente** |
| D-14 | 2026-11-08 | CI `FUT / validate` em PRs; serializar escritores por lock Git para não perder pedidos | [Etapa 7](../../ops/audit-2026-11-08-step7-ci.md) | **Implementado em branch** |
| D-15 | 2026-11-08 | Corrigir gestão de foco do modal, alvos de 44 px e reduced-motion sem alterar visual e IDs | [Etapa 8](../../ops/audit-2026-11-08-step8-ui.md) | **78/78 regressões automatizadas** |
| D-16 | 2026-11-08 | Reutilizar dez categorias do PR #1, preservar o README original/metadata histórico e gerar métricas só dos JSON | [Etapa 9](../../ops/audit-2026-11-08-step9-docs.md) | **Consolidado em auditoria, sem merge** |

**Interpretação:** a tabela D-01 a D-09 descreve decisões anteriores e deve ser lida como histórico quando refere estados ou propostas entretanto ultrapassados. As decisões D-10+ refletem alterações da branch de auditoria **ainda não publicadas**.
