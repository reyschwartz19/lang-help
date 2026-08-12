import { ArrowRight, Check, Volume2 } from 'lucide-react'
import { reviewGrades, type ReviewGrade } from '@/lib/review/fsrs-scheduler'

export function ReviewSurface({ label, front, answer, translation, revealed, onReveal, onPlay, onGrade }: {
  label: string; front: React.ReactNode; answer: string; translation: string; revealed: boolean
  onReveal: () => void; onPlay: () => void; onGrade: (grade: ReviewGrade) => void
}) {
  return <>
    <div className="flashcard"><p className="eyebrow">{revealed ? 'ENGLISH' : label}</p>{revealed ? <div className="answer"><strong>{translation}</strong><span>{answer}</span></div> : front}<button className="sound-button" aria-label={`Listen to ${label.toLowerCase()}`} onClick={onPlay}><Volume2 size={20} /></button></div>
    <button className="secondary-button full" onClick={onReveal}>{revealed ? 'Hide answer' : 'Reveal answer'} <ArrowRight size={16} /></button>
    {revealed && <div className="review-actions">{reviewGrades.map(({ key, label: gradeLabel }, index) => <button key={key} className={`pill-button ${index >= 2 ? 'primary-pill' : ''}`} onClick={() => onGrade(key)}>{index === 0 && <Check size={16} />}{gradeLabel}</button>)}</div>}
  </>
}
