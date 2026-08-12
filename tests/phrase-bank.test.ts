import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

type Phrase = {
  id: string
  french: string
  english: string
  category: string
  level: 'A1' | 'A2'
  priority: 1 | 2 | 3
}

const phrases = JSON.parse(
  readFileSync(new URL('../data/content/phrase-bank.json', import.meta.url), 'utf8'),
) as Phrase[]

test('the v1 phrase bank is a complete, uniquely identified A1/A2 corpus', () => {
  assert.ok(phrases.length >= 180 && phrases.length <= 250)
  assert.equal(new Set(phrases.map((phrase) => phrase.id)).size, phrases.length)
  assert.ok(phrases.every((phrase) => phrase.french.trim() && phrase.english.trim() && phrase.category.trim()))
  assert.ok(phrases.every((phrase) => phrase.level === 'A1' || phrase.level === 'A2'))
  assert.ok(phrases.every((phrase) => [1, 2, 3].includes(phrase.priority)))
})

test('the phrase taxonomy covers conversation building and everyday interaction without fragmentation', () => {
  const categories = new Set(phrases.map((phrase) => phrase.category))
  const required = ['greeting', 'buying_time', 'repair', 'reactions', 'opinion', 'questions', 'connecting', 'self', 'routines', 'plans', 'time_quantity', 'requests', 'food_shopping', 'transport', 'work_study', 'social']
  assert.deepEqual([...categories].sort(), required.sort())
  assert.ok([...categories].every((category) => phrases.filter((phrase) => phrase.category === category).length >= 10))
})

test('each level and priority tier has meaningful coverage', () => {
  for (const level of ['A1', 'A2'] as const) assert.ok(phrases.filter((phrase) => phrase.level === level).length >= 75)
  for (const priority of [1, 2, 3] as const) assert.ok(phrases.some((phrase) => phrase.priority === priority))
})
