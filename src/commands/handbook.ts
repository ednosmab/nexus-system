/**
 * handbook.ts — Nexus Handbook CLI Command
 *
 * The `nexus handbook` command. Displays the interactive handbook
 * organized by abstraction levels.
 *
 * Usage:
 *   nexus handbook                  # Show full handbook index
 *   nexus handbook --level 1        # Only fundamentals
 *   nexus handbook --level 2        # Only commands
 *   nexus handbook --level 3        # Only architecture
 *   nexus handbook --topic init     # Search by topic
 *   nexus handbook --list           # List all available topics
 */

import { Command } from "commander";
import chalk from "chalk";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { banner } from "../formatting.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HANDBOOK_ROOT = join(__dirname, "..", "docs", "handbook");

// ── Types ──────────────────────────────────────────────────────────────────

interface HandbookTopic {
  level: number;
  levelName: string;
  category: string;
  file: string;
  title: string;
  description: string;
}

// ── Topic Registry ─────────────────────────────────────────────────────────

const TOPICS: HandbookTopic[] = [
  // Level 1 — Fundamentals
  { level: 1, levelName: "Fundamentos", category: "intro", file: "01-fundamentals/what-is-nexus.md", title: "O que é Nexus", description: "Definição, problema que resolve, para quem serve" },
  { level: 1, levelName: "Fundamentos", category: "intro", file: "01-fundamentals/installation.md", title: "Instalação", description: "Pré-requisitos, métodos de instalação, verificação" },
  { level: 1, levelName: "Fundamentos", category: "intro", file: "01-fundamentals/quick-start.md", title: "Primeiros Passos", description: "Init, status, detect, briefing, feedback" },
  { level: 1, levelName: "Fundamentos", category: "intro", file: "01-fundamentals/concepts.md", title: "Conceitos", description: "Maturity, capabilities, governance, knowledge debt" },

  // Level 2 — Commands
  { level: 2, levelName: "Comandos", category: "setup", file: "02-commands/setup.md", title: "Setup & Config", description: "init, mcp, upgrade, clean" },
  { level: 2, levelName: "Comandos", category: "analysis", file: "02-commands/analysis.md", title: "Status & Análise", description: "status, audit, doctor, assess, detect" },
  { level: 2, levelName: "Comandos", category: "pipeline", file: "02-commands/pipeline.md", title: "Pipeline & Execução", description: "run, evolve, act, plan" },
  { level: 2, levelName: "Comandos", category: "governance", file: "02-commands/governance.md", title: "Governança", description: "goal, decide, policy" },
  { level: 2, levelName: "Comandos", category: "reports", file: "02-commands/reports.md", title: "Relatórios", description: "console, report, digest, bench" },
  { level: 2, levelName: "Comandos", category: "ai", file: "02-commands/ai-integration.md", title: "Integração AI", description: "briefing, feedback, profile, dashboard, reminders" },
  { level: 2, levelName: "Comandos", category: "system", file: "02-commands/system.md", title: "Sistema", description: "validate, shell-init" },
  { level: 2, levelName: "Comandos", category: "docs", file: "02-commands/documentation.md", title: "Documentação", description: "docs-audit" },

  // Level 3 — Architecture
  { level: 3, levelName: "Arquitetura", category: "events", file: "03-architecture/event-system.md", title: "Sistema de Eventos", description: "Event bus, tipos de eventos, subscribe/publish" },
  { level: 3, levelName: "Arquitetura", category: "rules", file: "03-architecture/rule-engine.md", title: "Rule Engine", description: "Regras reativas, triggers, como criar regras" },
  { level: 3, levelName: "Arquitetura", category: "mcp", file: "03-architecture/mcp-server.md", title: "MCP Server", description: "Protocolo MCP, configuração, uso com AI agents" },
  { level: 3, levelName: "Arquitetura", category: "custom", file: "03-architecture/custom-rules.md", title: "Regras Customizadas", description: "Como criar regras próprias" },
  { level: 3, levelName: "Arquitetura", category: "contributing", file: "03-architecture/contributing.md", title: "Contribuindo", description: "Guia para contribuidores" },
];

// ── Display Helpers ────────────────────────────────────────────────────────

function displayIndex(): void {
  console.log("");
  banner("nexus handbook", "Manual de Referência");
  console.log("");

  console.log(chalk.bold("  Níveis de Abstração:"));
  console.log("");
  console.log(chalk.cyan("    1") + chalk.gray(" — Fundamentos     (para qualquer pessoa)"));
  console.log(chalk.cyan("    2") + chalk.gray(" — Comandos        (para developers)"));
  console.log(chalk.cyan("    3") + chalk.gray(" — Arquitetura     (para architects)"));
  console.log("");

  console.log(chalk.bold("  Uso:"));
  console.log(chalk.gray("    nexus handbook --level 1       # Apenas fundamentos"));
  console.log(chalk.gray("    nexus handbook --level 2       # Apenas comandos"));
  console.log(chalk.gray("    nexus handbook --level 3       # Apenas arquitetura"));
  console.log(chalk.gray("    nexus handbook --topic init    # Buscar por tópico"));
  console.log(chalk.gray("    nexus handbook --list          # Listar todos os tópicos"));
  console.log("");
}

function displayLevel(level: number): void {
  const topics = TOPICS.filter((t) => t.level === level);
  if (topics.length === 0) {
    console.log(chalk.red(`  Nível ${level} não encontrado.`));
    return;
  }

  const levelName = topics[0]!.levelName;

  console.log("");
  banner(`nexus handbook --level ${level}`, levelName);
  console.log("");

  for (const topic of topics) {
    const file_path = join(HANDBOOK_ROOT, topic.file);
    const exists = existsSync(file_path);

    const status = exists ? chalk.green("✅") : chalk.red("❌");
    const title = chalk.bold(topic.title);
    const desc = chalk.gray(topic.description);

    console.log(`  ${status} ${title}`);
    console.log(`     ${desc}`);
    console.log(chalk.gray(`     ${topic.file}`));
    console.log("");
  }
}

function listTopics(): void {
  console.log("");
  banner("nexus handbook", "Todos os Tópicos");
  console.log("");

  let currentLevel = 0;

  for (const topic of TOPICS) {
    if (topic.level !== currentLevel) {
      currentLevel = topic.level;
      console.log(chalk.bold.green(`  Nível ${topic.level} — ${topic.levelName}:`));
    }

    const file_path = join(HANDBOOK_ROOT, topic.file);
    const exists = existsSync(file_path);
    const status = exists ? chalk.green("✅") : chalk.red("❌");

    console.log(`    ${status} ${chalk.bold(topic.title)} — ${chalk.gray(topic.description)}`);
  }

  console.log("");
}

function searchTopic(query: string): void {
  const results = TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()) ||
      t.file.toLowerCase().includes(query.toLowerCase())
  );

  if (results.length === 0) {
    console.log(chalk.red(`  Nenhum resultado para "${query}".`));
    return;
  }

  console.log("");
  console.log(chalk.bold(`  Resultados para "${query}":`));
  console.log("");

  for (const topic of results) {
    const file_path = join(HANDBOOK_ROOT, topic.file);
    const exists = existsSync(file_path);
    const status = exists ? chalk.green("✅") : chalk.red("❌");

    console.log(`  ${status} ${chalk.bold(topic.title)} (Nível ${topic.level})`);
    console.log(`     ${chalk.gray(topic.description)}`);
    console.log(chalk.gray(`     ${topic.file}`));
    console.log("");
  }
}

// ── Command Export ─────────────────────────────────────────────────────────

export const handbookCommand = new Command("handbook")
  .description("Exibe o handbook de referência do Nexus")
  .option("--level <number>", "Mostrar apenas um nível (1, 2 ou 3)")
  .option("--topic <name>", "Buscar por tópico específico")
  .option("--list", "Listar todos os tópicos disponíveis")
  .action((options) => {
    if (options.list) {
      listTopics();
      return;
    }

    if (options.topic) {
      searchTopic(options.topic);
      return;
    }

    if (options.level) {
      const level = parseInt(options.level, 10);
      if (level < 1 || level > 3) {
        console.log(chalk.red("  Nível inválido. Use 1, 2 ou 3."));
        return;
      }
      displayLevel(level);
      return;
    }

    displayIndex();
  });
