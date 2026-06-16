import { PrismaAdapter } from "@auth/prisma-adapter"
import type { UserRole } from "@prisma/client"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

const PUBLIC_PATHS = new Set(["/login", "/signup"])
const NO_ACCESS_PATH = "/no-access"
const ADMIN_PATH_PREFIX = "/admin"
const USER_ROLES = new Set<UserRole>(["INACTIVE", "ACTIVE", "ADMIN"])

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function resolveUserRole(value: unknown): UserRole {
  return typeof value === "string" && USER_ROLES.has(value as UserRole)
    ? (value as UserRole)
    : "INACTIVE"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  events: {
    async createUser({ user }) {
      const bootstrapAdminEmail = process.env.AUTH_BOOTSTRAP_ADMIN_EMAIL
      if (!bootstrapAdminEmail || !user.email || !user.id) {
        return
      }

      const isBootstrapEmail =
        normalizeEmail(user.email) === normalizeEmail(bootstrapAdminEmail)
      if (!isBootstrapEmail) {
        return
      }

      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      })

      if (adminCount === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        })
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (!user) {
        return token
      }

      const userId = user.id ?? token.sub
      if (!userId) {
        token.role = "INACTIVE"
        return token
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      token.sub = userId
      token.id = userId
      token.role = dbUser?.role ?? "INACTIVE"

      return token
    },
    async session({ session, token }) {
      if (!session.user) {
        return session
      }

      const userId = token.id ?? token.sub
      if (userId) {
        session.user.id = userId
      }
      session.user.role = resolveUserRole(token.role)

      return session
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isPublic = PUBLIC_PATHS.has(pathname)
      const isLoggedIn = Boolean(auth?.user)
      const role = auth?.user?.role ?? "INACTIVE"

      if (!isLoggedIn) {
        return isPublic
      }

      if (isPublic) {
        const destination = role === "INACTIVE" ? NO_ACCESS_PATH : "/"
        return NextResponse.redirect(new URL(destination, request.nextUrl))
      }

      if (pathname.startsWith(ADMIN_PATH_PREFIX) && role !== "ADMIN") {
        return NextResponse.redirect(new URL(NO_ACCESS_PATH, request.nextUrl))
      }

      if (role === "INACTIVE" && pathname !== NO_ACCESS_PATH) {
        return NextResponse.redirect(new URL(NO_ACCESS_PATH, request.nextUrl))
      }

      if (role !== "INACTIVE" && pathname === NO_ACCESS_PATH) {
        return NextResponse.redirect(new URL("/", request.nextUrl))
      }

      return true
    },
  },
})
