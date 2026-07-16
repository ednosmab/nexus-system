# Relatório de Avaliação — shiten audit

**Autor:** Buffy (AI Assistant)
**Data:** 2026-07-16
**Contexto:** Auditoria enterprise executada em 4 níveis (quick, standard, code-review, enterprise)

---

## 1. Resumo Executivo

O `shiten audit` é uma ferramenta de auditoria abrangente que combina detecção de bugs, qualidade de código, segurança, governança e supply chain num único comando. Com 170 detectores no nível enterprise, é uma das ferramentas de auditoria mais completas que já analisei.

**Nota Geral: 7.5/10**

| Aspecto | Nota | Comentário |
|---|---|---|
| Cobertura | 9/10 | 170 detectores cobrem código, docs, governança, segurança, supply chain |
| Velocidade | 7/10 | 58s para enterprise é aceitável, mas pode melhorar com cache |
| Precisão | 6/10 | Falsos positivos em unsafe_deserialize e unused_export |
| Acçãoabilidade | 8/10 | Cada issue tem location, description, recommendation |
| Integração | 9/10 | Bem integrado com governance, backlog, health-score |
| Apresentação | 7/10 | Output limpo, mas score pode confundir (59/100 para projecto funcional) |

---

## 2. Análise Detalhada

### 2.1 Pontos Fortes

#### Cobertura Única no Mercado
Não conheço outra ferramenta que audite **código + documentação + governança + supply chain + segurança** num único comando. O shiten audit faz isso com 170 detectores organizados em 4 níveis:

- **quick** (97/100): Verificações básicas — buffer stale, datas placeholder, .gitignore
- **standard** (62/100): + broken refs, empty dirs, orphan modules, console usage
- **code-review** (60/100): + complexity, SRP, dead code, taint flow
- **enterprise** (59/100): + SBOM, OWASP, SOC2, NIST, LGPD, circuit breaker, race conditions

#### Sistema de Detectores Bem Arquitetado
O `detector-map.ts` permite registar novos detectores dinamicamente. O `DETECTORS_BY_LEVEL` em `constants.ts` controla quais detectores correm em cada nível. Isto permite:
- Adicionar novos detectores sem alterar o código existente
- Controlar granularmente o que corre em cada nível
- Testar detectores individualmente

#### Output Accionável
Cada issue tem:
- `type`: Categoria do problema (ex: `path_traversal`, `empty_catch`)
- `severity`: 1 (info), 2 (warning), 3 (critical)
- `description`: Descrição legível do problema
- `location`: Ficheiro e linha exacta
- `recommendation`: Como corrigir

O modo `--json` permite automação e o `--auto-backlog` regista issues directamente no BACKLOG.md.

#### Integração com Governance
O audit não é uma ferramenta isolada — está integrado com:
- `health-score-registry.ts`: Histórico de scores
- `suggestion-engine.ts`: Sugestões automáticas de fix
- `knowledge-graph.ts`: Análise de dependências entre artefactos
- `backlog-writer.ts`: Auto-registo no BACKLOG.md

---

### 2.2 Pontos a Melhorar

#### 1. Score Final (59/100) É Enganoso
O score de 59/100 para um projecto funcional com 2000+ testes passando e lint limpo parece baixo. O problema é que o score mistura:
- **Bugs reais** (path_traversal, XSS) com
- **Debt técnico** (unused exports, empty catch blocks) com
- **Sugestões de optimização** (complexity warnings)

**Sugestão:** Criar scores separados:
- **Score de Funcionalidade:** Bugs, segurança, dados (peso alto)
- **Score de Qualidade:** Código, docs, governance (peso médio)
- **Score de Optimização:** Performance, best practices (peso baixo)

#### 2. Ruido Alto (76% Info)
Das 863 issues, 659 (76%) são "info". O utilizador vê "863 problemas" mas na realidade a maioria são sugestões. Isto cria "alert fatigue".

**Sugestão:** Output padrão mostra apenas critical + warning. Info disponível com `--verbose`.

#### 3. Falsos Positivos em `unsafe_deserialize`
67 instâncias de `JSON.parse` detectadas como "unsafe", mas muitas são parse de JSON estático (config files, fixtures, dados hardcoded). O detector não distingue:
```typescript
JSON.parse(input_utilizador)    // ❌ Real risk
JSON.parse('{"key": "value"}') // ✅ Safe (static data)
JSON.parse(configFile)          // ⚠️ Depends on context
```

**Sugestão:** Análise de fluxo de dados (taint analysis) mais precisa — só flagar quando o input vem de fonte externa.

#### 4. `unused_export` (399 instâncias) Étoo AgGRESSIVE
399 exports marcados como "unused" inclui:
- Barrel exports (re-exports para backward compatibility)
- Types e interfaces usados em testes
- Funções públicas da API que podem ser usadas por consumidores externos

**Sugestão:** Excluir barrel exports, types, e exports de módulos públicos da contagem.

#### 5. Falta de Trends e Comparação
O audit mostra o estado actual mas não compara com auditorias anteriores. Não sabemos se o score subiu ou desceu.

**Sugestão:** Guardar histórico de scores e mostrar tendência:
```
Score: 59/100 (↑3 vs. 2026-07-15, ↓2 vs. 2026-07-01)
```

#### 6. Duração do Enterprise (58s)
58s é aceitável mas poderia ser optimizado com:
- Cache incrementar (só re-analisar ficheiros modificados)
- Paralelização de detectores independentes
- Lazy loading de detectores enterprise

#### 7. Detecção de Circular Deps Limitada
Só encontrou 2 circular dependencies para 257 ficheiros. Ferramentas como `madge` ou `dpdm` são mais precisas.

**Sugestão:** Integrar `madge` como detector de circular deps para maior precisão.

---

### 2.3 Comparação com Outras Ferramentas

| Aspecto | shiten audit | ESLint | SonarQube | CodeClimate |
|---|---|---|---|---|
| **Scope** | Code + Docs + Governance + Security + Supply Chain | Code only | Code + Security | Code + Security |
| **Detectors** | 170 | ~200 rules | ~500 rules | ~300 rules |
| **Speed** | 58s (enterprise) | ~5s | ~30s | ~20s |
| **Cost** | Gratuito | Gratuito | Pago (SaaS) | Pago (SaaS) |
| **Docs Audit** | ✅ Unique | ❌ | ❌ | ❌ |
| **Governance** | ✅ Unique | ❌ | ❌ | ❌ |
| **Supply Chain** | ✅ SBOM, licenças | ❌ | ✅ | ✅ |
| **Integration** | ✅ Backlog, health-score | ✅ CI/CD | ✅ CI/CD | ✅ CI/CD |

**Conclusão:** O shiten audit é **único** na capacidade de auditar documentação e governança. Nenhuma outra ferramenta faz isso.

---

## 3. Recomendações

### Prioridade Alta
1. **Separar scores** (funcionalidade vs. qualidade vs. optimização)
2. **Reducir ruido** (info só com --verbose)
3. **Melhorar taint analysis** (reduzir falsos positivos em unsafe_deserialize)

### Prioridade Média
4. **Adicionar trends** (comparação com auditorias anteriores)
5. **Cache incrementar** (só re-analisar ficheiros modificados)
6. **Integrar madge** para circular deps mais precisas

### Prioridade Baixa
7. **Excluir barrel exports** de unused_export
8. **Output HTML** para relatórios visuais
9. **Integração com GitHub PRs** (comentar issues directamente no PR)

---

## 4. Veredicto Final

O `shiten audit` é uma ferramenta **pioneira** na auditoria holística de projectos. A capacidade de combinar código, documentação, governança e segurança num único comando é única. Os falsos positivos e o ruido são problemas menores que podem ser refinados.

**Para um projecto em fase de crescimento como shitenno-go, o audit é indispensável.** Ele revela problemas que nenhuma outra ferramenta detectaria (broken refs em docs, dead rules, stale buffers, system map mismatches).

**Nota: 7.5/10** — Excelente conceito, boa execução, com espaço para refinamento.

---

*Buffy — Strategic Coding Assistant*
*freebuff.com*
