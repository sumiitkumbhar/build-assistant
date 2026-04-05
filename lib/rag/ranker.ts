import type { RankedChunk } from "./hybridTypes";

function lower(value: unknown): string {
  return String(value || "").toLowerCase();
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
}

function uniqueTerms(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9.\s-]/g, " ")
        .split(/\s+/)
        .map((x) => x.trim())
        .filter((x) => x.length >= 2)
    )
  );
}

function isDefinitionQuery(query: string): boolean {
  const q = lower(query);
  return (
    q.includes("what is ") ||
    q.includes("define ") ||
    q.includes("definition") ||
    q.includes("what does requirement") ||
    q.includes("what is requirement")
  );
}

function isTableQuery(query: string): boolean {
  const q = lower(query);
  return (
    q.includes("table ") ||
    q.includes("travel distance") ||
    q.includes("single direction") ||
    q.includes("alternative escape") ||
    q.includes("values") ||
    q.includes("limits") ||
    q.includes("maximum travel distance")
  );
}

function isThresholdQuery(query: string): boolean {
  const q = lower(query);
  return (
    q.includes("when is") ||
    q.includes("required") ||
    q.includes("threshold") ||
    q.includes("minimum") ||
    q.includes("maximum") ||
    q.includes("over 11m") ||
    q.includes("over 18m") ||
    q.includes("11m") ||
    q.includes("18m")
  );
}

function extractRequestedTable(query: string): string | null {
  const m = lower(query).match(/\btable\s+([a-z]?\d+(?:\.\d+)?)\b/);
  return m?.[1] || null;
}

function definitionBoost(query: string, chunk: RankedChunk): number {
  if (!isDefinitionQuery(query)) return 0;

  const heading = lower(chunk.section_heading);
  const section = lower(chunk.section_hierarchy);
  const content = lower(chunk.content);

  let score = 0;

  if (heading.includes("requirement")) score += 0.22;
  if (section.includes("requirement")) score += 0.18;
  if (heading.includes("introduction")) score += 0.08;

  if (
    content.includes("the building shall be designed and constructed") ||
    content.includes("means of warning and escape") ||
    content.includes("internal fire spread") ||
    content.includes("external fire spread") ||
    content.includes("access and facilities for the fire service")
  ) {
    score += 0.18;
  }

  return score;
}

function tableBoost(query: string, chunk: RankedChunk): number {
  if (!isTableQuery(query)) return 0;

  const requestedTable = extractRequestedTable(query);
  const content = lower(chunk.content);
  const citationType = lower(chunk.citation_type);
  const citationValue = lower(chunk.citation_value);
  const tableRefs = (chunk.table_refs || []).map((t) => lower(t));

  let score = 0;

  if (citationType === "table") score += 0.2;
  if (content.includes("table")) score += 0.08;

  if (requestedTable) {
    if (citationValue === requestedTable) score += 0.35;
    if (tableRefs.includes(requestedTable)) score += 0.35;
    if (content.includes(`table ${requestedTable}`)) score += 0.3;
  }

  if (hasAny(content, ["travel distance", "single direction", "alternative escape"])) {
    score += 0.15;
  }

  if (/\b\d+\s?m\b/.test(content)) {
    score += 0.08;
  }

  return score;
}

function thresholdBoost(query: string, chunk: RankedChunk): number {
  if (!isThresholdQuery(query)) return 0;

  const content = lower(chunk.content);
  let score = 0;

  if (/\b11m\b/.test(content)) score += 0.08;
  if (/\b18m\b/.test(content)) score += 0.1;
  if (/\brequired\b/.test(content)) score += 0.08;
  if (/\bfirefighting shaft\b/.test(content)) score += 0.18;
  if (/\bregulation 38\b/.test(content)) score += 0.14;

  return score;
}

function metadataBoost(query: string, chunk: RankedChunk): number {
  const q = lower(query);
  const heading = lower(chunk.section_heading);
  const section = lower(chunk.section_hierarchy);
  const topic = lower(chunk.topic);
  const clause = lower(chunk.clause_label);
  const keywords = (chunk.keywords || []).map((k) => lower(k));

  let score = 0;

  if (heading && q.includes(heading)) score += 0.25;
  if (section && q.includes(section)) score += 0.18;
  if (clause && q.includes(clause)) score += 0.14;
  if (topic && q.includes(topic)) score += 0.1;

  const keywordHits = keywords.filter((k) => q.includes(k)).length;
  score += Math.min(0.2, keywordHits * 0.03);

  return score;
}

function lexicalBoost(query: string, chunk: RankedChunk): number {
  const qTerms = uniqueTerms(query);
  const text = [
    chunk.section_heading,
    chunk.section_hierarchy,
    chunk.topic,
    chunk.clause_label,
    ...(chunk.keywords || []),
    chunk.content,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hits = countMatches(text, qTerms);
  return Math.min(0.22, hits * 0.02);
}

function penalties(query: string, chunk: RankedChunk): number {
  const q = lower(query);
  const heading = lower(chunk.section_heading);
  const section = lower(chunk.section_hierarchy);
  const content = lower(chunk.content);

  let penalty = 0;

  const genericHeading =
    heading === "contents" ||
    heading === "introduction" ||
    heading.includes("appendix");

  const mentionOnly =
    content.includes("see section") ||
    content.includes("see paragraph") ||
    content.includes("see table") ||
    content.includes("for guidance see");

  if (genericHeading && !q.includes("contents") && !q.includes("appendix")) {
    penalty += 0.12;
  }

  if (mentionOnly) {
    penalty += 0.1;
  }

  if (
    isDefinitionQuery(query) &&
    !heading.includes("requirement") &&
    !section.includes("requirement") &&
    !content.includes("the building shall be designed and constructed")
  ) {
    penalty += 0.08;
  }

  if (
    isTableQuery(query) &&
    lower(chunk.citation_type) !== "table" &&
    !(chunk.table_refs || []).length &&
    !content.includes("table")
  ) {
    penalty += 0.15;
  }

  return penalty;
}

export function rankRetrievedChunks(
  query: string,
  chunks: RankedChunk[]
): RankedChunk[] {
  return chunks
    .map((chunk) => {
      const base = Number(chunk.similarity || 0);

      const boosted =
        base +
        metadataBoost(query, chunk) +
        lexicalBoost(query, chunk) +
        definitionBoost(query, chunk) +
        tableBoost(query, chunk) +
        thresholdBoost(query, chunk) -
        penalties(query, chunk);

      return {
        ...chunk,
        finalScore: Number(boosted.toFixed(4)),
      };
    })
    .sort((a, b) => Number(b.finalScore || 0) - Number(a.finalScore || 0));
}