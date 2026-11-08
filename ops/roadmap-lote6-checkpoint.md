# FUT — Checkpoint do lote operacional 6

Data: **8 de novembro de 2026**. Repositório oficial: `newuser-hub/fut`, branch `main`.

## Âmbito autorizado e substituição
- Autorizadas originalmente: FIFA 365 2025 (Cromos.pt 320) e Mundial Coreia/Japão 2002 (Cromos.pt 17).
- Pré-auditoria [ops/roadmap-lote6-source-audit.md](./roadmap-lote6-source-audit.md): FIFA 365 2025 tem 533 posições (458 principais, 75 extras), com **0 caminhos de imagem**. Foi **suspensa** por ausência total de fotos, não integrada; permanece no roteiro para futuras reavaliações.
- Substituta pela ordem do plano, autorizada pela condição do pedido: **Mundial França 1998** (Cromos.pt 15), com 561 cromos principais e imagens acessíveis. Não foram importadas coleções adicionais além do par final.

## Integração e auditoria verificadas
- Estado inicial: **31 coleções**, **20.013 posições**.
- Final: **33 coleções**, **21.155 posições** (+1.142).
- **Mundial Coreia/Japão 2002**: 581 posições, 581 imagens verificadas, 34 secções, 0 imagens em falta.
- **Mundial França 1998**: 561 posições, 561 imagens verificadas, 34 secções, 0 imagens em falta.
- **1.142 imagens** auditadas por HTTP GET, MIME, dimensão e SHA-256; todos os hashes distintos; 0 IDs/posições repetidos, 0 nomes/secções vazios.
- Workflow de integração [42465661499](https://github.com/newuser-hub/fut/actions/runs/42465661499) **SUCCESS**. Commit [8c4d35a658c9998d6e60961eb63f02dfc1496466](https://github.com/newuser-hub/fut/commit/8c4d35a658c9998d6e60961eb63f02dfc1496466) adicionou apenas os dois ficheiros `public/data` e atualizou `public/library.json` e `public/expansion-plan.json`. Nenhuma das 31 coleções anteriores, IDs, progresso independente ou autenticação/OAuth foi alterada.
- Vercel publicou o commit de integração em `production` e confirmou **READY**. Projeto `fut` ID `prj_AgqL0LPT5Zyan4XFmtmwiOrch1sH`.
- Este checkpoint acompanha a revisão editorial que assinala FIFA 365 2025 como `blocked` e atualiza a documentação/testes. **Antes de afirmar que a documentação final está publicada**, comparar SHA do último deployment READY com HEAD atual de `main` e voltar a testar HTTP 401 sem credenciais.

## Estado do roteiro e próximos passos
- `public/expansion-plan.json`: **12/20 integradas**, **4 bloqueadas** (FIFA 365 2027 ID 340; FIFA 365 Adrenalyn XL 2027 ID 99; FIFA 365 2024 ID 321; FIFA 365 2025 ID 320), **4 por auditar**.
- Próximo par elegível **apenas após nova autorização**: Euro 2000 (ID 16) + Taça das Confederações 2017 (ID 29).
- Depois: Mundial EUA 1994 (ID 13) e Euro Inglaterra 1996 (ID 14), condicionados à disponibilidade de imagens reais.
- `.github/workflows/verify-expansion-plan.yml` valida também os novos catálogos e `.github/workflows/verify-fut-access.yml` protege/testa os JSON de ambas as edições.
- Não publicar dados da variável `FUT_ALBUM_PASSWORD`, nem criar imagens fictícias ou alterar progressos individuais; uma retoma deve revalidar o estado de `main` e preservar alterações paralelas.

Sem execução em segundo plano.
