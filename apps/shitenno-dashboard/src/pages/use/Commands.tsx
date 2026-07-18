import { Link } from 'react-router-dom'

const essentialCommands = [
  {
    name: 'shugo init',
    purpose: 'Initialize governance in a project',
    when: 'First time setup — run once per project',
    example: 'shugo init',
    details: 'Detects stack, generates maturity profile, creates governance structure.',
  },
  {
    name: 'shugo status',
    purpose: 'Health check + complexity scoring',
    when: 'During development, before important commits',
    example: 'shugo status',
    details: 'Shows governance health, maturity score, and complexity analysis.',
  },
  {
    name: 'shugo run',
    purpose: 'Full 5-stage pipeline execution',
    when: 'Periodic health audits — weekly or after major changes',
    example: 'shugo run',
    details: 'Analyse → Score → Detect → Audit → Evolve.',
  },
]

const advancedCommands = [
  {
    name: 'shugo upgrade',
    purpose: 'Add governance capabilities',
    when: 'When you need more features',
    example: 'shugo upgrade --capability knowledge',
  },
  {
    name: 'shugo validate',
    purpose: 'Session integrity check',
    when: 'Before important commits or deploys',
    example: 'shugo validate',
  },
  {
    name: 'shugo detect',
    purpose: 'Pattern detection from history',
    when: 'Find recurring errors and reverted decisions',
    example: 'shugo detect',
  },
  {
    name: 'shugo audit',
    purpose: 'Self-evaluation of governance',
    when: 'Find dead rules, violation hotspots',
    example: 'shugo audit',
  },
  {
    name: 'shugo evolve',
    purpose: 'Adaptive recommendations',
    when: 'Get next-step suggestions based on maturity',
    example: 'shugo evolve',
  },
  {
    name: 'shugo assess',
    purpose: 'Re-evaluate maturity profile',
    when: 'After major changes to the project',
    example: 'shugo assess',
  },
  {
    name: 'shugo doctor',
    purpose: 'System diagnostics',
    when: 'When something feels off',
    example: 'shugo doctor',
  },
  {
    name: 'shugo sync',
    purpose: 'Sync governance from external source',
    when: 'Multi-project setups',
    example: 'shugo sync',
  },
  {
    name: 'shugo clean',
    purpose: 'Clean cache and temp files',
    when: 'Housekeeping',
    example: 'shugo clean',
  },
  {
    name: 'shugo report',
    purpose: 'Generate reports',
    when: 'Sharing status with stakeholders',
    example: 'shugo report',
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
