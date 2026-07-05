# Publish-Readiness Checklist

> **Data:** 2026-07-05
> **Propósito:** Guardar o checklist para quando a decisão de publicar for tomada.
> **Status:** ⏸ Aguarda conclusão das Fases 0-14 e decisão comercial.

---

## Pré-requisitos (bloqueadores)

- [ ] **Fases 0-14 concluídas** — não publicar com `digest`, `update`, ou `goal update --title` quebrados
- [ ] **`package.json` → `"private": false`** — só aplicar quando decidir publicar
- [ ] **`"files"` no `package.json`** lista só o necessário:
  - `dist/` (output do build)
  - `bin/nexus.ts` → apontar para `dist/nexus.js` (usuário final não tem `tsx`)
  - NÃO incluir: `plans/`, `nexus-system/` de teste, `src/`, `docs/` internos
- [ ] **`"bin"` aponta para `dist/nexus.js`** já buildado
- [ ] **`"main"` e `"exports"` apontam para `dist/nexus.js`**

## Validação antes do primeiro publish

- [ ] `npm run build` completa sem erros
- [ ] `npm pack --dry-run` mostra um tarball limpo:
  - Sem arquivos de desenvolvimento/teste
  - Sem `plans/`, `src/`, `docs/` internos
  - Com `dist/templates/` (necessário para `nexus init`)
- [ ] `node dist/nexus.js --help` funciona (sem `tsx`)
- [ ] `node dist/nexus.js --version` mostra a versão correcta
- [ ] `npx nexus-system --help` funciona (teste de instalação global)

## Pós-publish

- [ ] Verificar em `npmjs.com/package/nexus-system`
- [ ] Testar `npm install -g nexus-system` numa máquina limpa
- [ ] Testar `nexus init` numa pasta limpa
- [ ] Verificar que `dist/templates/` está incluído no tarball
- [ ] Actualizar README.md com instruções de instalação

## Notas

- O build script já copia templates: `tsup && rm -rf dist/templates && cp -r src/templates dist/templates`
- O `prepublishOnly` já corre o build automático
- Workspaces (`"workspaces": ["apps/*"]`) pode causar problemas com `npm publish` — considerar remover ou ajustar
