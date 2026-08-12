import assert from 'node:assert/strict'
import test from 'node:test'
import type { Sentence } from '../data/local/database'
import { findRepeatedGrammarPatterns } from '../lib/learning/grammar-patterns'

const sentence = (id: string, french: string): Sentence => ({ id, french, english: '', difficulty: 1, cefrLevel: 'A1', source: 'curated', spokenForm: null, audioText: french })

test('grammar hints surface only after repeated evidence', () => {
  assert.equal(findRepeatedGrammarPatterns([sentence('1', 'Je ne sais pas.')]).length, 0)
  assert.deepEqual(findRepeatedGrammarPatterns([sentence('1', 'Je ne sais pas.'), sentence('2', 'Il ne vient pas.')]).map(({ id }) => id), ['negation'])
})
