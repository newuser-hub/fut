# FUT — Auditoria Drive: etapa 6/10

**Data:** 08/11/2026. **Repositório:** `newuser-hub/fut`. **Branch de trabalho:** `audit/fut-2026-11-08`. **Base de produção imutável:** `d5fb60eec0801808ec2946385a14c8c9226df54d`.

**Resultado:** problemas demonstrados no código antigo corrigidos **apenas na branch de auditoria**, com novas operações preparadas para uma migração futura, sem executar qualquer migração real ou ativar Drive. Testes com armazenamento em memória e credenciais sintéticas: [Actions #42498722431](https://github.com/newuser-hub/fut/actions/runs/42498722431) **SUCCESS**, **54/54 testes Node** e **12/12 testes Python**.

## 1. Achados e severidade

| Gravidade | Achado confirmado na implementação anterior | Medida implementada |
|---|---|---|
| **P1 — integridade dos dados** | `scripts/migrate-drive.mjs` aproveitava `driveFileId` do catálogo anterior sem reler bytes/hash no Drive, permitindo apontar a uma imagem removida, adulterada ou desatualizada. | Cada recuperação de checkpoint lê/verifica a imagem armazenada por SHA-256 e tamanho. Imagens com SHA-256 anterior devem corresponder ao hash esperado. Imagens e capas sem hash inicial são submetidas a GET na origem, criam hash comprovado e são novamente verificadas na origem antes da reutilização após retoma. Ficheiros inválidos são recuperados por novo download e upload no staging. |
| **P1 — promoção incompleta** | O script gravava o catálogo em utilização a cada 50 posições e publicava os JSON finais por coleção antes da verificação global. Uma interrupção podia expor dados parcialmente migrados se o backend Drive estivesse ligado. | Gerações separadas `fut-stage-<generation>` e checkpoints `fut-checkpoint-<slug>.json` somente em staging; catálogos ativos e `library.json` da raiz não são substituídos. O manifesto e plano são fechados e verificados antes de gravar `fut-ready.json`. |
| **P1 — leitura durante migração** | `api/storage.js` lia diretamente `library.json` e catálogos da raiz Drive, sem garantia de snapshot único e sem obrigatoriedade de hashes para imagens não auditadas. | API usa exclusivamente o apontador `fut-active.json` para a pasta de geração; verifica SHA do manifesto, do plano e de cada catálogo, contagens e IDs, e exige imagem com `driveFileId`, bytes e SHA válido. Sem apontador promovido, falha fechada: `status.ready=false` e os pedidos de dados retornam erro genérico. |
| **P2 — imagem sem hash inicial** | O código tolerava `sha256=null`: a imagem poderia ser publicada sem validação futura. | SHA é derivado de bytes obtidos por GET e gravado no catálogo da geração preparada, com `bytes` e `driveFileId`; `readImage` recusa SHA ausente/malformado e compara com os bytes lidos. Os cinco previews Topps com HTTP 403 **continuam pendentes para uma migração real**; não se inventou conteúdo. |
| **P2 — memória e disponibilização** | `readRawFile` e a descarga externa usavam `arrayBuffer()`, só verificando o tamanho depois de carregar tudo em memória; faltava limite durante o streaming. | Limites verificados pelo `Content-Length` e durante leitura por blocos: **3 MB** para JSON, **6 MB** para imagem, limite máximo explícito **8 MB** nas leituras Drive. MIME de imagem permitido verificado. Redirecionamentos da origem analisados em cada salto, limite de saltos e retries apenas para rede/HTTP transitórios. |
| **P2 — capa externa** | Capa `premier-league-flagship-2026-27` em `blogger.googleusercontent.com` fora da allowlist; a migração falharia. | Exceção por **URL completa exata**, `kind=cover` e `collection=premier-league-flagship-2026-27`. Outras imagens, outros caminhos e esse host em outras coleções continuam bloqueados. |
| **P3 — cache de credenciais** | Um token OAuth/conta de serviço era reutilizado por modo de autenticação, mesmo que credenciais de igual modo fossem substituídas em ambiente de testes. | Cache vinculado a hash da configuração de autenticação; alteração invalida o token antigo. Nunca registar a configuração nem os tokens. |

**Nenhuma substituição de imagem/URL foi feita nos 47 catálogos do repositório.** Salis Abdul Samed continua sem a fotografia errada; a correção da etapa 4 foi preservada.

## 2. Protocolo de migração consistente

O código da branch define quatro operações distintas, que **não foram executadas contra o Drive real**:

1. **`--prepare --generation <id> --confirm-drive-write`** — cria uma pasta isolada `fut-stage-<id>` em catálogos e pasta de imagens da mesma geração; descarrega as imagens, calcula o SHA, confirma o upload por leitura de volta e grava checkpoints por coleção. A opção `--slug <slug>` apenas prepara uma coleção; **não permite promover** isoladamente.
2. **`--validate --generation <id>`** — relê o manifesto, plano, todos os catálogos e todas as imagens/capas da geração; valida hashes, tamanhos e contagens. A verificação é integral, não uma amostra. Falhas deixam o apontador ativo inalterado.
3. **`--promote --generation <id> --expected-active none|<id-anterior> --confirm-drive-write`** — repete a validação integral, compara o snapshot ativo esperado, grava diário de promoção e **muda apenas `fut-active.json`** na raiz. Os catálogos da raiz anterior não são reescritos; a geração anterior permanece disponível para recuperação explícita.
4. **`--resume --generation <id> --confirm-drive-write`** — reabre apenas checkpoints da geração não selada, revalida IDs/hashes e recupera ficheiros removidos, ou devolve `ready-for-promotion` se já estiver selada. Se a promoção anterior tiver ocorrido, revalida e devolve `already-active`. **A retoma nunca promove automaticamente.**

O ficheiro `fut-ready.json` é o último objeto escrito na fase de preparação, após validação integral. Uma geração selada fica imutável pelas operações de preparação. O frontend e a API só resolvem a geração indicada pelo apontador ativo. O `--plan` (predefinição) é apenas leitura dos JSON locais e não chama o Drive.

**Limite explícito:** a atualização de um ficheiro apontador é uma unidade lógica de publicação, mas não substitui uma transação distribuída. A implementação compara a geração ativa esperada, porém não usa uma operação CAS do Google Drive; promoções concorrentes devem ser serializadas operacionalmente por um único responsável. Uma alteração inesperada do apontador provoca abortamento antes da escrita sempre que observada. Falhas posteriores podem ser recuperadas revalidando a geração ativa ou promovendo explicitamente uma geração anterior intacta.

## 3. Sem fallback externo em modo Drive

`api/storage.js` continua protegido por Basic Auth (etapa 5). Quando `FUT_STORAGE_BACKEND=drive` estiver futuramente ativo e corretamente configurado:

- `kind=library` — manifesta capas apenas via `/api/storage?kind=cover&id=...` quando têm `driveFileId` e SHA; sem imagem válida, não utiliza fonte externa.
- `kind=plan` — retorna o plano da pasta de geração cujo SHA coincide com o apontador.
- `kind=catalog` — confirma contagem/sha do catálogo e substitui os URLs de imagens apenas por `/api/storage?kind=image&...`; limpa `source`.
- `kind=image/cover` — bytes só são servidos após validação do SHA; ficheiro removido ou conteúdo diferente devolve erro genérico `502`, nunca tenta buscar a fotografia no site externo.
- Sem apontador ou geração incompleta — `status.ready=false` e endpoint de dados indisponível, sem leitura dos catálogos legados da raiz.

Em modo Vercel normal, permanece o comportamento da etapa 5 (redirecionamentos internos, Basic Auth, `no-store`), sem qualquer ativação da configuração Drive.

## 4. Validação reprodutível realizada

**Execução final da etapa:** [FUT — etapa 6, run 42498722431](https://github.com/newuser-hub/fut/actions/runs/42498722431), **COMPLETED/SUCCESS**.

- **54/54 testes Node PASS:** `scripts/test-drive-migration.mjs`, `scripts/test-drive-store-safety.mjs`, `scripts/test-drive-storage.mjs`, `scripts/test-access-security.mjs` e `scripts/test-frontend-progress.mjs`. Incluem credenciais OAuth artificiais, conta de serviço com chave RSA efémera assinada e verificada em mock; sem pedidos reais a OAuth ou ao Drive.
- Testes específicos de preparação, validação e promoção com 2 coleções sintéticas, 4 posições e 2 capas: apontador só surge após validação; dados antigos da raiz preservados; promoção repetida é idempotente.
- Testes de interrupção/retoma, checkpoint parcial, ficheiro Drive removido, ficheiro com SHA diferente, fonte de imagem sem hash inicial alterada entre corridas, capa alterada, SHA original incorreto, catálogo incompleto, opção `--slug` parcial e alteração dos dados locais invalidando o checkpoint.
- Testes de URL Blogger: o URL exato é aceite para a capa correta; outras coleções, imagens da mesma origem, paths/query diferentes e HTTP/hosts não autorizados são recusados.
- Testes de leitura limitada e de MIME/SHA: `Content-Length` excessivo bloqueado antes de ler, payload excessivo interrompido durante streaming e imagem sem hash não servida.
- **12/12 testes Python PASS** das etapas anteriores; `npm run build`, verificadores de catálogos, expansão, lotes, imagens e frontend **PASS**.
- `node scripts/migrate-drive.mjs --plan` executado **sem rede**, declarou **47 coleções, 26.774 posições e 2.074 posições sem imagem**.
- CI fixou as variáveis de Drive em vazio e `FUT_STORAGE_BACKEND` em vazio. Não houve importação, cópia, GET de imagem real nem escrita remota nos testes; toda a lógica Drive foi exercitada num armazenamento em memória.

**Verificação adicional de regressões:** o workflow da etapa 5 foi ajustado para deixar de classificar o trabalho Drive explicitamente autorizado da etapa 6 como uma alteração proibida. A sua suite de autenticação continua obrigatória e foi novamente verificada, sem afrouxar as garantias de proteção dos catálogos.

## 5. Pontos pendentes e condições futuras

- **Drive real não testado nem migrado:** requer contas/permissões adequadas, operação fora desta auditoria, autorização expressa, confirmação de direitos sobre imagens e capacidade/quotas. O novo CLI é uma implementação preparada, **não uma garantia de operação real**.
- **Não ativar `FUT_STORAGE_BACKEND=drive`** antes de gerar e validar uma geração real completa e de autorizar separadamente a promoção e o deploy. A opção de ativação não está implementada no CLI de migração.
- Os cinco previews oficiais Topps devolvem 403 no ambiente anteriormente testado; com hash inicialmente ausente, a preparação integral não poderá ser selada sem recuperar os bytes legítimos. **Não converter 403 em imagem errada ou disponível.**
- Foi também testado o caso em que o marcador `fut-ready.json` é apagado depois da promoção: a geração ativa continua imutável e nenhuma re-preparação a pode sobrescrever. Os 2.074 cromos sem URL permanecem sem imagem. O staging não inventa fotografias ou `driveFileId`, mas preserva essas posições e os respetivos IDs.
- Em produção continua ativo `main=d5fb60eec0801808ec2946385a14c8c9226df54d`, proteção por palavra-passe e configurações anteriores. O código novo está só na branch de auditoria. **Sem merge, sem deploy, sem alteração de credenciais, permissões, visibilidade do GitHub, IDs ou progresso.**
- Para retoma da auditoria, consultar primeiro `ops/audit-2026-11-08.md` e este relatório, revalidar `main`, PRs, Actions e Vercel; só depois iniciar a etapa seguinte se autorizada.

**Conclusão:** etapa **6/10 CONCLUÍDA ao nível de código, testes e documentação**, com migração real expressamente **NÃO EXECUTADA**. Etapa **7/10 NÃO INICIADA**.
