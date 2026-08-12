import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPromptTemplate } from '../lib/handoff/prompt-template'

test('prompt contains the selected level and only supplied learning items', () => {
  const prompt = buildPromptTemplate({ cefrEstimate: 'A2', category: 'casual', recentItems: [{ text: 'En attendant', type: 'phrase', category: 'buying_time' }] })
  assert.match(prompt, /A2/)
  assert.match(prompt, /En attendant/)
  assert.doesNotMatch(prompt, /undefined/)
})

