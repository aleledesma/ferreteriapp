# AGENTS.md

## Project

Information system for **hardware store management** developed as a university final project.

The system digitizes the operations of a hardware store, replacing manual processes for:

- supplier price lists
- inventory management
- sales registration
- customer and supplier records
- business reports

## Main Features

- Import supplier price lists (Excel / CSV)
- Product and inventory management
- Sales registration with automatic stock updates
- Customer and supplier management
- Sales reports and statistics
- Automated database backups

## Tech Stack

- Next.js 15
- TypeScript
- Node.js
- Prisma ORM
- PostgreSQL
- n8n (for supplier list normalization automation)

## Core Data Model

Main entities in the system:

- Usuario
- Cliente
- Proveedor
- ListaProveedor
- Producto
- OrdenDeCompra
- DetalleOrden

Relationships follow a **relational database design implemented with PostgreSQL and Prisma**.

## Architecture Guidelines

- Use **Next.js App Router**.
- Backend logic runs in **Node.js server environment**.
- Database access must be handled through **Prisma ORM**.
- Keep **business logic separated from UI components**.
- Maintain clear separation between:
  - UI
  - application logic
  - database access

## Integrations

- **n8n** is used as an external automation service to normalize supplier product lists before importing them into the system.

## Coding Guidelines

- Use **TypeScript everywhere**.
- Prefer **clear and maintainable code over complex abstractions**.
- Keep components and modules **small and focused**.
- Avoid unnecessary dependencies.
- Keep non-UI naming in English (routes, file/folder names, identifiers, comments).
- All **user-facing UI text must always be in Spanish**.

## Agent Rules

AI agents working in this repository must:

1. Respect the existing database schema and Prisma models.
2. Avoid introducing unnecessary libraries.
3. Preserve separation between UI, logic, and database access.
4. Prefer simple and maintainable implementations.
5. Do not modify the core data model unless explicitly requested.
6. If clarification is needed during execution, use the interactive `question` tool instead of pausing the session with open-ended prompts.
