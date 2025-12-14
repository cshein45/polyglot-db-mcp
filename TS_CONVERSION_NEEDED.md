# JavaScript → ReScript Conversion Status

This repo uses ReScript for core logic with JavaScript entry points.

## Architecture

```
src/                         <- ReScript source (KEEP)
  Adapter.res                <- Core types
  bindings/*.res             <- Database client bindings
  adapters/*.res             <- Converted adapters (5 done)
lib/es6/                     <- Compiled output (GENERATED)
adapters/*.js                <- TO CONVERT (15 remaining)
server.js                    <- Entry point (KEEP as thin wrapper)
transport/*.js               <- TO CONVERT
index.js                     <- Legacy entry (REMOVE after server.js stable)
```

## Files to Convert to ReScript

### Already Converted (5/20)
- [x] `src/adapters/Dragonfly.res`
- [x] `src/adapters/Elasticsearch.res`
- [x] `src/adapters/Mongodb.res`
- [x] `src/adapters/Postgresql.res`
- [x] `src/adapters/Sqlite.res`

### Priority 1: Remaining Adapters (15)
- [ ] `adapters/arangodb.js` → `src/adapters/Arangodb.res`
- [ ] `adapters/cassandra.js` → `src/adapters/Cassandra.res`
- [ ] `adapters/couchdb.js` → `src/adapters/Couchdb.res`
- [ ] `adapters/duckdb.js` → `src/adapters/Duckdb.res`
- [ ] `adapters/influxdb.js` → `src/adapters/Influxdb.res`
- [ ] `adapters/itop.js` → `src/adapters/Itop.res`
- [ ] `adapters/lmdb.js` → `src/adapters/Lmdb.res`
- [ ] `adapters/mariadb.js` → `src/adapters/Mariadb.res`
- [ ] `adapters/meilisearch.js` → `src/adapters/Meilisearch.res`
- [ ] `adapters/memcached.js` → `src/adapters/Memcached.res`
- [ ] `adapters/neo4j.js` → `src/adapters/Neo4j.res`
- [ ] `adapters/qdrant.js` → `src/adapters/Qdrant.res`
- [ ] `adapters/surrealdb.js` → `src/adapters/Surrealdb.res`
- [ ] `adapters/virtuoso.js` → `src/adapters/Virtuoso.res`
- [ ] `adapters/xtdb.js` → `src/adapters/Xtdb.res`

### Priority 2: Transport (HTTP mode)
- [ ] `transport/streamable-http.js` → `src/transport/StreamableHttp.res`

### Keep as JavaScript (thin wrappers)
- `server.js` - Entry point, imports ReScript modules
- `index.js` - Legacy entry (deprecate after migration)

## Policy

- **REQUIRED**: ReScript for all NEW business logic
- **FORBIDDEN**: New TypeScript files
- **ALLOWED**: JavaScript entry points that import ReScript
- **ALLOWED**: Generated `.res.js` files in lib/es6/

## Build Commands

```bash
# Build ReScript
deno task res:build

# Watch mode
deno task res:watch

# Clean build
deno task res:clean
```

## Conversion Notes

When converting adapters:
1. Use `src/Adapter.res` module type
2. Create bindings in `src/bindings/` for database clients
3. Output goes to `lib/es6/`
4. Import in server.js as `./lib/es6/src/adapters/YourDb.res.js`
