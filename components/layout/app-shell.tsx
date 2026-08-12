'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Home, Layers3, LogOut, Menu, MessageSquareText, Mic2, Trophy, X, Route } from 'lucide-react'
import { useState } from 'react'
import { OfflineBanner } from '@/components/ui/network-status'

const items = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Practice', href: '/learn', icon: Route },
  { label: 'Reader', href: '/reader', icon: BookOpen },
  { label: 'Review', href: '/review', icon: Layers3 },
  { label: 'Phrases', href: '/phrases', icon: MessageSquareText },
  { label: 'Speaking', href: '/speaking', icon: Mic2 },
  { label: 'Progress', href: '/progress', icon: Trophy },
  { label: 'Handoff', href: '/handoff', icon: MessageSquareText },
]

export function AppShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); router.refresh() }
  return <main className="min-h-screen bg-background text-foreground"><a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar hidden lg:flex"><div className="brand-mark" aria-label="Parlez logo">é</div><div className="sidebar-inner">
      <Link href="/" className="brand-lockup"><div className="brand-dot" /><span>parlez</span></Link>
      <nav className="nav-list" aria-label="Main navigation">{items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`} aria-current={pathname === href ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{pathname === href && <span className="nav-pill" />}</Link>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item" onClick={logout}><LogOut size={19} /><span>Sign out</span></button><div className="profile"><div className="avatar">P</div><div><strong>Local learner</strong><span>Progress stays on this device</span></div></div></div>
    </div></aside>
    <div className="mobile-topbar lg:hidden"><Link href="/" className="brand-lockup"><div className="brand-dot" /><span>parlez</span></Link><button className="icon-button" aria-label="Open menu" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
    {open && <nav className="mobile-menu lg:hidden" aria-label="Mobile navigation">{items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)}><Icon size={18} />{label}</Link>)}</nav>}
    <section className="page-shell" id="main-content" tabIndex={-1}><header className="top-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1></div></header><OfflineBanner />{children}</section>
    <footer className="mobile-nav lg:hidden">{items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={pathname === href ? 'active' : ''}><Icon size={19} /><span>{label}</span></Link>)}</footer>
  </main>
}

export function ScreenCard({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`side-card ${className}`}>{children}</section> }
export function ScreenHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) { return <div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h3>{title}</h3></div>{action}</div> }
export const pageItems = items
export { Mic2 }
