export const speakingScenarios = [
  { id: 'bakery', prompt: 'You are at a bakery. Ask for two baguettes and whether you can pay by card.', reference: 'Je voudrais deux baguettes, s’il vous plaît. Est-ce que je peux payer par carte ?', translation: 'I would like two baguettes, please. Can I pay by card?', preparationSeconds: 5, responseSeconds: 30 },
  { id: 'directions', prompt: 'You are lost. Politely ask how to get to the station.', reference: 'Excusez-moi, comment est-ce que je peux aller à la gare ?', translation: 'Excuse me, how can I get to the station?', preparationSeconds: 5, responseSeconds: 30 },
  { id: 'clarification', prompt: 'You did not understand. Apologize and ask the speaker to repeat more slowly.', reference: 'Je suis désolé, je n’ai pas compris. Vous pouvez répéter plus lentement ?', translation: 'I’m sorry, I didn’t understand. Can you repeat more slowly?', preparationSeconds: 5, responseSeconds: 30 },
] as const

export const handoffScenarios = [
  { id: 'cafe', label: 'At a café', description: 'Order, ask follow-up questions, and close politely.' },
  { id: 'directions', label: 'Asking directions', description: 'Ask for a place and clarify the route.' },
  { id: 'weekend', label: 'Weekend plans', description: 'Discuss plans and make a suggestion.' },
] as const
