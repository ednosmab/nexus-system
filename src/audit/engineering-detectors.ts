/**
 * Audit module — Engineering detectors (barrel re-export)
 *
 * Re-exports all engineering detectors from sub-modules.
 * This file maintains backward compatibility.
 */

export {
  detectTestHealth,
  detectOrphanModules,
  detectComplexityHotspots,
  detectTestCoverageGaps,
  detectLintIssues,
  detectTypeSafetyIssues,
  detectConsoleUsage,
  detectEmptyCatchBlocks,
  detectHighComplexity,
  detectCircularDeps,
  detectUnusedExports,
  detectDeadCodePatterns,
} from "./engineering-detectors-quality.js";

export {
  detectHardcodedSecrets,
  detectSQLInjection,
  detectXSS,
  detectUnsafeEval,
  detectConsoleSecrets,
  detectWeakCrypto,
  detectInsecureHTTP,
  detectPrototypePollution,
  detectPathTraversal,
  detectRegexDos,
  detectUnsafeDeserialization,
  detectDependencyConfusion,
  detectInsecureCORS,
  detectInsecureCookies,
  detectWeakRandomness,
} from "./engineering-detectors-security.js";

export {
  detectUnpinnedVersions,
  detectMissingLockFile,
  detectLockFileDrift,
  detectPhantomDependencies,
  detectDeprecatedPackages,
  detectDependencyVulnerabilities,
  detectIncompatibleLicenses,
  detectConfigSecrets,
} from "./engineering-detectors-supply.js";
