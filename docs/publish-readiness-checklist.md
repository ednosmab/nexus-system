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
  - `bin/shiten.ts` → apontar para `dist/shiten.js` (usuário final não tem `tsx`)
  - NÃO incluir: `plans/`, `shitenno-go/` de teste, `src/`, `docs/` internos
- [ ] **`"bin"` aponta para `dist/shiten.js`** já buildado
- [ ] **`"main"` e `"exports"` apontam para `dist/shiten.js`**

## Validação antes do primeiro publish

- [ ] `npm run build` completa sem erros
- [ ] `npm pack --dry-run` mostra um tarball limpo:
  - Sem arquivos de desenvolvimento/teste
  - Sem `plans/`, `src/`, `docs/` internos
  - Com `dist/templates/` (necessário para `shiten init`)
- [ ] `node dist/shiten.js --help` funciona (sem `tsx`)
- [ ] `node dist/shiten.js --version` mostra a versão correcta
- [ ] `npx shitenno-go --help` funciona (teste de instalação global)

## Pós-publish

- [ ] Verificar em `npmjs.com/package/shitenno-go`
- [ ] Testar `npm install -g shitenno-go` numa máquina limpa
- [ ] Testar `shiten init` numa pasta limpa
- [ ] Verificar que `dist/templates/` está incluído no tarball
- [ ] Actualizar README.md com instruções de instalação

## Notas

- O build script já copia templates: `tsup && rm -rf dist/templates && cp -r src/templates dist/templates`
- O `prepublishOnly` já corre o build automático
- Workspaces (`"workspaces": ["apps/*"]`) pode causar problemas com `npm publish` — considerar remover ou ajustar
