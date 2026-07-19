# PLAN-2026-07-18 — Bloco H: Validação Cross-Project e Cross-Platform

**Status:** Done
**Date:** 2026-07-18
**Updated_at:** 2026-07-19T03:30:00.000Z

**Por que este bloco existe:** os Blocos A-G corrigem e protegem o sistema *contra si mesmo* — tudo foi verificado dentro do próprio repositório do Shugo, dogfooding em cima da própria `.shitenno/`. Nenhum dos blocos anteriores testa o único cenário que decide se o produto cumpre seu objetivo: **instalar em um projeto de terceiro que nunca viu essa ferramenta antes.** Duas lacunas concretas, confirmadas no código:

1. **Zero teste de scaffold completo em diretório genuinamente vazio.** `cli-integration.test.ts` (`describe("shugo init")`) só testa *detecção* de estado (`"already initialized"`, mensagens de warning) — nunca roda `scaffoldShitenno()` (`src/scaffolder.ts`, chamado em `commands/init.ts:277`) até o fim num diretório limpo e verifica se o resultado é usável (templates presentes, `shugo status` funciona depois, daemon sobe).
2. **Zero tratamento de plataforma.** `grep -rn "process.platform" src bin` retorna vazio — nenhuma diferenciação Linux/macOS/Windows em lugar nenhum. `notify-send` (dependência do Linux/`libnotify`) está hardcoded em 3 arquivos (`commands/reminders.ts`, `commands/shell-init.ts`, `commands/plan.ts`) com falha silenciosa fora do Linux — funcionalmente inofensivo (não quebra nada), mas significa que todo o sistema de notificação do Bloco F (F.5, F.7) simplesmente **nunca aparece** para quem instala num Mac ou Windows, sem nenhum aviso disso em lugar nenhum.

O `README.md` já é honesto sobre isso — "built and validated for solo use... has not been tested with real users yet" — mas isso significa que a resposta pra "vai funcionar de ponta a ponta instalado em outro projeto" é hoje **não verificado**, não "sim".

---

## H.1 — Teste E2E de scaffold completo em diretório vazio

**Ficheiro:** `src/__tests__/cli-integration.test.ts`, dentro de `describe("shugo init")`

```typescript
it("scaffolds a fully usable project from a clean directory", async () => {
  const dir = join(tmpdir(), `shitenno-e2e-fresh-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  dirs.push(dir);

  // Simula um projeto de terceiro real: package.json mínimo, sem nada do Shugo.
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "third-party-app", version: "1.0.0" }, null, 2));
  writeFileSync(join(dir, "index.js"), "console.log('hello');\n");

  const initResult = await runShugo("init --yes --dir " + dir); // ou os flags reais que pulam prompts interativos
  expect(initResult.exitCode).toBe(0);

  // O scaffold precisa ter criado a estrutura mínima usável:
  expect(existsSync(join(dir, ".shitenno"))).toBe(true);
  expect(existsSync(join(dir, ".shitenno", "governance"))).toBe(true);
  expect(existsSync(join(dir, ".shitenno", "governance", "plans"))).toBe(true);
  expect(existsSync(join(dir, ".shitenno", "governance", "rule-manifest.yaml"))).toBe(true);

  // E precisa ser funcional de imediato, não só ter arquivos:
  const statusResult = await runShugo("status --json", dir);
  const status = JSON.parse(statusResult.stdout);
  expect(status.initialized).toBe(true);

  const auditResult = await runShugo("audit --level basic", dir);
  expect(auditResult.exitCode).toBe(0);
});
```

Ajustar os nomes de flag reais de `initCommand` (`src/commands/init.ts:126`) — conferir se existe um `--yes`/`--non-interactive` que pula os prompts do `ora`/inquirer; se não existir, é um pré-requisito deste bloco (sem isso não dá pra automatizar o teste, e sem o teste automatizado não dá pra confiar no scaffold em CI).

**Critério de aceite:** o teste roda em CI (sem interação humana), cobre o caminho que hoje só é validado manualmente pelo próprio autor, e falha alto e claro se `scaffoldShitenno()` regredir.

---

## H.2 — Matriz de plataforma no CI

**Ficheiro:** `.github/workflows/ci.yml`

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install -g pnpm && pnpm install --ignore-scripts
      - run: npm run build
      - run: npx vitest run
```

Isso não elimina o gap de `notify-send` — só garante que build/testes core não quebram por assunção de shell POSIX ou path separator em plataforma diferente. É o piso mínimo antes de sequer discutir suporte de terceiros.

**Nota separada, não bloqueante para este bloco:** os scripts `.sh` (`scripts/check-file-size.sh`, `templates/base/scripts/close-session.ts` chamado via shell) e o `.husky/pre-commit` assumem ambiente POSIX. Em Windows isso normalmente funciona via Git Bash (que o Git for Windows já instala), mas nunca foi verificado — o job `windows-latest` acima é o primeiro sinal real disso, mesmo que só cubra build/test, não os scripts de shell.

---

## H.3 — Tornar a ausência de notificação visível, não silenciosa

**Ficheiro:** `src/notify.ts` (já planejado no Bloco F.7.1)

```typescript
import { execFileSync } from "node:child_process";
import { platform } from "node:os";
import type { ReminderPriority } from "./briefing.js";
import { logger } from "./logger.js";

let warnedUnsupportedPlatform = false;

export function sendDesktopNotification(title: string, message: string, priority: ReminderPriority = "medium"): void {
  if (platform() !== "linux") {
    // Não falha, não bloqueia nada — mas registra UMA vez por processo, em debug,
    // em vez de falhar silenciosamente sempre. Quem instalar em Mac/Windows
    // consegue descobrir isso olhando o log, em vez de nunca saber que
    // notificações de plano bloqueado/pendente simplesmente não existem pra eles.
    if (!warnedUnsupportedPlatform) {
      logger.debug("notify", `Desktop notifications requerem notify-send (Linux). Plataforma atual: ${platform()}. Reminders de alta prioridade continuam visíveis via "shugo briefing" e "shugo reminders".`);
      warnedUnsupportedPlatform = true;
    }
    return;
  }

  try {
    const urgency = priority === "high" ? "critical" : priority === "low" ? "low" : "normal";
    execFileSync("notify-send", [title, message, `--urgency=${urgency}`], { stdio: "pipe", timeout: 2000 });
  } catch {
    // notify-send não instalado mesmo em Linux (ex.: ambiente headless/servidor) — falha silenciosa aqui é correta.
  }
}
```

**Critério de aceite:** rodar em macOS/Windows não produz nenhum erro visível (comportamento igual a hoje), mas `shugo --verbose` ou o log de debug mostra explicitamente por que notificações não aparecem, em vez de deixar isso como mistério pra quem não é o autor original do projeto.

---

## H.4 — Protocolo de validação manual em projeto real (não é código, é processo)

Isso é o que o `README.md` já promete fazer antes de atualizar as claims de "team usage" — formalizar como checklist executável, não deixar como intenção vaga:

1. Escolher **um projeto real, de stack diferente** do próprio Shugo (ex.: um repo Python ou um repo JS de framework diferente — não outro projeto Node/TS parecido, isso não testa generalização).
2. Rodar `shugo init` do zero, sem nenhuma ajuda do autor original, seguindo só o que está documentado.
3. Registrar cada ponto de fricção: mensagem de erro confusa, comando que assume algo que não existe no projeto alvo (ex.: `package.json`, quando o projeto é Python), documentação que pressupõe conhecimento prévio.
4. Rodar por pelo menos uma semana de uso real (não só o `init`) — é quando o daemon, os reminders, o backlog modular e o gate do Bloco F realmente são exercitados em condição real, não em teste isolado.
5. Só depois disso, atualizar o `README.md` de "not tested with real users yet" para uma claim com número real — e não antes, porque essa frase hoje é a única parte do projeto que está sendo mais honesta que o resto do processo de "done".

**Critério de aceite:** existe um documento (`docs/VALIDATION_LOG.md` ou similar) com data, projeto usado (anonimizado se necessário), fricções encontradas e o que foi corrigido por causa delas — prova de que a validação aconteceu, no mesmo espírito do `.verification.json` do Bloco F: não confiar na alegação, confiar no registro.

---

## Resposta às três perguntas, resumida

- **"Ligado de ponta a ponta"?** Não ainda — os Blocos A-G resolvem tudo *dentro* do próprio repo; H.1-H.4 são o que falta pra validar o *fora*, que é o objetivo real do produto.
- **"Eficiência garantida"?** Nenhum sistema de software garante isso — o máximo alcançável é "verificado" (testes passam, build passa, gate impede regressão conhecida). "Garantida" não é uma palavra que deveria aparecer em nenhum plano ou changelog deste projeto daqui pra frente; é o mesmo tipo de excesso de confiança que gerou o problema original desta auditoria.
- **Eu, operando dentro desse projeto depois de instalado em terceiros?** Ainda não plenamente confiante — não pelos blocos A-G (esses eu confiaria, uma vez implementados e testados), mas especificamente pelos dois gaps deste bloco: scaffold nunca testado ponta a ponta em diretório limpo, e zero validação fora da própria stack Node/TS do autor. São exatamente o tipo de coisa que só aparece quando alguém de fora tenta usar — e "alguém de fora" é, por definição, o único público que não pode ser simulado dentro do próprio repositório.
