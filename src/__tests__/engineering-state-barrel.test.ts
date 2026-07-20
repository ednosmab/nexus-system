import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

describe("nenhum consumidor de produção importa submódulo de engineering-state/ direto", () => {
  it("só o barrel (index.js) é importado fora da própria pasta", () => {
    const offenders: string[] = [];
    function scan(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory() && !full.includes("node_modules") && !full.endsWith("engineering-state")) {
          scan(full);
        } else if (entry.name.endsWith(".ts") && !full.includes("engineering-state/") && !full.includes("__tests__") && !full.endsWith("engineering-state.ts")) {
          const content = readFileSync(full, "utf-8");
          if (/engineering-state\/(access|discovery|evolved|history|io|mutations|subscription)\.js/.test(content)) {
            offenders.push(full);
          }
        }
      }
    }
    scan(join(process.cwd(), "src"));
    expect(offenders).toEqual([]);
  });
});