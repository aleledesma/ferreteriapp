/**
 * reset-db.ts
 *
 * Vacía completamente la base de datos: borra todos los registros de todas
 * las tablas y reinicia las secuencias de IDs.
 *
 * Uso:
 *   npm run db:reset             → pide confirmación interactiva
 *   npm run db:reset -- --force  → ejecuta sin preguntar (útil en demos)
 */

import * as readline from "readline"
import { prisma } from "../lib/prisma"

// Tablas en orden de dependencia (FK). CASCADE resuelve las restantes.
const TABLES = [
  "stock_movements",
  "sale_items",
  "sales",
  "supplier_price_list_items",
  "products",
  "supplier_price_lists",
  "customers",
  "suppliers",
  "accounts",
  "sessions",
  "verification_tokens",
  "users",
]

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(
        answer.trim().toLowerCase() === "s" ||
        answer.trim().toLowerCase() === "y",
      )
    })
  })
}

async function resetDatabase() {
  const isForced = process.argv.includes("--force") || process.argv.includes("-f")

  console.log("\n╔══════════════════════════════════════════════╗")
  console.log("║        RESET COMPLETO DE BASE DE DATOS       ║")
  console.log("╚══════════════════════════════════════════════╝\n")
  console.log(`  Tablas a vaciar: ${TABLES.length}\n`)

  if (!isForced) {
    const ok = await confirm(
      "  ⚠  Esta acción es IRREVERSIBLE. ¿Confirmás el reset? (s/N): ",
    )

    if (!ok) {
      console.log("\n  Operación cancelada.\n")
      await prisma.$disconnect()
      process.exit(0)
    }
    console.log("")
  }

  console.log("  Ejecutando TRUNCATE...")

  try {
    const tableList = TABLES.map((t) => `"${t}"`).join(", ")
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`,
    )

    console.log("  ✓ Todas las tablas vaciadas\n")
    console.log("  Verificando conteos post-reset:")

    for (const table of TABLES) {
      const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) AS count FROM "${table}"`,
      )
      const count = Number(result[0].count)
      const icon  = count === 0 ? "✓" : "✗"
      console.log(`    ${icon}  ${table.padEnd(30)} ${count} registros`)
    }

    console.log("\n  ✅ Base de datos reseteada exitosamente.\n")
  } catch (error) {
    console.error("\n  ❌ Error al resetear la base de datos:")
    console.error(" ", error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()
