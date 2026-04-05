import type { CoverageDecision, QueryIntent } from "./hybridTypes";

export function shouldUseWebFallback(
  intent: QueryIntent,
  coverage: CoverageDecision
): boolean {
  if (intent === "current_or_external") return true;
  if (intent === "corpus_strict") return false;
  return !coverage.isSufficient;
}