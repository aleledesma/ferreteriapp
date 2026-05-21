"use client"

import type { UserRole } from "@prisma/client"
import { Hammer } from "lucide-react"
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

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const items = getVisibleSidebarNavigation(user.role)

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="FerreteriApp">
              <Link href="/">
                <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Hammer className="size-4" />
                </span>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FerreteriApp</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Panel autenticado</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActivePath(pathname, item.path)} tooltip={item.label}>
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

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium">{user.name ?? user.email ?? "Usuario autenticado"}</p>
          <p className="truncate text-xs uppercase tracking-wide text-sidebar-foreground/70">Rol {user.role}</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
