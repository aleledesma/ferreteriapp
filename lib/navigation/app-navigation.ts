import type { UserRole } from "@prisma/client"
import type { LucideIcon } from "lucide-react"
import {
  Boxes,
  ClipboardPlus,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
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
    icon: LayoutDashboard,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: true,
  },
  {
    path: "/customers",
    label: "Clientes",
    icon: Users,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: true,
  },
  {
    path: "/products",
    label: "Productos",
    icon: Boxes,
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
    icon: ShoppingCart,
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
    icon: Truck,
    allowedRoles: ["ACTIVE", "ADMIN"],
    visibleInSidebar: true,
  },
  {
    path: "/admin",
    label: "Administración",
    icon: ShieldCheck,
    allowedRoles: ["ADMIN"],
    visibleInSidebar: true,
  },
]

export function getVisibleSidebarNavigation(role: UserRole) {
  return appNavigation.filter((item) => item.visibleInSidebar && item.allowedRoles.includes(role))
}
