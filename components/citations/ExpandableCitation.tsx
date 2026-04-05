"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

interface ExpandableCitationProps {
  citation: Citation;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

type EvidenceBucket = {
  heading: string;
  lines: string[];
  tone: "primary" | "condition" | "exception" | "support";
};

function stripChunkMetadata(text: string) {
  if (!text) return "";

  return text
    .replace(/\[TOPIC\]:?[^\n]*/gi, "")
    .replace(/\[SECTION\]:?[^\n]*/gi, "")
    .replace(/\[HEADING\]:?[^\n]*/gi, "")
    .replace(/\[KEYWORDS\]:?[^\n]*/gi, "")
    .replace(/\[NEXT_PAGE\]:?[^\n]*/gi, "")
    .replace(/\[PREV_PAGE\]:?[^\n]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function repairSmashedWords(text: string) {
  if (!text) return "";

  return text
    .replace(/ONLIN[E]?VERSION/gi, "ONLINE VERSION")
    .replace(/Approved\s*Docu\s*ment/gi, "Approved Document")
    .replace(/Document\s*B\s*Volume/gi, "Document B Volume")
    .replace(/B\s*Volume/gi, "Volume")
    .replace(/Building\s*dR?I?B?u/gi, "")
    .replace(/\b([A-Za-z])\s(?=[A-Za-z]\s){2,}/g, (m) => m.replace(/\s/g, ""))
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/shaftscontaining/gi, "shafts containing")
    .replace(/shaftsshould/gi, "shafts should")
    .replace(/buildingwith/gi, "building with")
    .replace(/storeymore/gi, "storey more")
    .replace(/basementthat/gi, "basement that")
    .replace(/needone/gi, "need one")
    .replace(/storeythat/gi, "storey that")
    .replace(/building'sheight/gi, "building's height")
    .replace(/shaftsalso/gi, "shafts also")
    .replace(/storeys,each/gi, "storeys, each")
    .replace(/offirefighting/gi, "of firefighting")
    .replace(/shaftsare/gi, "shafts are")
    .replace(/firefightingshaft/gi, "firefighting shaft")
    .replace(/firemain/gi, "fire main")
    .replace(/,The/g, ", the")
    .replace(/\.The/g, ". The")
    .replace(/\.There/g, ". There")
    .replace(/\.Fire/g, ". Fire")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanCitationText(text: string) {
  return repairSmashedWords(stripChunkMetadata(text));
}

function looksLikeClause(line: string) {
  return /^\d+(\.\d+)+/.test(line);
}

function looksLikeBullet(line: string) {
  return /^[•\-]/.test(line) || /^[a-z]\./i.test(line);
}

function looksLikeNumericPoint(line: string) {
  return /^\d+\.$/.test(line) || /^\d+$/.test(line);
}

function looksLikeHeading(line: string) {
  return /^(diagram|figure|table|notes?)\b/i.test(line);
}

function looksLikeUpperHeading(line: string) {
  return /^[A-Z][A-Z\s/&-]{3,}$/.test(line);
}

function normalizeSentenceSpacing(line: string) {
  let t = line;
  t = t.replace(/([.?!;:])([A-Z])/g, "$1 $2");
  t = t.replace(/([a-z])(\d+\.\d+)/g, "$1 $2");
  t = t.replace(/(\d+\.\d+)([A-Z])/g, "$1 $2");
  t = t.replace(/([a-z])([A-Z][a-z])/g, "$1 $2");
  t = t.replace(/([a-z])([A-Z]{2,})/g, "$1 $2");
  t = t.replace(/([a-z])\(/g, "$1 (");
  t = t.replace(/\)\(/g, ") (");
  t = t.replace(/\s{2,}/g, " ");
  return t.trim();
}

function isStructuralStart(line: string) {
  return (
    looksLikeClause(line) ||
    looksLikeBullet(line) ||
    looksLikeNumericPoint(line) ||
    looksLikeHeading(line) ||
    looksLikeUpperHeading(line)
  );
}

function isLikelyContinuation(prev: string, current: string) {
  const prevTrimmed = prev.trim();
  const currentTrimmed = current.trim();

  if (!prevTrimmed || !currentTrimmed) return false;
  if (isStructuralStart(currentTrimmed)) return false;

  if (
    !/[.!?;:]$/.test(prevTrimmed) ||
    /\b(and|or|to|of|for|with|including|which|that|where|when|if|than|into|onto|under|over|both|more|less|minimum|maximum|paragraph|paragraphs|see)$/i.test(
      prevTrimmed
    ) ||
    /\($/.test(prevTrimmed)
  ) {
    return true;
  }

  if (
    /^[a-z(]/.test(currentTrimmed) ||
    /^(to|and|or|of|for|with|including|which|that|where|when|if|than|into|onto|under|over|both|more|less|minimum|maximum|see)\b/i.test(
      currentTrimmed
    )
  ) {
    return true;
  }

  return false;
}

function splitReadableParagraphs(text: string) {
  const rawLines = text
    .split("\n")
    .map((line) => normalizeSentenceSpacing(line.trim()))
    .filter(Boolean);

  const merged: string[] = [];

  for (const line of rawLines) {
    if (!merged.length) {
      merged.push(line);
      continue;
    }

    const prev = merged[merged.length - 1];

    if (isLikelyContinuation(prev, line)) {
      merged[merged.length - 1] = `${prev} ${line}`
        .replace(/\s{2,}/g, " ")
        .trim();
    } else {
      merged.push(line);
    }
  }

  return merged.map((line) => normalizeSentenceSpacing(line)).filter(Boolean);
}

function normalizeForBuckets(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/^ONLINE VERSION$/i.test(line) &&
        !/^Approved Document$/i.test(line) &&
        !/^Volume \d+$/i.test(line) &&
        !/^Building Regulations \d+$/i.test(line) &&
        !/^of the following\.?$/i.test(line) &&
        !/^[0-9]+\.?$/.test(line)
    );
}

function buildSemanticBlocks(lines: string[]) {
  const cleaned = normalizeForBuckets(lines);
  const blocks: string[] = [];

  for (const line of cleaned) {
    if (!blocks.length) {
      blocks.push(line);
      continue;
    }

    const prev = blocks[blocks.length - 1];
    const startsFresh =
      isStructuralStart(line) && !isLikelyContinuation(prev, line);

    if (startsFresh) {
      blocks.push(line);
    } else {
      blocks[blocks.length - 1] = `${prev} ${line}`
        .replace(/\s{2,}/g, " ")
        .trim();
    }
  }

  return blocks.map((block) => normalizeSentenceSpacing(block)).filter(Boolean);
}

function classifyBlockTone(block: string): EvidenceBucket["tone"] {
  const l = block.toLowerCase();

  if (
    /not required|does not need|need not|excluding|except|excludes|not applicable|is not required|are not required/i.test(
      block
    )
  ) {
    return "exception";
  }

  if (
    /if|where|when|provided to|minimum|maximum|more than|less than|at least|purpose group|storey|basement|area of|floor level|height|access level/i.test(
      l
    )
  ) {
    return "condition";
  }

  if (
    looksLikeClause(block) ||
    looksLikeBullet(block) ||
    looksLikeNumericPoint(block)
  ) {
    return "support";
  }

  return "primary";
}

function extractComplianceBuckets(lines: string[]): EvidenceBucket[] {
  const blocks = buildSemanticBlocks(lines);

  const primary: string[] = [];
  const conditions: string[] = [];
  const exceptions: string[] = [];
  const support: string[] = [];

  for (const block of blocks) {
    const tone = classifyBlockTone(block);
    if (tone === "exception") exceptions.push(block);
    else if (tone === "condition") conditions.push(block);
    else if (tone === "support") support.push(block);
    else primary.push(block);
  }

  const buckets: EvidenceBucket[] = [];

  if (primary.length) {
    buckets.push({
      heading: "Requirement",
      lines: primary.slice(0, 8),
      tone: "primary",
    });
  }

  if (conditions.length) {
    buckets.push({
      heading: "Conditions / Triggers",
      lines: conditions.slice(0, 20),
      tone: "condition",
    });
  }

  if (exceptions.length) {
    buckets.push({
      heading: "Exceptions / Limits",
      lines: exceptions.slice(0, 12),
      tone: "exception",
    });
  }

  if (support.length) {
    buckets.push({
      heading: "Evidence Extract",
      lines: support.slice(0, 20),
      tone: "support",
    });
  }

  return buckets;
}

function getConfidenceTone(confidence: number) {
  if (confidence >= 85) {
    return {
      chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400",
    };
  }

  if (confidence >= 60) {
    return {
      chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
      dot: "bg-amber-400",
    };
  }

  return {
    chip: "border-rose-400/25 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  };
}

function getTypeLabel(type: string) {
  if (type === "government_doc") return "Government doc";
  if (type === "legal_case") return "Legal";
  if (type === "technical_standard") return "Standard";
  if (type === "rate_schedule") return "Schedule";
  if (type === "web") return "Web";
  return type || "Source";
}

function bucketToneClasses(tone: EvidenceBucket["tone"]) {
  if (tone === "primary") {
    return {
      wrap: "border-blue-400/15 bg-blue-500/[0.04]",
      title: "text-blue-300",
      dot: "bg-blue-400",
    };
  }

  if (tone === "condition") {
    return {
      wrap: "border-amber-400/15 bg-amber-500/[0.04]",
      title: "text-amber-300",
      dot: "bg-amber-400",
    };
  }

  if (tone === "exception") {
    return {
      wrap: "border-rose-400/15 bg-rose-500/[0.04]",
      title: "text-rose-300",
      dot: "bg-rose-400",
    };
  }

  return {
    wrap: "border-white/10 bg-white/[0.02]",
    title: "text-slate-300",
    dot: "bg-slate-400",
  };
}

function renderEvidenceLine(line: string, key: string) {
  const trimmed = line.trim();

  if (looksLikeClause(trimmed)) {
    const firstSpace = trimmed.indexOf(" ");
    const clause = firstSpace > -1 ? trimmed.slice(0, firstSpace) : trimmed;
    const rest = firstSpace > -1 ? trimmed.slice(firstSpace + 1) : "";

    return (
      <p
        key={key}
        className="break-words [overflow-wrap:anywhere] border-l-2 border-blue-400/40 pl-3 text-blue-200"
      >
        <span className="font-semibold text-blue-300">{clause}</span>{" "}
        <span className="text-slate-200">{rest}</span>
      </p>
    );
  }

  if (/^[a-z]\./i.test(trimmed)) {
    return (
      <div
        key={key}
        className="relative break-words [overflow-wrap:anywhere] pl-5 text-slate-200"
      >
        <span className="absolute left-0 top-[10px] h-1.5 w-1.5 rounded-full bg-slate-400" />
        {trimmed.slice(2).trim()}
      </div>
    );
  }

  if (/^[•\-]/.test(trimmed)) {
    return (
      <div
        key={key}
        className="relative break-words [overflow-wrap:anywhere] pl-5 text-slate-200"
      >
        <span className="absolute left-0 top-[10px] h-1.5 w-1.5 rounded-full bg-slate-400" />
        {trimmed.replace(/^[•\-]\s*/, "")}
      </div>
    );
  }

  if (looksLikeNumericPoint(trimmed)) {
    return (
      <div key={key} className="text-sm font-semibold text-slate-400">
        {trimmed.replace(/\.$/, "")}.
      </div>
    );
  }

  if (/^(diagram|figure|table)/i.test(trimmed)) {
    return (
      <p
        key={key}
        className="break-words [overflow-wrap:anywhere] font-semibold text-fuchsia-300"
      >
        {trimmed}
      </p>
    );
  }

  if (/^(B\d|NOTES?)$/i.test(trimmed)) {
    return (
      <p
        key={key}
        className="break-words [overflow-wrap:anywhere] font-semibold tracking-wide text-purple-300"
      >
        {trimmed}
      </p>
    );
  }

  return (
    <p key={key} className="break-words [overflow-wrap:anywhere] text-slate-200">
      {trimmed}
    </p>
  );
}

function looksTruncated(text: string) {
  if (!text) return false;

  const t = text.trim();
  if (!t) return false;

  const lastLine =
    t
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .pop() || t;

  if (
    /\b(and|or|to|of|for|with|including|which|that|where|when|if|than|see|paragraph|paragraphs)$/i.test(
      lastLine
    )
  ) {
    return true;
  }

  if (/\($/.test(lastLine)) return true;
  if (/[:;,-]$/.test(lastLine)) return true;
  if (/^(\d+\.|[a-z]\.)$/i.test(lastLine)) return true;

  return false;
}

function looksDirtyForStructuredView(text: string) {
  if (!text) return false;

  return (
    /\[(TOPIC|SECTION|HEADING|KEYWORDS|NEXT_PAGE|PREV_PAGE)\]/i.test(text) ||
    looksTruncated(text)
  );
}

function getScrollClass() {
  return "overflow-visible";
}

export default function ExpandableCitation({
  citation,
  index,
  expanded,
  onToggle,
}: ExpandableCitationProps) {
  const [pagePreviewOpen, setPagePreviewOpen] = useState(false);
  const [pagePreviewLoading, setPagePreviewLoading] = useState(false);
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null);
  const [pagePreviewError, setPagePreviewError] = useState<string | null>(null);

  const rawSourceText = useMemo(
    () => citation.fullText || citation.excerpt || "",
    [citation.fullText, citation.excerpt]
  );

  const rawDisplayText = useMemo(
    () => stripChunkMetadata(rawSourceText),
    [rawSourceText]
  );

  const cleanedFullText = useMemo(
    () => cleanCitationText(rawDisplayText),
    [rawDisplayText]
  );

  const rawParagraphs = useMemo(
    () => splitReadableParagraphs(rawDisplayText),
    [rawDisplayText]
  );

  const cleanedParagraphs = useMemo(
    () => splitReadableParagraphs(cleanedFullText),
    [cleanedFullText]
  );

  const complianceBuckets = useMemo(
    () => extractComplianceBuckets(cleanedParagraphs),
    [cleanedParagraphs]
  );

  const rawLikelyTruncated = useMemo(
    () => looksTruncated(rawDisplayText),
    [rawDisplayText]
  );

  const shouldUseRawFallback = useMemo(
    () =>
      looksDirtyForStructuredView(rawSourceText) ||
      rawLikelyTruncated ||
      complianceBuckets.length === 0,
    [rawSourceText, rawLikelyTruncated, complianceBuckets.length]
  );

  const previewText = useMemo(() => {
    if (!rawDisplayText) return "";

    const mergedLines = splitReadableParagraphs(cleanCitationText(rawDisplayText));
    const firstReadable = mergedLines[0] || rawDisplayText;
    const sentenceMatch = firstReadable.match(/.*?[.!?](\s|$)/);
    const firstSentence = sentenceMatch?.[0]?.trim();

    if (
      firstSentence &&
      firstSentence.length >= 50 &&
      firstSentence.length <= 170
    ) {
      return firstSentence;
    }

    return firstReadable.length > 170
      ? `${firstReadable.slice(0, 170).trim()}…`
      : firstReadable;
  }, [rawDisplayText]);

  const tone = getConfidenceTone(Number(citation.confidence || 0));

  const loadPagePreview = async () => {
    const pdfUrl =
      citation.directLink ||
      citation._raw?.doc_path ||
      citation._raw?.directLink;
  
    const pageNumber = citation.pageNumber;
  
    if (!pdfUrl || !pageNumber) {
      setPagePreviewError("Missing PDF link or page number");
      return;
    }
  
    try {
      setPagePreviewLoading(true);
      setPagePreviewError(null);
      setPagePreviewOpen(false);
  
      const res = await fetch("/api/source-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfUrl,
          pageNumber,
        }),
      });
  
      const data = await res.json().catch(() => ({}));
  
      if (!res.ok || !data?.success || !data?.previewUrl) {
        throw new Error(data?.error || `Failed (${res.status})`);
      }
  
      setPagePreviewUrl(String(data.previewUrl));
      setPagePreviewOpen(true);
    } catch (e: any) {
      setPagePreviewError(e?.message || "Failed to load page preview");
    } finally {
      setPagePreviewLoading(false);
    }
  };


  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06]">
      <button
        type="button"
        onClick={onToggle}
        className="group w-full px-4 py-3 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-white/10 px-2 text-[11px] font-semibold text-slate-200">
                {index + 1}
              </span>

              <h4 className="truncate text-sm font-semibold text-white transition group-hover:text-blue-300">
                {citation.title || "Untitled source"}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
              {citation.pageNumber ? <span>Page {citation.pageNumber}</span> : null}
              {citation.clauseNumber ? <span>Clause {citation.clauseNumber}</span> : null}
              {citation.section ? (
                <span className="max-w-[280px] truncate text-slate-500">
                  {citation.section}
                </span>
              ) : null}
            </div>

            {previewText ? (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300/90">
                {previewText}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone.chip}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {Math.round(citation.confidence || 0)}%
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
              {getTypeLabel(citation.type)}
            </span>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-visible"
          >
            <div className="border-t border-white/10 bg-black/10 px-4 py-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {citation.directLink ? (
                  <a
                    href={citation.directLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300 transition hover:bg-blue-500/15"
                  >
                    Open source
                  </a>
                ) : null}

{citation.pageNumber &&
typeof citation.directLink === "string" &&
citation.directLink.startsWith("http") ? (
                  <button
                    type="button"
                    onClick={loadPagePreview}
                    className="inline-flex items-center rounded-lg border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-300 transition hover:bg-purple-500/15"
                  >
                    {pagePreviewLoading
                      ? "Loading page..."
                      : `View page ${citation.pageNumber}`}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(rawDisplayText || cleanedFullText)
                  }
                  className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                >
                  Copy text
                </button>

                {rawLikelyTruncated ? (
                  <span className="inline-flex items-center rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
                    Source text appears truncated upstream
                  </span>
                ) : null}
              </div>

              {pagePreviewError ? (
                <div className="mb-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {pagePreviewError}
                </div>
              ) : null}

{pagePreviewOpen && pagePreviewUrl ? (
  <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-xs text-slate-400">
        Source page preview — Page {citation.pageNumber}
      </p>

      <a
        href={pagePreviewUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300 transition hover:bg-blue-500/15"
      >
        Open full page
      </a>
    </div>

    <iframe
      src={pagePreviewUrl}
      title={`Preview of page ${citation.pageNumber}`}
      className="h-[720px] w-full rounded-lg border border-white/10 bg-white"
    />
  </div>
) : null}

              {shouldUseRawFallback ? (
                <div className="rounded-2xl border border-amber-400/15 bg-amber-500/[0.04] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <h5 className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
                      Raw extract
                    </h5>
                  </div>

                  <div className="space-y-2 text-[12px] leading-7">
                    {rawParagraphs.slice(0, 40).map((line, i) =>
                      renderEvidenceLine(line, `${citation.id}-raw-${i}`)
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {complianceBuckets.map((bucket, bucketIndex) => {
                    const bucketTone = bucketToneClasses(bucket.tone);

                    return (
                      <div
                        key={`${citation.id}-bucket-${bucketIndex}`}
                        className={`rounded-2xl border p-4 ${bucketTone.wrap}`}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${bucketTone.dot}`} />
                          <h5
                            className={`text-xs font-semibold uppercase tracking-[0.14em] ${bucketTone.title}`}
                          >
                            {bucket.heading}
                          </h5>
                        </div>

                        <div
                          className={`${getScrollClass()} space-y-2 pb-1 text-[12px] leading-7`}
                        >
                          {bucket.lines.map((line, lineIndex) =>
                            renderEvidenceLine(
                              line,
                              `${citation.id}-${bucketIndex}-${lineIndex}`
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}