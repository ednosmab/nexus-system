import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  detectStatusMarkers,
  detectSemanticDuplication,
  classifyDocument,
  auditDocLifecycle,
  applyMoves,
  type DocumentInfo,
  type DetectionSignals,
} from "../doc-lifecycle-auditor.js";

let tempDir: string;
let nexusDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "nexus-doc-lifecycle-"));
  nexusDir = join(tempDir, "nexus-system");
  mkdirSync(nexusDir, { recursive: true });
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("detectStatusMarkers", () => {
  it("detects completed status from 'Status: Concluído'", () => {
    const content = "# Plan\n\n### 1.1 Feature\n- **Status:** Concluído\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("completed");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("detects completed status from 'Status: Completed'", () => {
    const content = "# Plan\n\n### 1.1 Feature\n- **Status:** Completed\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("completed");
  });

  it("detects planned status from 'Status: Pendente'", () => {
    const content = "# Plan\n\n### 1.1 Feature\n- **Status:** Pendente\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("planned");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("detects planned status from 'TODO'", () => {
    const content = "# Plan\n\nTODO: implement this feature\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("planned");
  });

  it("detects in_progress status from 'Status: Em andamento'", () => {
    const content = "# Plan\n\n### 1.1 Feature\n- **Status:** Em andamento\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("in_progress");
  });

  it("detects in_progress status from 'Status: In Progress'", () => {
    const content = "# Plan\n\n### 1.1 Feature\n- **Status:** In Progress\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("in_progress");
  });

  it("detects superseded status from 'Substituído por'", () => {
    const content = "# Plan\n\nSubstituído por: new-plan.md\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("superseded");
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("detects superseded status from 'Superseded by'", () => {
    const content = "# Plan\n\nSuperseded by: new-plan.md\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("superseded");
  });

  it("returns null when no status markers found", () => {
    const content = "# Plan\n\nThis is a simple document without status markers.\n";
    const result = detectStatusMarkers(content);
    expect(result.status).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("detects mixed status with majority completed", () => {
    const content = `# Plan

### 1.1 Feature
- **Status:** Concluído

### 1.2 Feature
- **Status:** Concluído

### 1.3 Feature
- **Status:** Pendente
`;
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("completed");
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it("detects mixed status with majority pending", () => {
    const content = `# Plan

### 1.1 Feature
- **Status:** Pendente

### 1.2 Feature
- **Status:** Pendente

### 1.3 Feature
- **Status:** Concluído
`;
    const result = detectStatusMarkers(content);
    expect(result.status).toBe("planned");
  });
});

describe("detectSemanticDuplication", () => {
  it("clusters documents with similar titles", () => {
    const docs: DocumentInfo[] = [
      { path: "plans/plan1.md", relativePath: "plans/plan1.md", title: "Nexus Evolution Plan", content: "" },
      { path: "plans/plan2.md", relativePath: "plans/plan2.md", title: "Nexus Evolution Strategy", content: "" },
      { path: "plans/plan3.md", relativePath: "plans/plan3.md", title: "Nexus Evolution Roadmap", content: "" },
    ];
    const clusters = detectSemanticDuplication(docs);
    expect(clusters.length).toBeGreaterThanOrEqual(1);
    expect(clusters[0]!.documents.length).toBeGreaterThanOrEqual(2);
  });

  it("does not cluster unrelated documents", () => {
    const docs: DocumentInfo[] = [
      { path: "docs/skills/tdd.md", relativePath: "docs/skills/tdd.md", title: "TDD Workflow", content: "" },
      { path: "docs/skills/ddd.md", relativePath: "docs/skills/ddd.md", title: "Domain Driven Design", content: "" },
      { path: "plans/evolution.md", relativePath: "plans/evolution.md", title: "Evolution Plan", content: "" },
    ];
    const clusters = detectSemanticDuplication(docs);
    expect(clusters.length).toBe(0);
  });

  it("handles empty document list", () => {
    const docs: DocumentInfo[] = [];
    const clusters = detectSemanticDuplication(docs);
    expect(clusters).toHaveLength(0);
  });
});

describe("classifyDocument", () => {
  it("classifies as completed when all items marked done", () => {
    const doc: DocumentInfo = {
      path: "plans/plan.md",
      relativePath: "plans/plan.md",
      title: "Plan",
      content: "# Plan\n\n### 1.1\n- **Status:** Concluído\n\n### 1.2\n- **Status:** Concluído\n",
    };
    const signals: DetectionSignals = {
      statusMarkers: { status: "completed", confidence: 0.9, evidence: ["Status: Concluído"] },
      crossReferences: [],
      gitCorrelation: { lastModified: new Date().toISOString(), referencedFilesExist: true, recentCommits: true },
      staleness: { ageInDays: 5, referencedByOtherDocs: true, recentCommits: true },
    };
    const classification = classifyDocument(doc, signals);
    expect(classification.status).toBe("completed");
    expect(classification.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("classifies as planned when all items pending", () => {
    const doc: DocumentInfo = {
      path: "plans/plan.md",
      relativePath: "plans/plan.md",
      title: "Plan",
      content: "# Plan\n\n### 1.1\n- **Status:** Pendente\n\n### 1.2\n- **Status:** Pendente\n",
    };
    const signals: DetectionSignals = {
      statusMarkers: { status: "planned", confidence: 0.9, evidence: ["Status: Pendente"] },
      crossReferences: [],
      gitCorrelation: { lastModified: new Date().toISOString(), referencedFilesExist: false, recentCommits: false },
      staleness: { ageInDays: 2, referencedByOtherDocs: false, recentCommits: false },
    };
    const classification = classifyDocument(doc, signals);
    expect(classification.status).toBe("planned");
  });

  it("classifies as in_progress when mix of done/pending", () => {
    const doc: DocumentInfo = {
      path: "plans/plan.md",
      relativePath: "plans/plan.md",
      title: "Plan",
      content: "# Plan\n\n### 1.1\n- **Status:** Concluído\n\n### 1.2\n- **Status:** Pendente\n",
    };
    const signals: DetectionSignals = {
      statusMarkers: { status: "in_progress", confidence: 0.7, evidence: ["Mixed status"] },
      crossReferences: [],
      gitCorrelation: { lastModified: new Date().toISOString(), referencedFilesExist: true, recentCommits: true },
      staleness: { ageInDays: 10, referencedByOtherDocs: true, recentCommits: true },
    };
    const classification = classifyDocument(doc, signals);
    expect(classification.status).toBe("in_progress");
  });

  it("classifies as stale when no references and old", () => {
    const doc: DocumentInfo = {
      path: "plans/old-plan.md",
      relativePath: "plans/old-plan.md",
      title: "Old Plan",
      content: "# Old Plan\n\nSome content without status markers.\n",
    };
    const signals: DetectionSignals = {
      statusMarkers: { status: null, confidence: 0, evidence: [] },
      crossReferences: [],
      gitCorrelation: { lastModified: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), referencedFilesExist: false, recentCommits: false },
      staleness: { ageInDays: 60, referencedByOtherDocs: false, recentCommits: false },
    };
    const classification = classifyDocument(doc, signals);
    expect(classification.status).toBe("stale");
  });

  it("returns high confidence when multiple signals agree", () => {
    const doc: DocumentInfo = {
      path: "plans/plan.md",
      relativePath: "plans/plan.md",
      title: "Plan",
      content: "# Plan\n\n### 1.1\n- **Status:** Concluído\n",
    };
    const signals: DetectionSignals = {
      statusMarkers: { status: "completed", confidence: 0.9, evidence: ["Status: Concluído"] },
      crossReferences: [{ target: "src/feature.ts", exists: true }],
      gitCorrelation: { lastModified: new Date().toISOString(), referencedFilesExist: true, recentCommits: true },
      staleness: { ageInDays: 5, referencedByOtherDocs: true, recentCommits: true },
    };
    const classification = classifyDocument(doc, signals);
    expect(classification.confidence).toBeGreaterThanOrEqual(0.8);
  });
});

describe("auditDocLifecycle", () => {
  it("returns empty report for empty project", () => {
    const report = auditDocLifecycle(tempDir, nexusDir);
    expect(report.totalDocuments).toBe(0);
    expect(report.classifications).toHaveLength(0);
    expect(report.clusters).toHaveLength(0);
    expect(report.proposedMoves).toHaveLength(0);
  });

  it("classifies documents correctly in real project structure", () => {
    mkdirSync(join(nexusDir, "docs"), { recursive: true });
    mkdirSync(join(nexusDir, "plans"), { recursive: true });

    writeFileSync(
      join(nexusDir, "docs", "AGENTS.md"),
      "# Rules\n1. **Rule One**: do this\n"
    );
    writeFileSync(
      join(nexusDir, "plans", "completed-plan.md"),
      "# Plan\n\n### 1.1\n- **Status:** Concluído\n"
    );
    writeFileSync(
      join(nexusDir, "plans", "pending-plan.md"),
      "# Plan\n\n### 1.1\n- **Status:** Pendente\n"
    );

    const report = auditDocLifecycle(tempDir, nexusDir);
    expect(report.totalDocuments).toBeGreaterThanOrEqual(2);
    expect(report.classifications.length).toBeGreaterThanOrEqual(2);

    const completed = report.classifications.find(
      (c) => c.status === "completed"
    );
    expect(completed).toBeDefined();
    expect(completed!.status).toBe("completed");

    const planned = report.classifications.find(
      (c) => c.status === "planned"
    );
    expect(planned).toBeDefined();
    expect(planned!.status).toBe("planned");
  });

  it("detects clusters of similar documents", () => {
    mkdirSync(join(nexusDir, "plans"), { recursive: true });

    writeFileSync(
      join(nexusDir, "plans", "evolution-plan.md"),
      "# Nexus Evolution Plan\n\nContent about evolution.\n"
    );
    writeFileSync(
      join(nexusDir, "plans", "evolution-strategy.md"),
      "# Nexus Evolution Strategy\n\nContent about strategy.\n"
    );
    writeFileSync(
      join(nexusDir, "plans", "evolution-roadmap.md"),
      "# Nexus Evolution Roadmap\n\nContent about roadmap.\n"
    );

    const report = auditDocLifecycle(tempDir, nexusDir);
    expect(report.clusters.length).toBeGreaterThanOrEqual(1);
  });

  it("proposes correct moves for each status", () => {
    mkdirSync(join(nexusDir, "plans"), { recursive: true });

    writeFileSync(
      join(nexusDir, "plans", "completed-plan.md"),
      "# Plan\n\n### 1.1\n- **Status:** Concluído\n"
    );
    writeFileSync(
      join(nexusDir, "plans", "old-plan.md"),
      "# Old Plan\n\nSome content without status.\n"
    );

    const report = auditDocLifecycle(tempDir, nexusDir);
    expect(report.proposedMoves.length).toBeGreaterThanOrEqual(1);

    const completedMove = report.proposedMoves.find(
      (m) => m.status === "completed"
    );
    expect(completedMove).toBeDefined();
    expect(completedMove!.destination).toContain("_archive/completed");
  });
});

describe("applyMoves", () => {
  it("moves files to correct destinations", () => {
    mkdirSync(join(nexusDir, "plans"), { recursive: true });
    mkdirSync(join(nexusDir, "docs", "_archive", "completed"), { recursive: true });

    writeFileSync(
      join(nexusDir, "plans", "completed-plan.md"),
      "# Plan\n\n### 1.1\n- **Status:** Concluído\n"
    );

    const report = auditDocLifecycle(tempDir, nexusDir);
    const result = applyMoves(report, nexusDir, false);

    expect(result.movesApplied).toBeGreaterThanOrEqual(1);
    expect(existsSync(join(nexusDir, "docs", "_archive", "completed", "completed-plan.md"))).toBe(true);
  });

  it("creates destination directories if needed", () => {
    mkdirSync(join(nexusDir, "plans"), { recursive: true });

    writeFileSync(
      join(nexusDir, "plans", "completed-plan.md"),
      "# Plan\n\n### 1.1\n- **Status:** Concluído\n"
    );

    const report = auditDocLifecycle(tempDir, nexusDir);
    const result = applyMoves(report, nexusDir, false);

    expect(existsSync(join(nexusDir, "docs", "_archive", "completed"))).toBe(true);
  });

  it("writes CHANGELOG entry for each move", () => {
    mkdirSync(join(nexusDir, "plans"), { recursive: true });
    mkdirSync(join(nexusDir, "docs", "_archive"), { recursive: true });

    writeFileSync(
      join(nexusDir, "plans", "completed-plan.md"),
      "# Plan\n\n### 1.1\n- **Status:** Concluído\n"
    );

    const report = auditDocLifecycle(tempDir, nexusDir);
    applyMoves(report, nexusDir, false);

    const changelogPath = join(nexusDir, "docs", "_archive", "CHANGELOG.md");
    expect(existsSync(changelogPath)).toBe(true);

    const changelog = readFileSync(changelogPath, "utf-8");
    expect(changelog).toContain("completed-plan.md");
  });

  it("does not move files when dry-run mode", () => {
    mkdirSync(join(nexusDir, "plans"), { recursive: true });

    writeFileSync(
      join(nexusDir, "plans", "completed-plan.md"),
      "# Plan\n\n### 1.1\n- **Status:** Concluído\n"
    );

    const report = auditDocLifecycle(tempDir, nexusDir);
    const result = applyMoves(report, nexusDir, true);

    expect(result.movesApplied).toBe(0);
    expect(existsSync(join(nexusDir, "plans", "completed-plan.md"))).toBe(true);
  });
});
