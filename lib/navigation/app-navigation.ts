import type { UserRole } from "@prisma/client"
import type { LucideIcon } from "lucide-react"
import {
  BadgeDollarSign,
  Building2,
  ClipboardPlus,
  Home,
  Package2,
  ReceiptText,
  Shield,
  UserRound,
} from "lucide-react"

export type AppNavigationItem = {
  path: string
  label: string
  icon: LucideIcon
  allowedRoles: UserRole[]
  visibleInSidebar: boolean
}

export const appNavigation: AppNavigationItem[] = [
  {
    path: "/",
    label: "Inicio",
    icon: Home,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: true,
  },
  {
    path: "/customers",
    label: "Clientes",
    icon: UserRound,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: true,
  },
  {
    path: "/products",
    label: "Productos",
    icon: Package2,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: true,
  },
  {
    path: "/products/new",
    label: "Nuevos productos",
    icon: ClipboardPlus,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: false,
  },
  {
    path: "/sales",
    label: "Ventas",
    icon: BadgeDollarSign,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: true,
  },
  {
    path: "/sales/new",
    label: "Nueva venta",
    icon: ReceiptText,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: false,
  },
  {
    path: "/suppliers",
    label: "Proveedores",
    icon: Building2,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: true,
  },
  {
    path: "/admin",
    label: "Administración",
    icon: Shield,
    allowedRoles: ["ADMIN"],
    visibleInSidebar: true,
  },
]

export function getVisibleSidebarNavigation(role: UserRole) {
  return appNavigation.filter((item) => item.visibleInSidebar && item.allowedRoles.includes(role))
}
