# Rec Room

A standalone, multi-tenant product for building personal digital recreation rooms. Rooms organise writing, recommendations, books, film and television, games, music, and collected links through configurable physical objects.

Akshat's room is the first reference tenant.

## Run locally

Use Node.js 22 and pnpm:

```bash
pnpm install
pnpm dev
```

## Product routes

- `/` — public product landing page
- `/[slug]` — a tenant's public room, including `/akshat`
- `/[slug]/admin` — the authenticated tenant studio
- `/register` and `/login` — account entry points
- `/bookshelf-archive` — preserved earlier bookshelf concept

## Environment

Copy `.env.example` to `.env.local`. MongoDB, authentication, and feed credentials must remain server-only.

Authentication uses Better Auth with MongoDB-backed sessions and password hashing. Tenant content and room configuration are stored separately, and studio access is authorized server-side through tenant membership.
