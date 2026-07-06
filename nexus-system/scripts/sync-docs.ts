import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..');
const NEXUS = resolve(ROOT, 'nexus-system');
const DOCS = resolve(NEXUS, 'docs');
const GOV = resolve(NEXUS, 'governance');
const GUIDE = resolve(DOCS, 'Nexus-System_GUIDE.md');
const SRC = resolve(ROOT, 'src', 'commands');

// ── CLI Flags ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const QUIET = args.includes('--quiet') || args.includes('-q');
const AUTO = args.includes('--auto');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

interface Discrepancy {
  type: 'missing_in_docs' | 'missing_in_fs' | 'wrong_count' | 'broken_reference';
  severity: 'error' | 'warning';
  message: string;
  file?: string;
  expected?: string;
  actual?: string;
}

const discrepancies: Discrepancy[] = [];

function error(message: string, file?: string, expected?: string, actual?: string) {
  discrepancies.push({
    type: 'missing_in_docs',
    severity: 'error',
    message,
    file,
    expected,
    actual,
  });
  if (!QUIET) console.error(`❌ ${message}`);
}

function warn(message: string, file?: string) {
  discrepancies.push({
    type: 'missing_in_docs',
    severity: 'warning',
    message,
    file,
  });
  if (!QUIET) console.warn(`⚠️  ${message}`);
}

function pass(message: string) {
  if (VERBOSE || (!QUIET && !AUTO)) {
    console.log(`✅ ${message}`);
  }
}

function log(message: string) {
  if (!QUIET) {
    console.log(message);
  }
}

// ── 1. Check documented directories exist ─────────────────────────────────
function checkDocumentedDirectories() {
  log('\n📁 Checking documented directories...\n');

  const guideContent = existsSync(GUIDE) ? readFileSync(GUIDE, 'utf-8') : '';

  const documentedDirs = [
    'governance/agents/',
    'governance/context/',
    'governance/contracts/',
    'governance/handoffs/',
    'governance/knowledge-graph/',
    'governance/policies/',
    'governance/premortem/',
    'governance/reviews/',
    'governance/rules/',
    'cognition/context/',
    'cognition/memory/',
    'cognition/prompts/',
    'core/complexity/',
    'docs/adrs/',
    'docs/feedback/',
    'docs/history/',
    'docs/runbooks/',
    'docs/skills/',
    'feedback/records/',
    'reports/',
    'scripts/',
    'telemetry/',
  ];

  for (const dir of documentedDirs) {
    const fullPath = resolve(NEXUS, dir);
    if (existsSync(fullPath)) {
      pass(`Directory exists: ${dir}`);
    } else {
      warn(`Directory documented but missing: ${dir}`);
    }
  }
}

// ── 2. Check undocumented directories exist ───────────────────────────────
function checkUndocumentedDirectories() {
  log('\n🔍 Checking for undocumented directories...\n');

  const nexusDirs = readdirSync(NEXUS).filter((f) => {
    try {
      return statSync(join(NEXUS, f)).isDirectory();
    } catch {
      return false;
    }
  });

  const documentedInGuide = [
    'cognition',
    'core',
    'docs',
    'feedback',
    'governance',
    'reports',
    'scripts',
    'session-feedback',
    'telemetry',
  ];

  for (const dir of nexusDirs) {
    if (!documentedInGuide.includes(dir)) {
      warn(`Directory exists but not documented in GUIDE: ${dir}/`);
    }
  }
}

// ── 3. Check CLI commands documented vs implemented ───────────────────────
function checkCLICommands() {
  log('\n🔧 Checking CLI commands...\n');

  if (!existsSync(SRC)) {
    warn('src/commands/ directory not found — skipping CLI check');
    return;
  }

  const implemented = readdirSync(SRC)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    .map((f) => f.replace(/\.(ts|tsx)$/, ''));

  const guideContent = existsSync(GUIDE) ? readFileSync(GUIDE, 'utf-8') : '';

  const documented = implemented.filter((cmd) =>
    guideContent.includes(`nexus ${cmd}`)
  );

  const undocumented = implemented.filter(
    (cmd) => !guideContent.includes(`nexus ${cmd}`)
  );

  pass(`${documented.length}/${implemented.length} commands documented`);

  if (undocumented.length > 0) {
    for (const cmd of undocumented) {
      warn(`Command implemented but not documented: nexus ${cmd}`);
    }
  }
}

// ── 4. Check skills count ─────────────────────────────────────────────────
function checkSkillsCount() {
  log('\n📚 Checking skills...\n');

  const skillsDir = resolve(DOCS, 'skills');
  if (!existsSync(skillsDir)) {
    warn('docs/skills/ directory not found');
    return;
  }

  const skills = readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
  const guideContent = existsSync(GUIDE) ? readFileSync(GUIDE, 'utf-8') : '';

  const countMatch = guideContent.match(/(\d+)\s*Competências\s*de\s*Engenharia/);
  const documentedCount = countMatch ? parseInt(countMatch[1], 10) : 0;

  if (skills.length === documentedCount) {
    pass(`Skills count matches: ${skills.length}`);
  } else {
    warn(`Skills count mismatch: ${skills.length} exist, ${documentedCount} documented`);
  }

  for (const skill of skills) {
    if (!guideContent.includes(skill)) {
      warn(`Skill not documented in GUIDE: ${skill}`);
    }
  }
}

// ── 5. Check for broken references ────────────────────────────────────────
function checkBrokenReferences() {
  log('\n🔗 Checking for broken references...\n');

  const guideContent = existsSync(GUIDE) ? readFileSync(GUIDE, 'utf-8') : '';

  const pathRefs = guideContent.match(/`([^`]+\.(?:md|ts|json|yaml))`/g) || [];
  const uniquePaths = [...new Set(pathRefs.map((r) => r.replace(/`/g, '')))];

  let brokenCount = 0;

  for (const ref of uniquePaths) {
    if (ref.includes('*') || ref.includes('<') || ref.includes('[')) continue;
    if (ref.includes('Nexus-System_GUIDE.md')) continue;

    const fullPath = resolve(NEXUS, ref);
    if (!existsSync(fullPath)) {
      const parentRef = ref.split('/').slice(0, -1).join('/');
      const parentPath = resolve(NEXUS, parentRef);
      if (!existsSync(parentPath)) {
        warn(`Broken reference: ${ref}`);
        brokenCount++;
      }
    }
  }

  if (brokenCount === 0) {
    pass('No broken references found');
  }
}

// ── 6. Generate report ────────────────────────────────────────────────────
function generateReport() {
  const report = {
    generated_at: new Date().toISOString(),
    mode: AUTO ? 'auto' : QUIET ? 'quiet' : 'manual',
    total_discrepancies: discrepancies.length,
    errors: discrepancies.filter((d) => d.severity === 'error').length,
    warnings: discrepancies.filter((d) => d.severity === 'warning').length,
    discrepancies,
  };

  const reportsDir = resolve(NEXUS, 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const reportPath = resolve(reportsDir, `doc-sync-${date}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Report saved to: ${reportPath}`);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  log('\n🔄 SYNC DOCS — Validating documentation sync\n');

  checkDocumentedDirectories();
  checkUndocumentedDirectories();
  checkCLICommands();
  checkSkillsCount();
  checkBrokenReferences();

  const errors = discrepancies.filter((d) => d.severity === 'error').length;
  const warnings = discrepancies.filter((d) => d.severity === 'warning').length;

  log(`\n📊 Summary: ${errors} errors, ${warnings} warnings`);

  if (errors > 0) {
    log('\n❌ Documentation sync failed\n');
    process.exit(1);
  } else if (warnings > 0) {
    log('\n⚠️  Documentation sync passed with warnings\n');
    process.exit(0);
  } else {
    log('\n✅ Documentation fully synced\n');
    process.exit(0);
  }
}

main();
