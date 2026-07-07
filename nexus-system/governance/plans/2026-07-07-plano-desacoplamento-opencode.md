# Plano — Desacoplamento do `opencode.json` e Achados Fora de Escopo

**Origem:** sessão de auditoria contínua sobre o `nexus-system-main`, motivada por uma pergunta específica ("o sistema funciona sem `opencode.json`?"). A resposta era não, e a investigação pra corrigir isso destravou uma cadeia de outros problemas que não estavam no pedido original. Este documento separa **o que foi pedido** do **que apareceu no caminho**, pra você decidir o que revisar com mais cuidado antes de aceitar.

**Como foi verificado:** tudo abaixo marcado ✅ foi testado rodando o código de verdade (build, `npx vitest run`, `nexus init`/`status`/`audit`/`clean`/`mcp` em projetos reais) — não é leitura de diff.

---

## PARTE A — O que foi pedido: desacoplar o CLI de `opencode.json`

### A.1 Diagnóstico confirmado por execução

Removendo `opencode.json` de um projeto com `nexus-system/` totalmente populado (regras, docs, governança intactos), o CLI tratava o projeto inteiro como **nunca inicializado**: `status`, `audit`, `clean` recusavam rodar. Causa raiz: `isInitialized` e `detectLifecycleState` exigiam `existsSync(opencode.json) && existsSync(nexus-system/)` — as duas condições, não uma.

### A.2 Correções aplicadas

| # | Arquivo | Mudança |
|---|---|---|
| 1 | `src/shared.ts` | `isInitialized` passa a depender só de `existsSync(nexus-system/)`. |
| 2 | `src/nexus-state-machine.ts` | `detectLifecycleState` — removida a mesma checagem redundante de `opencode.json`. Parâmetro `projectRoot` ficou sem uso; prefixado `_projectRoot` (convenção já aceita pelo lint/tsconfig do projeto) em vez de alterar a assinatura e mexer nos 8 call sites. |
| 3 | `src/analyser.ts` | Campo `hasNexus` checava `opencode.json` (nome não batia com o que checava). Corrigido pra checar `nexus-system/` de verdade. Campo não tinha nenhum consumidor no código — fix de correção, não de comportamento observável. |
| 4 | `src/capability-engine.ts` | Achado lateral: a lista de arquivos-sinal da capability `core` procurava `opencode.json` **dentro** de `nexus-system/`, onde ele nunca existiu (fica na raiz do projeto) — checagem morta por path errado desde sempre. Trocado por `docs/BACKLOG.md` (real, sempre presente sob `core` após o fix do item B.1). |

### A.3 Testes atualizados (travavam o comportamento antigo por design)

| Arquivo | Antes | Depois |
|---|---|---|
| `src/__tests__/cli-integration.test.ts` | Exigia que `nexus-system/` sozinho fosse "not initialized" | Reescrito pra exigir o oposto: `nexus-system/` sozinho = inicializado, `status` roda normal |
| `src/__tests__/constants.test.ts` | Testava gate morto do `sync` | Trocado por teste que confirma a ausência da entrada morta |

### A.4 Validação final

- Lint limpo, `tsc --noEmit` limpo, suíte completa **1194/1194 passando** (zero regressão).
- Ponta a ponta, projeto novo, `opencode.json` removido: `status` (mostra 1 aviso entre 6 checks, não bloqueia mais), `audit --level full`, `goal create`, `nexus mcp` — todos funcionando.
- Caminho inverso (arquivo presente) — sem regressão, check aparece `✔` normalmente.

### A.5 O que isso NÃO resolve ainda (para o plano de portabilidade completa)

- **Roteamento de modelo por papel** (plan/build/orchestrator/review, hoje só no `opencode.json`) não tem equivalente universal entre Claude Code, Cursor, Antigravity — continua sendo um adaptador específico do opencode, por natureza do problema, não por falta de esforço.
- **Registro de MCP servers** (`nexus-mcp` próprio + `local-filesystem` genérico) hoje só é escrito no `opencode.json`. O servidor em si já é 100% agnóstico (testado via stdio, protocolo puro) — falta gerar o arquivo de registro certo por ferramenta-alvo (`.mcp.json`, `.cursor/mcp.json`, `mcp_config.json`). Não implementado ainda, é o próximo passo natural.

---

## PARTE B — Achados fora do escopo original, corrigidos ao longo da investigação

Estes não foram pedidos nesta rodada — apareceram porque testar de verdade (rodar `init`/`audit`/suíte completa) expôs problemas adjacentes. Cada um tem sua própria verificação, listada pra você conferir independentemente.

### B.1 `docs/BACKLOG.md` nunca era criado (bug de path no scaffolder)
`capability-mapping.ts` tinha `{ src: "nexus-system/docs/BACKLOG.md", dest: "docs/BACKLOG.md" }` — o `src` real do template não tem o prefixo `nexus-system/`, e o `dest` correto (o que `rule-engine.ts` de fato lê) é `nexus-system/docs/BACKLOG.md`. Como o scaffolder pula silenciosamente arquivos-fonte ausentes, o arquivo nunca era copiado em nenhum projeto, mesmo sob `core` (sempre instalada). **Corrigido e testado** (`nexus init` limpo → arquivo aparece no lugar certo).

### B.2 Falso positivo de XSS no próprio detector
`SECURITY_DETECTOR_SELF_PATHS` listava `src/health-auditor.ts` e `src/audit/taint/`, mas não `src/audit/engineering-detectors.ts` — o arquivo que contém os próprios padrões regex de XSS, que por isso se autoacusava ao rodar `audit` no próprio repo. **Corrigido e testado** (rodei `audit --level full --json` no próprio repo antes/depois — falso positivo eliminado).

### B.3 Teste quebrado + resíduo morto do comando `sync`
`cli-integration.test.ts` esperava `"sync"` no `--help`, mas o comando foi removido do CLI em algum momento anterior a esta sessão (não está em `bin/nexus.ts`). `constants.ts` ainda tinha `sync: "governed"` em `COMMAND_GATES`, uma entrada morta. **Ambos corrigidos** (teste atualizado, entrada removida).

### B.4 `src/commands/sync.ts` — comando órfão, não corrigido, decisão pendente
Ao investigar o item B.3, encontrei que o comando `sync` **ainda existe, completo e funcional** (gate de lifecycle ligado, lógica real), só não está registrado em `bin/nexus.ts`. Não decidi por conta própria se ele deveria voltar a ser exposto ou ser removido de vez — não há indício nos planos anteriores de que a remoção do registro tenha sido intencional (o plano que tratou do `doc-sync-hook` não menciona isso). **Precisa de decisão sua.**

### B.5 Causa raiz do OOM em `npx vitest run` — resolvida, não só contornada
O CI já tinha um paliativo (`--max-old-space-size=8192`). Verifiquei que a causa raiz (recriação de `ts.Program` do TypeScript Compiler API a cada teste, sem liberar memória) foi de fato corrigida via um `programCache` estático no `TaintAnalyzer` (cache por hash de tsconfig + mtimes dos arquivos). **Testado**: suíte completa roda sem OOM mesmo sem o paliativo de memória.

### B.6 Fórmula de `healthScore` recalibrada
Não saturava mais em 0 com poucos criticals — testei 6 cenários (de "0 issues" a "10 criticals em projeto pequeno") e a curva responde de forma gradual, com amortecimento por `sqrt` e normalização por tamanho do projeto.

### B.7 Rule Engine — regras reais persistidas, mas ações ainda falham silenciosamente em tiers baixos
As 10 regras default (`RULE-001` a `RULE-010`) têm lógica real e são persistidas em disco (testado via `nexus init`). Mas ações como `log_event` (precisa de `nexus-system/docs/history/`) e `create_reminder` (precisa de `governance/context/context_buffer.yaml`) dependem de arquivos que só existem sob as capabilities `metrics`/`governance`, que não são instaladas em todos os tiers — então falham silenciosamente (`existsSync` retorna falso, ação vira no-op) em perfis como `junior-solo`. **Não corrigido** — depende de uma decisão de design (mover esses arquivos pra `core`, ou gatear as próprias regras por capability). Fica registrado aqui pra você decidir; não é urgente dado o escopo mais modesto do projeto (ver Parte C).

### B.8 Event Bus — 10 de 34 eventos declarados nunca são publicados
Recalculado do zero cruzando toda publicação (`.publish(...)`) contra a lista de tipos declarados. `RULE-005` depende de um evento (`knowledge_debt.detected`/`debt.detected`) que nunca é publicado — a regra nunca dispara. **Não corrigido** — rebaixado de prioridade depois que você esclareceu que orquestração multi-agente não é objetivo do projeto (ver Parte C). Vira backlog de qualidade interna, não bloqueio de produto.

---

## PARTE C — Contexto de escopo (pra quem for revisar o motivo das prioridades acima)

Durante a sessão, ficou definido que o Nexus **não** persegue orquestração de múltiplos agentes internamente — isso ficaria a cargo de um plugin externo de terceiros, se algum dia fizer sentido. O papel do Nexus se limita a (1) facilitar troca de modo/modelo do agente, e (2) fornecer contexto/documentação de forma organizada. Isso é o que justifica os itens B.7 e B.8 estarem com prioridade rebaixada — eles importariam mais numa visão de coordenação multi-agente que foi conscientemente descartada.

---

## Ordem sugerida para o agente

1. **B.1, B.2, B.3** — já corrigidos e testados nesta sessão, só revisar o diff e integrar.
2. **Parte A (1–4)** — já corrigidos e testados, revisar e integrar.
3. **B.4** — decidir com você antes de tocar: restaurar `sync` ou apagar `sync.ts`.
4. **A.5** — implementar o gerador de registro MCP multi-formato (próximo passo natural do desacoplamento, ainda não feito).
5. **B.7, B.8** — backlog, sem urgência dado o escopo atual do projeto.
6. Extritamente após a conclusão desse plano e o sucesso total em todos os testes, deve marcá-lo como done e mover para o diretório done. 