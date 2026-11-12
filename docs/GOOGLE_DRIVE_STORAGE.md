# FUT — Armazenamento privado Google Drive

**Estado real em 08/11/2026:** implementação de preparação/validação/promoção/recovery existe **apenas na branch de auditoria**; **não foi feita migração de dados reais**, não há geração real confirmada como pronta e **`FUT_STORAGE_BACKEND=drive` não foi ativado**. A produção continua a usar os catálogos estáticos do Vercel. A migração não deve ser inferida da existência de pastas no Google Drive, de variáveis de ambiente ou de testes com mocks.

**Esta página é um procedimento para uma eventual operação futura autorizada. Não é autorização para a executar.** Consultar [etapa 6](../ops/audit-2026-11-08-step6-drive.md), [API](../api/storage.js) e [motor de migração](../lib/drive-migration.js).

## 1. Arquitetura e autenticação

| Modo | Dados | Imagens | Progresso |
|---|---|---|---|
| `vercel` (atual, predefinido) | JSON estáticos de `public/library.json`, `public/expansion-plan.json` e `public/data/*.json`; `/api/storage` responde com redirecionamento interno | URLs externos declarados nos catálogos | `localStorage`, por coleção, no dispositivo |
| `drive` (não ativado) | `api/storage.js` só lê uma geração privada indicada por `fut-active.json`, confirmando SHA dos manifestos/catálogos | `/api/storage?kind=image&id=...&card=...` e `kind=cover`, bytes da Drive API autenticada e validados por SHA; **sem fallback externo** | O mesmo `localStorage`, sem migração automática |

A autenticação HTTP Basic da aplicação é independente do acesso do servidor ao Drive; `proxy.js` e `api/storage.js` protegem os endpoints. O utilizador Basic é `fut` e o segredo reside **apenas** em `FUT_ALBUM_PASSWORD` no ambiente privado. **GitHub público mantém os dados de repositório publicamente consultáveis**, mesmo quando o portal Vercel exige palavra-passe.

O cliente Google Drive admite **um dos dois modos de autenticação**:

1. **OAuth 2.0 de utilizador proprietário**: `FUT_DRIVE_OAUTH_CLIENT_ID`, `FUT_DRIVE_OAUTH_CLIENT_SECRET` e `FUT_DRIVE_OAUTH_REFRESH_TOKEN`. Adequado a My Drive mediante consentimento do proprietário, dentro das permissões autorizadas.
2. **Conta de serviço em Shared Drive do Workspace**: `FUT_DRIVE_SERVICE_ACCOUNT_JSON` e `FUT_DRIVE_SHARED_DRIVE_ID`. O modo de conta de serviço **não serve** para assumir propriedade de uploads no My Drive pessoal; partilhar uma pasta pessoal como Editor não elimina esta limitação.

Ambos exigem `FUT_DRIVE_CATALOGS_FOLDER_ID` e `FUT_DRIVE_IMAGES_FOLDER_ID`. Não divulgar valores de IDs privados, tokens, chaves JSON ou refresh tokens nos logs ou commits. A ligação de ChatGPT ao Google Drive **não fornece automaticamente** credenciais de servidor ao Vercel. Não modificar regras de partilha nem segredos nesta auditoria.

## 2. Quatro fases separadas — **procedimento não executado**

### A. Planeamento sem rede (única operação autorizada nesta auditoria)

```bash
npm ci --ignore-scripts
npm run build
node scripts/migrate-drive.mjs --plan
```

`--plan` é o comportamento predefinido e só lê JSON locais. Para o inventário atual, regista **47 coleções, 26.774 posições e 2.074 posições sem imagem**, sem transferir ficheiros nem consultar OAuth/Drive.

### B. Preparação isolada (apenas com autorização futura)

```bash
node scripts/migrate-drive.mjs --prepare --generation fut-2026-11-08-a \
  --confirm-drive-write
```

Grava uma pasta privada `fut-stage-<geração>`, imagens da geração e checkpoints `fut-checkpoint-<slug>.json` **dentro do staging**, não sobre os catálogos ativos. Compara bytes/SHA antes e depois do upload. Capas sem hash inicial obtêm hash dos bytes reais; previews Topps sem hash também exigem origem acessível e bytes válidos. `--slug <slug>` prepara só uma coleção e **não autoriza promoção parcial**.

**Limites de segurança:** URLs HTTPS em hosts específicos, redirecionamentos validados por salto e uma única exceção pelo **URL exato da capa Premier League em Blogger** (não pelo domínio inteiro); MIME restrito e leitura de imagem até **6 MB**, JSON até **3 MB** e leitura Drive com máximo configurável **8 MB**. Erros de HTTP/bytes/hash não são mascarados.

### C. Validação integral, sem alterar publicação

```bash
node scripts/migrate-drive.mjs --validate --generation fut-2026-11-08-a
```

Relê **todos** os catálogos, o manifesto, o roteiro, as capas e **todos os ficheiros de imagem disponíveis** no staging. Confirma hashes, tamanhos, contagens e IDs. Só uma preparação completa e válida recebe `fut-ready.json`. Não é uma amostra nem substitui autorização para copiar obras de terceiros.

### D. Promoção explícita, isolada e reversível (não executar sem autorização)

```bash
node scripts/migrate-drive.mjs --promote --generation fut-2026-11-08-a \
  --expected-active none --confirm-drive-write
```

`--expected-active none` significa que não há geração ativa; numa atualização, deve indicar a **geração antiga exata**. O script revalida a geração completa, compara o apontador esperado, regista a operação e só então altera `fut-active.json`. **Nunca escreve checkpoints sobre catálogos de uma geração já promovida**.

**Condição importante:** a comparação do apontador **não é uma operação CAS atómica de Google Drive**; serializar promoções por um responsável e verificar que não existe outra migração em curso. A troca de um único apontador dá uma unidade lógica de publicação, mas não equivale a transação distribuída. O backend em produção **só pode ser ativado depois de autorização explícita, migração e validação reais, teste em ambiente apropriado e um deployment `READY` do SHA correto.**

## 3. Interrupção, retoma e recuperação

```bash
node scripts/migrate-drive.mjs --resume --generation fut-2026-11-08-a \
  --confirm-drive-write
```

A retoma reabre apenas um estágio **não selado**, compara o conteúdo e a origem do checkpoint e revalida cada `driveFileId` por bytes, MIME e SHA-256. Se o ficheiro desapareceu, ficou diferente ou a imagem de origem sem hash mudou, baixa de novo a origem e grava uma nova versão validada em staging; se a origem falhar, a preparação **falha**, sem inventar bytes. Capas também são revalidadas na origem na retoma. Uma geração ativa é imutável mesmo que o marcador `fut-ready.json` desapareça.

A retoma **não promove automaticamente**: quando um estágio ficou pronto devolve indicação `ready-for-promotion`; se a geração já estiver ativa, confirma `already-active`. Se a promoção falhar, conservar o apontador anterior e o diário. Uma geração antiga íntegra pode ser novamente promovida mediante operação explícita, depois de confirmar o `expected-active` atual. Na ausência de `fut-active.json` válido, o modo Drive falha fechado e `kind=status` devolve `ready:false`; não recua para JSON antigos ou imagens externas.

Não apagar as cópias estáticas nem checkpoints de gerações anteriores durante um incidente. Não remover ficheiros da pasta de uma geração ativa.

## 4. Barreiras atualmente pendentes

- **Cinco links oficiais Topps com HTTP 403** no runner, sem hash inicial verificado. A política de integridade impede preparar/selar como imagem válida uma geração real completa até ter bytes legítimos, autorizados e verificáveis; não inventar fotografia nem marcar imagem como validada.
- **2.074 posições sem URL** são legítimas e são preservadas; não exigem imagem artificial. Diferem das cinco ligações não verificadas.
- **Direitos de imagem e quotas:** HTTP público não confere licença de reprodução nem de alojamento no Drive. Verificar autorização dos titulares, quotas, disponibilidade e possíveis limites de upload antes de qualquer migração real.
- **Testes reais da Drive API e OAuth pendentes:** as suites `scripts/test-drive-migration.mjs`, `scripts/test-drive-store-safety.mjs` e `scripts/test-drive-storage.mjs` usam exclusivamente fixtures/credenciais sintéticas; não constituem validação de permissões do utilizador.
- **Ativação Vercel não executada:** nenhuma alteração de `FUT_STORAGE_BACKEND`, variáveis secretas ou deployment nesta auditoria. Não confundir a existência de configuração possível com operação ativa.

## 5. Testes e diagnóstico (sem credenciais reais)

```bash
node --test scripts/test-drive-migration.mjs scripts/test-drive-store-safety.mjs \
  scripts/test-drive-storage.mjs scripts/test-access-security.mjs
python3 scripts/verify_catalogs.py
python3 scripts/refresh_documentation.py --check
```

Em execução futura com autorização própria, comprovar `/api/storage?kind=status` autenticado e a leitura de manifesto, roteiro, catálogos, capas e imagens, sem fallback. Não imprimir respostas de autenticação, IDs internos, conteúdo de tokens nem credenciais. Diferenciar erro de configuração (503/`ready:false`), recurso inexistente (404) e leitura Drive inválida (502). Testar a aplicação no browser e verificar o SHA `READY` nos dois domínios como etapa distinta; testes de acesso anónimo não verificam utilização com credenciais reais.

## 6. Progresso pessoal e backup

Os mapas `revealed` e `favorites` permanecem no `localStorage` por coleção, na chave `fut.album.<id>.progress.v1`. Drive não sincroniza nem copia progresso de dispositivos. Para conservar progresso, abrir cada coleção, **Exportar** o JSON e guardá-lo em local seguro; para recuperar, utilizar **Importar** na mesma coleção e confirmar substituição. Não alterar IDs, números ou chaves de progresso durante migração.

[Arquitetura](06-arquitetura/README.md) · [Segurança](07-seguranca/README.md) · [Imagem e direitos](04-imagens/README.md) · [Recuperação operacional](08-github-vercel/README.md).
