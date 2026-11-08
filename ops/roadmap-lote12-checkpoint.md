# FUT — Checkpoint do lote 12 (8 de novembro de 2026)

## Autorização e base de execução

- Autorização explícita para apenas o **lote 12**: Mundial Itália 1990 (Cromos.pt 11) e Euro Suécia 1992 (Cromos.pt 12). Registada em `requests/roadmap-batch.json` com `batch=roadmap-12`, `authorizedSourceIds=[11,12]`, commit [7a36f93c](https://github.com/newuser-hub/fut/commit/7a36f93c2caf2d1c2059914ef612ab10970d788d).
- Base da `main` antes de iniciar: `32376490386e68cb02bb70c579515f22e9789ea5`, **43 coleções, 25.127 cromos**. As duas workflows finais do lote 11 (integridade e HTTP 401) estavam em **SUCCESS**, e o mesmo SHA em Vercel `production READY`.
- Preflight do roteiro: Mundial 1990 448/448 caminhos de imagem; Euro 1992 257/261 caminhos (quatro ausentes). Foram preservadas as quatro candidatas históricas bloqueadas, as exclusões e os IDs anteriores.

## Integração e auditoria das imagens

- [GitHub Actions 42482032742](https://github.com/newuser-hub/fut/actions/runs/42482032742): **SUCCESS** em todas as etapas: validação inicial, importação/auditoria das duas coleções, sincronização do roteiro, verificação de catálogos e frontend e commit.
- [Commit de integração fbe1ab66](https://github.com/newuser-hub/fut/commit/fbe1ab6636bef4d018839d660dff4cb9259c1c31): acrescenta apenas `public/data/world-cup-1990.json` e `public/data/euro-1992.json` como novos catálogos e atualiza os manifests `public/library.json`, `public/expansion-plan.json` e o pedido autorizado.
- **Mundial Itália 1990 Panini** (origem 11): **448 cromos principais**, sem extras, **448/448** imagens verificadas, **27 secções**.
- **Euro Suécia 1992 Panini** (origem 12): **261 cromos principais**, sem extras, **257/261** imagens verificadas (**98,47%**), **12 secções**. Quatro posições principais preservadas sem fotografia por não existir caminho `img_path` na origem:

  | Número | Nome | Secção/seleção | Source ID | ID imutável |
  |---|---|---|---:|---|
  | 29 | Klas Ingesson | Sweden | 3791 | `euro-1992-3791` |
  | 48 | Bernard Casoni | France | 3810 | `euro-1992-3810` |
  | 145 | Henry Smith | Scotland | 3907 | `euro-1992-3907` |
  | 223 | Brian Steen Nielsen | Denmark | 3985 | `euro-1992-3985` |

- Para os quatro registos, `available=false`, `image=null`, `sha256=null`. Não foram inventadas imagens nem alterada a fonte. A cobertura ultrapassa o limiar mínimo de 80% do pipeline; a ausência fica explícita para eventual enriquecimento futuro se houver proveniência verificável.
- **709 posições catalogadas**, **705 imagens auditadas por GET HTTP, MIME, bytes e SHA-256**, **705 hashes distintos** entre os dois novos catálogos. Zero duplicações de IDs/números, nomes e secções vazios ou ausência de secções no índice.
- Comparação dos manifests da base e do commit de integração: as **43 entradas pré-existentes permanecem bit a bit equivalentes após parsing JSON**. Os ficheiros dos 43 catálogos anteriores e o código de OAuth, palavra-passe, progresso por caderneta e categoria Champions League não foram modificados.
- Biblioteca final: **45 coleções ativas, 25.836 posições**. Das 30 candidatas do roteiro: **24 integradas, 4 bloqueadas e 2 pendentes**.

## Vercel, segurança e validação final

- Commit de integração `fbe1ab6636bef4d018839d660dff4cb9259c1c31` confirmado em Vercel **production READY** (deployment `dpl_EKXQYYJvDGcVvucXdbkyZb1Qx8yx`).
- A workflow `.github/workflows/verify-fut-access.yml` passou a incluir os endpoints `/data/world-cup-1990.json` e `/data/euro-1992.json` e exige **HTTP 401 exato** sem autenticação nos domínios `fut-rosy.vercel.app` e `fut-pjr-s-projects.vercel.app` para portal, manifesto, roteiro e catálogos.
- `.github/workflows/verify-expansion-plan.yml` passou a monitorizar as alterações dos dois novos ficheiros. A verificação estrutural do lote faz parte da workflow e utiliza `requests/roadmap-batch.json` para testar as duas coleções efetivamente autorizadas.
- Após o commit de documentação, verificar o **SHA final em Vercel production READY** e resultados de ambas as workflows (integridade e HTTP 401) antes de declarar a execução totalmente concluída.

## Restrições e próxima etapa

- **Lote 12 é o último lote autorizado neste pedido.** O lote 13 permanece pendente: Liga Portugal 2016/17 (Cromos.pt ID 64) e Liga Portugal 2014/15 (ID 55), com autorização independente.
- Não realizar importações concorrentes nem avançar para o lote 13 sem novo pedido. Numa futura retoma, revalidar `main`, Actions, Vercel, manifesto, auditoria e bloqueios históricos.
