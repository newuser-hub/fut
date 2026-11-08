# FUT — Checkpoint do lote operacional 8 (8 novembro 2026)

## Verificação inicial
- Repositório `newuser-hub/fut` branch `main`; commit anterior `d101e891749cdf285a8ce4247afed6578efb3663`; GitHub Actions sem importações paralelas.
- Produção Vercel para o estado inicial: READY. Projeto `fut` (`prj_AgqL0LPT5Zyan4XFmtmwiOrch1sH`).
- Biblioteca anterior: 35 coleções e 21.814 cromos. Organização por Portugal/Seleções/Outros e anos, progresso local por coleção, OAuth e proteção por palavra-passe preservados.

## Resultado de auditoria e integração
- Pedido e autorização: **Mundial EUA 1994 (Cromos.pt ID 13)** e **Euro Inglaterra 1996 (Cromos.pt ID 14)**. Nenhuma substituição necessária; não foram importadas edições fora do lote.
- **Mundial EUA 1994**: 444 posições principais, **444 imagens verificadas**, 26 secções, 0 faltas.
- **Euro Inglaterra 1996**: 354 posições principais, **354 imagens verificadas**, 18 secções, 0 faltas.
- Total **798 posições, 798 imagens**, HTTP GET, MIME imagem, tamanho e SHA-256 auditados individualmente. 798 hashes distintos, IDs e números únicos em cada edição, sem nomes/secções vazios.
- Execução [GitHub Actions 42473969216](https://github.com/newuser-hub/fut/actions/runs/42473969216) — **SUCCESS**, incluindo `verify_catalogs.py`, `verify_expansion_plan.py` e sintaxe do frontend.
- Commit da integração [29e5d922b988f67e1a95ad2b62a9c4fdcc49c412](https://github.com/newuser-hub/fut/commit/29e5d922b988f67e1a95ad2b62a9c4fdcc49c412) modificou apenas os dois novos catálogos JSON, o manifesto `public/library.json` e o roteiro `public/expansion-plan.json`, de forma transacional.
- As 35 coleções anteriores e as chaves de progresso `fut.album.<id>.progress.v1` não foram alteradas; OAuth e proteção de dados permanecem.

## Estado após a integração
- Biblioteca: **37 coleções, 22.612 posições**.
- Roteiro das 20 candidatas: **16 integradas / 4 bloqueadas sem imagens / 0 pendentes**.
- Bloqueadas: FIFA 365 2027 ID 340; FIFA 365 Adrenalyn XL 2027 ID 99; FIFA 365 2024 ID 321; FIFA 365 2025 ID 320. Não apagar histórico nem inventar imagens.
- O commit da integração obteve deployment Vercel **READY em produção**. Esta atualização documental acrescenta testes explícitos de acesso anónimo para `/data/world-cup-1994.json` e `/data/euro-1996.json`.
- **Antes de confirmar a versão documental final em produção**, verificar o SHA atual READY contra a main, executar validações e testar HTTP 401 sem credenciais nos dois domínios, incluindo novos dados.
- Não consultar nem expor `FUT_ALBUM_PASSWORD` nem alterar segredos, OAuth ou autenticação.

## Próxima fase
O roteiro inicial de 20 candidatas está totalmente avaliado, mas quatro edições continuam bloqueadas. Não existe candidato pendente para iniciar outro lote automaticamente. Uma próxima autorização poderá:
1. Aprovar descoberta/avaliação de **duas novas coleções fora do roteiro atual**, expandindo o plano de forma auditada e preservando IDs/progressos; ou
2. Reavaliar a disponibilidade das fotografias nas quatro coleções bloqueadas, sem as integrar se faltarem imagens reais.

Nenhuma dessas atividades foi executada ou autorizada por este lote.
