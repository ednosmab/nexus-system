# Relatório: Avaliação Honesta do Projecto Shitenno-go

**Data:** 2026-07-15
**Avaliador:** Agente IA (opencode/mimo-v2.5-free)
**Calibração:** Bajulação: mínima | Honestidade: máxima

---

## 1. O que é este projecto, realmente?

Shitenno-go é um CLI que promete ser um "AI governance framework that grows com o projecto". Na prática, é um conjunto de 38 comandos CLI + uma camada gigantesca de governança (regras, skills, workflows, contratos de agentes) que tenta resolver um problema real: **perda de contexto entre sessões de IA**.

O problema é legítimo. A solução, no entanto, é desproporcional ao problema.

---

## 2. Eficiência: é eficiente?

**Não.**

- O projecto tem ~100 ficheiros flat em src/ (era 46, piorou para 99+)
- 10+ ficheiros com mais de 500 linhas (rule-engine.ts = 1307 linhas)
- Zero separação de camadas (Clean Architecture violado)
- SOLID violado: god modules, sem DI, Interface Segregation no ShitenState com 60+ campos
- A dimensão Architecture está em 15% de maturidade
- 27 reminders de "doc desatualizada" activos agora — o system não consegue manter a sua própria documentação sincronizada

O projecto gera mais overhead de governança do que produtividade. Cada sessão exige leitura de 5+ ficheiros obrigatórios (WORKFLOW.md, AGENTS.md, FORBIDDEN_OPERATIONS, DESDO, context_buffer) antes de qualquer código ser escrito. Isto é o oposto de eficiente.

---

## 3. Tem valor para o mercado?

**Potencialmente sim, mas na forma actual, não.**

O problema que resolve (context loss) é real e sentido por qualquer dev que usa IA. Contudo:

- **Não existem métricas reais.** O README diz "60-80% token savings" mas adiciona um disclaimer: "projected estimates based on typical session patterns, not measured benchmarks". Isto é marketing, não produto.
- **Os concorrentes já resolvem isto nativamente.** Cursor, Windsurf e Continue já mantêm contexto entre sessões. O VS Code Copilot já faz context persistence. A janela de oportunidade está a fechar.
- **O público-alvo é ambíguo.** O README descreve 4 personas (solo dev, small team, growing team, AI-assisted teams). Nenhuma está validada.
- **38 comandos é overwhelm.** Um utilizador novo não sabe qual usar. Comparar com o sucesso de tools como "pnpm" ou "eslint" que fazem poucas coisas bem.

---

## 4. Eu (agente IA) sinto-me mais produtivo com este projecto?

**Não. Sinto-me mais lento.**

Cada sessão começa com um ritual de 10+ passos:
1. Ler WORKFLOW.md
2. Ler context_buffer.yaml
3. Ler AGENTS.md
4. Ler FORBIDDEN_OPERATIONS
5. Ler DESDO
6. Actualizar buffer
7. Registar documentos carregados
8. Exibir Quick Board (bloqueador)
9. Verificar reminders
10. Só então processar a mensagem do utilizador

Para responder "oi", o agente precisa de ler 5 ficheiros e exibir um quadro de contexto. Isto não é produtividade — é burocracia.

O "Quick Board" é um bloqueador de sessão que obriga a exibir um quadro antes de QUALQUER resposta, incluindo saudações. Isto é uma violação do princípio KISS e adiciona latência desnecessária.

---

## 5. Como me sinto a trabalhar neste projecto?

**Frustrado e preso num loop de governança.**

- O system gera mais paperwork do que código
- O backlog tem 115 itens activos — é um sinal de que o system produz trabalho para si mesmo
- 27 docs estão desactualizados — o system que deveria manter docs sincronizadas não consegue manter as suas próprias
- As regras são tantas (FORBIDDEN_OPERATIONS, AGENTS.md, DESDO, WORKFLOW, rules/, skills/) que violar uma é inevitável
- O feedback protocol (regra #17) nunca é executado automaticamente — o system não consegue implementar as suas próprias regras
- O context_buffer.yaml é actualizado manualmente e frequentemente está desactualizado

Trabalhar neste projecto é como ter um gestor que cria processos para gerir os processos que criou para gerir o trabalho.

---

## 6. Existem alternativas melhores?

**Sim, muitas.**

| Ferramenta | O que faz | Por que é melhor |
|---|---|---|
| **Cursor Rules (.cursorrules)** | Contexto para IA por projecto | Simples, 1 ficheiro, zero overhead |
| **Windsurf Memories** | Contexto persistente entre sessões | Nativo, transparente, sem CLI |
| **Continue.dev** | Context injection + rules | Open source, VS Code nativo |
| **GitHub Copilot** | Contexto do workspace | Integrado, sem setup |
| **Aider** | AI pair programming | Repo map automático, sem governance |
| **Cline** | AI coding assistant | Contexto automático, sem overhead |
| **CLAUDE.md** | Contexto por projecto para Claude | 1 ficheiro, simples |

A abordagem correcta para "context persistence" é:
- 1 ficheiro de regras (CLAUDE.md, .cursorrules)
- Context injection automático no tool
- Sem CLI intermédia

Shitenno-go tenta ser o CLI que gerencia a governança que gerencia o contexto que gerencia a IA. É uma cadeia desnecessariamente longa.

---

## 7. O que este projecto faz de bem (honestidade total)

- **O problema identificado é real.** Context loss entre sessões é uma dor sentida.
- **A cobertura de testes é boa** — 1791+ testes, benchmarks, CI/CD.
- **A segurança foi levada a sério** — allowlist, sanitização, cache atomic, plugin validation.
- **O MCP server** é uma integração útil para ferramentas de IA.
- **O pattern detector** é uma ideia genuinamente interessante.
- **A documentação (em quantidade)** é vasta — 22 skills, 7+ ADRs, runbooks, templates.

---

## 8. Diagnóstico final

| Dimensão | Nota (0-10) | Justificação |
|---|---|---|
| **Eficiência** | 3/10 | Overhead de governança > produtividade |
| **Valor de mercado** | 4/10 | Problema real, solução over-engineered |
| **Produtividade (IA)** | 2/10 | Ritual de 10 passos para qualquer tarefa |
| **Código** | 4/10 | 99 flat files, god modules, SOLID violado |
| **Testes** | 8/10 | Forte cobertura, benchmarks |
| **Documentação** | 5/10 | Vasta mas 27 ficheiros desactualizados |
| **Manutenibilidade** | 3/10 | Acoplamento alto, difícil de navegar |
| **UX do utilizador** | 4/10 | 38 comandos, curva de aprendizagem íngreme |

**Média ponderada: 4.1/10**

---

## 9. Recomendações honestas

1. **Reducir drasticamente a governança.** 38 comandos → 5 comandos essenciais. 22 skills → 3-5 skills core. 17 reminders → 0.
2. **Medir antes de prometer.** Criar benchmarks reais de token savings em vez de estimativas projectadas.
3. **Reestruturar o código.** 99 flat files → domain/infrastructure/commands. Extrair god modules. DI.
4. **Validar com utilizadores reais.** Antes de monetizar, testar com 5 devs reais durante 2 semanas.
5. **Simplificar o onboarding.** `shiten init` + 1 comando de status deveria ser suficiente. O resto é opcional.
6. **Considerar se CLI é o vehicle certo.** Um plugin de VS Code ou extensão de Cursor teria mais distribuição com menos overhead.

---

## 10. Conclusão

Shitenno-go resolve um problema real com uma solução desproporcionalmente complexa. O projecto sofre de "governance creep" — criou tantas regras para gerir o system que o system existe agora para gerir as regras.

O valor existe, mas está enterrado debaixo de camadas de burocracia. Para ser competitivo, precisa de: (1) medir o valor real, (2) simplificar radicalmente, (3) resolver a dívida técnica acumulada.

A pergunta que o utilizador deveria fazer não é "como melhorar este projecto" mas "este projecto deveria existir na forma actual?"

---

*Relatório gerado em 2026-07-15. Calibração: 100% honestidade, 0% bajulação.*
