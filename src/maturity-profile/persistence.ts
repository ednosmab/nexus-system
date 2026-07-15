import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Capability, MaturityProfile } from "../domain/entities/engineering-state.js";
import type { MaturityAnswers, ProjectAnalysis } from "./dimensions.js";
import { calculateDimensions, calculateOverallScore } from "./dimensions.js";
import { detectCapabilitySignalsFromFilesystem } from "./detection.js";
import { recommendCapabilities, getFutureCapabilities } from "./recommendation.js";

export function calculateMaturityProfile(
  answers: MaturityAnswers,
  analysis: ProjectAnalysis,
  shitenDir?: string
): MaturityProfile {
  const dimensions = calculateDimensions(answers, analysis, shitenDir);
  const overallScore = calculateOverallScore(dimensions);
  const installed: Capability[] = shitenDir ? detectCapabilitySignalsFromFilesystem(shitenDir) : ["core"];
  const recommended = recommendCapabilities(dimensions, installed);
  const future = getFutureCapabilities(installed, recommended);

  return {
    dimensions,
    overallScore,
    recommendedCapabilities: recommended,
    installedCapabilities: installed,
    futureCapabilities: future,
    computedAt: new Date().toISOString(),
  };
}

const PROFILE_FILENAME = "maturity-profile.json";

export function saveMaturityProfile(
  shitenDir: string,
  profile: MaturityProfile
): void {
  if (!existsSync(shitenDir)) {
    mkdirSync(shitenDir, { recursive: true });
  }

  const filePath = join(shitenDir, PROFILE_FILENAME);
  writeFileSync(filePath, JSON.stringify(profile, null, 2), "utf-8");
}

export function loadMaturityProfile(shitenDir: string): MaturityProfile | null {
  const filePath = join(shitenDir, PROFILE_FILENAME);
  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as MaturityProfile;
  } catch {
    return null;
  }
}

export function profileToLegacyLevel(
  profile: MaturityProfile
): "junior" | "pleno" | "senior" {
  if (profile.overallScore >= 65) return "senior";
  if (profile.overallScore >= 35) return "pleno";
  return "junior";
}
