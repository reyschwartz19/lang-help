'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, MessageSquareText } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'

import { AppShell, ScreenCard, ScreenHeading } from '@/components/layout/app-shell'
import { db, type PhraseBank } from '@/data/local/database'
import { buildPromptTemplate, scenarioCategories, type ScenarioCategory } from '@/lib/handoff/prompt-template'

export default function HandoffPage() {
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory>('casual')
  const [copied, setCopied] = useState(false)

  const userStats = useLiveQuery(() => db.userStats.toCollection().first(), [])
  const phraseBank = useLiveQuery(async () => {
    return (await db.phraseBank.orderBy('category').toArray()) as PhraseBank[]
  }, [])

  const recentItems = useMemo(
    () =>
      (phraseBank ?? []).slice(0, 6).map((phrase) => ({
        text: phrase.french,
        type: 'phrase' as const,
        category: phrase.category,
      })),
    [phraseBank],
  )

  const cefrEstimate = userStats?.cefrEstimate ?? 'A1'
  const promptText = useMemo(
    () => buildPromptTemplate({ cefrEstimate, category: selectedCategory, recentItems }),
    [cefrEstimate, selectedCategory, recentItems],
  )

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(promptText)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <AppShell title="ChatGPT handoff">
      <div className="screen-stack">
        <ScreenCard>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 text-[#5267da]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7ecff]">
                <MessageSquareText size={18} />
              </div>
              <div>
                <p className="eyebrow">EXTERNAL PRACTICE</p>
                <h3 className="m-0 text-[19px] font-semibold text-slate-800">Ready-to-paste prompt</h3>
              </div>
            </div>

            <p className="screen-copy">
              This creates a prompt for your own outside chat, with your current level and recent phrases mixed in.
            </p>

            <div className="flex flex-wrap gap-2">
              {scenarioCategories.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`rounded-full border px-3 py-2 text-[11px] font-bold transition ${
                    selectedCategory === option.id
                      ? 'border-[#5267da] bg-[#5267da] text-white'
                      : 'border-[#dfe6f5] bg-white text-slate-600'
                  }`}
                  onClick={() => setSelectedCategory(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button type="button" className="primary-button w-full" onClick={handleCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy prompt'}
            </button>
          </div>
        </ScreenCard>

        <ScreenHeading eyebrow="PROMPT PREVIEW" title="Paste this into ChatGPT" />

        <ScreenCard className="overflow-hidden">
          <textarea
            readOnly
            value={promptText}
            className="min-h-[340px] w-full resize-none rounded-2xl border border-[#e2e8f0] bg-slate-50 p-4 text-[13px] leading-6 text-slate-700 outline-none"
            aria-label="Generated chat prompt"
          />
        </ScreenCard>

        <ScreenHeading eyebrow="RECENT PHRASES" title="What’s in the mix" />

        {recentItems.length === 0 ? (
          <p className="screen-copy">Start by reviewing a few phrases so the prompt feels tailored to your current routine.</p>
        ) : (
          <div className="vocab-list">
            {recentItems.map((item, index) => (
              <div className="phrase-row coral" key={`${item.text}-${index}`}>
                <div>
                  <strong>{item.text}</strong>
                  <span>{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
