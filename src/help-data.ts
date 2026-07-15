/**
 * help-data.ts — Command help metadata for shiten help system
 *
 * Categories, descriptions, usage examples, and tips for each command.
 * Used by the custom help formatter in bin/shiten.ts.
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
    description: "Initialize and configure your Shiten project",
    commands: [
      {
        name: "init",
        description: "Initialize Shiten ecosystem with maturity-based discovery",
        usage: "shiten init [options]",
        examples: [
          "shiten init                          # Interactive setup",
          "shiten init --dir ./my-project        # Initialize specific directory",
          "shiten init --answers-file config.json # Non-interactive mode",
        ],
        tips: [
          "Run this first to set up governance in your project",
          "If already initialized, re-runs maturity questionnaire",
        ],
      },
      {
        name: "mcp",
        description: "MCP server for AI agents — start server or install globally",
        usage: "shiten mcp [options] [command]",
        examples: [
          "shiten mcp                    # Start MCP server",
          "shiten mcp --project-root .   # Specify project root",
          "shiten mcp install            # Install MCP Filesystem server",
          "shiten mcp install --check    # Check installation status",
          "shiten mcp install --upgrade  # Upgrade to latest version",
        ],
        tips: [
          "Connect your AI agent to this server for live project context",
          "Run 'shiten mcp install' once to fix MCP timeout issues",
        ],
      },
      {
        name: "upgrade",
        description: "Add capabilities to your governance ecosystem",
        usage: "shiten upgrade [options]",
        examples: [
          "shiten upgrade                          # Show available capabilities",
          "shiten upgrade --capability architecture # Install specific capability",
          "shiten upgrade --accept-recommended     # Install all recommended",
        ],
      },
      {
        name: "clean",
        description: "Clear shiten cache and temporary files",
        usage: "shiten clean [options]",
        examples: [
          "shiten clean              # Clear all cache",
          "shiten clean --dry-run    # Preview what would be deleted",
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
        usage: "shiten status [options]",
        examples: [
          "shiten status              # Full health report",
          "shiten status --json       # JSON output",
          "shiten status --no-cache   # Skip cache, recalculate",
        ],
      },
      {
        name: "audit",
        description: "Audit governance health, knowledge graph, and issues",
        usage: "shiten audit [options]",
        examples: [
          "shiten audit               # Full audit with health score",
          "shiten audit --json        # JSON output for CI/CD",
        ],
        tips: [
          "Shows health score (0-100), issues, and knowledge graph status",
          "Run periodically to track governance health over time",
        ],
      },
      {
        name: "doctor",
        description: "Engineering mentor — identify risks and suggest improvements",
        usage: "shiten doctor [options]",
        examples: [
          "shiten doctor              # Full diagnostic report",
          "shiten doctor --json       # JSON output",
        ],
      },
      {
        name: "assess",
        description: "Re-evaluate project maturity and recommend new capabilities",
        usage: "shiten assess [options]",
        examples: [
          "shiten assess              # Interactive re-assessment",
          "shiten assess --json       # JSON output",
        ],
        tips: [
          "Run when your project has grown to discover new capabilities",
        ],
      },
      {
        name: "detect",
        description: "Detect patterns in history and propose candidate rules",
        usage: "shiten detect [options]",
        examples: [
          "shiten detect              # Analyze history for patterns",
          "shiten detect --json       # JSON output",
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
        usage: "shiten run [options]",
        examples: [
          "shiten run                 # Run full pipeline",
          "shiten run --json          # JSON output",
        ],
        tips: [
          "Combines all analysis stages in one command",
          "Useful for CI/CD or periodic health checks",
        ],
      },
      {
        name: "evolve",
        description: "Show evolution recommendations and manage feedback",
        usage: "shiten evolve [options]",
        examples: [
          "shiten evolve              # Show recommendations",
          "shiten evolve --json       # JSON output",
        ],
      },
      {
        name: "act",
        description: "Execute actions with idempotency guarantees",
        usage: "shiten act [options]",
        examples: [
          "shiten act create --title 'Fix auth' --action-type bugfix",
          "shiten act list            # List all actions",
        ],
      },
      {
        name: "plan",
        description: "Manage coordinated action sequences (plans)",
        usage: "shiten plan <subcommand> [options]",
        examples: [
          "shiten plan create my-plan           # Create a plan",
          "shiten plan execute <plan-id>        # Execute a plan",
          "shiten plan list                     # List all plans",
          "shiten plan show <plan-id>           # Show plan details",
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
        usage: "shiten goal <subcommand> [options]",
        examples: [
          "shiten goal create --title 'Improve tests' --priority high",
          "shiten goal list            # List all goals",
          "shiten goal show <id>       # Show goal details",
        ],
      },
      {
        name: "decide",
        description: "Evaluate proposed actions using specialized evaluators",
        usage: "shiten decide <action> [options]",
        examples: [
          'shiten decide "upgrade auth to OAuth2"',
          'shiten decide "add rate limiting" --category security',
          "shiten decide list          # List all decisions",
        ],
        tips: [
          "Evaluates risk, impact, confidence, and goal alignment",
        ],
      },
      {
        name: "policy",
        description: "Manage and evaluate declarative governance policies",
        usage: "shiten policy <subcommand> [options]",
        examples: [
          "shiten policy list          # List all policies",
          "shiten policy evaluate      # Evaluate current state against policies",
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
        usage: "shiten console [options]",
        examples: [
          "shiten console              # Full console",
          "shiten console --days 30    # Last 30 days",
        ],
      },
      {
        name: "report",
        description: "Generate performance report for the user",
        usage: "shiten report [options]",
        examples: [
          "shiten report               # Full report",
          "shiten report --json        # JSON output",
        ],
      },
      {
        name: "digest",
        description: "Daily digest of project health and recent changes",
        usage: "shiten digest [options]",
        examples: [
          "shiten digest               # Today's digest",
          "shiten digest --json        # JSON output",
        ],
      },
      {
        name: "bench",
        description: "Benchmark token economy and Context Pipeline performance",
        usage: "shiten bench [options]",
        examples: [
          "shiten bench                # Run benchmark",
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
        usage: "shiten briefing [options]",
        examples: [
          "shiten briefing             # Full briefing",
          "shiten briefing --summary   # One-line summary",
          "shiten briefing --write     # Write to .shiten/BRIEFING.md",
          "shiten briefing --json      # JSON output",
        ],
        tips: [
          "Run at the start of each AI session for context",
        ],
      },
      {
        name: "feedback",
        description: "Report session outcome for the Context Pipeline feedback loop",
        usage: "shiten feedback [options]",
        examples: [
          'shiten feedback --outcome success',
          'shiten feedback --outcome failure --notes "type error in auth"',
        ],
      },
      {
        name: "profile",
        description: "View and update your user profile for personalized feedback",
        usage: "shiten profile [options]",
        examples: [
          "shiten profile              # Show current profile",
          "shiten profile --update     # Update profile interactively",
        ],
      },
      {
        name: "dashboard",
        description: "Interactive engineering dashboard with tabs, mouse, and accessibility",
        usage: "shiten dashboard [options]",
        examples: [
          "shiten dashboard            # Open interactive dashboard",
          "shiten dashboard --json     # JSON snapshot",
          "shiten dashboard --live 5   # Auto-refresh every 5s",
        ],
        tips: [
          "Navigate with arrow keys, Tab, numbers, or mouse",
          "Press 'q' to quit, 'r' to refresh",
        ],
      },
      {
        name: "reminders",
        description: "List, add, remove, and manage session reminders with priority and category",
        usage: "shiten reminders [options] [command]",
        examples: [
          "shiten reminders                                              # List all active reminders",
          'shiten reminders add "Run audit"                              # Add reminder (default: medium, feature)',
          'shiten reminders add "Fix auth bug" --priority high --category bug  # Add with priority and category',
          'shiten reminders add "Security review" --notify               # Add with desktop notification',
          "shiten reminders rm 1                                         # Remove reminder by index",
          'shiten reminders rm --message "audit"                         # Remove by partial match',
          "shiten reminders clear                                        # Remove all reminders",
          "shiten reminders --json                                       # Output as JSON",
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
        usage: "shiten validate [options]",
        examples: [
          "shiten validate             # Validate current session",
          "shiten validate --json      # JSON output",
        ],
      },
      {
        name: "shell-init",
        description: "Output shell hooks for session tracking",
        usage: "shiten shell-init [options]",
        examples: [
          "shiten shell-init           # Show shell hooks",
          "Add to .bashrc/.zshrc: eval $(shiten shell-init)",
        ],
      },
      {
        name: "handbook",
        description: "Exibe o handbook de referência do Shiten",
        usage: "shiten handbook [options]",
        examples: [
          "shiten handbook              # Show full handbook index",
          "shiten handbook --level 1    # Apenas fundamentos",
          "shiten handbook --level 2    # Apenas comandos",
          "shiten handbook --level 3    # Apenas arquitetura",
          "shiten handbook --topic init # Buscar por tópico",
          "shiten handbook --list       # Listar todos os tópicos",
        ],
        tips: [
          "Nível 1: Para qualquer pessoa (o que é, instalação, primeiros passos)",
          "Nível 2: Para developers (referência de comandos)",
          "Nível 3: Para architects (arquitetura interna)",
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
        usage: "shiten docs-audit [options]",
        examples: [
          "shiten docs-audit              # Dry-run: show proposed moves",
          "shiten docs-audit --apply      # Apply moves with confirmation",
          "shiten docs-audit --json       # Output as JSON",
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
