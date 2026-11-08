# 04 — Imagens, cobertura e proveniência

## Resumo de auditoria persistida (2026-11-08)

| Classe | Posições |
|---|---:|
| `available=true` com SHA-256 | **16.911** |
| `available=true` sem SHA-256 (pré-visualizações Topps) | **5** |
| `available=false` (imagem indisponível) | **1.957** |
| **Total** | **18.873** |

**Premier League Flagship 2026/27:** 0 imagens com hash, 5 links Topps não auditados por SHA-256 e 1.133 sem fotografia. As ligações podem devolver HTTP 403.

## Política

Verificar URL original, HTTP GET, MIME, dimensões/tamanho e SHA-256 quando existirem bytes válidos; guardar a proveniência e preservar todas as posições sem fotografia. Não criar imagens artificiais, não trocar jogadores ou edições, não presumir que um link sem hash é uma imagem verificada.

[Pipeline de importação](../../scripts/ingest_batch.py) · [Validador](../../scripts/verify_catalogs.py) · [Inventário completo por coleção](../02-colecoes/README.md).

**Limitação:** esta reorganização conferiu os dados e hashes guardados, mas **não repetiu pedidos HTTP aos fornecedores**. A validade de uma fotografia num determinado dia não garante disponibilidade futura. A existência de URLs públicos não prova direitos de redistribuição.
