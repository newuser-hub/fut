# 05 — Portal, navegação, progresso e backup

## Organização e pesquisa

Portal com **quatro categorias e anos decrescentes dentro de cada categoria**: Portugal (12), Seleções (23), Champions League (5) e Outros (7). Pesquisa no portal sem distinção de acentos; dentro de cada coleção, índice de secções e pesquisa de cromos por nome, equipa/clube ou número. Páginas de até **nove cromos**, navegação por botões, seletor de secção, setas do teclado e swipe horizontal.

Gestos: primeiro toque revela; num cromo já revelado, toque único amplia e dois toques rápidos tapam. Há opções de revelar/tapar página, revelar todos, favoritos, seleção aleatória e retorno ao índice. Imagens ausentes são identificadas sem recorrer a fotos inventadas.

## Acessibilidade corrigida na etapa 8 (ainda não publicada)

O modal de ampliação tem nome `aria-labelledby`, foco inicial no botão Fechar, contenção de Tab/Shift+Tab, Escape e devolução do foco ao cromo. Conteúdo de fundo fica `inert` enquanto o diálogo está aberto. Botões essenciais têm alvos mínimos de 44 px e foco visível no teclado; `prefers-reduced-motion` também afeta scroll JavaScript.

**Testes de browser:** 78/78 PASS em Playwright Chromium/WebKit Linux nas larguras 320/390/768 px, com rede atrasada e `axe-core`. **Não houve teste em Safari real nem num iPhone físico**. [Matriz e medições](../../ops/audit-2026-11-08-step8-ui.md).

## Progresso e favoritos

`revealed` e `favorites` são mapas de IDs guardados **neste navegador**, por coleção, na chave antiga e estável `fut.album.<id>.progress.v1`. Não existe conta de utilizador, sincronização entre equipamentos ou cópia automática para Google Drive. Uma troca de browser, limpeza do `localStorage` ou bloqueio de armazenamento pode apagar o progresso local.

**Backup por coleção:** abrir a coleção → **Exportar** → guardar `fut-<id>-progresso.json`. Para restaurar, abrir **a mesma** coleção → **Importar** → selecionar JSON compatível → confirmar substituição. A aplicação valida versão, ID da coleção e IDs dos cromos, e só anuncia sucesso quando o armazenamento persistiu. Nunca importar um backup de outra caderneta para substituir a atual.

A [suite de progresso](../../scripts/test-frontend-progress.mjs) cobre pedidos concorrentes, backup inválido, IDs estranhos, recusa por quota e seleção trocada durante importação.

## Ações de expansão

Os botões de roteiro apenas **copiam um texto de autorização** para usar no ChatGPT. Não ativam por si importações nem processos em segundo plano. As 30 candidatas do roteiro são uma lista editorial, não um limite absoluto de coleções nem autorização de deployment.

[Frontend editável](../../src/index.html) · [HTML construído](../../public/index.html) · [Catálogos](../03-catalogos/README.md).
