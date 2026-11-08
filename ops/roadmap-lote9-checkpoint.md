# FUT — Checkpoint do lote 9 (8 de novembro de 2026)

## Integração concluída

- No início: **37 coleções, 22.612 posições**; no fim: **39 coleções, 23.480 posições** (+868).
- **Liga Portugal 2020/21 Panini**, origem Cromos.pt ID 60: 445 cartas (418 principais e 27 extras), **445/445 imagens**, 19 secções.
- **Liga Portugal 2019/20 Panini**, origem ID 61: 423 cartas (397 principais e 26 extras), **423/423 imagens**, 22 secções.
- **868 imagens** com GET HTTP, MIME, dimensão, SHA-256 e **868 hashes únicos**; zero nomes/secções vazios, zero números/IDs repetidos ou imagens em falta.
- [GitHub Actions 42478834337](https://github.com/newuser-hub/fut/actions/runs/42478834337) finalizou com **SUCCESS**. O [commit 7f2df3ee](https://github.com/newuser-hub/fut/commit/7f2df3ee30c06ce16b448b131b9391ecff85d426) adicionou apenas os dois ficheiros JSON e atualizou `public/library.json` e `public/expansion-plan.json` na mesma transação.
- Todas as 37 coleções anteriores, o respetivo progresso por chave de caderneta, OAuth, proteção por palavra-passe, o motor de navegação, pesquisa e a categoria Champions League foram preservados.
- Roteiro atual: **30 candidatas, 18 integradas, quatro bloqueadas e oito ainda pendentes**. Novos lotes planeados: 10–13, com autorização separada.
- A nova fase contém dez candidatos; FIFA 365 2023 (ID 322) não foi incluída por falta absoluta de imagens na origem.

## Publicação e verificações

- O Vercel indicou **READY** para o SHA de integração `7f2df3ee30c06ce16b448b131b9391ecff85d426`, ambiente `production`. Rever o HEAD após qualquer atualização adicional; não atribuir a produção a um commit diferente sem confirmação.
- A workflow de testes do roteiro foi adaptada para 30 candidatas, quatro categorias e crescimento progressivo; uma verificação só admite um lote por integrar quando ambas as candidatas se encontram pendentes, e rejeita integração parcial.
- Acrescentar os novos catálogos à verificação HTTP 401 anónima nos dois domínios de produção e confirmar os testes após o último commit.

## Próximo trabalho autorizado apenas por novo pedido

- Lote 10: **Euro 2008 Áustria/Suíça** (Cromos.pt ID 20) e **Taça das Confederações Brasil 2013** (ID 28), pré-verificadas mas ainda sem auditoria HTTP integral.
- Depois: lote 11 Liga Portugal 2018/19 (ID 62) + 2017/18 (ID 63); lote 12 Mundial Itália 1990 (ID 11) + Euro Suécia 1992 (ID 12); lote 13 Liga Portugal 2016/17 (ID 64) + 2014/15 (ID 55).
- Revalidar main, Actions e Vercel antes de cada lote. Preservar IDs, progresso local e autenticação. Não inventar fotografias, não prosseguir para os lotes seguintes sem autorização.
