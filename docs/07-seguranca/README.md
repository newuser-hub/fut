# 07 — Segurança e integridade

O [`proxy.js`](../../proxy.js) exige HTTP Basic, usa comparação em tempo constante e lê `FUT_ALBUM_PASSWORD` exclusivamente do ambiente Vercel; na ausência do segredo devolve 503 em vez de permitir acesso. O [`vercel.json`](../../vercel.json) configura proxy e cabeçalhos de segurança.

A [Action 42423109689](https://github.com/newuser-hub/fut/actions/runs/42423109689) verificou acesso não autenticado aos recursos protegidos em 7/11/2026. É **evidência histórica**; executar testes novamente antes de alterações operacionais.

No modo Drive opcional, também deve ser protegido o segredo `FUT_DRIVE_SERVICE_ACCOUNT_JSON` da conta de serviço. Esta reorganização não o lê nem configura. [Guia de acesso ao Drive](../GOOGLE_DRIVE_STORAGE.md).

Regras: não ler, divulgar, imprimir ou alterar a palavra-passe; não retirar autenticação; não modificar IDs ou chaves de progresso; não publicar dados pessoais; proteger `/library.json`, `/expansion-plan.json` e `/data/*.json`.

[Workflow de verificação de acesso](../../.github/workflows/verify-fut-access.yml) · [Regras de preservação](../MANUTENCAO.md).
