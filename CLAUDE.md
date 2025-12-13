# CLAUDE.md — AI Assistant Instructions

## Project Overview

**polyglot-db-mcp** is a unified MCP (Model Context Protocol) server providing access to 18 databases through a single interface. It runs on Deno and exposes database operations as MCP tools.

## Quick Reference

```bash
# Start the server
deno task start

# Or manually
deno run --allow-net --allow-read --allow-write --allow-env --unstable-kv index.js
```

## Project State Files

This project uses Guile Scheme files for state tracking and meta-information:

- **STATE.scm** — Current project state, Dublin Core metadata, roadmap, and issues
- **META.scm** — Architectural decisions, development practices, extension guides
- **ECOSYSTEM.scm** — Relationships with sibling projects, dependencies, integration opportunities

Read these files to understand the project's current status and design decisions.

## Supported Databases

| Database | Type | Status | Notes |
|----------|------|--------|-------|
| SurrealDB | Multi-model | Implemented | Full CRUD + SurrealQL |
| ArangoDB | Multi-model | Implemented | Document + graph + KV, AQL queries |
| Virtuoso | RDF/SPARQL | Implemented | Triplestore, linked data, full-text search |
| CouchDB | Document | Implemented | HTTP REST API, Mango queries |
| Cassandra | Wide Column | Implemented | Distributed, CQL queries |
| Dragonfly/Redis | Cache | Implemented | Redis-compatible |
| XTDB | Bitemporal | Implemented | Datalog queries |
| SQLite | Embedded SQL | Implemented | Full SQL support |
| DuckDB | Analytics | Stub | Requires HTTP API mode |
| Qdrant | Vector | Implemented | Semantic search |
| Meilisearch | Search | Implemented | Full-text search |
| MariaDB | Relational | Implemented | MySQL-compatible |
| Memcached | Cache | Implemented | Simple KV cache |
| LMDB | Embedded KV | Implemented | Uses Deno.Kv backend |
| iTop | CMDB | Implemented | IT service management |

## Architecture

```
index.js          — Main entry, MCP server setup
adapters/         — Database-specific adapters
  ├── surrealdb.js
  ├── arangodb.js
  ├── virtuoso.js
  ├── couchdb.js
  ├── cassandra.js
  ├── dragonfly.js
  ├── xtdb.js
  ├── sqlite.js
  ├── duckdb.js   (stub - HTTP only)
  ├── qdrant.js
  ├── meilisearch.js
  ├── mariadb.js
  ├── memcached.js
  ├── lmdb.js     (Deno.Kv backend)
  └── itop.js
```

## Adding a New Database Adapter

1. Create `adapters/yourdb.js`
2. Export: `name`, `description`, `connect()`, `disconnect()`, `isConnected()`, `tools`
3. Follow existing adapter patterns
4. Add SPDX header: `// SPDX-License-Identifier: MIT`
5. Import in `index.js`
6. Document environment variables in README

## Environment Variables

Each adapter reads its config from environment variables. See README.md for the full list.

## Code Standards

- **License**: MIT with SPDX headers on all source files
- **Style**: `deno fmt` for formatting
- **Lint**: `deno lint` for linting
- **RSR Compliance**: Bronze level (JavaScript instead of type-safe language)

## Quality Priorities (User-Specified)

1. Dependability
2. Security
3. Interoperability
4. Accessibility
5. Performance
6. Functional additions

## Key Design Decisions

- **Deno over Node.js** — Better security model, native permissions
- **JavaScript over TypeScript** — User preference for simplicity
- **Adapter pattern** — Easy to add new databases
- **Deno.Kv for LMDB** — Native Deno solution for embedded KV

## Testing

Currently manual testing. Future: add `deno test` suite.

## Related Projects

- [arango-mcp](https://github.com/hyperpolymath/arango-mcp) — ArangoDB MCP server (merged into this project)
- [virtuoso-mcp](https://github.com/hyperpolymath/virtuoso-mcp) — Virtuoso SPARQL MCP server (merged into this project)
- [Rhodium-Standard-Repositories](https://github.com/hyperpolymath/Rhodium-Standard-Repositories) — RSR compliance framework
