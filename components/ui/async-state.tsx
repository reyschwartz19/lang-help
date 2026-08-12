import { AlertCircle, CheckCircle2, CloudOff, LoaderCircle, ShieldAlert } from 'lucide-react'

type Kind = 'loading' | 'empty' | 'error' | 'permission' | 'success' | 'offline'
const icons = { loading: LoaderCircle, empty: AlertCircle, error: AlertCircle, permission: ShieldAlert, success: CheckCircle2, offline: CloudOff }

export function AsyncState({ kind, title, detail, action }: { kind: Kind; title: string; detail?: string; action?: React.ReactNode }) {
  const Icon = icons[kind]
  return <div className="flex min-h-32 flex-col items-center justify-center gap-3 px-6 text-center" role={kind === 'error' ? 'alert' : 'status'} aria-live="polite">
    <Icon className={kind === 'loading' ? 'animate-spin text-primary motion-reduce:animate-none' : 'text-muted-foreground'} size={22} aria-hidden="true" />
    <div><h3 className="text-lg font-semibold text-foreground">{title}</h3>{detail && <p className="mt-1 max-w-md text-sm text-muted-foreground">{detail}</p>}</div>{action}
  </div>
}
