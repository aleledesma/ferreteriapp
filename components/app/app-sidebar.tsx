"use client"

import type { UserRole } from "@prisma/client"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { getVisibleSidebarNavigation } from "@/lib/navigation/app-navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../ui/sidebar"

type AppSidebarProps = {
  onSignOut: () => Promise<void>
  user: {
    name?: string | null
    email?: string | null
    role: UserRole
  }
}

function isActivePath(pathname: string, itemPath: string) {
  if (itemPath === "/") {
    return pathname === "/"
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function AppSidebar({ user, onSignOut }: AppSidebarProps) {
  const pathname = usePathname()
  const items = getVisibleSidebarNavigation(user.role)

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4 group-data-[collapsible=icon]:px-2">
        <Link
          href="/"
          className="hidden size-8 items-center justify-center rounded-lg border border-sidebar-border text-xs font-semibold tracking-[0.12em] text-sidebar-foreground/80 group-data-[collapsible=icon]:flex"
        >
          FA
        </Link>
        <Link
          href="/"
          className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
        >
          <span className="grid text-left text-base leading-tight">
            <span className="truncate font-semibold tracking-tight">
              FerreteriApp
            </span>
            <span className="truncate pt-0.5 text-xs text-sidebar-foreground/65">
              Sistema de gestión
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="px-3">Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2 py-2">
              {items.map((item) => {
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActivePath(pathname, item.path)}
                      tooltip={item.label}
                      className="h-10 rounded-lg px-3 text-[0.95rem]"
                    >
                      <Link href={item.path}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <form action={onSignOut}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                type="submit"
                tooltip="Cerrar sesión"
                className="h-10 rounded-lg px-3 text-sidebar-foreground/80"
              >
                <LogOut />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </form>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
