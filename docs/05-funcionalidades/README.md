# 05 — Funcionalidades da aplicação

**Implementado:** pesquisa por nome/clube/número; secções, navegação por páginas até nove cromos, teclado e gestos; revelar, ocultar, ampliar, favoritos e escolha aleatória; ações por página/coleção; progresso local independente; importação/exportação de progresso JSON; mensagens de imagem indisponível; roteiro visual e botões para **copiar** autorização de novos lotes.

A autorização copiada não é executada automaticamente: deve ser enviada explicitamente ao ChatGPT. Não existe sincronização dos progressos entre dispositivos.

O frontend de origem é [`src/index.html`](../../src/index.html) e a versão construída é [`public/index.html`](../../public/index.html). Os IDs dos cartões/coleções são essenciais para a compatibilidade com o `localStorage`. A reorganização **não altera** o código ou os progressos.

**Recomendação operacional:** exportar JSON de progresso antes de qualquer intervenção futura que possa alterar IDs, armazenamento ou interface.
