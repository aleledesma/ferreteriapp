import type { ReactNode } from "react"

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <section className="w-full max-w-md space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </section>
    </main>
  )
}
