# FUT — Armazenamento Google Drive (migração segura)

## Estado e objetivo

O FUT foi originalmente publicado com **catálogos JSON estáticos no Vercel**
(\`/library.json\` e \`/data/<coleção>.json\`), imagens referenciadas por URLs
externos e progresso individual guardado no \`localStorage\` do navegador.

A pasta privada **FUT — Coleções** no Google Drive foi criada para alojar o
arquivo. A pasta de Ídolos 2026/27 já existente é um arquivo separado:
não equivale a ter todas as coleções do FUT no Drive.

Os novos endpoints \`/api/storage\` permitem alternar entre duas origens:
- **vercel** (por defeito): encaminha para os JSONs existentes, sem alterar o
  comportamento, a autenticação ou o progresso das cadernetas.
- **drive** (só depois da migração completa): lê catálogos, índice, roteiro,
  capas e imagens individuais diretamente do **Drive privado**, através do
  servidor Vercel e de uma conta de serviço Google. O navegador nunca recebe
  tokens, chaves nem IDs de ficheiros internos.

Se o modo Drive for ativado sem credenciais ou faltar uma imagem que deveria
existir no Drive, o serviço **falha de forma explícita**; não passa silenciosamente
a usar URLs externos ou cópias estáticas.

## Pastas privadas criadas

| Pasta | ID Google Drive |
|---|---|
| FUT — Coleções | \`1j9SVNmg8KMtCEsxM4-3MjWKvkF75IlgC\` |
| catalogos | \`1YSBTawUnSfk76QM2fxJ6I7O2MYr3nf-f\` |
| imagens | \`17qFZjaYOf_ALoQSIA9mI3zjc5_ZmxZg3\` |
| manifestos | \`1sLahZsrqoDDi7otKMbq9_uKo_RELR_Bu\` |
| auditorias | \`10Mi4EEckBY1V4jpK-pOhIPisQy2Meni7\` |

**Não tornar as pastas públicas.** O site mantém a proteção HTTP Basic;
o acesso à Drive API é exclusivo do servidor.

## Autenticação obrigatória para concluir

A ligação da conta Google Drive à conversa ChatGPT **não disponibiliza tokens
permanentes ao site Vercel**. Para a migração e leitura do Drive em produção:

1. Criar numa conta Google Cloud uma **conta de serviço** (com Google Drive API
   ativada); obter o JSON de credenciais e o respetivo \`client_email\`.
2. Partilhar **catalogos** e **imagens** com o \`client_email\` como **Editor**.
3. Guardar o JSON na variável Vercel \`FUT_DRIVE_SERVICE_ACCOUNT_JSON\`,
   tipo **Sensitive**, para Production (e ambientes de teste necessários).
   Nunca introduzir o ficheiro no GitHub, no código ou em logs.
4. Configurar no Vercel:
   \`\`\`text
   FUT_DRIVE_CATALOGS_FOLDER_ID=1YSBTawUnSfk76QM2fxJ6I7O2MYr3nf-f
   FUT_DRIVE_IMAGES_FOLDER_ID=17qFZjaYOf_ALoQSIA9mI3zjc5_ZmxZg3
   FUT_STORAGE_BACKEND=vercel
   \`\`\`
5. No ambiente de migração privado, configurar as mesmas credenciais,
   reconstruir todos os catálogos e executar:
   \`\`\`bash
   npm run build
   node scripts/migrate-drive.mjs --images
   \`\`\`
   O script copia **apenas** imagens disponíveis na origem, exige SHA-256
   quando há hash registado, conserva os IDs dos cromos e permite retoma de
   coleções já copiadas. Guarda catálogos por coleção e publica \`library.json\`
   **só depois** de toda a migração concluir.

   Para arquivar apenas os JSONs, sem ativar a leitura:
   \`\`\`bash
   node scripts/migrate-drive.mjs
   \`\`\`

6. Validar a existência no Drive dos catálogos de **todas as coleções ativas**,
   \`library.json\`, \`expansion-plan.json\`, capas e todas as imagens disponíveis.
   Só depois configurar \`FUT_STORAGE_BACKEND=drive\` no Vercel e publicar.
7. Testar com autenticação no endereço de produção: \`/api/storage?kind=status\`
   deverá mostrar \`{"backend":"drive","ready":true,"imageBackend":"drive"}\`.
   Todas as leituras e imagens deverão passar por \`/api/storage\`.

Para lotes futuros: executar novamente a migração de forma idempotente **antes**
de publicar o manifesto atualizado no Drive. Não ativar o backend privado se
algum catálogo estiver por migrar.

## Integridade, disponibilidade e progressos

- Cada cromo conserva o mesmo \`id\`, \`number\`, \`section\` e os restantes
  metadados. Os ficheiros de imagem recebem apenas um novo
  \`driveFileId\` no catálogo **do Drive**.
- A imagem apresentada passa a ser servida por
  \`/api/storage?kind=image&id=<coleção>&card=<id>\`,
  mantendo a autorização do portal; não são emitidas ligações públicas ao Drive.
- A migração pode exigir tempo e quota significativos para milhares de imagens.
  As imagens sem autorização de utilização devem ser excluídas; a acessibilidade
  HTTP por si só não constitui uma licença de reprodução.
- O **progresso do utilizador** (\`revealed\`, \`favorites\`) permanece no
  \`localStorage\` do mesmo navegador, por coleção. Mover os catálogos para o
  Drive **não sincroniza automaticamente** o progresso entre dispositivos.
  Uma futura sincronização individual exigiria identidade e controlo de acesso
  separados.
- As cópias estáticas atuais só devem ser removidas após migração integral,
  validação de equivalência e aprovação explícita.

## Testes técnicos

\`\`\`bash
node --test scripts/test-drive-storage.mjs
python3 scripts/verify_catalogs.py
\`\`\`

O teste verifica que a origem antiga continua a funcionar enquanto o Drive
não é ativado, e que o modo Drive sem credenciais falha fechado.
O teste real de leitura do Drive exige uma conta de serviço configurada.
