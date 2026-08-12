export const scenarioCategories = [
  {
    id: 'casual',
    label: 'Casual chat',
    description: 'A relaxed, everyday conversation about daily life, plans, and opinions.',
  },
  {
    id: 'travel',
    label: 'Travel',
    description: 'A practical French exchange while navigating transport, hotels, or sightseeing.',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    description: 'Ordering food, asking for recommendations, and chatting with a server or cashier.',
  },
  {
    id: 'problem',
    label: 'Problem solving',
    description: 'A short conversation where you need to ask for help, clarify something, or fix a misunderstanding.',
  },
] as const

export type ScenarioCategory = (typeof scenarioCategories)[number]['id']

export type PromptItem = {
  text: string
  type?: 'phrase' | 'sentence'
  category?: string
}

export function buildPromptTemplate({
  cefrEstimate = 'A1',
  category = 'casual',
  recentItems = [],
}: {
  cefrEstimate?: string
  category?: ScenarioCategory
  recentItems?: PromptItem[]
}) {
  const selectedCategory =
    scenarioCategories.find((entry) => entry.id === category) ?? scenarioCategories[0]

  const recentText =
    recentItems.length > 0
      ? recentItems
          .slice(0, 6)
          .map((item, index) => `${index + 1}. ${item.text}`)
          .join('\n')
      : 'No recent phrases yet — start simple and let the conversation grow naturally.'

  return [
    'Act as my French conversation coach.',
    '',
    `Scenario: ${selectedCategory.description}`,
    `My current level: ${cefrEstimate}`,
    '',
    'Please keep this as a short, realistic French conversation. Use simple but natural language, and help me stay in the sweet spot of being challenged without getting lost.',
    'I want a 5-minute role-play with a few exchanges. Ask me questions, respond naturally, and correct me gently when needed.',
    'Please keep your answers in French, and if I make a mistake, give me a short correction in English after the French reply.',
    '',
    'Recent phrases and sentence chunks I already know:',
    recentText,
    '',
    'Please build the conversation around these ideas, but do not sound robotic. Keep it friendly, a little practical, and realistic for everyday life.',
    'When it feels right, end with one follow-up question so I can respond in French.',
  ].join('\n')
}
