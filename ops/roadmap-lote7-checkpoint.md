# FUT — Checkpoint lote operacional 7 (8 de novembro de 2026)

## Âmbito autorizado e estado inicial
- GitHub: `newuser-hub/fut`, branch `main`; Vercel `fut`, projeto `prj_AgqL0LPT5Zyan4XFmtmwiOrch1sH`.
- Autorização: Euro 2000 Bélgica/Países Baixos Panini (Cromos.pt ID 16) e Taça das Confederações 2017 Panini (ID 29), com substituição apenas na falta de cobertura. **Não foi necessária qualquer substituição**.
- Inicial: **33 coleções e 21.155 posições**. A branch `main` já continha a reorganização da página de entrada (`ad219b18`) por Portugal, Seleções, Outros e anos; todas as coleções existentes e progressos tinham de ser preservados.
- GitHub Actions inicial sem importações concorrentes; Vercel com último commit READY para o estado inicial.

## Resultado auditado
- Euro 2000: **358 posições, 358 fotografias verificadas, 17 secções**; sem fotografia em falta.
- Taça das Confederações 2017: **301 posições, 301 fotografias verificadas, 14 secções**; sem fotografia em falta.
- Total: **659 posições e 659 fotografias verificadas**, todas via GET HTTP, MIME, tamanho e SHA-256. Os **659 hashes são distintos**; nenhum ID/número de posição duplicado, zero nomes vazios, zero secções vazias. Algumas designações genéricas repetem-se e há quebras de linha em nomes de origem; não são duplicações de cromos e foram preservadas por fidelidade ao catálogo.
- Workflow [42467903628](https://github.com/newuser-hub/fut/actions/runs/42467903628) **SUCCESS**. Commit [52488f312a3eeccd2619004af4cfec22900e4759](https://github.com/newuser-hub/fut/commit/52488f312a3eeccd2619004af4cfec22900e4759) alterou **apenas** quatro ficheiros: os dois novos `public/data/*.json`, `public/library.json` e `public/expansion-plan.json`. As outras 33 coleções, a interface agrupada, o progresso independente, OAuth e autenticação foram mantidos.
- Final: **35 coleções e 21.814 posições**. Roteiro: **14/20 integradas, quatro bloqueadas por falta de imagens e duas elegíveis**.

## Publicação e segurança
- O Vercel confirmou **READY** no ambiente de produção para o SHA `52488f312a3eeccd2619004af4cfec22900e4759`.
- Esta documentação e a extensão dos testes de acesso são acrescentadas após o commit da integração. Verificar explicitamente novo HEAD de `main`, testes de integridade, novo deployment READY e HTTP 401 sem credenciais em ambos os domínios, incluindo `/data/euro-2000.json` e `/data/confederations-2017.json`.
- Não ler nem modificar `FUT_ALBUM_PASSWORD`, não remover a proteção do Vercel.

## Continuação
- Próximo lote operacional elegível, após nova autorização: **Mundial EUA 1994 — Panini, Cromos.pt ID 13** e **Euro Inglaterra 1996 — Panini, ID 14**.
- Não repetir a auditoria das 659 imagens, a menos que mude a fonte ou o catálogo.
- Confirmar a `main` antes de começar, preservar alterações paralelas, não trabalhar em segundo plano sem agendamento.
