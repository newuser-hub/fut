# 04 — Imagens, proveniência e cobertura

**Snapshot calculado dos 47 catálogos em 2026-11-08.** [Inventário detalhado](../02-colecoes/README.md) · [Auditoria HTTP/SHA da etapa 4](../../ops/audit-2026-11-08-step4-images.md).

| Estado, mutuamente exclusivo | Cromos | Fonte da classificação |
|---|---:|---|
| URL e SHA-256 persistido com bytes positivos | **24.695** | Campos `image`. `sha256`. `bytes` |
| URL oficial sem SHA-256 auditado | **5** | Cinco previews Topps, HTTP 403 na última auditoria |
| Sem URL de imagem | **2.074** | `image` ausente ou nulo; posições mantidas |
| **Total de posições** | **26.774** | `public/library.json` e `public/data/*.json` |

**URLs de cromos:** 24.700 = 24.695 com hash + 5 ligações não verificadas. **Capas:** 47 URLs adicionais (não fazem parte das posições). **Inventário URL total:** 24.747.

## GET real — evidência histórica de 08/11/2026

- O varrimento da [etapa 4](../../ops/audit-2026-11-08-step4-images.md) cobriu 24.747 URLs e comprovou **24.742 GET 200** com tipo MIME de imagem, tamanho e SHA (24.695 cromos + 47 capas), sem divergência de hash confirmada. Os outros **5 URLs** devolveram HTTP 403.
- O hash persistido no JSON é evidência histórica de bytes, **não** uma nova descarga e **não** garante que o URL responda hoje.
- A capa Premier League num URL específico de `blogger.googleusercontent.com` foi verificada por GET; o pipeline Drive permite apenas essa URL exata como exceção de host.
- O cromo **Salis Abdul Samed**, Ligue 1 #383, tinha os mesmos bytes de uma fotografia de outro jogador. A associação errada foi retirada; preservaram-se identidade, número e progresso, mantendo a fotografia pendente.
- Oito pares de cromos regionais Coca-Cola partilham imagens legitimamente. Não foram apagados nem alterados.

## Regras de qualidade

Usar URL legítimo, HTTP GET, MIME, limite de bytes e SHA-256; investigar diferenças por imagem e identidade antes de substituir. Se os bytes não forem verificáveis, assinalar ligação não verificada; se não houver URL, preservar a posição sem fotografia. **Nunca inventar imagens, hashes ou disponibilidade.**

As imagens e marcas pertencem aos titulares. A acessibilidade pública não constitui autorização de reprodução nem de migração para outro alojamento. A [migração Drive](../GOOGLE_DRIVE_STORAGE.md) continua não executada.
