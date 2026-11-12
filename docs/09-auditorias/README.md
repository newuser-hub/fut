# 09 — Auditorias, qualidade e limitações

**Fontes:** [métricas derivadas dos JSON](../metrics-current.json), [inventário de 47 coleções](../02-colecoes/README.md) e [checkpoint principal](../../ops/audit-2026-11-08.md). Os números do PR #1 referiam **29 coleções** e são históricos, não atuais.

| Evidência atual / data | Resultado |
|---|---|
| Manifesto e catálogos, 08/11/2026 | **47 / 26.774 posições / 1.508 secções**, IDs preservados |
| Campos de cromos com URL + SHA + bytes | **24.695** |
| Previews Topps com URL mas sem SHA | **5** |
| Posições sem URL de imagem | **2.074**, em **18** coleções |
| Capas | **47** URLs |
| Varrimento HTTP da etapa 4, em 08/11/2026 | **24.742 GET 200** verificáveis, **5 HTTP 403**, **0 divergências SHA confirmadas** |
| Roteiro | **30** candidatas; 26 integradas / 4 bloqueadas / 0 outras pendentes |
| Interface/teclado, etapa 8 | **78/78 Playwright PASS**, Chromium/WebKit automatizados a 320/390/768 px |
| CI e lógica, etapa 7 | **60/60 Node, 31/31 Python**, npm ci/build, workflow [`FUT / validate`](../../.github/workflows/ci.yml) |
| Drive, etapa 6 | Código de staging/validação/promoção testado com mocks, **zero migrações reais** |
| Produção | `main` `d5fb60eec0801808ec2946385a14c8c9226df54d`, Vercel READY; branch de auditoria não publicada |

## Defeitos resolvidos (na branch de auditoria; não em produção)

- **Fotografia errada de Salis Abdul Samed** — URL retirado depois de provar que a imagem repetia outro jogador. ID/número/ordem preservados; posição permanece sem imagem. [Etapa 4](../../ops/audit-2026-11-08-step4-images.md).
- **Acesso API sem proteção independente e logs potencialmente informativos** — Basic Auth no proxy e na API, fail-closed sem password, parâmetros/métodos validados e no-store. [Etapa 5](../../ops/audit-2026-11-08-step5-security.md).
- **DriveFileId cego e checkpoints sobre catálogos ativos** — staging separado, SHA/bytes verificados, promoção por pointer e retoma; código com mocks, não migração real. [Etapa 6](../../ops/audit-2026-11-08-step6-drive.md).
- **CI incompleta, locks não globais e verificação de deployment antigo** — `FUT / validate`, lock único, pedido fixado no SHA e gate antes do commit; produção exige SHA READY certo. [Etapa 7](../../ops/audit-2026-11-08-step7-ci.md).
- **Modal sem gestão de foco e botões favoritos de ~21 px** — foco inicial/contido/devolvido, nomes acessíveis, alvos 44 px, scroll reduced-motion. [Etapa 8](../../ops/audit-2026-11-08-step8-ui.md).
- **Documentação desatualizada** (PR #1 a 29, README a 39, guia Drive legado) — atualizada e gerada a partir dos JSON na etapa 9, preservando cópias históricas.

## Limitações aceites (com evidência, sem falso sucesso)

- Cinco previews Topps oficiais devolvem **HTTP 403** no runner; URL preservado, sem hash e **sem comprovar bytes**. Não estão errados por definição, mas não podem ser migrados como fotografias verificadas.
- **2.074 posições sem imagem** mantêm-se navegáveis; **18 coleções** têm pelo menos uma lacuna. Não inventar nem reutilizar imagens de outro cromo.
- Oito pares regionais Coca-Cola têm hashes repetidos de forma intencional, com jogador igual; não eliminar sem evidência editorial.
- Hash registado e GET efetuado em novembro **não garante URL disponível hoje** nem licencia armazenamento/redistribuição.
- WebKit Linux Playwright **não é Safari real/iPhone**; não se testou VoiceOver em dispositivo, rede móvel real ou login de produção com credenciais reais.
- Proteção do site Vercel **não oculta** ficheiros de um repositório GitHub público.

## Trabalho pendente

- Obter fotografia correta e devidamente autorizada de Salis, se existir; revalidar os cinco Topps por uma fonte legalmente acessível; manter 2.074 posições sem fotos até haver prova.
- Rever editorialmente as quatro candidatas bloqueadas: FIFA 365 2027, FIFA 365 Adrenalyn XL 2027, FIFA 365 2024 e FIFA 365 2025. **Sem autorização de nova importação**.
- Migração Drive real, direitos, quotas e testes autenticados **só mediante autorização futura**; não ativar `FUT_STORAGE_BACKEND=drive`.
- Verificação em Safari/iPhone e VoiceOver reais; validação de proteção via deployment READY do SHA exato quando houver publicação autorizada.
- PR de auditoria: revisão, resolução de eventuais conflitos e eventual merge **sujeitos a decisão posterior**; não encerrar nem integrar PR #1 automaticamente.

### Histórico e método

O [mapa original de 76 ficheiros](../source-map.json), o [README original de 29](../01-gestao/README-original-2026-11-08.md) e os [checkpoints operacionais](../../ops/) representam **estados de época**, não contagens vigentes. O gerador `scripts/refresh_documentation.py --check` prova correspondência dos indicadores deste snapshot com os JSON, mas não descarrega novamente fotografias.
