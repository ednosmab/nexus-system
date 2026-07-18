/**
 * help-data.ts — Command help metadata for shugo help system
 *
 * Categories, descriptions, usage examples, and tips for each command.
 * Used by the custom help formatter in bin/shugo.ts.
 */

export interface CommandHelp {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  tips?: string[];
}

export interface CommandCategory {
  name: string;
  description: string;
  commands: CommandHelp[];
}

export const COMMAND_CATEGORIES: CommandCategory[] = [
  {
    name: "Setup & Configuration",
    description: "Initialize and configure your Shugo project",
    commands: [
      {
        name: "init",
        description: "Initialize Shugo ecosystem with maturity-based discovery",
        usage: "shugo init [options]",
        examples: [
          "shugo init                          # Interactive setup",
          "shugo init --dir ./my-project        # Initialize specific directory",
          "shugo init --answers-file config.json # Non-interactive mode",
        ],
        tips: [
          "Run this first to set up governance in your project",
          "If already initialized, re-runs maturity questionnaire",
        ],
      },
      {
        name: "mcp",
        description: "MCP server for AI agents — start server or install globally",
        usage: "shugo mcp [options] [command]",
        examples: [
          "shugo mcp                    # Start MCP server",
          "shugo mcp --project-root .   # Specify project root",
          "shugo mcp install            # Install MCP Filesystem server",
          "shugo mcp install --check    # Check installation status",
          "shugo mcp install --upgrade  # Upgrade to latest version",
        ],
        tips: [
          "Connect your AI agent to this server for live project context",
          "Run 'shugo mcp install' once to fix MCP timeout issues",
        ],
      },
      {
        name: "upgrade",
        description: "Add capabilities to your governance ecosystem",
        usage: "shugo upgrade [options]",
        examples: [
          "shugo upgrade                          # Show available capabilities",
          "shugo upgrade --capability architecture # Install specific capability",
          "shugo upgrade --accept-recommended     # Install all recommended",
        ],
      },
      {
        name: "clean",
        description: "Clear shugo cache and temporary files",
        usage: "shugo clean [options]",
        examples: [
          "shugo clean              # Clear all cache",
          "shugo clean --dry-run    # Preview what would be deleted",
        ],
      },
    ],
  },
  {
    name: "Status & Analysis",
    description: "Check project health, maturity, and patterns",
    commands: [
      {
        name: "status",
        description: "Check governance health status with maturity score",
        usage: "shugo status [options]",
        examples: [
          "shugo status              # Full health report",
          "shugo status --json       # JSON output",
          "shugo status --no-cache   # Skip cache, recalculate",
        ],
      },
      {
        name: "audit",
        description: "Audit governance health, knowledge graph, and issues",
        usage: "shugo audit [options]",
        examples: [
          "shugo audit               # Full audit with health score",
          "shugo audit --json        # JSON output for CI/CD",
        ],
        tips: [
          "Shows health score (0-100), issues, and knowledge graph status",
          "Run periodically to track governance health over time",
        ],
      },
      {
        name: "doctor",
        description: "Engineering mentor — identify risks and suggest improvements",
        usage: "shugo doctor [options]",
        examples: [
          "shugo doctor              # Full diagnostic report",
          "shugo doctor --json       # JSON output",
        ],
      },
      {
        name: "assess",
        description: "Re-evaluate project maturity and recommend new capabilities",
        usage: "shugo assess [options]",
        examples: [
          "shugo assess              # Interactive re-assessment",
          "shugo assess --json       # JSON output",
        ],
        tips: [
          "Run when your project has grown to discover new capabilities",
        ],
      },
      {
        name: "detect",
        description: "Detect patterns in history and propose candidate rules",
        usage: "shugo detect [options]",
        examples: [
          "shugo detect              # Analyze history for patterns",
          "shugo detect --json       # JSON output",
        ],
      },
    ],
  },
  {
    name: "Pipeline & Execution",
    description: "Run analysis pipelines and execute governance actions",
    commands: [
      {
        name: "run",
        description: "Run the full analysis pipeline (analyze → score → detect → audit → evolve)",
        usage: "shugo run [options]",
        examples: [
          "shugo run                 # Run full pipeline",
          "shugo run --json          # JSON output",
        ],
        tips: [
          "Combines all analysis stages in one command",
          "Useful for CI/CD or periodic health checks",
        ],
      },
      {
        name: "evolve",
        description: "Show evolution recommendations and manage feedback",
        usage: "shugo evolve [options]",
        examples: [
          "shugo evolve              # Show recommendations",
          "shugo evolve --json       # JSON output",
        ],
      },
      {
        name: "act",
        description: "Execute actions with idempotency guarantees",
        usage: "shugo act [options]",
        examples: [
          "shugo act create --title 'Fix auth' --action-type bugfix",
          "shugo act list            # List all actions",
        ],
      },
      {
        name: "plan",
        description: "Manage coordinated action sequences (plans)",
        usage: "shugo plan <subcommand> [options]",
        examples: [
          "shugo plan create my-plan           # Create a plan",
          "shugo plan execute <plan-id>        # Execute a plan",
          "shugo plan list                     # List all plans",
          "shugo plan show <plan-id>           # Show plan details",
        ],
      },
    ],
  },
  {
    name: "Governance",
    description: "Manage goals, decisions, and policies",
    commands: [
      {
        name: "goal",
        description: "Manage governance goals",
        usage: "shugo goal <subcommand> [options]",
        examples: [
          "shugo goal create --title 'Improve tests' --priority high",
          "shugo goal list            # List all goals",
          "shugo goal show <id>       # Show goal details",
        ],
      },
      {
        name: "decide",
        description: "Evaluate proposed actions using specialized evaluators",
        usage: "shugo decide <action> [options]",
        examples: [
          'shugo decide "upgrade auth to OAuth2"',
          'shugo decide "add rate limiting" --category security',
          "shugo decide list          # List all decisions",
        ],
        tips: [
          "Evaluates risk, impact, confidence, and goal alignment",
        ],
      },
      {
        name: "policy",
        description: "Manage and evaluate declarative governance policies",
        usage: "shugo policy <subcommand> [options]",
        examples: [
          "shugo policy list          # List all policies",
          "shugo policy evaluate      # Evaluate current state against policies",
        ],
      },
    ],
  },
  {
    name: "Reports & Dashboards",
    description: "View reports, dashboards, and digests",
    commands: [
      {
        name: "console",
        description: "Token economy console with session metrics",
        usage: "shugo console [options]",
        examples: [
          "shugo console              # Full console",
          "shugo console --days 30    # Last 30 days",
        ],
      },
      {
        name: "report",
        description: "Generate performance report for the user",
        usage: "shugo report [options]",
        examples: [
          "shugo report               # Full report",
          "shugo report --json        # JSON output",
        ],
      },
      {
        name: "digest",
        description: "Daily digest of project health and recent changes",
        usage: "shugo digest [options]",
        examples: [
          "shugo digest               # Today's digest",
          "shugo digest --json        # JSON output",
        ],
      },
      {
        name: "bench",
        description: "Benchmark token economy and Context Pipeline performance",
        usage: "shugo bench [options]",
        examples: [
          "shugo bench                # Run benchmark",
        ],
      },
    ],
  },
  {
    name: "AI Integration",
    description: "Briefings, feedback, and AI agent tools",
    commands: [
      {
        name: "briefing",
        description: "Pre-session briefing for AI agents (Context Pipeline)",
        usage: "shugo briefing [options]",
        examples: [
          "shugo briefing             # Full briefing",
          "shugo briefing --summary   # One-line summary",
          "shugo briefing --write     # Write to .shugo/BRIEFING.md",
          "shugo briefing --json      # JSON output",
        ],
        tips: [
          "Run at the start of each AI session for context",
        ],
      },
      {
        name: "feedback",
        description: "Report session outcome for the Context Pipeline feedback loop",
        usage: "shugo feedback [options]",
        examples: [
          'shugo feedback --outcome success',
          'shugo feedback --outcome failure --notes "type error in auth"',
        ],
      },
      {
        name: "profile",
        description: "View and update your user profile for personalized feedback",
        usage: "shugo profile [options]",
        examples: [
          "shugo profile              # Show current profile",
          "shugo profile --update     # Update profile interactively",
        ],
      },
      {
        name: "dashboard",
        description: "Interactive engineering dashboard with tabs, mouse, and accessibility",
        usage: "shugo dashboard [options]",
        examples: [
          "shugo dashboard            # Open interactive dashboard",
          "shugo dashboard --json     # JSON snapshot",
          "shugo dashboard --live 5   # Auto-refresh every 5s",
        ],
        tips: [
          "Navigate with arrow keys, Tab, numbers, or mouse",
          "Press 'q' to quit, 'r' to refresh",
        ],
      },
      {
        name: "reminders",
        description: "List, add, remove, and manage session reminders with priority and category",
        usage: "shugo reminders [options] [command]",
        examples: [
          "shugo reminders                                              # List all active reminders",
          'shugo reminders add "Run audit"                              # Add reminder (default: medium, feature)',
          'shugo reminders add "Fix auth bug" --priority high --category bug  # Add with priority and category',
          'shugo reminders add "Security review" --notify               # Add with desktop notification',
          "shugo reminders rm 1                                         # Remove reminder by index",
          'shugo reminders rm --message "audit"                         # Remove by partial match',
          "shugo reminders clear                                        # Remove all reminders",
          "shugo reminders --json                                       # Output as JSON",
        ],
        tips: [
          "Priorities: high (🔴), medium (🟡), low (🟢) — default is medium",
          "Categories: bug (🐛), feature (✨), debt (🔧), security (🔒), docs (📝), infra (⚙️)",
          "High priority reminders trigger desktop notifications on session start",
          "Reminders appear in the briefing sorted by priority (high → low)",
        ],
      },
    ],
  },
  {
    name: "System",
    description: "Shell integration and system utilities",
    commands: [
      {
        name: "validate",
        description: "Validate session integrity and governance rules",
        usage: "shugo validate [options]",
        examples: [
          "shugo validate             # Validate current session",
          "shugo validate --json      # JSON output",
        ],
      },
      {
        name: "shell-init",
        description: "Output shell hooks for session tracking",
        usage: "shugo shell-init [options]",
        examples: [
          "shugo shell-init           # Show shell hooks",
          "Add to .bashrc/.zshrc: eval $(shugo shell-init)",
        ],
      },
      {
        name: "handbook",
        description: "Exibe o handbook de referência do Shugo",
        usage: "shugo handbook [options]",
        examples: [
          "shugo handbook              # Show full handbook index",
          "shugo handbook --level 1    # Apenas fundamentos",
          "shugo handbook --level 2    # Apenas comandos",
          "shugo handbook --level 3    # Apenas arquitetura",
          "shugo handbook --topic init # Buscar por tópico",
          "shugo handbook --list       # Listar todos os tópicos",
        ],
        tips: [
          "Nível 1: Para qualquer pessoa (o que é, instalação, primeiros passos)",
          "Nível 2: Para developers (referência de comandos)",
          "Nível 3: Para architects (arquitetura interna)",
        ],
      },
      {
        name: "daemon",
        description: "Manage the Shugo background daemon (start/stop/status)",
        usage: "shugo daemon [options] [command]",
        examples: [
          "shugo daemon start          # Start the daemon in the background",
          "shugo daemon stop           # Stop the daemon gracefully",
          "shugo daemon status         # Show daemon status and uptime",
          "shugo daemon restart        # Restart the daemon",
        ],
        tips: [
          "O daemon é opcional — todos os comandos funcionam sem ele",
          "Use 'shugo daemon status' para verificar se está a correr",
          "Monitoriza ficheiros, sessões, saúde e desafios em tempo real",
        ],
      },
    ],
  },
  {
    name: "Documentation",
    description: "Manage documentation lifecycle and organization",
    commands: [
      {
        name: "docs-audit",
        description: "Audit documentation lifecycle status and propose organization",
        usage: "shugo docs-audit [options]",
        examples: [
          "shugo docs-audit              # Dry-run: show proposed moves",
          "shugo docs-audit --apply      # Apply moves with confirmation",
          "shugo docs-audit --json       # Output as JSON",
        ],
        tips: [
          "Run this periodically to keep documentation organized",
          "Use --apply only after reviewing the dry-run report",
          "Documents are classified as: planned, in_progress, completed, superseded, stale",
        ],
      },
    ],
  },
];

/**
 * Find a command by name across all categories.
 */
export function findCommand(name: string): CommandHelp | undefined {
  for (const cat of COMMAND_CATEGORIES) {
    const cmd = cat.commands.find((c) => c.name === name);
    if (cmd) return cmd;
  }
  return undefined;
}

/**
 * Get all command names.
 */
export function getAllCommandNames(): string[] {
  const names: string[] = [];
  for (const cat of COMMAND_CATEGORIES) {
    for (const cmd of cat.commands) {
      names.push(cmd.name);
    }
  }
  return names;
}
