import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AppShell, ScreenCard, ScreenHeading } from '@/components/layout/app-shell'

export default function LearnPage() { return <AppShell title="Practice French"><div className="screen-stack"><ScreenCard><ScreenHeading eyebrow="CHOOSE A REAL ACTIVITY" title="There is no fabricated lesson roadmap" /><p className="screen-copy">Parlez currently organizes practice around available stories, mined sentence reviews, phrase practice, and speaking recordings. A learning path will appear only when it can be driven by real learner history.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/reader" className="primary-button">Open reader <ArrowRight size={16} /></Link><Link href="/review" className="secondary-button">Review due sentences</Link></div></ScreenCard></div></AppShell> }
