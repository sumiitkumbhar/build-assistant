"use client";

import React, { useEffect, useMemo, useState } from "react";
import ExpandableCitation from "@/components/citations/ExpandableCitation";

export interface Citation {
  id: string | number;
  title: string;
  type: string;
  pageNumber?: number;
  clauseNumber?: string;
  section?: string;
  fullText: string;
  excerpt: string;
  confidence: number;
  lastUpdated: string;
  directLink?: string;
  sourceLabel?: string;
  _raw?: any;
}

interface SourcesSectionProps {
  sources?: Citation[];
}

function normalizeSource(citation: Citation): Citation {
  return {
    ...citation,
    title: citation.title || "Untitled source",
    type: citation.type || "Source",
    fullText: citation.fullText || "",
    excerpt: citation.excerpt || "",
    confidence: Number.isFinite(Number(citation.confidence))
      ? Number(citation.confidence)
      : 0,
    lastUpdated: citation.lastUpdated || "",
  };
}

export default function SourcesSection({
  sources = [],
}: SourcesSectionProps) {
  const safeSources = useMemo(() => {
    if (!Array.isArray(sources)) return [];
    return sources
      .filter(Boolean)
      .map((source) => normalizeSource(source))
      .filter((source) => source.id !== undefined && source.id !== null);
  }, [sources]);

  const sortedSources = useMemo(() => {
    return [...safeSources].sort(
      (a, b) => Number(b.confidence || 0) - Number(a.confidence || 0)
    );
  }, [safeSources]);

  const [expandedId, setExpandedId] = useState<string | number | null>(
    sortedSources[0]?.id ?? null
  );
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!sortedSources.length) {
      setExpandedId(null);
      return;
    }

    const currentStillExists = sortedSources.some(
      (source) => source.id === expandedId
    );

    if (!currentStillExists) {
      setExpandedId(sortedSources[0].id);
    }
  }, [sortedSources, expandedId]);

  if (!sortedSources.length) return null;

  const visibleSources = showAll ? sortedSources : sortedSources.slice(0, 5);

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            Sources ({sortedSources.length})
          </p>
          <p className="text-xs text-slate-400">
            Ranked by confidence. Click a source to inspect the evidence.
          </p>
        </div>

        {sortedSources.length > 5 ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-200 transition hover:bg-white/10"
          >
            {showAll ? "Show top 5" : `Show all (${sortedSources.length})`}
          </button>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {visibleSources.map((citation, index) => (
          <div id={`citation-card-${citation.id}`} key={String(citation.id)}>
            <ExpandableCitation
              citation={citation}
              index={index}
              expanded={expandedId === citation.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === citation.id ? null : citation.id))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}