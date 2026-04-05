import type { CoverageDecision, RankedChunk } from "./hybridTypes";

function lower(value: string | null | undefined): string {
  return String(value || "").toLowerCase();
}

function isDefinitionQuery(query: string): boolean {
  const q = query.toLowerCase();
  return (
    q.includes("what is ") ||
    q.includes("define ") ||
    q.includes("definition") ||
    q.includes("what does requirement")
  );
}

function isTableQuery(query: string): boolean {
  const q = query.toLowerCase();
  return (
    q.includes("table ") ||
    q.includes("travel distance") ||
    q.includes("maximum travel distance") ||
    q.includes("single direction") ||
    q.includes("values") ||
    q.includes("limits")
  );
}

export function evaluateCoverage(
  query: string,
  chunks: RankedChunk[]
): CoverageDecision {
  if (!chunks.length) {
    return {
      isSufficient: false,
      reason: "no_relevant_chunks",
      topScore: 0,
      strongChunkCount: 0,
      hasExactHeadingMatch: false,
      hasTableMatch: false,
      hasDefinitionStyleChunk: false,
    };
  }

  const q = query.toLowerCase();
  const topScore = Number(chunks[0]?.finalScore || chunks[0]?.rerankScore || chunks[0]?.similarity || 0);

  const hasExactHeadingMatch = chunks.some((c) => {
    const h = lower(c.section_heading);
    const s = lower(c.section_hierarchy);
    return h.includes(q) || s.includes(q) || (
      q.includes("requirement b1") && (h.includes("requirement b1") || s.includes("requirement b1"))
    ) || (
      q.includes("regulation 38") && (h.includes("regulation 38") || s.includes("regulation 38"))
    );
  });

  const hasTableMatch = chunks.some((c) => {
    const tables = c.table_refs || [];
    const cv = lower(c.citation_value);
    const ct = lower(c.citation_type);
    const content = lower(c.content);
    return (
      tables.some((t) => q.includes(t.toLowerCase()) || t.toLowerCase() === "2.1") ||
      (ct === "table" && (cv === "2.1" || q.includes(cv))) ||
      content.includes("table 2.1")
    );
  });

  const hasDefinitionStyleChunk = chunks.some((c) => {
    const h = lower(c.section_heading);
    const s = lower(c.section_hierarchy);
    const content = lower(c.content);
    return (
      h.includes("requirement") ||
      s.includes("requirement") ||
      h.includes("introduction") ||
      content.includes("the building shall be designed and constructed") ||
      content.includes("means of warning and escape")
    );
  });

  const strongChunkCount = chunks.filter((c) => {
    const score = Number(c.finalScore || c.rerankScore || c.similarity || 0);
    return score >= 0.78;
  }).length;

  if (isTableQuery(query)) {
    const sufficient = topScore >= 0.78 && strongChunkCount >= 2 && hasTableMatch;
    return {
      isSufficient: sufficient,
      reason: sufficient ? "strong_match" : "no_table_match",
      topScore,
      strongChunkCount,
      hasExactHeadingMatch,
      hasTableMatch,
      hasDefinitionStyleChunk,
    };
  }

  if (isDefinitionQuery(query)) {
    const sufficient =
      topScore >= 0.78 &&
      strongChunkCount >= 2 &&
      (hasExactHeadingMatch || hasDefinitionStyleChunk);

    return {
      isSufficient: sufficient,
      reason: sufficient
        ? "strong_match"
        : hasDefinitionStyleChunk
        ? "weak_match"
        : "no_exact_definition",
      topScore,
      strongChunkCount,
      hasExactHeadingMatch,
      hasTableMatch,
      hasDefinitionStyleChunk,
    };
  }

  const sufficient =
    topScore >= 0.75 &&
    strongChunkCount >= 2 &&
    (hasExactHeadingMatch || hasTableMatch || hasDefinitionStyleChunk);

  return {
    isSufficient: sufficient,
    reason: sufficient ? "strong_match" : "weak_match",
    topScore,
    strongChunkCount,
    hasExactHeadingMatch,
    hasTableMatch,
    hasDefinitionStyleChunk,
  };
}