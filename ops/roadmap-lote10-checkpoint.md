# FUT — Checkpoint do lote 10 (8 de novembro de 2026)

## Autorização, auditoria e integração

- Base: 39 coleções ativas e 23.480 cromos, commit `239750ca2cb905275ac7e69b28e1ad357f3dfaad`. Pedido `roadmap-10`, autorização das origens Cromos.pt **20 e 28**, commit `55dbf1e4460bdfeaed9a7047de305b2dc63b390a`.
- GitHub Actions [42481102972](https://github.com/newuser-hub/fut/actions/runs/42481102972): **SUCCESS**, sem erros na ingestão, sincronização, validação integral dos catálogos e frontend.
- Commit transacional [c2b6c008](https://github.com/newuser-hub/fut/commit/c2b6c008dac7fba437cfabfa5c361454c916f430): adiciona `public/data/euro-2008.json` e `public/data/confederations-2013.json`, atualiza `public/library.json` e `public/expansion-plan.json`.
- **Euro 2008 Áustria/Suíça**, ID 20: 568/568 principais, 568/568 imagens verificadas, 20 secções, zero extras e zero falhas.
- **Taça das Confederações Brasil 2013**, ID 28: 249/249 principais, 249/249 imagens verificadas, 11 secções, zero extras e zero falhas.
- **817/817 imagens**: GET HTTP 200 e MIME `image/*` na origem, tamanho superior ao mínimo e SHA-256 registados. Todos os **817 hashes são distintos**, inclusive entre as duas coleções. IDs, números de navegação, nomes e secções aprovados. Não foi necessário substituir fontes.
- Total final: **41 coleções, 24.297 cromos**. Roteiro de 30 candidatas: **20 integradas, 4 bloqueadas, 6 pendentes**. Nenhum dos 39 catálogos existentes foi substituído; OAuth, password, progresso por caderneta e categoria Champions League mantidos.

## Produção e segurança

- O deploy do commit de integração `c2b6c008dac7fba437cfabfa5c361454c916f430` foi confirmado `READY` em `production` no projeto Vercel `fut`, deployment `dpl_5TWfBafbXUZPgfmxtP8xo3LGYmcJ`.
- A workflow de verificação pública passa a incluir as duas rotas novas `/data/euro-2008.json` e `/data/confederations-2013.json` nos dois domínios de produção e a exigir **HTTP 401** exato, sem credenciais, para a página inicial e os dados. A execução da verificação e o `READY` do SHA de documentação são confirmados separadamente após este commit.

## Próxima autorização

- **Lote 11**, exclusivo: **Liga Portugal 2018/19** (Cromos.pt 62) e **Liga Portugal 2017/18** (63). Antes de qualquer escrita, revalidar `main`, GitHub Actions, Vercel e roteiro; exigir auditoria integral por imagem, sem fotografias inventadas. Preservar os quatro bloqueios históricos, IDs e todos os 41 catálogos.
