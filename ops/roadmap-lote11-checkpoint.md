# FUT — Checkpoint do lote 11 (8 de novembro de 2026)

## Autorização e base revalidada

- Autorização exclusiva para o lote 11 (Cromos.pt **62 e 63**) no commit [c4fbbd4](https://github.com/newuser-hub/fut/commit/c4fbbd4ba23609ef958e5d6c99c75cd9352edfa2), a partir de `f9f45ff3b5ed976555be4a20459c53e428071797` (lote 10 completo).
- Base de 41 coleções ativas e 24.297 cromos, no Vercel `READY` antes da execução. Os workflows de integridade e proteção do lote 10 estavam concluídos com `SUCCESS`.
- `requests/roadmap-batch.json`: `roadmap-11`, `authorizedSourceIds=[62,63]`, com exatamente duas coleções e controlo de concorrência da fila existente.

## Auditoria e integração

- [GitHub Actions 42481547388](https://github.com/newuser-hub/fut/actions/runs/42481547388) terminou com **SUCCESS**: importação transacional, auditoria GET/MIME/bytes/SHA-256, sincronização do roteiro, validação de todos os catálogos e teste de frontend.
- [Commit de integração dc8b1011](https://github.com/newuser-hub/fut/commit/dc8b1011d51fa222743f76bdabfa96b7cc5dffb8), que acrescentou `public/data/liga-portugal-2018-19.json` e `public/data/liga-portugal-2017-18.json` e atualizou `public/library.json` e `public/expansion-plan.json`.
- **Liga Portugal 2018/19 Panini** (origem 62): **432** posições, **422 principais e 10 extras**, 23 secções, **432/432 imagens** com SHA-256, nenhuma ausente.
- **Liga Portugal 2017/18 Panini** (origem 63): **398** posições, **395 principais e 3 extras**, 22 secções, **397/398 imagens** com SHA-256. **395/395 imagens principais presentes**.
- Única imagem ausente: cromo extra **Lucas Cavalcante**, **126bis**, secção **Estoril**, source sticker ID **27812**, ID imutável `liga-portugal-2017-18-27812`. A origem não fornece `img_path` para esta posição, pelo que o registo permanece com `available=false`, `image=null`, `sha256=null`. A ausência de apenas um extra, com cobertura total dos principais, não justificou trocar a fonte nem fabricar imagem.
- Conjunto auditado: **830 posições**, **829 imagens**, **829 SHA-256 distintos** entre as duas coleções. Zero IDs, números de navegação, nomes ou secções inválidos/duplicados em qualquer dos catálogos.
- Integridade histórica: comparados os manifests em `f9f45ff3` e `dc8b1011`; as primeiras **41 entradas são idênticas**. O diff adiciona apenas os dois JSON, atualiza manifesto, roteiro e pedido; não modifica outros catálogos nem código de OAuth, palavra-passe, progresso local ou grupos Champions League.
- Resultado: **43 coleções, 25.127 cromos**; de 30 candidatas do roteiro, **22 integradas, 4 bloqueadas, 4 pendentes**.

## Publicação, segurança e testes

- A integração `dc8b1011d51fa222743f76bdabfa96b7cc5dffb8` foi verificada `READY` no Vercel `production`, deployment `dpl_9en2jNr8abMJH6HgvNYXybpNbY5C`.
- Os testes automáticos de segurança passam a incluir `/data/liga-portugal-2018-19.json` e `/data/liga-portugal-2017-18.json` nos domínios `fut-rosy.vercel.app` e `fut-pjr-s-projects.vercel.app`. Exigem HTTP **401** exato sem credenciais para páginas, índices, roteiro e JSON das coleções.
- Após o commit de documentação, verificar resultados de ambas as workflows (roteiro/frontend e HTTP 401) e `production READY` para o SHA final. Não confundir o SHA de integração com o de documentação.

## Estado e próximos passos

- **Lote 11 concluído**, com a única limitação editorial documentada no extra 126bis de 2017/18.
- **Lote 12 não autorizado**: Mundial Itália 1990 (ID 11) e Euro Suécia 1992 (ID 12); nenhuma importação ou modificação dessas candidatas nesta execução. Revalidar base, cobertura de imagens e autorização antes de qualquer trabalho futuro.
