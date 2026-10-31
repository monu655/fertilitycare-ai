import type { Passage } from "./knowledge-base";

// Simple keyword search. No AI and no outside call, so it is predictable and always available.

const STOP = new Set(
  "a an the and or but if of to in on at for from with about as is are was were be been being do does did can could should would will may might i me my we our you your it its this that these those what which who how why when where there here not no yes any some more most much many very than then so too also into over under after before again just only own same such".split(
    " ",
  ),
);

function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem);
}

export type Scored = { passage: Passage; score: number };

// Topic and keyword matches count more than words that merely appear in the text.
// A passage needs a real match (score of at least 3), so unrelated questions return nothing.
export function retrieve(question: string, passages: Passage[], limit = 3): Passage[] {
  const q = [...new Set(tokenize(question))];
  if (q.length === 0) return [];

  const scored: Scored[] = passages.map((passage) => {
    const topic = new Set(tokenize(passage.topic));
    const keywords = new Set(tokenize(passage.keywords));
    const body = tokenize(passage.text);
    let score = 0;
    for (const token of q) {
      if (topic.has(token)) score += 3;
      if (keywords.has(token)) score += 3;
      const count = body.filter((b) => b === token).length;
      score += Math.min(count, 2);
    }
    return { passage, score };
  });

  return scored
    .filter((s) => s.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.passage);
}
