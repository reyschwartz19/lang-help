'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, Layers3, Menu, MessageSquareText, Mic2, MoreHorizontal, Settings2, Trophy, X } from 'lucide-react'
import { useState } from 'react'

const items = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Learn', href: '/learn', icon: BookOpen },
  { label: 'Review', href: '/review', icon: Layers3 },
  { label: 'Progress', href: '/progress', icon: Trophy },
  { label: 'Handoff', href: '/handoff', icon: MessageSquareText },
]

export function AppShell({ children, title, eyebrow = 'SATURDAY, MAY 17, 2025' }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return <main className="min-h-screen bg-background text-foreground">
    <aside className="sidebar hidden lg:flex"><div className="brand-mark" aria-label="Parlez logo">é</div><div className="sidebar-inner">
      <Link href="/" className="brand-lockup"><div className="brand-dot" /><span>parlez</span></Link>
      <nav className="nav-list" aria-label="Main navigation">{items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`} aria-current={pathname === href ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{pathname === href && <span className="nav-pill" />}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="streak-card"><div className="streak-icon">5</div><div><strong>5 day streak</strong><span>Keep it going</span></div></div><button className="nav-item"><Settings2 size={19} /><span>Settings</span></button><div className="profile"><div className="avatar">R</div><div><strong>Remy</strong><span>Level B1</span></div><MoreHorizontal size={17} className="profile-more" /></div></div>
    </div></aside>
    <div className="mobile-topbar lg:hidden"><Link href="/" className="brand-lockup"><div className="brand-dot" /><span>parlez</span></Link><button className="icon-button" aria-label="Open menu" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
    {open && <div className="mobile-menu lg:hidden">{items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)}><Icon size={18} />{label}</Link>)}</div>}
    <section className="page-shell"><header className="top-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><div className="header-actions"><div className="avatar avatar-header">R</div></div></header>{children}</section>
    <footer className="mobile-nav lg:hidden">{items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={pathname === href ? 'active' : ''}><Icon size={19} /><span>{label}</span></Link>)}</footer>
  </main>
}

export function ScreenCard({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`side-card ${className}`}>{children}</section> }
export function ScreenHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) { return <div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h3>{title}</h3></div>{action}</div> }
export const pageItems = items
export { Mic2 }
