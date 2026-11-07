# Checkpoint FUT — Lote operacional 4 (7 de novembro de 2026)

## Estado confirmado no GitHub
- Repositório `newuser-hub/fut`, branch `main`, catálogo preservado.
- Inicial: 27 coleções, 17.822 posições. Final: **29 coleções, 18.873 posições**, +1.051.
- FIFA 365 2026 Panini (Cromos.pt 44): 524/524 imagens verificadas, 31 secções.
- Liga Portugal 2023/24 Panini (Cromos.pt 53): 525/527 imagens verificadas, 26 secções; duas posições sem fotografia, sem invenções.
- Total: 1.049 imagens verificadas individualmente por HTTP/MIME/tamanho/SHA-256 e 1.049 hashes únicos; IDs e números únicos.
- Integração: https://github.com/newuser-hub/fut/actions/runs/42422831409 (sucesso).
- Commit dos catálogos: `98ad44aeeb8777f0cec4bafeab16283d06c4aa3a`; alterou só dois ficheiros `public/data`, `public/library.json` e `public/expansion-plan.json`. Não modificou os restantes catálogos nem o motor de progresso individual.
- Roteiro: **8/20 integradas, 3 bloqueadas por imagens, 9 ainda pendentes**. Suspensas: FIFA 365 2027 (340), FIFA 365 Adrenalyn XL 2027 (99), FIFA 365 2024 (321).
- Próximo lote operacional elegível, apenas após nova autorização: Champions League 2024/25 Topps (Cromos.pt 77) e Liga Portugal 2022/23 Panini (Cromos.pt 58).

## Publicação e segurança
- A versão anterior de 27 coleções foi publicada com êxito no Vercel, commit `70a004b3bdad69ed0cf301e87bb66f9dc56e2460`, deployment READY.
- A publicação **deste lote 4** deve ser confirmada explicitamente para o commit do HEAD que inclua as 29 coleções; não inferir do sucesso no GitHub.
- Projeto `fut` no Vercel, ID `prj_AgqL0LPT5Zyan4XFmtmwiOrch1sH`, destino `production`. Testar HTTP 401 sem credenciais em `/`, `/library.json`, `/expansion-plan.json` e os ficheiros `/data/fifa-365-2026.json`, `/data/liga-portugal-2023-24.json`, nos dois domínios de produção.
- Não ler, divulgar ou modificar `FUT_ALBUM_PASSWORD`.
- Antes de qualquer retoma, revalidar a `main`, Actions e o deployment atual. Não repetir importações concluídas.

Este checkpoint permite continuidade sem execução agendada nem alteração de limites de conta.
