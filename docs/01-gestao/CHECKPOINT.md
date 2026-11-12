# Checkpoint atual — FUT (08/11/2026)

**Este bloco é atual.** O checkpoint original do PR #1, com 29 coleções, é preservado **abaixo como histórico identificado**, não como estado vigente.

- **Dados do JSON:** **47 coleções**, **26.774 posições**, **1.508 secções**; **24.695 imagens de cromos com hash**, **5 links oficiais sem hash**, **2.074 posições sem URL**, **47 capas**. [Métricas recalculadas](../metrics-current.json).
- **Portal:** Portugal 12, Seleções 23, Champions League 5, Outros 7. [Inventário atual](../02-colecoes/README.md).
- **Roteiro:** 30 candidatas, 26 integradas, 4 bloqueadas, 0 outras pendentes, sem execução adicional autorizada.
- **Auditoria:** etapas **1–8 completas** em `audit/fut-2026-11-08`; a etapa 9 reconcilia a documentação e abre PR de auditoria. [Registo detalhado](../../ops/audit-2026-11-08.md).
- **`main`:** `d5fb60eec0801808ec2946385a14c8c9226df54d`, preservada. PR #1 ainda aberto com head `88276ade9db577e9f81df9252f5adf56f85a163a`, baseado no snapshot de 29 coleções; **não encerrar/mergir automaticamente**.
- **Produção:** Vercel `READY` no commit de `main`, deployment `dpl_6d5JncMTvFHF9XcuRc4wy957AaWA`, não inclui código de auditoria. **Drive não migrado/ativado**.
- **Evidências de teste:** 78/78 Playwright automatizado (WebKit Linux e Chromium), 60/60 testes Node e 31/31 Python da etapa 7; suite de segurança e Drive com mocks. Ver [auditorias](../09-auditorias/README.md).
- **Retoma:** reler checkpoint principal e este índice, validar estado real GitHub/Actions/Vercel, conservar IDs, catálogos e progresso, iniciar a etapa 10 apenas com pedido explícito. Sem importação/merge/deploy.

---

## Histórico — checkpoint original do PR #1 (snapshot de 29 coleções; NÃO atual)

[Origem integral do PR #1](https://github.com/newuser-hub/fut/blob/88276ade9db577e9f81df9252f5adf56f85a163a/docs/01-gestao/CHECKPOINT.md). O documento à data registava `main` `4fc739b7b425a62fbd3e80add57380405a86e607`, 29 coleções, 18.873 posições, 16.911 hashes, 5 previews sem hash, 1.957 posições sem imagem e roteiro 8/20 integradas. O par 77+58 era então o próximo; **ambas as coleções foram integradas posteriormente e não constituem próxima tarefa atual**.

O PR #1 continua independente. O seu README antigo foi preservado integralmente em [README-original-2026-11-08.md](README-original-2026-11-08.md); os [checkpoints de cada lote](../../ops/) não foram reescritos.
