import type { QueryIntent } from "./hybridTypes";

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

export function classifyQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase().trim();

  const strictSignals = [
    "approved document b",
    "adb",
    "requirement b1",
    "requirement b2",
    "requirement b3",
    "requirement b4",
    "requirement b5",
    "regulation 38",
    "table 2.1",
    "table ",
    "diagram ",
    "section ",
    "clause ",
    "paragraph ",
    "what does requirement",
    "what does table",
    "when is a firefighting shaft required",
  ];

  const currentSignals = [
    "latest",
    "current",
    "recent",
    "today",
    "updated",
    "change",
    "changes",
    "new guidance",
    "news",
    "2026",
    "2025",
  ];

  if (hasAny(q, currentSignals)) return "current_or_external";
  if (hasAny(q, strictSignals)) return "corpus_strict";
  return "corpus_preferred";
}