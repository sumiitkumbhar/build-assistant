export type QueryIntent =
  | "corpus_strict"
  | "corpus_preferred"
  | "current_or_external";

export type CoverageReason =
  | "strong_match"
  | "weak_match"
  | "mention_only"
  | "no_exact_definition"
  | "no_table_match"
  | "no_relevant_chunks";

export type CoverageDecision = {
  isSufficient: boolean;
  reason: CoverageReason;
  topScore: number;
  strongChunkCount: number;
  hasExactHeadingMatch: boolean;
  hasTableMatch: boolean;
  hasDefinitionStyleChunk: boolean;
};

export type RankedChunk = {
  id?: string;
  content?: string | null;
  section_heading?: string | null;
  section_hierarchy?: string | null;
  keywords?: string[] | null;
  citation_type?: string | null;
  citation_value?: string | null;
  clause_label?: string | null;
  table_refs?: string[] | null;
  page_from?: number | null;
  page_to?: number | null;
  topic?: string | null;
  similarity?: number | null;
  rerankScore?: number | null;
  finalScore?: number | null;
};

export type AnswerReference = {
  sourceType: "indexed_corpus" | "web";
  title: string;
  page?: number | null;
  clause?: string | null;
  table?: string | null;
  url?: string | null;
};

export type AnswerResponse = {
  answer: string;
  sourceType: "indexed_corpus" | "web" | "mixed";
  corpusStatus: {
    searched: boolean;
    sufficient: boolean;
    reason: CoverageReason;
  };
  usedWebFallback: boolean;
  webFallbackReason?: string | null;
  sections: {
    corpusAnswer?: string | null;
    webSupplement?: string | null;
  };
  references: AnswerReference[];
  confidence: {
    overall: number;
    corpus: number;
    web?: number | null;
  };
  warnings: string[];
};