'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: data.get('username'), password: data.get('password') }) })
    setBusy(false)
    if (!response.ok) { setError('The username or password is incorrect.'); return }
    router.replace('/'); router.refresh()
  }
  return <main className="login-page"><section className="login-card" aria-labelledby="login-title">
    <div className="brand-lockup login-brand"><div className="brand-dot" /><span>parlez</span></div>
    <p className="eyebrow">WELCOME BACK</p><h1 id="login-title">Continue learning French</h1>
    <p className="login-copy">Sign in to keep your progress in step across your devices.</p>
    <form onSubmit={submit} className="login-form">
      <label>Username<input name="username" type="text" autoComplete="username" required maxLength={64} autoFocus /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
      {error && <p className="login-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </section></main>
}
