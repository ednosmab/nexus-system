# Audits

> **Directório:** `shitenno-go/docs/audits/`
> **Propósito:** Armazenar resultados de auditorias do projecto

---

## Descrição

Este directório contém os relatórios de auditoria gerados pelo comando `shiten audit`.

## Tipos de Auditoria

| Tipo | Comando | Descrição |
|------|---------|-----------|
| **code-review** | `shiten audit` | Auditoria completa de código |
| **health** | `shiten audit --health` | Verificação de saúde do projecto |
| **security** | `shiten audit --security` | Auditoria de segurança |

## Estrutura

```
audits/
├── README.md                    # Este ficheiro
├── audit-YYYY-MM-DD.json       # Relatório de auditoria (futuro)
└── audit-YYYY-MM-DD.md         # Relatório formatado (futuro)
```

## Notas

- Directório criado automaticamente durante a inicialização
- Relatórios são gerados conforme necessidade

---

*Última actualização: 2026-07-10*
