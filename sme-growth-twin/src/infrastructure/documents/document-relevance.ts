const STOP_WORDS = new Set([
  "about", "according", "after", "answer", "approved", "cite", "citation", "could", "data", "document", "documents",
  "does", "evidence", "exact", "file", "files", "fictional", "find", "from", "give", "include", "inside", "into",
  "only", "please", "question", "report", "search", "show", "source", "sources", "tell", "text", "that", "them",
  "there", "this", "those", "through", "uploaded", "uploads", "using", "what", "when", "where", "which", "with",
  "would", "your", "their", "these", "about", "than", "then", "have", "has", "had", "were", "was", "are", "the",
  "and", "for", "not", "but", "you", "can", "how", "who", "why", "did", "say", "says", "said", "all", "any",
]);

function stem(value: string) {
  if (value.length > 5 && value.endsWith("ing")) return value.slice(0, -3);
  if (value.length > 4 && value.endsWith("ed")) return value.slice(0, -2);
  if (value.length > 4 && value.endsWith("es")) return value.slice(0, -2);
  if (value.length > 3 && value.endsWith("s")) return value.slice(0, -1);
  return value;
}

function terms(value: string) {
  return new Set((value.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term))
    .map(stem));
}

/** A conservative rescue for strong lexical matches just below the vector threshold. */
export function hasStrongDocumentTermOverlap(query: string, excerpt: string) {
  const requested = terms(query);
  if (requested.size < 2) return false;
  const present = terms(excerpt);
  const matches = [...requested].filter((term) => present.has(term)).length;
  return matches >= 2 && matches / requested.size >= 0.4;
}
