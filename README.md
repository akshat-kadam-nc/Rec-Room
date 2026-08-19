# Rec Room

A standalone, multi-tenant product for building personal digital recreation rooms. Rooms organise writing, recommendations, books, film and television, games, music, and collected links through configurable physical objects.

Akshat's room is the first reference tenant.

## Run locally

Use Node.js 22 and pnpm:

```bash
pnpm install
pnpm dev
```

## Current routes

- `/bookshelf` — reference room implementation
- `/admin` — public content-studio preview; authentication is not implemented yet
- `/bookshelf-archive` — preserved earlier bookshelf concept

## Environment

Copy `.env.example` to `.env.local`. MongoDB, authentication, and feed credentials must remain server-only.

## Status

This is the extracted product seed. Tenant routing, MongoDB persistence, authentication, templates, and the jukebox are the next milestones.
