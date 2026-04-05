import type { RankedChunk } from "./hybridTypes";

type RerankResult = {
  rankedIds: string[];
  scores: Record<string, number>;
};

function makeChunkId(chunk: RankedChunk, index: number): string {
  return (
    chunk.id ||
    `chunk_${index}_${chunk.page_from || "na"}_${chunk.clause_label || "na"}`
  );
}

function compactChunkView(chunk: RankedChunk, index: number) {
  const id = makeChunkId(chunk, index);

  return {
    id,
    page: chunk.page_from ?? null,
    heading: chunk.section_heading ?? null,
    section: chunk.section_hierarchy ?? null,
    clause: chunk.clause_label ?? null,
    citationType: chunk.citation_type ?? null,
    citationValue: chunk.citation_value ?? null,
    tableRefs: chunk.table_refs ?? [],
    topic: chunk.topic ?? null,
    preview: String(chunk.content || "").slice(0, 1400),
  };
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

export async function rerankChunks(
  query: string,
  chunks: RankedChunk[],
  generate: (prompt: string) => Promise<string>
): Promise<RankedChunk[]> {
  if (!chunks.length) return [];
  if (chunks.length === 1) {
    return [{ ...chunks[0], rerankScore: 0.95, finalScore: chunks[0].finalScore ?? chunks[0].similarity ?? 0 }];
  }

  const compact = chunks.map(compactChunkView);

  const prompt = `
You are a retrieval reranker for a regulatory RAG system.

Task:
Rank the candidate chunks by how directly they answer the user's question.

Important rules:
1. Prefer chunks that contain the exact rule, threshold, requirement definition, or table values.
2. Prefer definitional chunks over chunks that only mention a requirement.
3. Prefer table chunks for questions about values, distances, limits, or thresholds.
4. Penalize generic headers, introductions, and weak references.
5. Do NOT answer the question. Only rerank the chunks.
6. Return valid JSON only.

User query:
${query}

Candidate chunks:
${JSON.stringify(compact, null, 2)}

Return JSON in this exact shape:
{
  "rankedIds": ["best_id", "second_best_id", "third_best_id"],
  "scores": {
    "best_id": 0.97,
    "second_best_id": 0.88
  }
}
`;

  let parsed: RerankResult | null = null;

  try {
    const raw = await generate(prompt);
    const json = extractJsonObject(raw);
    if (json) {
      parsed = JSON.parse(json) as RerankResult;
    }
  } catch {
    parsed = null;
  }

  if (!parsed || !Array.isArray(parsed.rankedIds)) {
    return chunks
      .map((c) => ({
        ...c,
        rerankScore: Number(c.finalScore || c.similarity || 0),
      }))
      .sort((a, b) => Number(b.rerankScore || 0) - Number(a.rerankScore || 0));
  }

  const chunkMap = new Map<string, RankedChunk>();
  chunks.forEach((chunk, i) => {
    chunkMap.set(makeChunkId(chunk, i), chunk);
  });

  const ranked: RankedChunk[] = [];
  const used = new Set<string>();

  for (const id of parsed.rankedIds) {
    const found = chunkMap.get(id);
    if (!found) continue;
    used.add(id);
    ranked.push({
      ...found,
      rerankScore: Number(parsed.scores?.[id] ?? found.finalScore ?? found.similarity ?? 0),
    });
  }

  for (let i = 0; i < chunks.length; i++) {
    const id = makeChunkId(chunks[i], i);
    if (used.has(id)) continue;
    ranked.push({
      ...chunks[i],
      rerankScore: Number(chunks[i].finalScore || chunks[i].similarity || 0),
    });
  }

  return ranked.sort(
    (a, b) => Number(b.rerankScore || 0) - Number(a.rerankScore || 0)
  );
}