import type {
  AnswerReference,
  AnswerResponse,
  CoverageDecision,
  QueryIntent,
  RankedChunk,
} from "./hybridTypes";

function corpusRefs(chunks: RankedChunk[]): AnswerReference[] {
  return chunks.slice(0, 5).map((c) => ({
    sourceType: "indexed_corpus",
    title: "Approved_Document_B_Oct24",
    page: c.page_from ?? null,
    clause: c.clause_label ?? null,
    table:
      c.citation_type === "table"
        ? c.citation_value ?? null
        : c.table_refs?.[0] ?? null,
    url: null,
  }));
}

export function buildHybridAnswerResponse(params: {
  finalAnswer: string;
  corpusAnswer: string | null;
  webSupplement: string | null;
  rerankedChunks: RankedChunk[];
  coverage: CoverageDecision;
  usedWebFallback: boolean;
  webFallbackReason?: string | null;
  webReferences?: { title: string; url: string }[];
}): AnswerResponse {
  const {
    finalAnswer,
    corpusAnswer,
    webSupplement,
    rerankedChunks,
    coverage,
    usedWebFallback,
    webFallbackReason,
    webReferences = [],
  } = params;

  const references: AnswerReference[] = [
    ...corpusRefs(rerankedChunks),
    ...webReferences.map((r) => ({
      sourceType: "web" as const,
      title: r.title,
      url: r.url,
      page: null,
      clause: null,
      table: null,
    })),
  ];

  const warnings: string[] = [];
  if (!coverage.isSufficient) {
    warnings.push("The indexed corpus did not fully resolve this question.");
  }
  if (usedWebFallback) {
    warnings.push("Supplementary context was taken from web sources.");
  }

  return {
    answer: finalAnswer,
    sourceType: usedWebFallback
      ? corpusAnswer
        ? "mixed"
        : "web"
      : "indexed_corpus",
    corpusStatus: {
      searched: true,
      sufficient: coverage.isSufficient,
      reason: coverage.reason,
    },
    usedWebFallback,
    webFallbackReason: webFallbackReason || null,
    sections: {
      corpusAnswer,
      webSupplement,
    },
    references,
    confidence: {
      overall: usedWebFallback
        ? coverage.isSufficient
          ? 0.8
          : 0.68
        : Math.max(0.55, Math.min(0.95, coverage.topScore)),
      corpus: Math.max(0.35, Math.min(0.95, coverage.topScore)),
      web: usedWebFallback ? 0.78 : null,
    },
    warnings,
  };
}