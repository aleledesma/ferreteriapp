import { signOut } from "@/auth"
import { AppSidebar } from "@/components/app/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { requireAuthenticatedUser } from "@/lib/auth/guards"

type AuthenticatedLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const user = await requireAuthenticatedUser()

  async function handleSignOut() {
    "use server"

    await signOut({ redirectTo: "/login" })
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} onSignOut={handleSignOut} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div className="min-w-0">
            {/* <p className="text-sm font-semibold">FerreteriApp</p> */}
            {(user.name || user.email) && (
              <p className="truncate text-xs text-muted-foreground">
                Usuario: {user.name ?? user.email}
              </p>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
