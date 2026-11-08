# 10 — Backlog, bloqueios e autorização

**Roteiro atual:** [`public/expansion-plan.json`](../../public/expansion-plan.json), **30 candidatas**, 26 integradas no manifesto, **quatro bloqueadas por cobertura/qualidade de imagens** e **zero outras pendentes** no roteiro. Não existe limite técnico fixo de coleções para o FUT, mas nenhuma expansão é autorizada por esta documentação.

## Candidatas bloqueadas — não importar

| Candidata | ID no roteiro | Situação |
|---|---|---|
| FIFA 365 2027 | `fifa-365-2027` | Fonte sem imagens suficientes verificáveis |
| FIFA 365 Adrenalyn XL 2027 | `fifa-365-adrenalyn-2027` | Fonte sem imagens suficientes verificáveis |
| FIFA 365 2024 | `fifa-365-2024` | Fotografia não disponível em volume adequado |
| FIFA 365 2025 | `fifa-365-2025` | Validação editorial/visual bloqueada |

**O par 77+58 indicado no PR #1 já foi integrado**: Champions League 2024/25 e Liga Portugal 2022/23 estão no manifesto de 47. Os lotes 6–13 e as entradas posteriores também foram processados; não reutilizar pedidos históricos para criar novas importações.

## Prioridades pós-auditoria — sem autorização implícita

| Classe | Ação | Estado |
|---|---|---|
| P0 | Preservar 47 coleções, IDs, backups, Basic Auth e progresso por browser | Obrigação permanente |
| P0 | Rever PR da auditoria com CI e aceitar ou rejeitar mudanças de forma controlada | **Pendente de revisão humana; sem merge** |
| P1 | Resolver imagem incorreta de Salis com fotografia verdadeira verificável | **Ligação errada resolvida; imagem correta pendente** |
| P1 | Investigar 5 ligações Topps HTTP 403 e direitos de imagem | **Não verificadas; não equivalem a fotos descarregadas** |
| P1 | Manter/documentar 2.074 posições sem URL, em 18 coleções | **Lacunas aceites; continuar observação editorial** |
| P1 | Adaptar writers a branches/PRs antes de eventual regra de PR obrigatório | **Proposta, sem alteração de settings** |
| P2 | Confirmar acesso real em Safari/iPhone e VoiceOver | **Não testado; WebKit Linux 78/78 é evidência distinta** |
| P2 | Verificar permissões, quotas e consentimento para migração Google Drive real | **Não autorizada / não executada** |
| P2 | Avaliar custos de servir fotos pela Drive API e serialização de promoções | **Pendente de decisão técnica** |
| P3 | Considerar sincronização de progresso entre dispositivos | **Ideia, não aprovada** |

O roteiro visual e os botões de autorização **apenas copiam textos**, não executam importações automaticamente. Para novas coleções, criar pedido explícito, auditar catálogos e imagens, validar CI, publicar por SHA certo apenas após aprovação. O progresso permanece no `localStorage`; fazer backup individual por coleção.

### Estado histórico do PR #1 — não operacional

O snapshot documental inicial tinha **8/20 integradas, 3 bloqueadas e 9 pendentes**, e recomendava as entradas 77+58. Foi correto **naquela data**, mas deixou de descrever o inventário real. [Cronologia](../HISTORICO.md), [arquivo original](../01-gestao/README-original-2026-11-08.md) e [checkpoints](../../ops/) preservam a sucessão sem reescrever o passado.

**Nada nesta lista autoriza novas importações, merges, alterações de GitHub/Vercel ou deploy.**
