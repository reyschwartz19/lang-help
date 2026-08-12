import type { Sentence } from '@/data/local/database'

export interface GrammarPattern { id: string; title: string; summary: string; test: RegExp }

export const grammarPatterns: GrammarPattern[] = [
  { id: 'negation', title: 'Negation: ne … pas', summary: 'Standard French wraps the conjugated verb with ne and pas; spoken French often drops ne.', test: /\b(?:ne|n[’'])\b.*\bpas\b/i },
  { id: 'object-pronoun', title: 'Object pronouns before the verb', summary: 'Short object pronouns such as le, la, lui, and en normally come before the conjugated verb.', test: /\b(?:le|la|les|lui|leur|en|y)\s+\w+/i },
  { id: 'recent-past', title: 'Recent past: venir de', summary: 'Venir de + infinitive describes something that has just happened.', test: /\b(?:viens|vient|venons|venez|viennent)\s+de\b/i },
  { id: 'near-future', title: 'Near future: aller + infinitive', summary: 'A present form of aller followed by an infinitive expresses an upcoming action.', test: /\b(?:vais|vas|va|allons|allez|vont)\s+\w+(?:er|ir|re)\b/i },
]

export function findRepeatedGrammarPatterns(sentences: Sentence[], minimumOccurrences = 2) {
  return grammarPatterns.filter((pattern) => sentences.filter((sentence) => pattern.test.test(sentence.french)).length >= minimumOccurrences)
}
