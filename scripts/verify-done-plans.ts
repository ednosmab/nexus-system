import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

const doneDir = join(process.cwd(), ".shitenno", "governance", "plans", "done");
let failed = false;

if (!existsSync(doneDir)) {
  console.log("✅ No done/ directory found — nothing to verify");
  process.exit(0);
}

for (const file of readdirSync(doneDir)) {
  if (!file.endsWith(".md")) continue;
  const planId = basename(file, ".md");
  const verificationPath = join(doneDir, `${planId}.verification.json`);

  if (!existsSync(verificationPath)) {
    console.error(`❌ ${planId}: done sem .verification.json — possivel bypass do pipeline`);
    failed = true;
    continue;
  }

  try {
    const record = JSON.parse(readFileSync(verificationPath, "utf-8"));
    if (!record.passed) {
      console.error(`❌ ${planId}: .verification.json existe mas passed=false`);
      failed = true;
    }
  } catch {
    console.error(`❌ ${planId}: .verification.json invalido (JSON parse failed)`);
    failed = true;
  }
}

if (failed) {
  console.error("\nCommit bloqueado: plano(s) marcados 'done' sem prova de verificacao valida.");
  process.exit(1);
}
console.log("✅ Todos os planos em done/ tem verification.json valido");
