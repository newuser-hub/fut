# Regras para crescimento da documentação

## Uma única fonte por assunto

Coleções = [manifesto](../public/library.json); cromos e imagens = [dados](../public/data/); prioridades = [roteiro](../public/expansion-plan.json); execução = Actions/commits; produção = deployment Vercel com SHA e estado.

## Classificação futura

| Caminho | Categoria |
|---|---|
| `public/data/*`, `public/library.json` | 02 |
| `archives/*` | 03 |
| `src/*`, HTML/capa do portal | 05 |
| `scripts/*`, `package.json` | 06 |
| `proxy.js`, `robots.txt` | 07 |
| `.github/workflows/*`, `vercel.json` | 08 |
| `requests/*`, `public/expansion-plan.json` | 10 |
| `ops/*`, README de gestão | 01 |

As imagens e auditorias são vistas transversais em 04 e 09. Um ficheiro novo sem correspondência deve ser assinalado para classificação manual, não ignorado.

## Checklist por lote

1. Revalidar main, PRs e Actions; confirmar autorização e âmbito.
2. Executar o pipeline de importação e validar todos os catálogos; não alterar IDs históricos.
3. Atualizar [inventário](02-colecoes/README.md) e [cobertura](04-imagens/README.md) com novo snapshot, sem reescrever dados operativos a partir dos documentos.
4. Atualizar [backlog](10-backlog/README.md), [decisões](01-gestao/DECISOES.md), [checkpoint](01-gestao/CHECKPOINT.md) e [cronologia](HISTORICO.md).
5. Verificar links, classificar ficheiros novos e registar novas divergências em [auditorias](09-auditorias/README.md).
6. Confirmar separadamente READY e HTTP 401 sem credenciais; não contornar quotas nem publicar sem autorização.

O índice pode ser atualizado por script/verificação de forma controlada no futuro, mas **não criar processos que façam auto-merge, importações ou deployments a partir da documentação**.
