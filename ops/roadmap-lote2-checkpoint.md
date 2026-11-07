# FUT — Checkpoint do lote 2 do roteiro (7 novembro 2026)

## Integrado, verificado e imutável até novo lote
- Coleções ativas: **25**; posições totais: **16.793** (antes: 23, 15.461).
- Novo lote: `idolos-pt-2026-27` (ID origem 335): 313 posições, 252 principais, 301 imagens verificadas, 12 extras sem imagem, 29 secções.
- Nova substituição autorizada: `world-cup-adrenalyn-2026` (ID origem 34): 1.019 posições, 700 principais, 929 imagens verificadas, 90 extras sem imagem, 67 secções.
- Todos os 952 principais foram verificados com fotografias; IDs e números sem duplicados.
- Catálogos integrados no commit `6e39826d70ed1ac42dd9e631a4ffec795becd10c`; GitHub Action concluída com sucesso: https://github.com/newuser-hub/fut/actions/runs/42419643838
- Versão com estas **25 coleções** já publicada no Vercel em estado READY (SHA `6e39826d70ed1ac42dd9e631a4ffec795becd10c`).

## Candidatas suspensas, não importadas
- FIFA 365 2027 (Cromos.pt 340): 0/496 imagens principais no Cromos.pt; 0/591 imagens individuais na alternativa StickersOne.
- FIFA 365 Adrenalyn XL 2027 (Cromos.pt 99): 0/451 imagens principais.
- Auditoria: https://github.com/newuser-hub/fut/actions/runs/42419529030
- Preservadas no roteiro para reavaliação quando surjam imagens reais; não usar imagens artificiais ou de outra edição.

## Alteração final do roteiro — GitHub validado, Vercel pendente
- Commit funcional validado `4cefbbc7cc68654ea87983fe697a2c51d396d5c2`: `public/expansion-plan.json` identifica quatro integradas, duas bloqueadas e catorze elegíveis; a interface ignora candidatas sem imagens nos próximos pedidos, mas continua a mostrá-las no plano.
- Testes automáticos aprovados: https://github.com/newuser-hub/fut/actions/runs/42420227140 (validador do roteiro, estrutura das 25 coleções, sintaxe JavaScript).
- Testes reais de proteção aprovados: https://github.com/newuser-hub/fut/actions/runs/42420227161. Os dois domínios `fut-rosy.vercel.app` e `fut-pjr-s-projects.vercel.app` devolveram **401 sem credenciais** na página inicial, manifesto e dados de cartas. O segredo continua exclusivamente na variável Vercel `FUT_ALBUM_PASSWORD`; não foi lido nem publicado.
- A implantação do commit `4cef...` foi impedida pelo Vercel: HTTP **402**, código `api-deployments-free-per-day`, mensagem **more than 100**, `retryAfter=86400` (limite diário). O ambiente com CLI alternativo disponível foi verificado e não tinha o executável `vercel`. Não foi alterado nenhum plano, quota, segredo ou configuração de proteção.
- **Não afirmar que a interface atualizada do roteiro já foi publicada.** O último deployment confirmado como READY continua associado ao commit `6e39826d...`; a produção inclui as cartas novas, mas os estados de bloqueio/botões ainda podem refletir o roteiro anterior.

## Retoma segura (quando a quota permitir)
1. Ler `main`, Actions e deployments antes de operar; não duplicar catálogos nem executar novamente a auditoria de 1.332 posições.
2. Confirmar qual é o SHA mais recente na `main` (incluindo este checkpoint); pedir nova implantação de `main` no **projeto Vercel `fut`** (`prj_AgqL0LPT5Zyan4XFmtmwiOrch1sH`), destino **production**.
3. Confirmar deployment READY do SHA exato e que a página do roteiro apresenta **4/20 integradas, 2 aguardam imagens**, com o próximo par elegível.
4. Repetir testes anónimos HTTP 401 para `/`, `/library.json` e `/data/idolos-pt-2026-27.json`. Não divulgar credenciais.
5. Próximo lote operacional autorizado **apenas mediante novo pedido do utilizador**: Champions League 2025/26 Topps (Cromos.pt 49) + Match Attax Extra 2025/26 Topps (Cromos.pt 51); depois continuar o plano sem limite global.

Este ficheiro é um checkpoint, não um pedido de execução em segundo plano.
