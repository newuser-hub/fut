# FUT — Documentação operacional, 08/11/2026

**Estado atual, calculado diretamente dos JSON:** **47 coleções ativas, 26.774 posições, 1.508 secções**. Imagens de cromos: **24.695 com URL/SHA/bytes**, **5 URLs oficiais Topps sem hash verificável**, **2.074 posições sem URL**. Há **47 capas** adicionais. O roteiro tem **30 candidatas, 26 integradas, 4 bloqueadas e 0 pendentes não bloqueadas**.

**Branch de trabalho:** `audit/fut-2026-11-08`. **Referência de produção/main:** `d5fb60eec0801808ec2946385a14c8c9226df54d`, READY no Vercel em 08/11/2026. O código desta auditoria não foi publicado; o PR #1 permanece aberto.

| # | Categoria | Conteúdo e procedimentos |
|---|---|---|
| 01 | [Gestão](01-gestao/README.md) | Estado, decisões, checkpoints, recuperação da auditoria |
| 02 | [Coleções](02-colecoes/README.md) | Inventário **gerado** dos 47 catálogos por Portugal, Seleções, Champions League e Outros |
| 03 | [Catálogos e bases de dados](03-catalogos/README.md) | Origem dos JSON, invariantes, IDs, reconciliação, versão dos dados |
| 04 | [Imagens](04-imagens/README.md) | Cobertura por classe, HTTP/SHA da etapa 4, direitos, ligações bloqueadas |
| 05 | [Funcionalidades](05-funcionalidades/README.md) | Portal, pesquisa, toque/teclado, progresso, exportação/importação |
| 06 | [Arquitetura](06-arquitetura/README.md) | Instalação, frontend, API, proxy, Drive, comandos, testes |
| 07 | [Segurança](07-seguranca/README.md) | HTTP Basic, segredos, cabeçalhos, Drive e GitHub público |
| 08 | [GitHub e Vercel](08-github-vercel/README.md) | CI/CD, escritoras, check do SHA, deploy e rollback |
| 09 | [Auditorias](09-auditorias/README.md) | Qualidade, evidências, limitações e matriz de testes |
| 10 | [Backlog](10-backlog/README.md) | Trabalho bloqueado e pendente, sem autorização implícita |

## Fontes de verdade e atalhos

O manifesto, catálogos e roteiro são, por esta ordem, [`public/library.json`](../public/library.json), [`public/data/`](../public/data/) e [`public/expansion-plan.json`](../public/expansion-plan.json). Nunca editar os JSON para fazer coincidir com um relatório. As métricas atualizadas estão em [`metrics-current.json`](metrics-current.json) e [`index.json`](index.json); regenerar com `python3 scripts/refresh_documentation.py --write` e verificar com `--check`.

**Checkpoints:** [Auditoria 1–9](../ops/audit-2026-11-08.md) · [gestão](01-gestao/CHECKPOINT.md) · [decisões](01-gestao/DECISOES.md) · [Drive](GOOGLE_DRIVE_STORAGE.md) · [cronologia](HISTORICO.md) · [manutenção](MANUTENCAO.md).

## História claramente separada

A organização em dez categorias foi proposta pelo [PR #1](https://github.com/newuser-hub/fut/pull/1) quando existiam **29 coleções e 18.873 posições**. O [README integral de então](01-gestao/README-original-2026-11-08.md), o [mapa original de 76 ficheiros](source-map.json) e as contagens em [CLASSIFICACAO](CLASSIFICACAO.md) são **snapshots históricos**, não o estado operativo de hoje. O README seguinte referia 39 coleções e também ficou ultrapassado; a história é preservada no Git, não repetida como verdade atual.

A produção antiga READY, falhas antigas de quota e lotes antigos devem ser interpretados no seu momento. Um deployment READY antigo não comprova uma alteração por publicar.

**Nenhum merge, nova coleção, migração Drive ou deployment foi solicitado por esta reorganização.**
