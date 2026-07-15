import { Link } from 'react-router-dom'

const essentialCommands = [
  {
    name: 'shiten init',
    purpose: 'Initialize governance in a project',
    when: 'First time setup — run once per project',
    example: 'shiten init',
    details: 'Detects stack, generates maturity profile, creates governance structure.',
  },
  {
    name: 'shiten status',
    purpose: 'Health check + complexity scoring',
    when: 'During development, before important commits',
    example: 'shiten status',
    details: 'Shows governance health, maturity score, and complexity analysis.',
  },
  {
    name: 'shiten run',
    purpose: 'Full 5-stage pipeline execution',
    when: 'Periodic health audits — weekly or after major changes',
    example: 'shiten run',
    details: 'Analyse → Score → Detect → Audit → Evolve.',
  },
]

const advancedCommands = [
  {
    name: 'shiten upgrade',
    purpose: 'Add governance capabilities',
    when: 'When you need more features',
    example: 'shiten upgrade --capability knowledge',
  },
  {
    name: 'shiten validate',
    purpose: 'Session integrity check',
    when: 'Before important commits or deploys',
    example: 'shiten validate',
  },
  {
    name: 'shiten detect',
    purpose: 'Pattern detection from history',
    when: 'Find recurring errors and reverted decisions',
    example: 'shiten detect',
  },
  {
    name: 'shiten audit',
    purpose: 'Self-evaluation of governance',
    when: 'Find dead rules, violation hotspots',
    example: 'shiten audit',
  },
  {
    name: 'shiten evolve',
    purpose: 'Adaptive recommendations',
    when: 'Get next-step suggestions based on maturity',
    example: 'shiten evolve',
  },
  {
    name: 'shiten assess',
    purpose: 'Re-evaluate maturity profile',
    when: 'After major changes to the project',
    example: 'shiten assess',
  },
  {
    name: 'shiten doctor',
    purpose: 'System diagnostics',
    when: 'When something feels off',
    example: 'shiten doctor',
  },
  {
    name: 'shiten sync',
    purpose: 'Sync governance from external source',
    when: 'Multi-project setups',
    example: 'shiten sync',
  },
  {
    name: 'shiten clean',
    purpose: 'Clean cache and temp files',
    when: 'Housekeeping',
    example: 'shiten clean',
  },
  {
    name: 'shiten report',
    purpose: 'Generate reports',
    when: 'Sharing status with stakeholders',
    example: 'shiten report',
  },
]

export default function Commands() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Commands</h1>
        <p className="text-text-secondary max-w-2xl">
          These 3 commands cover 90% of daily use. The rest are for specific situations.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Essential</h2>
        {essentialCommands.map(cmd => (
          <div key={cmd.name} className="layer-card space-y-3">
            <div className="flex items-center gap-2">
              <code className="text-accent font-mono text-sm font-bold">{cmd.name}</code>
              <span className="px-2 py-0.5 rounded-full bg-accent-subtle text-accent text-[10px] font-medium">ESSENTIAL</span>
            </div>
            <p className="text-sm text-text-secondary">{cmd.purpose}</p>
            <div className="flex flex-col gap-1">
              <div className="text-xs text-text-muted">When to use:</div>
              <p className="text-xs text-text-secondary">{cmd.when}</p>
            </div>
            <div className="command-block">{cmd.example}</div>
            <p className="text-xs text-text-muted">{cmd.details}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text-primary">Advanced</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {advancedCommands.map(cmd => (
            <div key={cmd.name} className="layer-card space-y-2">
              <code className="text-accent font-mono text-xs font-bold">{cmd.name}</code>
              <p className="text-sm text-text-secondary">{cmd.purpose}</p>
              <p className="text-xs text-text-muted">{cmd.when}</p>
            </div>
          ))}
        </div>
      </section>

      <Link to="/use/best-practices" className="btn btn-primary">
        Best practices
      </Link>
    </div>
  )
}
