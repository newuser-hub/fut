# FUT — Migração privada para Google Drive

## Estado atual (8 de novembro de 2026)

**Ainda não está ativo.** O FUT continua a ler os catálogos JSON estáticos do Vercel e as fotografias das origens externas. O progresso e os favoritos permanecem no `localStorage` do navegador, por coleção. O backend privado Google Drive já está integrado em `/api/storage`, mas só será ativado após autenticação e migração integral.

- `FUT_STORAGE_BACKEND` ausente ou `vercel`: o novo endpoint usa os ficheiros estáticos que já existiam.
- `FUT_STORAGE_BACKEND=drive`: catálogos, manifesto, roteiro, capas e imagens são servidos pelo Vercel, após leitura autenticada do Drive, sem expor o token, os IDs Drive ou os URLs externos ao visitante.
- Sem credenciais ou com conteúdo incompleto: o modo Drive falha explicitamente; **não** faz uma substituição silenciosa pelos URLs de origem.

## Arquivo privado criado no Google Drive

| Pasta | ID |
|---|---|
| FUT — Coleções | `1j9SVNmg8KMtCEsxM4-3MjWKvkF75IlgC` |
| catalogos | `1YSBTawUnSfk76QM2fxJ6I7O2MYr3nf-f` |
| imagens | `17qFZjaYOf_ALoQSIA9mI3zjc5_ZmxZg3` |
| manifestos | `1sLahZsrqoDDi7otKMbq9_uKo_RELR_Bu` |
| auditorias | `10Mi4EEckBY1V4jpK-pOhIPisQy2Meni7` |

Estas pastas estão no **Meu disco / My Drive pessoal**, não numa unidade partilhada do Google Workspace. Contêm atualmente os relatórios de auditoria e uma cópia privada do ZIP original de Ídolos 2026/27. **Ainda não contêm todos os JSONs nem as fotografias das 29 coleções.** Não tornar as pastas públicas.

## Autenticação da Google Drive API (obrigatória)

A ligação Drive existente no ChatGPT **não fornece credenciais reutilizáveis a aplicações externas**. São necessárias credenciais próprias de uma aplicação Google Cloud (com Drive API ativada). Existem duas opções:

### Opção A — Meu disco pessoal (situação atual; recomendada)

Utilizar **OAuth 2.0 com consentimento do proprietário do Drive** e scope `https://www.googleapis.com/auth/drive`. Obter legitimamente um **refresh token** com consentimento explícito do utilizador, por meio do fluxo OAuth da aplicação Google Cloud.

Guardar diretamente nas variáveis **Sensitive** do projeto Vercel, nunca na conversa, no GitHub ou nos logs:

```text
FUT_DRIVE_OAUTH_CLIENT_ID=<ID do cliente OAuth>
FUT_DRIVE_OAUTH_CLIENT_SECRET=<segredo do cliente OAuth>
FUT_DRIVE_OAUTH_REFRESH_TOKEN=<refresh token autorizado>
```

O Vercel usa o refresh token exclusivamente no servidor para pedir access tokens de curta duração e aceder às pastas privadas com os direitos do proprietário. Deve manter-se o consentimento e gerir a validade/rotação/revogação das credenciais.

### Opção B — Google Workspace Shared Drive

Para uma unidade verdadeiramente **partilhada** (não uma pasta partilhada dentro do Meu disco), pode usar-se uma **conta de serviço** com permissões adequadas na unidade. Configurar o JSON na variável **Sensitive** `FUT_DRIVE_SERVICE_ACCOUNT_JSON` e a identificação da unidade em `FUT_DRIVE_SHARED_DRIVE_ID`. Criar ou mover primeiro o arquivo para uma Shared Drive e atualizar os IDs de pastas correspondentes.

**Atenção:** uma conta de serviço tem quota zero e **não pode ser proprietária de ficheiros no My Drive pessoal**. Partilhar as pastas atuais apenas como Editor **não é suficiente** para fazer uploads. A Google indica expressamente que devem ser utilizadas Shared Drives ou OAuth 2.0 em nome de um utilizador humano:
https://developers.google.com/workspace/drive/api/guides/handle-errors#storageQuotaExceeded

## Identificadores do projeto Vercel

Já foram configuradas (não são segredos):

```text
FUT_DRIVE_CATALOGS_FOLDER_ID=1YSBTawUnSfk76QM2fxJ6I7O2MYr3nf-f
FUT_DRIVE_IMAGES_FOLDER_ID=17qFZjaYOf_ALoQSIA9mI3zjc5_ZmxZg3
```

**Não configurar `FUT_STORAGE_BACKEND=drive` ainda.** O sítio continua disponível com `FUT_STORAGE_BACKEND=vercel` implícito.

## Procedimento de migração depois de configurar OAuth / Shared Drive

1. Em ambiente de execução seguro com acesso às credenciais, recuperar o repositório `newuser-hub/fut`, reconstruir os ficheiros e validar:

   ```bash
   npm run build
   python3 scripts/verify_catalogs.py
   node --test scripts/test-drive-storage.mjs
   ```

2. Configurar as variáveis de autenticação no ambiente privado, e executar `node scripts/migrate-drive.mjs --images`. Este programa copia os ficheiros individuais e só publica `library.json` depois da migração completa, preservando IDs, números e secções. Existe `--slug <slug>` para retoma por coleção.

3. Antes de ativar, confirmar as imagens de **todas** as coleções no Drive, comparar contagens, MIME, tamanhos e SHA-256, testar a leitura privada da Drive API e confirmar a ausência de imagens em falta. **Há cinco URLs de pré-visualização Topps anteriormente não verificáveis por HTTP; precisam de resolução editorial antes da migração completa.** Nunca inventar imagens nem assinalar como verificadas aquelas que falharam.

4. Ativar a variável Vercel `FUT_STORAGE_BACKEND=drive` somente após sucesso da verificação integral; publicar e testar `/api/storage?kind=status`. Deve devolver `{"backend":"drive","ready":true,"imageBackend":"drive"}` com autenticação HTTP Basic.

5. Testar cada uma das coleções, cromos ampliados, navegação, favoritos e progressos existentes. Conservar as cópias originais durante a transição, e verificar que os novos cartões usam exclusivamente a rota autenticada `/api/storage?kind=image`.

6. Para cada lote FUT futuro, migrar as novas imagens e catálogos para o Drive **antes** de atualizar o manifesto no Drive, evitando coleções incompletas.

## Progresso e direitos

A migração de catálogos/imagens para o Drive **não transfere o progresso pessoal**. `revealed` e `favorites` são dados de `localStorage` e continuam associados ao navegador e à coleção; sincronizar entre iPhone/computador exigirá autenticação de utilizador e proteção de dados adicional.

As imagens pertencem aos respetivos titulares e podem ter restrições de reprodução. Disponibilidade pública por HTTP não equivale a licença para replicar; confirmar os direitos aplicáveis antes de copiar imagens de terceiros.
