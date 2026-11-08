# 09 — Auditorias e controlo de qualidade

| Objeto | Resultado da leitura de 2026-11-08 |
|---|---|
| Ficheiros de origem classificados | 76 / 76 |
| Catálogos inspecionados | 29 / 29 |
| Posições | 18.873 |
| Diferenças no total ou secções face ao manifesto | 0 |
| IDs de cromos duplicados dentro de catálogos | 0 |
| Números de navegação duplicados dentro de catálogos | 0 |
| Imagens com SHA registado | 16.911 |
| Links sem SHA | 5 |
| Posições sem imagem | 1.957 |
| Roteiro | 8 integradas, 3 bloqueadas, 9 pendentes |

**Alteração paralela preservada:** cinco fontes relacionadas com Google Drive foram atribuídas à categoria 06; a migração real não foi executada neste trabalho.

**Problemas/limitações:** 14 coleções têm lacunas de imagens; Premier League tem cobertura visual especialmente baixa; o README antigo misturava estados de épocas e lotes; a quota Vercel bloqueou um deploy anterior mas foi seguida por READY; a edição LaLiga ESTE tinha colisões de números impressos, preservadas em `originalNumber` e desambiguadas no número de navegação.

A leitura não inclui nova auditoria HTTP/MIME/SHA-256 ao vivo nem revisão semântica dos nomes, apenas reconciliação dos metadados existentes. Não declarar fotos como atualmente acessíveis apenas por terem hash histórico.

[Validação estrutural](../../scripts/verify_catalogs.py) · [Validação do roteiro](../../scripts/verify_expansion_plan.py) · [Action de sucesso](https://github.com/newuser-hub/fut/actions/runs/42423109703).

As categorias 04 e 09 são **vistas transversais**: os seus dados primários estão dentro dos catálogos, pipelines e Actions. Não duplicar o estado operativo.
