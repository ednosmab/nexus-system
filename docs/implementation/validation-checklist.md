# 28 — VALIDATION CHECKLIST

> Validation checklist per capability.

## Core Capability

- [ ] `opencode.json` exists at project root
- [ ] `shitenno-go/` directory exists
- [ ] `shitenno-go/docs/AGENTS.md` exists
- [ ] `shitenno-go/docs/FORBIDDEN_OPERATIONS.md` exists (from `src/templates/base/docs/FORBIDDEN_OPERATIONS.md`)
- [ ] `shitenno-go/docs/DESDO.md` exists
- [ ] `shitenno-go/docs/CONCEPTUAL_MODEL.md` exists
- [ ] `shitenno-go/docs/KNOWLEDGE_LIFECYCLE.md` exists
- [ ] `shitenno-go/docs/BACKLOG.md` exists
- [ ] `shitenno-go/governance/SYSTEM_MAP.md` exists
- [ ] `shitenno-go/docs/opencode-context.md` exists
- [ ] `shitenno-go/docs/Shitenno-go_GUIDE.md` exists
- [ ] `shitenno-go/core/complexity/types.ts` exists
- [ ] `shitenno-go/docs/feedback/README.md` exists

## Knowledge Capability

- [ ] `shitenno-go/docs/skills/` directory exists
- [ ] At least 1 skill file present
- [ ] Skills match project stack

## Architecture Capability

- [ ] `shitenno-go/docs/adrs/` directory exists
- [ ] `shitenno-go/docs/adrs/ADR-TEMPLATE.md` exists
- [ ] `shitenno-go/docs/sdr/` directory exists
- [ ] `shitenno-go/docs/sdr/SDR-TEMPLATE.md` exists
- [ ] `shitenno-go/governance/plans/` directory exists
- [ ] `shitenno-go/governance/plans/TEMPLATE.md` exists

## Governance Capability

- [ ] `shitenno-go/governance/context/` directory exists
- [ ] `shitenno-go/governance/WORKFLOW.md` exists
- [ ] `shitenno-go/governance/context/context_buffer.yaml` exists
- [ ] Context buffer is valid YAML

## AI Capability

- [ ] `shitenno-go/governance/agents/` directory exists
- [ ] At least 1 agent contract exists
- [ ] Agent contracts are valid YAML
- [ ] `shitenno-go/governance/contracts/CONTRACTS_INDEX.md` exists
- [ ] `shitenno-go/governance/handoffs/TEMPLATE.md` exists
- [ ] `shitenno-go/cognition/context/CONTEXT_HIERARCHY.md` exists
- [ ] `shitenno-go/cognition/memory/MEM-operational-state-v1.json` exists

## Quality Capability

- [ ] `shitenno-go/scripts/validate-session.ts` exists
- [ ] Script is syntactically valid TypeScript

## Metrics Capability

- [ ] `shitenno-go/reports/` directory exists
- [ ] `shitenno-go/docs/history/` directory exists
- [ ] `shitenno-go/reports/README.md` exists

## Operations Capability

- [ ] `shitenno-go/docs/runbooks/` directory exists
- [ ] `shitenno-go/scripts/close-session.ts` exists
- [ ] `shitenno-go/scripts/premortem-check.ts` exists
- [ ] `shitenno-go/docs/runbooks/merge.md` exists

## Compliance Capability

- [ ] `shitenno-go/governance/premortem/` directory exists
- [ ] `shitenno-go/governance/premortem/PREMORTEM.md` exists
- [ ] `shitenno-go/governance/reviews/` directory exists
- [ ] `shitenno-go/governance/reviews/SESSION_REVIEW.md` exists

## System-Wide Checks

- [ ] `shiten status` runs without errors
- [ ] `shiten validate` passes all checks
- [ ] `shiten detect` completes successfully
- [ ] `shiten audit` completes successfully
- [ ] `shiten doctor` completes successfully
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All tests pass (`npm test`)
